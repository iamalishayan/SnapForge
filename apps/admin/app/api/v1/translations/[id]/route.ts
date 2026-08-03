import { handleRouteError } from '../../../../../utils/error'
import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { withValidation } from '../../../../../utils/validate'
import { TranslationUpdateSchema } from '../../../../../utils/schemas'
import { normalizeArticleContent } from '../../articles/utils'

const EDITABLE_STATUSES = new Set(['qa_queue', 'flagged'])

// GET /api/translations/:id — Fetch a single translation by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing translation ID.' }, { status: 400 })
    }

    const translation = await DbService.getTranslationById(id)
    
    if (!translation) {
      return NextResponse.json({ success: false, error: 'Translation not found.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: translation })
  } catch (error: any) {
    return handleRouteError(error, '[id]/route.ts')
  }
}

// PATCH /api/translations/:id — Human edit while in QA (qa_queue | flagged only)
export const PATCH = withValidation(
  TranslationUpdateSchema,
  async (_request, data, context: { params: { id: string } }) => {
    try {
      const { id } = context.params
      const existing = await DbService.getTranslationById(id)

      if (!EDITABLE_STATUSES.has(existing.status || '')) {
        return NextResponse.json(
          {
            success: false,
            error: `Translation can only be edited while status is qa_queue or flagged (current: ${existing.status}).`,
          },
          { status: 400 }
        )
      }

      const updates: Record<string, unknown> = {
        qa_reviewer_notes: 'Content human-edited in QA inspector.',
      }

      if (data.translated_title !== undefined) {
        updates.translated_title = data.translated_title
      }
      if (data.translated_content !== undefined) {
        updates.translated_content = normalizeArticleContent(data.translated_content)
      }
      if (data.translated_meta_title !== undefined) {
        updates.translated_meta_title = data.translated_meta_title
      }
      if (data.translated_meta_description !== undefined) {
        updates.translated_meta_description = data.translated_meta_description
      }
      if (data.translated_faq !== undefined) {
        updates.translated_faq = data.translated_faq
      }

      // Flagged items return to the human review queue after a fix
      if (existing.status === 'flagged') {
        updates.status = 'qa_queue'
      }

      const updated = await DbService.updateTranslation(id, updates)
      return NextResponse.json({ success: true, data: updated })
    } catch (error: any) {
      if (error.message?.includes('No row') || error.message?.includes('0 rows')) {
        return NextResponse.json({ success: false, error: 'Translation not found.' }, { status: 404 })
      }
      return handleRouteError(error, 'PATCH /api/translations/[id]')
    }
  }
)
