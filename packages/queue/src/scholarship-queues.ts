/**
 * scholarship-queues.ts — BullMQ Queue Instances (Phase 0.4)
 *
 * All 13 scholarship pipeline queues instantiated with typed payloads
 * and correct retry/DLQ policies per the roadmap §0.4 spec:
 *
 *   Retryable failures (network timeout, proxy error, API rate limit):
 *     → retry with exponential backoff, max 3 attempts
 *
 *   Permanent failures (Zod validation error, Tier 3 trust violation,
 *     repeated fact-check failure):
 *     → scholarship:dlq WITHOUT retry
 *
 * These queue instances are:
 *   1. Registered in Bull Board (start-worker.ts)
 *   2. Used by producer code in Phase 2+ workers to enqueue jobs
 *   3. Consumed by Worker<T> instances in their respective worker files
 *
 * NOTE: The Playwright browser worker (scholarship:fetch:browser) runs in an
 * ISOLATED Docker container and does NOT share the worker process with the
 * Cheerio static fetcher. It connects to the same Redis but has its own
 * concurrency + limiter config. This file only defines the Queue instance
 * (the producer side) — the browser Worker<> is defined in Phase 2.6.
 */

import { Queue } from 'bullmq'
import { connection } from './connection'
import { SCHOLARSHIP_QUEUE_NAMES } from './scholarship-queue-names'
import type {
  FetchStaticJobPayload,
  FetchBrowserJobPayload,
  ExtractJobPayload,
  QAJobPayload,
  GenerateJobPayload,
  AmendmentJobPayload,
  FactcheckJobPayload,
  ClusterTranslateJobPayload,
  ClusterPublishJobPayload,
  IsrRetryJobPayload,
  RecheckJobPayload,
  QuarantineJobPayload,
  ScholarshipDlqPayload,
} from './scholarship-types'

const conn = connection as any

// ─── Phase 2 — Fetcher Layer ──────────────────────────────────────────────────

/** Cheerio HTTP fetch jobs. Concurrency set in the worker, not here. */
export const scholarshipFetchStaticQueue = new Queue<FetchStaticJobPayload>(
  SCHOLARSHIP_QUEUE_NAMES.FETCH_STATIC,
  {
    connection: conn,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10_000 },
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 200 },
    },
  }
)

/**
 * Playwright browser fetch jobs.
 * The consuming Worker<> runs in an isolated container — not in this process.
 * Queue is still instantiated here so Bull Board can display it.
 */
export const scholarshipFetchBrowserQueue = new Queue<FetchBrowserJobPayload>(
  SCHOLARSHIP_QUEUE_NAMES.FETCH_BROWSER,
  {
    connection: conn,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 15_000 },
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 200 },
    },
  }
)

// ─── Phase 3 — Cross-Lingual Extraction ───────────────────────────────────────

/** LLM extraction jobs. 3 retries — handles Gemini 503/429 transient spikes. */
export const scholarshipExtractQueue = new Queue<ExtractJobPayload>(
  SCHOLARSHIP_QUEUE_NAMES.EXTRACT,
  {
    connection: conn,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 20_000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 100 },
    },
  }
)

// ─── Phase 4 — Authenticity & QA Gate ─────────────────────────────────────────

/**
 * QA gate jobs. Structural checks are deterministic (no retry needed for logic errors).
 * 3 retries cover network failures during official link check (Phase 4.3).
 */
export const scholarshipQAQueue = new Queue<QAJobPayload>(
  SCHOLARSHIP_QUEUE_NAMES.QA,
  {
    connection: conn,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 100 },
    },
  }
)

// ─── Phase 5 — Article Builder ────────────────────────────────────────────────

/**
 * New cycle article build jobs — LLM narrative generation.
 * 3 retries for LLM API transient failures. Permanent failures → DLQ.
 */
export const scholarshipGenerateQueue = new Queue<GenerateJobPayload>(
  SCHOLARSHIP_QUEUE_NAMES.GENERATE,
  {
    connection: conn,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 20_000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 100 },
    },
  }
)

/**
 * Amendment re-render jobs — zero LLM cost, deterministic.
 * 2 retries — only network/DB failures can cause transient errors here.
 */
export const scholarshipAmendmentQueue = new Queue<AmendmentJobPayload>(
  SCHOLARSHIP_QUEUE_NAMES.AMENDMENT,
  {
    connection: conn,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 100 },
    },
  }
)

// ─── Phase 6 — Structural Fact-Check Gate ─────────────────────────────────────

/**
 * Fact-check gate jobs — deterministic slot verification + lightweight LLM prose scan.
 * 2 retries (LLM prose scan). Hard slot mismatches fail permanently → DLQ.
 */
export const scholarshipFactcheckQueue = new Queue<FactcheckJobPayload>(
  SCHOLARSHIP_QUEUE_NAMES.FACTCHECK,
  {
    connection: conn,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'exponential', delay: 10_000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 100 },
    },
  }
)

// ─── Phase 8 — Translation & Atomic Cluster Publish ───────────────────────────

/**
 * Cluster translation jobs — translates narrativeBlocks to all N target locales.
 * 3 retries for LLM translation API failures. Post-translation slot validation
 * failure → quarantine:translation_slot_corruption (not retry).
 */
export const scholarshipClusterTranslateQueue = new Queue<ClusterTranslateJobPayload>(
  SCHOLARSHIP_QUEUE_NAMES.CLUSTER_TRANSLATE,
  {
    connection: conn,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 20_000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 100 },
    },
  }
)

/**
 * Atomic cluster publish jobs — assembles all N variants and fires ISR fan-out.
 * 2 retries for DB write transient failures. ISR fan-out failures are handled
 * per-domain via scholarship:cluster:isr-retry — not by retrying the whole job.
 */
export const scholarshipClusterPublishQueue = new Queue<ClusterPublishJobPayload>(
  SCHOLARSHIP_QUEUE_NAMES.CLUSTER_PUBLISH,
  {
    connection: conn,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 100 },
    },
  }
)

/**
 * Per-domain ISR retry jobs (v5 fix — Phase 8.4).
 * Enqueued for individual failing domains — does NOT roll back the cluster publish.
 * Max 4 retries with aggressive exponential backoff (site endpoint may be down briefly).
 * Phase 9 monitoring alerts when retryCount > 3.
 */
export const scholarshipClusterIsrRetryQueue = new Queue<IsrRetryJobPayload>(
  SCHOLARSHIP_QUEUE_NAMES.CLUSTER_ISR_RETRY,
  {
    connection: conn,
    defaultJobOptions: {
      attempts: 4,
      backoff: { type: 'exponential', delay: 30_000 },
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 200 },
    },
  }
)

// ─── Phase 7 — Staleness & Freshness Management ───────────────────────────────

/**
 * Staleness re-check cron jobs.
 * Low retry — if a re-check fails transiently the cron will retry on its next cycle.
 * jobId is set to the scholarshipRecordId to prevent duplicate re-check jobs
 * being enqueued for the same record if the cron fires twice.
 */
export const scholarshipRecheckQueue = new Queue<RecheckJobPayload>(
  SCHOLARSHIP_QUEUE_NAMES.RECHECK,
  {
    connection: conn,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'exponential', delay: 30_000 },
      removeOnComplete: { count: 1000 },  // Keep more — high-volume cron queue
      removeOnFail: { count: 500 },
    },
  }
)

// ─── Phase 4.5 — Quarantine ───────────────────────────────────────────────────

/**
 * Quarantine jobs — no retry. Failed records are persisted to scholarship_quarantine
 * for human review. The quarantine worker writes the DB row and alerts monitoring.
 */
export const scholarshipQuarantineQueue = new Queue<QuarantineJobPayload>(
  SCHOLARSHIP_QUEUE_NAMES.QUARANTINE,
  {
    connection: conn,
    defaultJobOptions: {
      attempts: 1,  // No retry — quarantine is a terminal state pending human action
      removeOnComplete: { count: 200 },
      removeOnFail: false,  // Keep failed quarantine jobs visible in Bull Board
    },
  }
)

// ─── DLQ ─────────────────────────────────────────────────────────────────────

/**
 * Scholarship DLQ — permanent failures only, no retry.
 * Phase 9 monitoring alerts immediately on any new DLQ entry.
 */
export const scholarshipDlq = new Queue<ScholarshipDlqPayload>(
  SCHOLARSHIP_QUEUE_NAMES.DLQ,
  {
    connection: conn,
    defaultJobOptions: {
      attempts: 1,
      removeOnComplete: false,  // Preserve all DLQ entries for investigation
      removeOnFail: false,
    },
  }
)

// ─── Convenience export ───────────────────────────────────────────────────────

/** All scholarship queues as an array — used by Bull Board registration */
export const ALL_SCHOLARSHIP_QUEUES = [
  scholarshipFetchStaticQueue,
  scholarshipFetchBrowserQueue,
  scholarshipExtractQueue,
  scholarshipQAQueue,
  scholarshipGenerateQueue,
  scholarshipAmendmentQueue,
  scholarshipFactcheckQueue,
  scholarshipClusterTranslateQueue,
  scholarshipClusterPublishQueue,
  scholarshipClusterIsrRetryQueue,
  scholarshipRecheckQueue,
  scholarshipQuarantineQueue,
  scholarshipDlq,
] as const
