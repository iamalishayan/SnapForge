import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'

// GET /api/templates — returns all templates from database
export async function GET() {
  try {
    const templates = await DbService.getTemplates()
    return NextResponse.json({ success: true, data: templates })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST /api/templates — creates a new template in the database
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const template = await DbService.createTemplate(body)
    return NextResponse.json({ success: true, data: template }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
