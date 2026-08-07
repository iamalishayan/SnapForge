import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { translationQueue } from '@snapforge/queue'
import { withValidation } from '../../../../utils/validate'
import { TranslateRequestSchema } from '../../../../utils/schemas'
import { handleRouteError } from '../../../../utils/error'
import { validateArticleTemplateId } from '../articles/validate-template'
import { validateArticleForTranslation } from '@snapforge/ai'

// POST /api/translate — Fans out translation jobs to all active sites for a given articleId
export const POST = withValidation(TranslateRequestSchema, async (request, data) => {
  try {


    const { articleId, siteConfigIds, force } = data

    // 1. Fetch original article context
    const article = await DbService.getArticleById(articleId)
    if (!article) {
      return NextResponse.json({ success: false, error: 'Article not found.' }, { status: 404 })
    }

    if (!article.template_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Article has no template_id. Assign a template before translating.',
        },
        { status: 400 }
      )
    }

    if (article.status !== 'ready') {
      return NextResponse.json(
        {
          success: false,
          error:
            'Article must be marked "ready" before translating. Save the article with status ready or use Send to Translation.',
        },
        { status: 400 }
      )
    }

    const templateError = await validateArticleTemplateId(article.template_id)
    if (templateError) return templateError

    const translatable = validateArticleForTranslation(article.content || '')
    if (translatable.ok === false) {
      return NextResponse.json({ success: false, error: translatable.error }, { status: 400 })
    }

    // 2. Fetch all active site configurations
    let sites = await DbService.getSiteConfigs()
    if (sites.length === 0) {
      return NextResponse.json({ success: false, error: 'No active site configurations found.' }, { status: 400 })
    }

    // Filter by specific sites if requested
    if (siteConfigIds && siteConfigIds.length > 0) {
      sites = sites.filter((site: any) => siteConfigIds.includes(site.id))
      if (sites.length === 0) {
        return NextResponse.json({ success: false, error: 'None of the specified siteConfigIds were found or active.' }, { status: 404 })
      }
    }

    // Prevent duplicate translations unless explicitly forced
    if (!force) {
      const existingTranslations = await DbService.getTranslations({ articleId })
      const existingSiteIds = new Set(existingTranslations.map((t: any) => t.site_config_id))
      
      sites = sites.filter((site: any) => !existingSiteIds.has(site.id))
      
      if (sites.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'All requested sites already have a translation for this article. Pass "force": true to overwrite.' 
        }, { status: 400 })
      }
    }

    const enqueuedJobs = []

    // 3. Queue one translation job per site target
    for (const site of sites) {
      const payload = {
        articleId,
        siteConfigId: site.id,
        targetLanguage: site.language_code,
        countryCode: site.country_code,
        requestId: request.headers.get('x-request-id') || undefined
      }

      // Placeholder row so admin UI shows processing before the worker finishes
      await DbService.markTranslationProcessing(
        articleId,
        site.id,
        site.language_code,
        site.country_code
      )

      // Generate a deterministic jobId to prevent duplicate enqueues (BullMQ rejects colons)
      const jobId = `${articleId}___${site.id}`

      const existingJob = await (translationQueue as any).getJob(jobId)
      if (existingJob) {
        await existingJob.remove()
      }

      const job = await (translationQueue as any).add('translate', payload, {
        jobId,
        removeOnComplete: true, // Clean up successful jobs automatically
        removeOnFail: false    // Preserve failed jobs for inspection
      })

      enqueuedJobs.push({
        jobId: job.id,
        site: site.domain,
        language: site.language_code
      })
    }

    return NextResponse.json({
      success: true,
      message: `Queued ${enqueuedJobs.length} translation job(s). Status will show as processing; failures appear on the dashboard.`,
    })
  } catch (error: any) {
    return handleRouteError(error, 'POST /api/translate')
  }
})
