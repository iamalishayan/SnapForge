/**
 * hashUtils.ts — Canonical Hash Utility (Phase 0.7)
 *
 * Implements the deterministic semantic record hash used at two pipeline stages:
 *   - Phase 3.4: After Zod validation, to detect scholarship data changes (Stage 2 diff)
 *   - Phase 7.1: Staleness worker, to decide whether to trigger article rebuild
 *
 * Design guarantees:
 *   1. fast-json-stable-stringify ensures object keys are always sorted, regardless of
 *      the order LLM extraction returns them.
 *   2. Pre-sorting arrays by their stable string representation means identical scholarship
 *      data always produces the same hash even if the LLM lists eligibility items in a
 *      different order across re-extractions.
 *   3. computeScholarshipId() produces the stable, year-independent primary key for
 *      scholarship_records so that upserts across intake cycles remain idempotent.
 *
 * NEVER use raw JSON.stringify() for hashing scholarship data — key ordering is
 * implementation-defined and will produce different hashes for identical data.
 */

import fastStringify from 'fast-json-stable-stringify'
import { createHash } from 'node:crypto'

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Normalizes an unknown value to a stable string for comparison/sorting.
 * Strings are returned as-is; objects/arrays are stable-stringified.
 */
function normalizeItem(item: unknown): string {
  return typeof item === 'string' ? item : fastStringify(item)
}

/**
 * Serializes an array in a stable, order-independent way.
 * Elements are sorted by their normalized string representation before serialization.
 * This means arrays with identical elements in different orders produce the same output.
 *
 * @example
 * stableSerializeArray(['B', 'A', 'C']) === stableSerializeArray(['C', 'A', 'B'])
 * // → true
 */
function stableSerializeArray(arr: unknown[]): string {
  const sorted = [...arr].sort((a, b) =>
    normalizeItem(a).localeCompare(normalizeItem(b))
  )
  return fastStringify(sorted)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Computes the deterministic Stage 2 semantic record hash.
 *
 * Only includes fields that represent a genuine data change to the scholarship
 * information — NOT the cleanContentHash (cosmetic/navigation changes) and NOT
 * fetchedAt/lastVerifiedAt timestamps.
 *
 * When this hash changes, the downstream article rebuild pipeline fires.
 * When it stays the same (despite cleanContentHash changing), only lastVerifiedAt
 * is updated — no LLM call, no translation job, no token cost.
 *
 * Input fields must be in canonical form (ISO 8601 dates, numeric amounts).
 * Do NOT pass locale-formatted strings — those vary by locale, breaking the hash.
 *
 * @param record - The normalized scholarship fields used for semantic identity
 * @returns SHA-256 hex string
 */
export function computeSemanticRecordHash(record: {
  /** ISO 8601 date string (YYYY-MM-DD), in Europe/Berlin timezone */
  deadline: string
  /** Primary/midpoint stipend amount (numeric, EUR) */
  monthlyStipend: { amount: number; currency: string }
  /** Structured eligibility array from Zod-validated extraction */
  eligibilitySummary: unknown[]
  /** Required documents list from Zod-validated extraction */
  requiredDocuments: unknown[]
  /** The official application URL — changes indicate a redirect or broken link */
  officialApplyUrl: string
}): string {
  // Concatenate in a fixed field order — same order as Phase 0.7 spec
  const input =
    record.deadline +
    record.monthlyStipend.amount.toString() +
    stableSerializeArray(record.eligibilitySummary) +
    stableSerializeArray(record.requiredDocuments) +
    record.officialApplyUrl

  return createHash('sha256').update(input, 'utf8').digest('hex')
}

/**
 * Computes the stable, deterministic primary key for scholarship_records.
 *
 * No year in the hash — intentional. The same scholarship (DAAD EPOS, Germany)
 * has the same id across the 2026/27 and 2027/28 intake cycles. This allows
 * upserts to correctly target the existing row rather than creating a duplicate,
 * and ensures the evergreen URL accumulates SEO authority across cycles.
 *
 * @param provider - Canonical provider name (e.g. 'DAAD', 'TU Munich')
 * @param slug     - URL-safe scholarship identifier (e.g. 'daad-epos')
 * @param country  - ISO 3166-1 alpha-2 country code (e.g. 'DE')
 * @returns SHA-256 hex string used as scholarship_records.id
 */
export function computeScholarshipId(
  provider: string,
  slug: string,
  country: string
): string {
  const input = `${provider.toLowerCase().trim()}|${slug.toLowerCase().trim()}|${country.toUpperCase().trim()}`
  return createHash('sha256').update(input, 'utf8').digest('hex')
}

/**
 * Computes the intake key for a specific semester + cycle label combination.
 * Used as the UNIQUE constraint key in scholarship_intakes:
 *   UNIQUE(scholarship_id, intake_key)
 *
 * @param semester   - 'Wintersemester' | 'Sommersemester' | 'Annual' | 'Rolling'
 * @param cycleLabel - e.g. '2026/27'
 * @returns SHA-256 hex string used as scholarship_intakes.intake_key
 */
export function computeIntakeKey(semester: string, cycleLabel: string): string {
  const input = `${semester.trim()}|${cycleLabel.trim()}`
  return createHash('sha256').update(input, 'utf8').digest('hex')
}
