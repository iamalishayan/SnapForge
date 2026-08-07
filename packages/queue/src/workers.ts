import { Worker, Queue } from 'bullmq'
import { connection } from './connection'
import { DbService } from '@snapforge/db'
import {
  translateArticle,
  runAutoQAChecks,
  suggestArticleKeywords,
  extractImageUrlsFromHtml,
} from '@snapforge/ai'
import { processImageTranslation } from './image-translation-processor'
import { logger, withTimeout } from '@snapforge/shared'
import type {
  TranslationJobPayload,
  RevalidationJobPayload,
  ImageTranslationJobPayload,
} from './types'

const imageTranslationQueue = new Queue<ImageTranslationJobPayload>(
  'image-translation-jobs',
  { connection: connection as any }
)

/**
 * Translation Worker
 * Processes AI localization per language/site, triggers QA gate, and writes results to DB.
 * Concurrency: 3 (rate limits API request speeds)
 * Limiter: Max 12 translations per minute (stays safely under Gemini's 15 RPM limits)
 */
export const translationWorker = new Worker<TranslationJobPayload>(
  'translation-jobs',
  async (job) => {
    const { articleId, siteConfigId, targetLanguage, countryCode, requestId } = job.data

    logger.info({ jobId: job.id, requestId, articleId, targetLanguage, countryCode }, 'Processing translation')

    // Mark in-progress so UI shows retries as processing (not stuck failed)
    try {
      await DbService.markTranslationProcessing(
        articleId,
        siteConfigId,
        targetLanguage,
        countryCode
      )
    } catch (statusErr) {
      logger.warn(
        {
          requestId,
          articleId,
          err: statusErr instanceof Error ? statusErr.message : statusErr,
        },
        'Failed to mark translation processing'
      )
    }

    // 1. Fetch original article context (includes joined template data)
    const article = await DbService.getArticleById(articleId)
    if (!article) {
      throw new Error(`Article ${articleId} not found in DB.`)
    }

    // Pull the per-tool Gemini prompt from the linked template (if any)
    const templatePrompt = (article as any).templates?.gemini_prompt ?? null

    // 1.5 Fetch or Generate SEO Keywords for this specific article
    let keywords = await DbService.getKeywordsByArticleAndLanguage(articleId, targetLanguage)
    
    let primaryKeyword: string | undefined = undefined
    let secondaryKeywords: string[] = []
    
    if (!keywords) {
      const suggested = await suggestArticleKeywords(article.content || '', targetLanguage, countryCode)
      if (suggested.length > 0) {
        primaryKeyword = suggested[0]
        secondaryKeywords = suggested.slice(1)
        
        await DbService.saveKeywords({
          article_id: articleId,
          language_code: targetLanguage,
          country_code: countryCode,
          primary_keyword: primaryKeyword,
          secondary_keywords: secondaryKeywords,
          source: 'gemini-article-auto'
        })
      }
    } else {
      primaryKeyword = keywords.primary_keyword
      secondaryKeywords = (keywords.secondary_keywords as string[]) || []
    }

    // 2. Call AI Translator with optional per-tool prompt guidance
    const translation = await translateArticle(
      article,
      targetLanguage,
      countryCode,
      primaryKeyword,
      secondaryKeywords,
      templatePrompt
    )

    // 3. Run automated validation checks
    const qaResult = await runAutoQAChecks(
      translation,
      article,
      targetLanguage,
      primaryKeyword,
      secondaryKeywords
    )

    // 4. Upsert translated results to translations table
    const result = await DbService.upsertTranslation({
      article_id: articleId,
      site_config_id: siteConfigId,
      language_code: targetLanguage,
      country_code: countryCode,
      translated_title: translation.translated_title,
      translated_content: translation.translated_content,
      translated_meta_title: translation.translated_meta_title,
      translated_meta_description: translation.translated_meta_description,
      translated_faq: translation.translated_faq,
      target_keywords: primaryKeyword ? [primaryKeyword, ...secondaryKeywords] : [],
      inner_links: article.inner_links as any,
      outer_links: article.outer_links as any,
      status: qaResult.passed ? 'qa_queue' : 'staging', // Only push to QA queue if auto-passed
      qa_auto_passed: qaResult.passed,
      qa_auto_errors: qaResult.errors,
      qa_auto_warnings: qaResult.warnings as any, // Safely persist structured warnings
      last_error: null,

      model_used: translation.model_used,
      token_count: translation.output_tokens
    })

    // 5. Log API generation cost metrics
    await DbService.logCost({
      translation_id: result.id,
      model: translation.model_used,
      input_tokens: translation.input_tokens,
      output_tokens: translation.output_tokens,
      estimated_cost_usd: (translation.input_tokens * 0.000075) + (translation.output_tokens * 0.0003) // Gemini price estimator
    })

    // 6. Enqueue image localization (non-blocking for text pipeline)
    const imageUrls = extractImageUrlsFromHtml(translation.translated_content || article.content || '')
    if (imageUrls.length > 0) {
      try {
        const jobId = `img___${result.id}`
        await imageTranslationQueue.add(
          'localize-images',
          { translationId: result.id, requestId },
          { jobId, removeOnComplete: true, removeOnFail: false }
        )
        logger.info(
          { jobId, requestId, translationId: result.id, imageCount: imageUrls.length },
          'Queued image localization'
        )
      } catch (enqueueErr) {
        logger.warn(
          {
            requestId,
            translationId: result.id,
            err: enqueueErr instanceof Error ? enqueueErr.message : enqueueErr,
          },
          'Failed to enqueue image localization; text translation succeeded'
        )
      }
    }

    logger.info({ jobId: job.id, requestId, qaPassed: qaResult.passed }, 'Finished translation job')
  },
  {
    connection: connection as any,
    concurrency: 3,
    limiter: {
      max: 12,
      duration: 60000 // Rate limit: Max 12 jobs executed per minute
    }
  }
)

/**
 * Image Translation Worker
 * VLM classify → translate slots → SVG template render → storage upload → src rewrite.
 * Logos/photos are kept; unmatched or low-confidence images are flagged for QA.
 */
export const imageTranslationWorker = new Worker<ImageTranslationJobPayload>(
  'image-translation-jobs',
  async (job) => {
    const { translationId, requestId } = job.data

    logger.info({ jobId: job.id, requestId, translationId }, 'Processing image localization')

    const { entries, needsReview } = await processImageTranslation(translationId, requestId)

    logger.info(
      {
        jobId: job.id,
        requestId,
        translationId,
        imageCount: entries.length,
        rendered: entries.filter((e) => e.status === 'rendered').length,
        needsReview,
      },
      'Finished image localization'
    )
  },
  {
    connection: connection as any,
    concurrency: 2,
    limiter: {
      max: 6,
      duration: 60000,
    },
  }
)

function isValidPublicDomain(domain: string): boolean {
  try {
    const hostname = new URL(`https://${domain}`).hostname
    const blocked = /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/
    return !blocked.test(hostname)
  } catch {
    return false
  }
}

/**
 * Revalidation Worker
 * Hits the Next.js revalidation endpoint on the sites frontend to clear the CDN cache
 * Concurrency: 1 (Ensures we don't bombard our own frontend)
 */
export const revalidationWorker = new Worker<RevalidationJobPayload>(
  'revalidation-jobs',
  async (job) => {
    const { templateSlug, articleSlug, domain, requestId } = job.data
    const revalidationSecret = process.env.REVALIDATION_SECRET

    if (!revalidationSecret) {
      throw new Error('REVALIDATION_SECRET environment variable is missing on execution context.')
    }

    if (!domain.includes('localhost') && !isValidPublicDomain(domain)) {
      throw new Error(`SSRF protection blocked request to: ${domain}`)
    }

    logger.info({ jobId: job.id, requestId, domain, templateSlug }, 'Triggering revalidation')

    const protocol = domain.includes('localhost') ? 'http' : 'https'
    const revalidateUrl = `${protocol}://${domain}/api/revalidate`
    const response = await withTimeout(
      fetch(revalidateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidation-secret': revalidationSecret
        },
        body: JSON.stringify({ templateSlug, articleSlug, domain })
      }),
      10_000,
      'Revalidation webhook timeout after 10s'
    )


    if (!response.ok) {
      const responseBody = await response.text().catch(() => '')
      throw new Error(`Revalidation request failed. HTTP Status: ${response.status}. Detail: ${responseBody}`)
    }

    logger.info({ jobId: job.id, requestId, domain, templateSlug }, 'Revalidated page')
  },
  {
    connection: connection as any,
    concurrency: 1,
    limiter: {
      max: 1,
      duration: 1000 // Rate limit: Max 1 revalidation task per second
    }
  }
)

const dlq = new Queue<any, any, string>('dead-letter-jobs', {
  connection: connection as any
})

imageTranslationWorker.on('failed', async (job, err) => {
  if (!job) {
    return
  }

  logger.error(
    { jobId: job.id, requestId: job.data.requestId, err: err.message },
    'Image text detection job failed'
  )

  try {
    await DbService.updateTranslation(job.data.translationId, {
      image_translation_needed: true,
    })
  } catch (updateErr) {
    logger.error(
      {
        translationId: job.data.translationId,
        err: updateErr instanceof Error ? updateErr.message : updateErr,
      },
      'Failed to flag translation after image detection failure'
    )
  }

  if (job.attemptsMade >= (job.opts.attempts || 2)) {
    await dlq.add('failed-image-translation', {
      originalPayload: job.data,
      error: err.message,
    })
  }
})

translationWorker.on('failed', async (job, err) => {
  if (!job) {
    return
  }

  if (job.attemptsMade >= (job.opts.attempts || 5)) {
    try {
      await DbService.markTranslationFailed(
        job.data.articleId,
        job.data.siteConfigId,
        err.message
      )
    } catch (updateErr) {
      logger.error(
        {
          jobId: job.id,
          articleId: job.data.articleId,
          err: updateErr instanceof Error ? updateErr.message : updateErr,
        },
        'Failed to persist translation failure status'
      )
    }

    await dlq.add('failed-translation', {
      originalPayload: job.data,
      error: err.message
    })
    logger.error({ jobId: job.id, requestId: job.data.requestId, err: err.message }, 'Translation Job permanently failed')
  } else {
    logger.warn(
      {
        jobId: job.id,
        requestId: job.data.requestId,
        attempt: job.attemptsMade,
        err: err.message,
      },
      'Translation job failed; will retry'
    )
  }
})

revalidationWorker.on('failed', async (job, err) => {
  if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
    await dlq.add('failed-revalidation', {
      originalPayload: job.data,
      error: err.message
    })
    logger.error({ jobId: job.id, requestId: job.data.requestId, err: err.message }, 'Revalidation Job permanently failed')
  }
})
