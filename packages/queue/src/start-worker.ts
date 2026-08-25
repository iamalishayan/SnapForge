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

// ─── Oracle Cloud IPv6 Fix ────────────────────────────────────────────────────
// Oracle Cloud VMs have an IPv6 interface but no outbound IPv6 route.
// Node.js tries IPv6 first by default, causing ETIMEDOUT on every external fetch
// (Cloudinary, Gemini API, etc). Force IPv4 first at process startup.
import { setDefaultResultOrder } from 'dns'
setDefaultResultOrder('ipv4first')
// ─────────────────────────────────────────────────────────────────────────────

import 'dotenv/config'
import { translationWorker, revalidationWorker, imageTranslationWorker } from './workers'
import { translationQueue, revalidationQueue, deadLetterQueue, imageTranslationQueue } from './index'
import { ALL_SCHOLARSHIP_QUEUES } from './scholarship-queues'
import { SCHOLARSHIP_QUEUE_NAMES } from './scholarship-queue-names'
import { connection } from './connection'
import { logger } from '@snapforge/shared'
import express from 'express'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'

const isDev = process.env.NODE_ENV !== 'production'

const banner = `
=========================================
  SNAPFORGE BACKGROUND WORKER PROCESS
  Node Env: ${process.env.NODE_ENV || 'development'}
=========================================
`

if (isDev) {
  // In dev, print banner directly so it looks nice
  console.log(banner)
}

logger.info({ queue: 'translation-jobs' }, 'Worker registered')
logger.info({ queue: 'revalidation-jobs' }, 'Worker registered')
logger.info({ queue: 'image-translation-jobs' }, 'Worker registered')
// Log all scholarship queues (workers for Phase 2+ registered as they are implemented)
for (const name of Object.values(SCHOLARSHIP_QUEUE_NAMES)) {
  logger.info({ queue: name }, 'Scholarship queue registered (worker pending Phase 2+)')
}
logger.info('Listening for jobs...')

// Setup Bull Board Express Server
const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

createBullBoard({
  queues: [
    // ─── Existing SnapForge queues ────────────────────────────────
    new BullMQAdapter(translationQueue),
    new BullMQAdapter(revalidationQueue),
    new BullMQAdapter(imageTranslationQueue),
    new BullMQAdapter(deadLetterQueue),
    // ─── Scholarship Pipeline queues (Phase 0.4) ──────────────────
    ...ALL_SCHOLARSHIP_QUEUES.map((q) => new BullMQAdapter(q)),
  ],
  serverAdapter,
})

const app = express()

// Simple basic auth using the ADMIN_API_KEY
app.use('/admin/queues', (req, res, next) => {
  const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')
  const expectedKey = process.env.ADMIN_API_KEY

  if (login === 'admin' && password === expectedKey) {
    return next()
  }

  res.set('WWW-Authenticate', 'Basic realm="SnapForge Bull Board"')
  res.status(401).send('Authentication required.')
})

app.use('/admin/queues', serverAdapter.getRouter())

// Render Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Worker is awake and healthy')
})

const envPort = process.env.PORT || process.env.BULL_BOARD_PORT
const boardPort = envPort ? Number(envPort) : 3005
const boardServer = app.listen(boardPort, '0.0.0.0', () => {
  logger.info({ port: boardPort }, 'Worker HTTP server (Bull Board + Health) running')
})

// ─── Worker Event Listeners ───────────────────────────────────────────────────
translationWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Job completed successfully')
})

translationWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, 'Job failed')
})

translationWorker.on('active', (job) => {
  logger.info({ jobId: job.id }, 'Job started processing')
})

revalidationWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Job completed')
})

revalidationWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, 'Job failed')
})

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal, shutting down gracefully...')

  await new Promise(r => boardServer.close(r))

  await Promise.all([
    translationWorker.close(),
    revalidationWorker.close(),
    imageTranslationWorker.close(),
    connection.quit()
  ])

  logger.info('All workers stopped. Goodbye.')
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

// ─── Health Check ─────────────────────────────────────────────────────────────
// Log a heartbeat every 30 seconds so you know the process is alive
setInterval(() => {
  const mem = process.memoryUsage()
}, 30_000)
