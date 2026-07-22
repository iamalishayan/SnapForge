import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'

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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PATCH /api/templates/[id] — update an existing template
// Allowed fields: name, slug, gemini_prompt
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const updatedTemplate = await DbService.updateTemplate(params.id, body)
    return NextResponse.json({ success: true, data: updatedTemplate })
  } catch (error: any) {
    if (error.message.includes('No row')) {
      return NextResponse.json({ success: false, error: 'Template not found.' }, { status: 404 })
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
