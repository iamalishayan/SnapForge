import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { handleRouteError } from '../../../../../utils/error'
import { runPublishSideEffects } from '../../../../../lib/publish'

/**
 * POST /api/webhooks/translation-approved
 * Triggered by a Supabase Database Webhook when a translation row's status
 * changes to 'published' (or 'qa_approved' for legacy setups).
 *
 * Fires the shared publish side-effects:
 *  1. BullMQ revalidation job → hits Vercel ISR endpoint to refresh the page cache
 *  2. IndexNow ping → notifies Bing/Yandex of the new page
 *  3. publish_log audit row
 *
 * Supabase Webhook setup:
 *   Table: translations
 *   Events: UPDATE
 *   Filter: status=eq.published
 *   URL: https://your-admin.vercel.app/api/webhooks/translation-approved
 *   Headers: x-supabase-webhook-secret: <SUPABASE_WEBHOOK_SECRET>
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

    if (!record || !['published', 'qa_approved'].includes(record.status)) {
      return NextResponse.json(
        { success: false, error: 'Not a published/qa_approved event.' },
        { status: 400 }
      )
    }

    // Fetch the site config for the domain (needed for revalidation + IndexNow)
    const site = await DbService.getSiteConfigById(record.site_config_id)
    if (!site) {
      return NextResponse.json({ success: false, error: 'Site config not found.' }, { status: 404 })
    }

    await runPublishSideEffects({
      translationId: record.id,
      domain: site.domain,
      requestId: request.headers.get('x-request-id') || undefined,
    })

    return NextResponse.json({ success: true, message: 'Webhook processed. Site cache cleared successfully.' })
  } catch (error: any) {
    return handleRouteError(error, 'POST /api/webhooks/translation-approved')
  }
}