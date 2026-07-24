import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { withValidation } from '../../../../../utils/validate'
import { QAFlagSchema } from '../../../../../utils/schemas'
import { handleRouteError } from '../../../../../utils/error'

// POST /api/qa/flag — Flags a translation and stores reviewer notes/reasons
export const POST = withValidation(QAFlagSchema, async (request, data) => {
  try {
    const { translationId, reviewerNotes } = data

    // Update status to flagged with notes
    await DbService.updateTranslationStatus(translationId, 'flagged', reviewerNotes)

    return NextResponse.json({ success: true, message: 'Translation successfully flagged.' })
  } catch (error: any) {
    return handleRouteError(error, 'POST /api/qa/flag')
  }
})
