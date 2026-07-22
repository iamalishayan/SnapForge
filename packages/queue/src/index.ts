import { Queue } from 'bullmq'
import { connection } from './connection'
import type { TranslationJobPayload, RevalidationJobPayload } from './types'

// BullMQ Queue wrappers with retry configurations
export const translationQueue = new Queue<TranslationJobPayload, any, string>('translation-jobs', { 
  connection: connection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000 // Retry starting at 5s delay, scaling exponentially
    }
  }
})

export const revalidationQueue = new Queue<RevalidationJobPayload, any, string>('revalidation-jobs', { 
  connection: connection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000
    }
  }
})



export * from './types'
export * from './workers'
export * from './connection'



