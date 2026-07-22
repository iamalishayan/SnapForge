/**
 * SnapForge Worker Process — start-worker.ts
 *
 * This is the standalone entry point for BullMQ workers.
 * It MUST run as a persistent separate process alongside Next.js (NOT inside it).
 *
 * In development:
 *   pnpm worker:dev
 *
 * In production (Vercel or Railway):
 *   Deploy this as a separate background worker service using `pnpm worker:start`
 */

import 'dotenv/config'
import { translationWorker, revalidationWorker } from './workers'
import { connection } from './connection'

const WORKER_PROCESS_NAME = 'SnapForge Worker'

// ─── Startup Banner ──────────────────────────────────────────────────────────
console.log(`
╔════════════════════════════════════════╗
║    ${WORKER_PROCESS_NAME} v1.0              ║
║    Translation + Revalidation Queue    ║
╚════════════════════════════════════════╝
`)

console.log('[Worker] Translation worker registered on queue: translation-jobs')
console.log('[Worker] Revalidation worker registered on queue: revalidation-jobs')
console.log('[Worker] Listening for jobs...\n')

// ─── Worker Event Listeners ───────────────────────────────────────────────────
translationWorker.on('completed', (job) => {
  console.log(`[Translation] ✅ Job ${job.id} completed successfully.`)
})

translationWorker.on('failed', (job, err) => {
  console.error(`[Translation] ❌ Job ${job?.id} failed: ${err.message}`)
})

translationWorker.on('active', (job) => {
  console.log(`[Translation] 🔄 Job ${job.id} started processing...`)
})

revalidationWorker.on('completed', (job) => {
  console.log(`[Revalidation] ✅ Job ${job.id} completed.`)
})

revalidationWorker.on('failed', (job, err) => {
  console.error(`[Revalidation] ❌ Job ${job?.id} failed: ${err.message}`)
})

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
async function shutdown(signal: string) {
  console.log(`\n[Worker] Received ${signal} — shutting down gracefully...`)

  await Promise.all([
    translationWorker.close(),
    revalidationWorker.close(),
    connection.quit()
  ])

  console.log('[Worker] All workers stopped. Goodbye.')
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

// ─── Health Check ─────────────────────────────────────────────────────────────
// Log a heartbeat every 30 seconds so you know the process is alive
setInterval(() => {
  const mem = process.memoryUsage()
  console.log(
    `[Worker] 💓 Heartbeat | Uptime: ${Math.floor(process.uptime())}s` +
    ` | RSS: ${Math.round(mem.rss / 1024 / 1024)}MB`
  )
}, 30_000)
