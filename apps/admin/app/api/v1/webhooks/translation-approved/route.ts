import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { handleRouteError } from '../../../../../utils/error'
import { getTranslationPageSlugs, buildPublicPageUrl } from '../../translations/page-path'
import { revalidationQueue } from '@snapforge/queue'
import { pingIndexNow, logger } from '@snapforge/shared'

/**
 * POST /api/webhooks/translation-approved
 * Triggered by a Supabase Database Webhook when a translation row's status changes to 'qa_approved'.
 * Fires:
 *  1. BullMQ revalidation job → hits Vercel ISR endpoint to refresh the page cache
 *  2. IndexNow ping → notifies Bing/Yandex of the new page
 *
 * Supabase Webhook setup:
 *   Table: translations
 *   Events: UPDATE
 *   Filter: status=eq.qa_approved
 *   URL: https://your-admin.vercel.app/api/webhooks/translation-approved
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Supabase DB webhook payload shape
    const record = body?.record as {
      id: string
      article_id: string
      site_config_id: string
      status: string
      language_code: string
    } | undefined

    if (!record || record.status !== 'qa_approved') {
      return NextResponse.json({ success: false, error: 'Not a qa_approved event.' }, { status: 400 })
    }

    // Fetch the site config for domain + IndexNow key
    const site = await DbService.getSiteConfigById(record.site_config_id)
    if (!site) {
      return NextResponse.json({ success: false, error: 'Site config not found.' }, { status: 404 })
    }

    const { templateSlug, articleSlug } = await getTranslationPageSlugs(record.id)
    const pageUrl = buildPublicPageUrl(site.domain, templateSlug, articleSlug)

    const safeDomain = site.domain.replace(/:/g, '_')

    await (revalidationQueue as any).add('revalidate', {
      domain: site.domain,
      templateSlug,
      articleSlug,
      requestId: request.headers.get('x-request-id') || undefined
    }, {
      jobId: `revalidate___${safeDomain}___${templateSlug}___${articleSlug}`,
      removeOnComplete: true,
      removeOnFail: false
    })

    // 2. Ping IndexNow if the site has a key configured
    let indexNowResponse: any = null
    let indexNowPinged = false

    if (site.indexnow_key) {
      indexNowResponse = await pingIndexNow(site.domain, site.indexnow_key, [pageUrl])
      indexNowPinged = true
    }

    // 3. Write to publish_log to maintain an immutable audit trail
    await DbService.logPublishAction({
      translation_id: record.id,
      site_config_id: site.id,
      action: 'published',
      indexnow_pinged: indexNowPinged,
      indexnow_response: indexNowResponse as any,
      vercel_revalidation_triggered: true,
      page_url: pageUrl
    })

    logger.info({ pageUrl }, 'Triggered revalidation + IndexNow')

    return NextResponse.json({ success: true, message: 'Webhook processed. Site cache cleared successfully.' })
  } catch (error: any) {
    return handleRouteError(error, 'POST /api/webhooks/translation-approved')
  }
}
