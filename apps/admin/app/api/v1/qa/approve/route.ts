import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { revalidationQueue } from '@snapforge/queue'
import { withValidation } from '../../../../../utils/validate'
import { QAApproveSchema } from '../../../../../utils/schemas'
import { handleRouteError } from '../../../../../utils/error'
import { getTranslationPageSlugs } from '../../translations/page-path'

// POST /api/qa/approve — Marks translation as approved and queues revalidation task
export const POST = withValidation(QAApproveSchema, async (request, data) => {
  try {
    const { translationId, domain } = data

    await DbService.updateTranslationStatus(translationId, 'published', 'Approved manually via admin UI.')

    const { templateSlug, articleSlug } = await getTranslationPageSlugs(translationId)

    const jobId = `revalidate___${translationId}`
    await (revalidationQueue as any).add(
      'revalidate',
      { domain, templateSlug, articleSlug, requestId: request.headers.get('x-request-id') || undefined },
      { jobId }
    )

    return NextResponse.json({ success: true, message: 'Translation approved and revalidation queued.' })
  } catch (error: any) {
    return handleRouteError(error, 'POST /api/qa/approve')
  }
})
