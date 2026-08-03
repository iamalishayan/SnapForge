import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { withValidation } from '../../../../../utils/validate'
import { TemplateUpdateSchema } from '../../../../../utils/schemas'
import { handleRouteError } from '../../../../../utils/error'

// GET /api/templates/[id] — fetch a single template
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const template = await DbService.getTemplateById(params.id)
    return NextResponse.json({ success: true, data: template })
  } catch (error: any) {
    if (error.message.includes('No row')) {
      return NextResponse.json({ success: false, error: 'Template not found.' }, { status: 404 })
    }
    return handleRouteError(error, 'GET /api/templates/[id]')
  }
}

// PATCH /api/templates/[id] — update an existing template
// Allowed fields: name, slug, gemini_prompt
export const PATCH = withValidation(TemplateUpdateSchema, async (request, data, context: { params: { id: string } }) => {
  try {
    const updatedTemplate = await DbService.updateTemplate(context.params.id, data as any)
    return NextResponse.json({ success: true, data: updatedTemplate })
  } catch (error: any) {
    if (error.message.includes('No row')) {
      return NextResponse.json({ success: false, error: 'Template not found.' }, { status: 404 })
    }
    return handleRouteError(error, 'PATCH /api/templates/[id]')
  }
})

// DELETE /api/templates/[id] — soft delete a template
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deletedTemplate = await DbService.deleteTemplate(params.id)
    return NextResponse.json({ success: true, data: deletedTemplate })
  } catch (error: any) {
    if (error.message.includes('No row')) {
      return NextResponse.json({ success: false, error: 'Template not found.' }, { status: 404 })
    }
    return handleRouteError(error, 'DELETE /api/templates/[id]')
  }
}
