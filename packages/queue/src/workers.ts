import { Worker } from 'bullmq'
import { connection } from './connection'
import { DbService } from '@snapforge/db'
import { translateArticle, runAutoQAChecks } from '@snapforge/ai'
import { logger, withTimeout } from '@snapforge/shared'
import type { TranslationJobPayload, RevalidationJobPayload } from './types'

/**
 * Translation Worker
 * Processes AI localization per language/site, triggers QA gate, and writes results to DB.
 * Concurrency: 3 (rate limits API request speeds)
 * Limiter: Max 12 translations per minute (stays safely under Gemini's 15 RPM limits)
 */
export const translationWorker = new Worker<TranslationJobPayload>(
  'translation-jobs',
  async (job) => {
    const { articleId, siteConfigId, targetLanguage, countryCode, primaryKeyword, secondaryKeywords } = job.data

    logger.info({ jobId: job.id, articleId, targetLanguage, countryCode }, 'Processing translation')

    // 1. Fetch original article context (includes joined template data)
    const article = await DbService.getArticleById(articleId)
    if (!article) {
      throw new Error(`Article ${articleId} not found in DB.`)
    }

    // Pull the per-tool Gemini prompt from the linked template (if any)
    const templatePrompt = (article as any).templates?.gemini_prompt ?? null

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

    logger.info({ jobId: job.id, qaPassed: qaResult.passed }, 'Finished translation job')
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
    const { templateSlug, domain } = job.data
    const revalidationSecret = process.env.REVALIDATION_SECRET

    if (!revalidationSecret) {
      throw new Error('REVALIDATION_SECRET environment variable is missing on execution context.')
    }

    if (!domain.includes('localhost') && !isValidPublicDomain(domain)) {
      throw new Error(`SSRF protection blocked request to: ${domain}`)
    }

    logger.info({ jobId: job.id, domain, templateSlug }, 'Triggering revalidation')

    const protocol = domain.includes('localhost') ? 'http' : 'https'
    const revalidateUrl = `${protocol}://${domain}/api/revalidate`
    const response = await withTimeout(
      fetch(revalidateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidation-secret': revalidationSecret
        },
        body: JSON.stringify({ templateSlug, domain })
      }),
      10_000,
      'Revalidation webhook timeout after 10s'
    )


    if (!response.ok) {
      const responseBody = await response.text().catch(() => '')
      throw new Error(`Revalidation request failed. HTTP Status: ${response.status}. Detail: ${responseBody}`)
    }

    logger.info({ jobId: job.id, domain, templateSlug }, 'Revalidated page')
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

import { Queue } from 'bullmq'

const dlq = new Queue<any, any, string>('dead-letter-jobs', {
  connection: connection as any
})

translationWorker.on('failed', async (job, err) => {
  if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
    await dlq.add('failed-translation', {
      originalPayload: job.data,
      error: err.message
    })
    logger.error({ jobId: job.id, err: err.message }, 'Translation Job permanently failed')
  }
})

revalidationWorker.on('failed', async (job, err) => {
  if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
    await dlq.add('failed-revalidation', {
      originalPayload: job.data,
      error: err.message
    })
    logger.error({ jobId: job.id, err: err.message }, 'Revalidation Job permanently failed')
  }
})
