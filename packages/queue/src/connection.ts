import { Redis } from 'ioredis'

const redisUrl = process.env.UPSTASH_REDIS_URL
if (!redisUrl) {
  throw new Error('Redis connection URL (UPSTASH_REDIS_URL) is missing in environment.')
}

// Instantiate shared Redis connection client
export const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ worker instances
  family: 4, // Force IPv4 (fixes ENOTFOUND / ETIMEDOUT errors with Upstash on modern Node versions)
  tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined
})
