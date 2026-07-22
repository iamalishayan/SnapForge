import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { revalidationQueue } from '@snapforge/queue'
import { pingIndexNow } from '@snapforge/shared'

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
    const sites = await DbService.getSiteConfigs()
    const site = sites.find(s => s.id === record.site_config_id)
    if (!site) {
      return NextResponse.json({ success: false, error: 'Site config not found.' }, { status: 404 })
    }

    // Fetch the article for the template slug (used as URL path)
    const article = await DbService.getArticleById(record.article_id)
    const templateSlug = (article as any)?.templates?.slug || 'unknown'
    const pageUrl = `https://${site.domain}/${templateSlug}`

    // Sanitize domain for BullMQ jobId (replace colons from ports like localhost:3009)
    const safeDomain = site.domain.replace(/:/g, '_')

    // 1. Enqueue ISR revalidation job via BullMQ
    await (revalidationQueue as any).add('revalidate', {
      domain: site.domain,
      templateSlug
    }, {
      jobId: `revalidate___${safeDomain}___${templateSlug}`,
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

    console.log(`[Webhook] Triggered revalidation + IndexNow for ${pageUrl}`)

    return NextResponse.json({
      success: true,
      message: `Revalidation and IndexNow triggered for ${pageUrl}`
    })
  } catch (error: any) {
    console.error('[Webhook] translation-approved handler error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
