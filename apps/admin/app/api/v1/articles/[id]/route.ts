import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { withValidation } from '../../../../../utils/validate'
import { ArticleUpdateSchema } from '../../../../../utils/schemas'
import { handleRouteError } from '../../../../../utils/error'

// GET /api/articles/[id] — fetch a single article by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const article = await DbService.getArticleById(params.id)
    return NextResponse.json({ success: true, data: article })
  } catch (error: any) {
    if (error.message.includes('No row')) {
      return NextResponse.json({ success: false, error: 'Article not found.' }, { status: 404 })
    }
    return handleRouteError(error, 'GET /api/articles/[id]')
  }
}

// PATCH /api/articles/[id] — update an existing article
export const PATCH = withValidation(ArticleUpdateSchema, async (request, data, context: { params: { id: string } }) => {
  try {
    const updatedArticle = await DbService.updateArticle(context.params.id, data as any)
    return NextResponse.json({ success: true, data: updatedArticle })
  } catch (error: any) {
    if (error.message.includes('No row')) {
      return NextResponse.json({ success: false, error: 'Article not found.' }, { status: 404 })
    }
    return handleRouteError(error, 'PATCH /api/articles/[id]')
  }
})

// DELETE /api/articles/[id] — soft delete an article
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await DbService.deleteArticle(params.id)
    return NextResponse.json({ success: true, message: 'Article deleted.' })
  } catch (error: any) {
    return handleRouteError(error, 'DELETE /api/articles/[id]')
  }
}
