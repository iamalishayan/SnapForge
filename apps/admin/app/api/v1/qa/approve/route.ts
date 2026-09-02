import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { withValidation } from '../../../../../utils/validate'
import { QAApproveSchema } from '../../../../../utils/schemas'
import { handleRouteError } from '../../../../../utils/error'
import { runPublishSideEffects } from '../../../../../lib/publish'

// POST /api/qa/approve — Marks translation as published and runs publish side-effects
// (revalidation, IndexNow ping, publish_log audit) via the shared helper.
export const POST = withValidation(QAApproveSchema, async (request, data) => {
  try {
    const { translationId, domain } = data

    await DbService.updateTranslationStatus(translationId, 'published', 'Approved manually via admin UI.')

    await runPublishSideEffects({
      translationId,
      domain,
      requestId: request.headers.get('x-request-id') || undefined,
    })

    return NextResponse.json({ success: true, message: 'Translation approved; revalidation + IndexNow queued.' })
  } catch (error: any) {
    return handleRouteError(error, 'POST /api/qa/approve')
  }
})
