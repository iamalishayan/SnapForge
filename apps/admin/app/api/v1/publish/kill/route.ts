import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { revalidationQueue } from '@snapforge/queue'
import { withValidation } from '../../../../../utils/validate'
import { PublishKillSchema } from '../../../../../utils/schemas'
import { handleRouteError } from '../../../../../utils/error'
import { getTranslationPageSlugs, buildPublicPageUrl } from '../../translations/page-path'

// POST /api/publish/kill — Emergency unpublish action: flags translation, queues revalidation task,
// and writes an immutable publish_log audit row.
export const POST = withValidation(PublishKillSchema, async (request, data) => {
  try {
    const { translationId, domain, reason } = data

    await DbService.updateTranslationStatus(
      translationId, 
      'flagged', 
      reason || 'Emergency unpublish triggered.'
    )

    const { templateSlug, articleSlug } = await getTranslationPageSlugs(translationId)

    const jobId = `kill___${translationId}`
    await (revalidationQueue as any).add(
      'revalidate',
      { domain, templateSlug, articleSlug, requestId: request.headers.get('x-request-id') || undefined },
      { jobId }
    )

    // Audit trail for the emergency unpublish
    const site = await DbService.getSiteConfigByDomain(domain)
    if (site) {
      await DbService.logPublishAction({
        translation_id: translationId,
        site_config_id: site.id,
        action: 'unpublished',
        vercel_revalidation_triggered: true,
        page_url: buildPublicPageUrl(domain, templateSlug, articleSlug),
      })
    }

    return NextResponse.json({ success: true, message: 'Emergency kill switch completed.' })
  } catch (error: any) {
    return handleRouteError(error, 'POST /api/publish/kill')
  }
})
