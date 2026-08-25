/**
 * scholarship-queue-names.ts — Canonical Queue Name Constants (Phase 0.4)
 *
 * All 10 scholarship pipeline queue names in one place.
 * Import these constants everywhere — never hardcode the strings.
 *
 * Queue topology (from roadmap §0.4):
 *
 *   scholarship:fetch:static     ← Cheerio HTTP fetch jobs (Phase 2.5)
 *   scholarship:fetch:browser    ← Playwright + stealth browser jobs (Phase 2.6)
 *   scholarship:extract          ← LLM cross-lingual extraction jobs (Phase 3)
 *   scholarship:qa               ← Authenticity gate jobs (Phase 4)
 *   scholarship:generate         ← Article builder jobs, new_cycle path only (Phase 5)
 *   scholarship:amendment        ← Amendment re-render + seoMeta jobs (Phase 5.1)
 *   scholarship:factcheck        ← Structural slot verification jobs (Phase 6)
 *   scholarship:cluster:translate← Cluster translation jobs, all locales, atomic (Phase 8)
 *   scholarship:cluster:publish  ← Atomic cluster publish jobs (Phase 8.4)
 *   scholarship:cluster:isr-retry← Per-domain ISR retry on fan-out failure (Phase 8.4 v5 fix)
 *   scholarship:recheck          ← Staleness cron re-check jobs (Phase 7)
 *   scholarship:quarantine       ← Failed gate jobs awaiting human review (Phase 4.5)
 *   scholarship:dlq              ← Dead-letter queue — permanent failures only
 *
 * DLQ policy (§0.4):
 *   Retryable:  network timeout, proxy error, API rate limit → exponential backoff, max 3 attempts
 *   Permanent:  Zod validation error, Tier 3 trust violation, repeated fact-check failure
 *               → scholarship:dlq WITHOUT retry
 */

export const SCHOLARSHIP_QUEUE_NAMES = {
  FETCH_STATIC:      'scholarship:fetch:static',
  FETCH_BROWSER:     'scholarship:fetch:browser',
  EXTRACT:           'scholarship:extract',
  QA:                'scholarship:qa',
  GENERATE:          'scholarship:generate',
  AMENDMENT:         'scholarship:amendment',
  FACTCHECK:         'scholarship:factcheck',
  CLUSTER_TRANSLATE: 'scholarship:cluster:translate',
  CLUSTER_PUBLISH:   'scholarship:cluster:publish',
  CLUSTER_ISR_RETRY: 'scholarship:cluster:isr-retry',
  RECHECK:           'scholarship:recheck',
  QUARANTINE:        'scholarship:quarantine',
  DLQ:               'scholarship:dlq',
} as const

export type ScholarshipQueueName =
  (typeof SCHOLARSHIP_QUEUE_NAMES)[keyof typeof SCHOLARSHIP_QUEUE_NAMES]
