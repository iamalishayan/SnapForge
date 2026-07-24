import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { translationQueue } from '@snapforge/queue'
import { withValidation } from '../../../../utils/validate'
import { TranslateRequestSchema } from '../../../../utils/schemas'
import { handleRouteError } from '../../../../utils/error'

// POST /api/translate — Fans out translation jobs to all active sites for a given articleId
export const POST = withValidation(TranslateRequestSchema, async (request, data) => {
  try {
    const { articleId, siteConfigId, force } = data

    // 1. Fetch original article context
    const article = await DbService.getArticleById(articleId)
    if (!article) {
      return NextResponse.json({ success: false, error: 'Article not found.' }, { status: 404 })
    }

    // 2. Fetch all active site configurations
    let sites = await DbService.getSiteConfigs()
    if (sites.length === 0) {
      return NextResponse.json({ success: false, error: 'No active site configurations found.' }, { status: 400 })
    }

    // Filter by specific site if requested
    if (siteConfigId) {
      sites = sites.filter((site: any) => site.id === siteConfigId)
      if (sites.length === 0) {
        return NextResponse.json({ success: false, error: 'The specified siteConfigId was not found or is inactive.' }, { status: 404 })
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

    // 2.5 Batch fetch keywords for all target languages
    const targetLangs = Array.from(new Set(sites.map((s: any) => s.language_code))) as string[]
    const allKeywords = await DbService.getKeywordsForTemplateBatch(article.template_id!, targetLangs)
    const keywordsByLang = new Map(allKeywords.map((k: any) => [k.language_code, k]))

    // 3. Queue one translation job per site target
    for (const site of sites) {
      const keywords = keywordsByLang.get(site.language_code)

      const payload = {
        articleId,
        siteConfigId: site.id,
        targetLanguage: site.language_code,
        countryCode: site.country_code,
        primaryKeyword: keywords?.primary_keyword || undefined,
        secondaryKeywords: (keywords?.secondary_keywords as string[]) || []
      }

      // Generate a deterministic jobId to prevent duplicate enqueues (BullMQ rejects colons)
      const jobId = `${articleId}___${site.id}`

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

    return NextResponse.json({ success: true, message: `Queued ${enqueuedJobs.length} translation jobs across ${sites.length} sites.` })
  } catch (error: any) {
    return handleRouteError(error, 'POST /api/translate')
  }
})
