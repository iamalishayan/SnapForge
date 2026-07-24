import { handleRouteError } from '../../../../utils/error'
import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { withValidation } from '../../../../utils/validate'
import { TemplateCreateSchema } from '../../../../utils/schemas'

// GET /api/templates — returns all templates from database
export async function GET() {
  try {
    const templates = await DbService.getTemplates()
    return NextResponse.json({ success: true, data: templates })
  } catch (error: any) {
    return handleRouteError(error, 'GET /api/templates')
  }
}

// POST /api/templates — creates a new template in the database
export const POST = withValidation(TemplateCreateSchema, async (request, data) => {
  try {
    const template = await DbService.createTemplate(data as any)
    return NextResponse.json({ success: true, data: template }, { status: 201 })
  } catch (error: any) {
    return handleRouteError(error, 'POST /api/templates')
  }
})
