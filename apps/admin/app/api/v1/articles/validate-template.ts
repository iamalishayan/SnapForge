import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'

/**
 * Ensures an article is linked to an existing, active template (required for translation).
 */
export async function validateArticleTemplateId(
  templateId: string | null | undefined
): Promise<NextResponse | null> {
  if (!templateId) {
    return NextResponse.json(
      {
        success: false,
        error:
          'template_id is required. Every article must be linked to a template for translation.',
      },
      { status: 400 }
    )
  }

  try {
    const template = await DbService.getTemplateById(templateId)
    if (!template.active) {
      return NextResponse.json(
        { success: false, error: 'The selected template is inactive. Choose an active template.' },
        { status: 400 }
      )
    }
    return null
  } catch {
    return NextResponse.json(
      { success: false, error: 'template_id does not match an existing template.' },
      { status: 404 }
    )
  }
}
