/**
 * hash-utils.test.ts — Determinism tests for computeSemanticRecordHash
 *
 * Three properties guaranteed by the implementation:
 *   1. IDEMPOTENCY:     Same input → same hash every time
 *   2. ORDER INDEPENDENCE: Arrays with identical elements in different order → same hash
 *   3. SENSITIVITY:    Any field change → different hash
 */

import { describe, it, expect } from 'vitest'
import { computeSemanticRecordHash, computeScholarshipId, computeIntakeKey } from '../src/utils/hashUtils'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_RECORD = {
  deadline: '2026-11-15',
  monthlyStipend: { amount: 934, currency: 'EUR' },
  eligibilitySummary: [
    { category: 'Nationality', description: 'Open to all nationalities', required: true },
    { category: 'Academic Record', description: 'Minimum 2.5 GPA equivalent', required: true },
  ],
  requiredDocuments: [
    'Motivation letter',
    'Two letters of recommendation',
    'Academic transcripts',
    'Language certificate',
  ],
  officialApplyUrl: 'https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/',
} as const

// ─── computeSemanticRecordHash ────────────────────────────────────────────────

describe('computeSemanticRecordHash', () => {
  it('1. IDEMPOTENCY — same input always produces the same hash', () => {
    const hash1 = computeSemanticRecordHash(BASE_RECORD)
    const hash2 = computeSemanticRecordHash(BASE_RECORD)
    const hash3 = computeSemanticRecordHash({ ...BASE_RECORD })

    expect(hash1).toBe(hash2)
    expect(hash2).toBe(hash3)
    expect(hash1).toMatch(/^[a-f0-9]{64}$/) // valid SHA-256 hex
  })

  it('2. ARRAY ORDER INDEPENDENCE — different element ordering → same hash', () => {
    // LLM may return eligibilitySummary items in any order across re-extractions.
    // The pre-sort in stableSerializeArray() must normalise this.
    const recordA = {
      ...BASE_RECORD,
      eligibilitySummary: [
        { category: 'Nationality', description: 'Open to all nationalities', required: true },
        { category: 'Academic Record', description: 'Minimum 2.5 GPA equivalent', required: true },
      ],
      requiredDocuments: [
        'Motivation letter',
        'Two letters of recommendation',
        'Academic transcripts',
        'Language certificate',
      ],
    }

    const recordB = {
      ...BASE_RECORD,
      // Reversed eligibility order
      eligibilitySummary: [
        { category: 'Academic Record', description: 'Minimum 2.5 GPA equivalent', required: true },
        { category: 'Nationality', description: 'Open to all nationalities', required: true },
      ],
      // Shuffled required documents
      requiredDocuments: [
        'Language certificate',
        'Academic transcripts',
        'Motivation letter',
        'Two letters of recommendation',
      ],
    }

    const hashA = computeSemanticRecordHash(recordA)
    const hashB = computeSemanticRecordHash(recordB)

    expect(hashA).toBe(hashB)
  })

  it('3. SENSITIVITY — any single field change produces a different hash', () => {
    const baseHash = computeSemanticRecordHash(BASE_RECORD)

    // Deadline change
    const deadlineChanged = computeSemanticRecordHash({
      ...BASE_RECORD,
      deadline: '2026-11-30', // extended by 15 days (amendment scenario)
    })
    expect(deadlineChanged).not.toBe(baseHash)

    // Amount change
    const amountChanged = computeSemanticRecordHash({
      ...BASE_RECORD,
      monthlyStipend: { amount: 1000, currency: 'EUR' },
    })
    expect(amountChanged).not.toBe(baseHash)

    // URL change
    const urlChanged = computeSemanticRecordHash({
      ...BASE_RECORD,
      officialApplyUrl: 'https://www2.daad.de/different-endpoint',
    })
    expect(urlChanged).not.toBe(baseHash)

    // New eligibility item added
    const eligibilityChanged = computeSemanticRecordHash({
      ...BASE_RECORD,
      eligibilitySummary: [
        ...BASE_RECORD.eligibilitySummary,
        { category: 'Language', description: 'German B2 or English C1', required: true },
      ],
    })
    expect(eligibilityChanged).not.toBe(baseHash)

    // All four changed hashes must also be distinct from each other
    const allHashes = [deadlineChanged, amountChanged, urlChanged, eligibilityChanged]
    const unique = new Set(allHashes)
    expect(unique.size).toBe(4)
  })
})

// ─── computeScholarshipId ─────────────────────────────────────────────────────

describe('computeScholarshipId', () => {
  it('produces consistent SHA-256 hex IDs', () => {
    const id1 = computeScholarshipId('DAAD', 'daad-epos', 'DE')
    const id2 = computeScholarshipId('DAAD', 'daad-epos', 'DE')
    expect(id1).toBe(id2)
    expect(id1).toMatch(/^[a-f0-9]{64}$/)
  })

  it('is case-normalised — different casing → same ID', () => {
    const id1 = computeScholarshipId('DAAD', 'DAAD-EPOS', 'DE')
    const id2 = computeScholarshipId('daad', 'daad-epos', 'de')
    expect(id1).toBe(id2)
  })

  it('is year-independent — provider+slug+country is the full key', () => {
    // Same scholarship across two cycles must produce the same ID so upserts
    // target the existing row rather than creating a duplicate.
    const id2026 = computeScholarshipId('DAAD', 'daad-epos', 'DE')
    const id2027 = computeScholarshipId('DAAD', 'daad-epos', 'DE')
    expect(id2026).toBe(id2027)
  })

  it('different scholarships produce different IDs', () => {
    const daadId = computeScholarshipId('DAAD', 'daad-epos', 'DE')
    const bmbfId = computeScholarshipId('BMBF', 'bmbf-research-grant', 'DE')
    expect(daadId).not.toBe(bmbfId)
  })
})

// ─── computeIntakeKey ─────────────────────────────────────────────────────────

describe('computeIntakeKey', () => {
  it('produces a deterministic key from semester + cycleLabel', () => {
    const key1 = computeIntakeKey('Wintersemester', '2026/27')
    const key2 = computeIntakeKey('Wintersemester', '2026/27')
    expect(key1).toBe(key2)
    expect(key1).toMatch(/^[a-f0-9]{64}$/)
  })

  it('different cycles produce different keys', () => {
    const ws2026 = computeIntakeKey('Wintersemester', '2026/27')
    const ws2027 = computeIntakeKey('Wintersemester', '2027/28')
    const ss2027 = computeIntakeKey('Sommersemester', '2027')
    expect(ws2026).not.toBe(ws2027)
    expect(ws2026).not.toBe(ss2027)
    expect(ws2027).not.toBe(ss2027)
  })
})
