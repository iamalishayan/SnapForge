/**
 * scholarship.ts — Zod Schemas for the Scholarship Pipeline (Phase 0)
 *
 * All schemas include European pre-normalizers (Phase 3.3) as z.preprocess layers
 * so that raw LLM output (German date formats, comma-decimal amounts, currency
 * symbol strings) is silently coerced to canonical form before validation runs.
 *
 * Architecture boundary enforced here:
 *   - hardSlots fields: validated strictly — any mismatch fails the QA gate
 *   - narrativeBlocks fields: validated as non-empty strings — content quality
 *     is checked by the prose safety scan (Phase 6.2), not by Zod
 *
 * Export surface: all schemas + their inferred TypeScript types.
 * Import from '@snapforge/ai' — do not import this file directly.
 */

import { z } from 'zod'

// ─── European Pre-Normalizer Utilities ───────────────────────────────────────

/**
 * Converts German comma-decimal format to standard float.
 * Examples: '934,00' → 934, '1.200,50' → 1200.5
 */
function normalizeGermanDecimal(val: unknown): unknown {
  if (typeof val !== 'string') return val
  // Remove German thousand separators (dots), replace decimal comma with dot
  return parseFloat(val.replace(/\./g, '').replace(',', '.'))
}

/**
 * Strips common currency symbols/codes and normalises decimal notation.
 * '€934,00' → 934, '934.00 EUR' → 934, '1.200' → 1200
 */
function parseCurrencyAmount(val: unknown): unknown {
  if (typeof val === 'number') return val
  if (typeof val !== 'string') return val
  const stripped = val.replace(/[€$£¥EUR\s]/g, '').trim()
  return normalizeGermanDecimal(stripped)
}

/**
 * Converts German date formats to ISO 8601 (YYYY-MM-DD).
 * '15. November 2026' → '2026-11-15'
 * '15.11.2026'        → '2026-11-15'
 * Already ISO format  → unchanged
 */
const GERMAN_MONTHS: Record<string, string> = {
  januar: '01', februar: '02', märz: '03', april: '04',
  mai: '05', juni: '06', juli: '07', august: '08',
  september: '09', oktober: '10', november: '11', dezember: '12',
}

function normalizeGermanDate(val: unknown): unknown {
  if (typeof val !== 'string') return val
  const v = val.trim()

  // Already ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v

  // DD.MM.YYYY
  const dotMatch = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (dotMatch) {
    return `${dotMatch[3]}-${dotMatch[2].padStart(2, '0')}-${dotMatch[1].padStart(2, '0')}`
  }

  // DD. MonthName YYYY  (e.g. '15. November 2026' or '15. november 2026')
  const verboseMatch = v.match(/^(\d{1,2})\.\s+([a-zäöü]+)\s+(\d{4})$/i)
  if (verboseMatch) {
    const monthKey = verboseMatch[2].toLowerCase()
    const monthNum = GERMAN_MONTHS[monthKey]
    if (monthNum) {
      return `${verboseMatch[3]}-${monthNum}-${verboseMatch[1].padStart(2, '0')}`
    }
  }

  return v // return as-is; let z.string().regex() catch invalid formats
}

// ─── Primitive Schemas ────────────────────────────────────────────────────────

/** ISO 8601 date string (YYYY-MM-DD). Pre-normalizes German date formats. */
const ISODateSchema = z.preprocess(
  normalizeGermanDate,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be ISO 8601 date (YYYY-MM-DD)')
)

/** Positive numeric amount. Pre-strips currency symbols and German decimal notation. */
const CurrencyAmountSchema = z.preprocess(
  parseCurrencyAmount,
  z.number().positive('Amount must be a positive number')
)

/** Absolute HTTPS URL. Rejects relative URLs and http:// links. */
const AbsoluteHttpsUrlSchema = z
  .string()
  .url('Must be a valid URL')
  .refine((url) => url.startsWith('https://'), {
    message: 'URL must be absolute HTTPS (https://...). Relative URLs break hreflang tags.',
  })

// ─── Domain Schemas ───────────────────────────────────────────────────────────

/**
 * Monthly stipend — supports single amount or range (min/max).
 * Range example from roadmap: '€850 - €1.200' → { amount: 850, minAmount: 850, maxAmount: 1200, currency: 'EUR' }
 */
export const MonthlyStipendSchema = z.object({
  /** Primary/midpoint display amount */
  amount: CurrencyAmountSchema,
  /** Present when source states a range (lower bound) */
  minAmount: CurrencyAmountSchema.optional(),
  /** Present when source states a range (upper bound) */
  maxAmount: CurrencyAmountSchema.optional(),
  currency: z.literal('EUR'),
})

export type MonthlyStipend = z.infer<typeof MonthlyStipendSchema>

/** Language proficiency requirement (e.g. IELTS 6.5, DSH-2) */
export const LanguageRequirementSchema = z.object({
  language: z.string().min(1),
  /** Minimum score as a string to accommodate formats like '6.5', 'B2', 'DSH-2' */
  minScore: z.string().optional(),
  testName: z.string().min(1),
})

export type LanguageRequirement = z.infer<typeof LanguageRequirementSchema>

/**
 * Single eligibility criterion row.
 * Kept flexible (category + description) to accommodate German/English source variation.
 */
export const EligibilityItemSchema = z.object({
  category: z.string().min(1),   // e.g. 'Nationality', 'Academic Record', 'German Language'
  description: z.string().min(1),
  required: z.boolean().optional().default(true),
})

export type EligibilityItem = z.infer<typeof EligibilityItemSchema>

// ─── Core Pipeline Schemas ────────────────────────────────────────────────────

/**
 * Full validated scholarship record — output of Phase 3 LLM extraction + Zod validation.
 * Maps 1:1 to the scholarship_records database table.
 */
export const ScholarshipRecordSchema = z.object({
  // Identity (set by application layer, not LLM)
  id: z.string().optional(),   // computeScholarshipId() — optional at extraction time
  name: z.string().min(1).max(500),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens').optional(),
  provider: z.string().min(1).max(255),
  providerType: z.enum(['government', 'university', 'foundation', 'eu_body', 'aggregator']),

  // Scope
  country: z.string().length(2, 'Must be ISO 3166-1 alpha-2 country code').toUpperCase(),
  targetDegree: z.enum(['ms', 'phd', 'bachelor', 'postdoc', 'any']),
  disciplines: z.array(z.string().min(1)).default([]),
  nationality: z.array(z.string()).default([]),

  // Financial — nulls allowed (mandate: LLM must not invent)
  monthlyStipend: MonthlyStipendSchema.nullable().default(null),
  tuitionCoverage: z.boolean().nullable().default(null),
  healthInsuranceCovered: z.boolean().nullable().default(null),
  otherBenefits: z.array(z.string()).default([]),
  fundingType: z.enum(['full', 'partial', 'tuition_only', 'stipend_only', 'travel_grant', 'unknown']).nullable().default(null),

  // Provenance
  sourceUrl: z.string().url(),
  officialApplyUrl: z.string().url(),
  sourceTier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  sourceLanguage: z.string().default('en'),

  // Hashes (computed in application layer, not by LLM)
  cleanContentHash: z.string().optional(),
  semanticRecordHash: z.string().optional(),

  // Content (LLM-extracted)
  shortDescription: z.string().max(500).nullable().default(null),
  eligibilitySummary: z.array(EligibilityItemSchema).default([]),
  requiredDocuments: z.array(z.string().min(1)).default([]),
  languageRequirements: z.array(LanguageRequirementSchema).default([]),

  // rawEvidence — verbatim source sentences for QA (Phase 3.2, not persisted to DB)
  rawEvidence: z.record(z.string(), z.string()).optional(),
})

export type ScholarshipRecord = z.infer<typeof ScholarshipRecordSchema>

/**
 * A single intake cycle row — maps to scholarship_intakes table.
 * intake_key is computed by computeIntakeKey(semester, cycleLabel).
 */
export const ScholarshipIntakeSchema = z.object({
  id: z.string().uuid().optional(),
  scholarshipId: z.string(),
  intakeKey: z.string(),    // computeIntakeKey(semester, cycleLabel)
  semester: z.enum(['Wintersemester', 'Sommersemester', 'Annual', 'Rolling']),
  cycleLabel: z.string().min(1),   // e.g. '2026/27'
  deadline: ISODateSchema,
  programStartDate: ISODateSchema.optional(),
})

export type ScholarshipIntake = z.infer<typeof ScholarshipIntakeSchema>

// ─── Cluster & Variant Schemas ────────────────────────────────────────────────

/**
 * A single published locale/domain variant.
 * Maps to scholarship_article_variants table.
 * canonicalUrl and revalidationEndpoint MUST be absolute HTTPS URLs.
 */
export const ClusterVariantSchema = z.object({
  id: z.string().uuid().optional(),
  clusterId: z.string().uuid().optional(),
  siteId: z.string().uuid(),
  locale: z.string().min(2),  // BCP 47 (e.g. 'de-DE', 'ur-PK', 'en-US')

  /**
   * REQUIRED: Fully-qualified absolute URL.
   * e.g. 'https://studygermany.de/scholarships/germany/daad-epos'
   * Relative URLs in hreflang tags cause Google Search Console errors.
   */
  canonicalUrl: AbsoluteHttpsUrlSchema,

  /**
   * Per-site ISR webhook endpoint.
   * Each deployed Next.js site must expose POST /api/revalidate.
   * Fan-out via Promise.allSettled() — one HTTP POST per variant (v5 fix).
   */
  revalidationEndpoint: AbsoluteHttpsUrlSchema,

  isrStatus: z.enum(['pending', 'success', 'failed', 'retrying']).default('pending'),
  isrRetryCount: z.number().int().min(0).default(0),
  lastRevalidatedAt: z.string().datetime().nullable().optional(),

  publishedAt: z.string().datetime().nullable().optional(),
})

export type ClusterVariant = z.infer<typeof ClusterVariantSchema>

/** Top-level cluster entity — maps to scholarship_article_clusters table. */
export const ArticleClusterSchema = z.object({
  id: z.string().uuid().optional(),
  scholarshipRecordId: z.string(),
  intakeKey: z.string(),
  clusterStatus: z.enum(['assembling', 'assembled', 'publishing', 'published', 'failed']).default('assembling'),
  variants: z.array(ClusterVariantSchema).default([]),
})

export type ArticleCluster = z.infer<typeof ArticleClusterSchema>

/** ISR revalidation result for a single domain — stored in scholarship_cluster_jobs.revalidation_results */
export const IsrRevalidationResultSchema = z.object({
  siteId: z.string().uuid(),
  locale: z.string(),
  status: z.enum(['success', 'failed']),
  retryCount: z.number().int().min(0).default(0),
  lastAttemptAt: z.string().datetime().optional(),
  errorMessage: z.string().optional(),
})

export type IsrRevalidationResult = z.infer<typeof IsrRevalidationResultSchema>

/** Atomic Cluster Publish job — maps to scholarship_cluster_jobs table. */
export const ClusterJobSchema = z.object({
  id: z.string().uuid().optional(),
  clusterId: z.string().uuid(),
  scholarshipRecordId: z.string(),
  intakeKey: z.string(),
  targetLocales: z.array(z.string().min(2)).min(1),
  buildPath: z.enum(['new_cycle', 'amendment']),
  jobStatus: z.enum(['translating', 'assembled', 'publishing', 'published', 'failed']).default('translating'),
  revalidationResults: z.array(IsrRevalidationResultSchema).default([]),
  publishedAt: z.string().datetime().nullable().optional(),
  failedReason: z.string().nullable().optional(),
})

export type ClusterJob = z.infer<typeof ClusterJobSchema>

// ─── ArticlePayload Schema ────────────────────────────────────────────────────

/**
 * Handoff contract between the Article Builder (Phase 5) and the Cluster
 * Translation Worker (Phase 8). Produced ONLY on the new_cycle path.
 *
 * buildPath: z.literal('new_cycle') — Amendment path never produces an ArticlePayload.
 * It publishes directly via template re-render + per-domain ISR fan-out (Phase 5.1).
 */
export const ArticlePayloadSchema = z.object({
  scholarshipRecordId: z.string(),
  intakeKey: z.string(),

  hardSlots: z.object({
    provider: z.string().min(1),
    fundingType: z.string().min(1),
    monthlyStipend: MonthlyStipendSchema.nullable(),
    otherBenefits: z.array(z.string()),
    /** ISO 8601 date — locale formatting applied per-locale in Phase 8 */
    deadline: ISODateSchema,
    /** ISO 8601 date — may be null if program start date not published */
    programStartDate: ISODateSchema.nullable(),
    cycleLabel: z.string().min(1),
    officialApplyUrl: z.string().url(),
    eligibilitySummary: z.array(EligibilityItemSchema),
    requiredDocuments: z.array(z.string()),
    languageRequirements: z.array(LanguageRequirementSchema),
    sourceAttribution: z.object({
      sourceName: z.string(),
      sourceUrl: z.string().url(),
      lastVerifiedAt: z.string().datetime(),
    }),
  }),

  narrativeBlocks: z.object({
    /**
     * What this scholarship is, who offers it, why it matters for international MS
     * students. ~150 words. MUST NOT contain specific numbers, dates, amounts, or
     * temporal language (Phase 5.3 constraint).
     */
    intro: z.string().min(50),
    /**
     * What the funding covers in practical terms. ~200 words.
     * No monetary amounts — those are in hardSlots.monthlyStipend.
     */
    coverageExplanation: z.string().min(50),
    /**
     * Step-by-step application process. ~200 words.
     * Derived from eligibilitySummary + requiredDocuments — LLM explains, not invents.
     */
    howToApplyNarrative: z.string().min(50),
    /** Rotating contextual section (city guide / visa process / tips / system overview) */
    secondarySection: z.object({
      type: z.enum(['city_cost_guide', 'visa_process', 'motivation_letter_tips', 'german_university_system']),
      content: z.string().min(50),
    }),
  }),

  seoMeta: z.object({
    /** '{name} {cycleLabel} — Complete Guide for International MS Students' */
    titleTemplate: z.string().min(10),
    /** Includes current hardSlots.deadline — must always reflect latest deadline. */
    metaDescriptionTemplate: z.string().min(50).max(160),
    /** URL-safe ASCII slug. Established at first publish, never changes. */
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    targetKeywords: z.array(z.string().min(1)).min(1),
  }),

  /** Discriminant: ArticlePayload is ONLY produced by the new_cycle path. */
  buildPath: z.literal('new_cycle'),
})

export type ArticlePayload = z.infer<typeof ArticlePayloadSchema>

// ─── Source Registry Schema ───────────────────────────────────────────────────

/**
 * Per-source configuration entry from the Phase 1 Source Registry.
 * Used by fetchers to determine proxy requirements, crawl delay, and render mode.
 */
export const SourceRegistryEntrySchema = z.object({
  name: z.string().min(1),
  baseUrl: z.string().url(),
  trustTier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  renderMode: z.enum(['static', 'js', 'api']),
  sourceLanguage: z.string().default('de'),
  wafDetected: z.boolean().default(false),
  proxyRequired: z.boolean().default(false),
  proxyType: z.enum(['residential', 'datacenter']).optional(),
  crawlDelaySeconds: z.number().min(1).default(5),
  burstConcurrency: z.number().min(1).max(5).default(2),
  listingUrlTemplate: z.string().optional(),
  detailUrlPattern: z.string().optional(),
  /** If officialApplyUrl redirects to an SSO/Campus portal, record the accepted host */
  expectedRedirectHost: z.string().optional(),
  /** Overrides global 365-day default (e.g. 180 for time-limited grants) */
  maxCycleWaitDays: z.number().min(30).max(730).default(365),
  enabled: z.boolean().default(true),
})

export type SourceRegistryEntry = z.infer<typeof SourceRegistryEntrySchema>
