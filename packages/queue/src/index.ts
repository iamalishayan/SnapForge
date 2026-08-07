import { Queue } from 'bullmq'
import { connection } from './connection'
import type { TranslationJobPayload, RevalidationJobPayload, ImageTranslationJobPayload } from './types'

// BullMQ Queue wrappers with retry configurations
export const translationQueue = new Queue<TranslationJobPayload, any, string>('translation-jobs', { 
  connection: connection as any,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 15000 // Retry starting at 15s for Gemini 503/429 spikes
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

// DLQ for permanently failed jobs (after all retries)
export const deadLetterQueue = new Queue<any, any, string>('dead-letter-jobs', {
  connection: connection as any
})

export const imageTranslationQueue = new Queue<ImageTranslationJobPayload, any, string>(
  'image-translation-jobs',
  {
    connection: connection as any,
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    },
  }
)



export * from './types'
export * from './workers'
export * from './connection'
export * from './image-translation-processor'



