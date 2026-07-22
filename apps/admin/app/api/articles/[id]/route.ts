import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'

// GET /api/articles/:id — fetch a single article by ID
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const article = await DbService.getArticleById(params.id)
    return NextResponse.json({ success: true, data: article })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 404 })
  }
}

// PATCH /api/articles/:id — update article fields (title, content, meta, template_id, status, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const article = await DbService.updateArticle(params.id, body)
    return NextResponse.json({ success: true, data: article })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

// DELETE /api/articles/:id — soft-delete an article (sets deleted_at)
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const article = await DbService.deleteArticle(params.id)
    return NextResponse.json({ success: true, data: article })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
