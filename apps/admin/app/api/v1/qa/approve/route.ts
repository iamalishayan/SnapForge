import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { revalidationQueue } from '@snapforge/queue'
import { withValidation } from '../../../../../utils/validate'
import { QAApproveSchema } from '../../../../../utils/schemas'
import { handleRouteError } from '../../../../../utils/error'

// POST /api/qa/approve — Marks translation as approved and queues revalidation task
export const POST = withValidation(QAApproveSchema, async (request, data) => {
  try {
    const { translationId, domain, templateSlug } = data

    // Update status to approved
    await DbService.updateTranslationStatus(translationId, 'qa_approved', 'Approved manually via admin UI.')

    // Queue revalidation task so the site clears its cache
    const jobId = `revalidate___${translationId}`
    await (revalidationQueue as any).add(
      'revalidate',
      { domain, templateSlug },
      { jobId }
    )

    return NextResponse.json({ success: true, message: 'Translation approved and revalidation queued.' })
  } catch (error: any) {
    return handleRouteError(error, 'POST /api/qa/approve')
  }
})
