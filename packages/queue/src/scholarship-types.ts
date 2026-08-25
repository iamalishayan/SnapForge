/**
 * scholarship-types.ts — Job Payload Types for the Scholarship Pipeline (Phase 0.4)
 *
 * One typed interface per BullMQ queue. Workers are generic over their queue's
 * payload type: Worker<FetchStaticJobPayload>, Worker<ExtractJobPayload>, etc.
 *
 * Naming convention: <QueueSegment>JobPayload
 *   scholarship:fetch:static     → FetchStaticJobPayload
 *   scholarship:fetch:browser    → FetchBrowserJobPayload
 *   scholarship:extract          → ExtractJobPayload
 *   scholarship:qa               → QAJobPayload
 *   scholarship:generate         → GenerateJobPayload
 *   scholarship:amendment        → AmendmentJobPayload
 *   scholarship:factcheck        → FactcheckJobPayload
 *   scholarship:cluster:translate→ ClusterTranslateJobPayload
 *   scholarship:cluster:publish  → ClusterPublishJobPayload
 *   scholarship:cluster:isr-retry→ IsrRetryJobPayload
 *   scholarship:recheck          → RecheckJobPayload
 *   scholarship:quarantine       → QuarantineJobPayload
 *   scholarship:dlq              → ScholarshipDlqPayload
 */

// ─── Shared base ─────────────────────────────────────────────────────────────

/** Included on every scholarship job for end-to-end request tracing */
interface ScholarshipJobBase {
  /** Trace ID — correlates fetch → extract → qa → generate → translate → publish */
  traceId: string
}

// ─── Phase 2 — Fetcher Layer ──────────────────────────────────────────────────

/**
 * scholarship:fetch:static
 * Dispatched by the schedule cron or staleness worker for sources with
 * renderMode: 'static' | 'api' in the source registry.
 */
export interface FetchStaticJobPayload extends ScholarshipJobBase {
  sourceRegistryName: string    // e.g. 'daad', 'study-in-germany'
  targetUrl: string             // Listing page or detail page URL
  scholarshipRecordId?: string  // Set for re-checks; absent for first-fetch discovery
  sourceTier: 1 | 2 | 3
  isDetailPage: boolean         // true = detail page fetch (Phase 3.5 token overflow)
}

/**
 * scholarship:fetch:browser
 * Dispatched for sources with renderMode: 'js' — runs in the isolated
 * Playwright container with stealth plugin + residential proxy.
 */
export interface FetchBrowserJobPayload extends ScholarshipJobBase {
  sourceRegistryName: string
  targetUrl: string
  scholarshipRecordId?: string
  sourceTier: 1 | 2 | 3
  isDetailPage: boolean
}

// ─── Phase 3 — Cross-Lingual Extraction ───────────────────────────────────────

/**
 * scholarship:extract
 * Dispatched by the fetcher workers after cleanContentHash changes (Stage 1 diff).
 * Contains the sanitized text so the extract worker is stateless.
 */
export interface ExtractJobPayload extends ScholarshipJobBase {
  sourceRegistryName: string
  sourceUrl: string
  sourceTier: 1 | 2 | 3
  sourceLanguage: string        // BCP 47 detected language of sanitized text
  sanitizedText: string         // Output of DOM sanitizer (Phase 2.3)
  cleanContentHash: string      // New hash (after Stage 1 change detected)
  previousCleanContentHash: string | null  // Prior hash (null on first fetch)
  scholarshipRecordId: string | null       // null if this is a newly discovered scholarship
  llmProvider: 'gemini' | 'claude' | 'auto'  // 'auto' = try Claude, fallback Gemini
}

// ─── Phase 4 — Authenticity & QA Gate ─────────────────────────────────────────

/**
 * scholarship:qa
 * Dispatched after successful extraction + semanticRecordHash change (Stage 2 diff).
 * Contains the full extracted record so the QA worker is stateless.
 */
export interface QAJobPayload extends ScholarshipJobBase {
  scholarshipRecordId: string
  extractedRecord: Record<string, unknown>  // Validated ScholarshipRecord (JSON)
  semanticRecordHash: string
  previousSemanticHash: string | null       // null = first extraction
  sourceTier: 1 | 2 | 3
  /** Expected redirect host for official link validation (Phase 4.3) */
  expectedRedirectHost?: string
}

// ─── Phase 5 — Intake Key Router & Article Builder ────────────────────────────

/**
 * scholarship:generate
 * NEW CYCLE PATH ONLY. Dispatched when QA passes and intakeKey upsert
 * returns was_inserted = true (new cycle).
 */
export interface GenerateJobPayload extends ScholarshipJobBase {
  scholarshipRecordId: string
  intakeKey: string
  intakeId: string              // UUID of the scholarship_intakes row
  extractedRecord: Record<string, unknown>  // Validated ScholarshipRecord (JSON)
}

/**
 * scholarship:amendment
 * AMENDMENT PATH ONLY. Dispatched when QA passes and intakeKey upsert
 * returns was_inserted = false (existing cycle, data changed).
 * Zero LLM cost — pure template re-render + seoMeta refresh.
 */
export interface AmendmentJobPayload extends ScholarshipJobBase {
  scholarshipRecordId: string
  intakeKey: string
  intakeId: string
  /** The field(s) that changed — drives targeted template re-render */
  changedHardSlots: Array<
    | 'deadline'
    | 'monthlyStipend'
    | 'officialApplyUrl'
    | 'eligibilitySummary'
    | 'requiredDocuments'
    | 'programStartDate'
  >
  updatedRecord: Record<string, unknown>  // Full updated ScholarshipRecord (JSON)
  /** All cluster variant site IDs + revalidation endpoints that need ISR fan-out */
  variantSiteIds: string[]
}

// ─── Phase 6 — Structural Fact-Check Gate ─────────────────────────────────────

/**
 * scholarship:factcheck
 * Dispatched after article generation (new_cycle path only).
 * Verifies ArticlePayload.hardSlots against ScholarshipRecord — no LLM, deterministic.
 */
export interface FactcheckJobPayload extends ScholarshipJobBase {
  scholarshipRecordId: string
  intakeKey: string
  /** UUID of the article_payloads row in DB (or the JSON inline for small payloads) */
  articlePayloadId: string
}

// ─── Phase 8 — Translation & Atomic Cluster Publish ───────────────────────────

/**
 * scholarship:cluster:translate
 * Dispatched after fact-check gate clears. Translates narrativeBlocks
 * to all N target locales and assembles locale-specific article HTML.
 */
export interface ClusterTranslateJobPayload extends ScholarshipJobBase {
  clusterJobId: string          // UUID from scholarship_cluster_jobs
  scholarshipRecordId: string
  intakeKey: string
  articlePayloadId: string
  targetLocales: string[]       // BCP 47 (e.g. ['de-DE', 'ur-PK', 'en-US'])
}

/**
 * scholarship:cluster:publish
 * Dispatched when all translation sub-jobs complete + post-translation slot
 * validation passes. Performs the atomic cluster publish + ISR fan-out.
 */
export interface ClusterPublishJobPayload extends ScholarshipJobBase {
  clusterJobId: string
  clusterId: string             // UUID from scholarship_article_clusters
  scholarshipRecordId: string
  intakeKey: string
  /** All assembled variant IDs to publish atomically */
  variantIds: string[]
}

/**
 * scholarship:cluster:isr-retry
 * Per-domain retry for a single failed ISR POST (v5 fix — Phase 8.4).
 * Enqueued by dispatchIsrFanOut() for any variant where status = 'failed'.
 * Does NOT roll back the cluster publish — HTML is already written.
 */
export interface IsrRetryJobPayload extends ScholarshipJobBase {
  clusterJobId: string
  variantId: string             // UUID from scholarship_article_variants
  siteId: string
  locale: string
  revalidationEndpoint: string  // Absolute HTTPS URL of the site's /api/revalidate
  path: string                  // Path to revalidate (e.g. /scholarships/germany/daad-epos)
  retryCount: number            // Current attempt number (for exponential backoff calc)
}

// ─── Phase 7 — Staleness & Freshness Management ───────────────────────────────

/**
 * scholarship:recheck
 * Enqueued by the staleness cron worker (Phase 7.1) for each active record.
 * Triggers the full two-stage diff (Stage 1 cleanContentHash, Stage 2 semanticHash).
 * Frequency varies by cycleStatus and days to deadline (see Phase 7.1 schedule).
 */
export interface RecheckJobPayload extends ScholarshipJobBase {
  scholarshipRecordId: string
  sourceRegistryName: string
  targetUrl: string
  /** 'high_frequency' = within 30d of deadline | 'standard' | 'low_frequency' | 'monitoring' */
  recheckFrequency: 'high_frequency' | 'standard' | 'low_frequency' | 'monitoring'
}

// ─── Phase 4.5 — Quarantine Queue ─────────────────────────────────────────────

/**
 * scholarship:quarantine
 * Dispatched whenever a QA gate or fact-check gate fails.
 * Persisted to scholarship_quarantine table for human review in the admin UI.
 */
export interface QuarantineJobPayload extends ScholarshipJobBase {
  scholarshipRecordId: string | null  // null if failure occurred before record was created
  sourceUrl: string
  sourceTier: 1 | 2 | 3
  failureReason:
    | 'broken_official_link'
    | 'slot_injection_error'
    | 'extraction_api_failure'
    | 'translation_slot_corruption'
    | 'tier3_only'
    | 'llm_plausibility_error'
    | 'zod_validation_error'
    | 'fact_check_failure'
  failureDetails: Record<string, unknown>
  /** Verbatim source sentences used to derive each flagged field (Phase 3.2) */
  rawEvidence: Record<string, string>
  /** Partial extraction output — displayed to human reviewer */
  extractedRecord?: Record<string, unknown>
}

// ─── DLQ ─────────────────────────────────────────────────────────────────────

/**
 * scholarship:dlq
 * Permanent failure — no further retry. Written by the failed event handler
 * of any scholarship worker after all retry attempts are exhausted.
 */
export interface ScholarshipDlqPayload {
  queueName: string
  originalPayload: Record<string, unknown>
  errorMessage: string
  failedAt: string              // ISO timestamp
  attemptsMade: number
  traceId?: string
}
