import { Worker } from 'bullmq'
import { connection } from './connection'
import { DbService } from '@snapforge/db'
import { translateArticle, runAutoQAChecks } from '@snapforge/ai'
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

    console.log(`[Worker] Processing translation for article ${articleId} -> ${targetLanguage} (${countryCode})`)

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

    console.log(`[Worker] Finished translation job ${job.id}. QA Passed: ${qaResult.passed}`)
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
 * Revalidation Worker
 * Hits Vercel revalidate URL per domain.
 * Concurrency: 1 (Ensures staggered requests to Vercel without overload)
 */
export const revalidationWorker = new Worker<RevalidationJobPayload>(
  'revalidation-jobs',
  async (job) => {
    const { domain, templateSlug } = job.data
    const revalidationSecret = process.env.REVALIDATION_SECRET

    if (!revalidationSecret) {
      throw new Error('REVALIDATION_SECRET environment variable is missing on execution context.')
    }

    console.log(`[Worker] Triggering revalidation on: ${domain}/${templateSlug}`)

    const protocol = domain.includes('localhost') ? 'http' : 'https'
    const revalidateUrl = `${protocol}://${domain}/api/revalidate`
    const response = await fetch(revalidateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidation-secret': revalidationSecret
      },
      body: JSON.stringify({ templateSlug, domain })
    })


    if (!response.ok) {
      const responseBody = await response.text().catch(() => '')
      throw new Error(`Revalidation request failed. HTTP Status: ${response.status}. Detail: ${responseBody}`)
    }

    console.log(`Worker] Revalidated page https://${domain}/${templateSlug}`)
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



