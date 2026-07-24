import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { revalidationQueue } from '@snapforge/queue'
import { withValidation } from '../../../../../utils/validate'
import { PublishKillSchema } from '../../../../../utils/schemas'
import { handleRouteError } from '../../../../../utils/error'

// POST /api/publish/kill — Emergency unpublish action: flags translation and queues revalidation task
export const POST = withValidation(PublishKillSchema, async (request, data) => {
  try {
    const { translationId, domain, templateSlug, reason } = data

    // 1. Instantly demote status to flagged
    await DbService.updateTranslationStatus(
      translationId, 
      'flagged', 
      reason || 'Emergency unpublish triggered.'
    )

    // 2. Queue revalidation task to strip live cached version
    const jobId = `kill___${translationId}`
    await (revalidationQueue as any).add(
      'revalidate',
      { domain, templateSlug },
      { jobId }
    )

    return NextResponse.json({ success: true, message: 'Emergency kill switch completed.' })
  } catch (error: any) {
    return handleRouteError(error, 'POST /api/publish/kill')
  }
})
