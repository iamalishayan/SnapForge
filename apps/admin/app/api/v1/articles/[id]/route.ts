import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { withValidation } from '../../../../../utils/validate'
import { ArticleUpdateSchema } from '../../../../../utils/schemas'
import { handleRouteError } from '../../../../../utils/error'
import { prepareArticleContent } from '../utils'
import { validateArticleTemplateId } from '../validate-template'
import { normalizeArticleSeoFields } from '../../../../../utils/normalize-seo'

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
    const updates = { ...data } as Record<string, unknown>

    // Links are always derived from content — ignore client-sent link arrays
    delete updates.inner_links
    delete updates.outer_links

    if (typeof updates.content === 'string') {
      const prepared = prepareArticleContent(updates.content)
      Object.assign(updates, prepared)
    }

    normalizeArticleSeoFields(updates)

    if (typeof updates.slug === 'string') {
      const existing = await DbService.getArticleById(context.params.id)
      const conflict = await DbService.getArticleByTemplateAndSlug(
        existing.template_id!,
        updates.slug
      )
      if (conflict && conflict.id !== context.params.id) {
        return NextResponse.json(
          { success: false, error: 'An article with this slug already exists for this template.' },
          { status: 409 }
        )
      }
    }

    if (updates.template_id !== undefined) {
      const templateError = await validateArticleTemplateId(updates.template_id as string)
      if (templateError) return templateError
    } else if (updates.slug !== undefined) {
      const existing = await DbService.getArticleById(context.params.id)
      const templateError = await validateArticleTemplateId(existing.template_id)
      if (templateError) return templateError
    } else {
      // Articles without a template cannot be translated — block saving orphaned records on edit
      const existing = await DbService.getArticleById(context.params.id)
      if (!existing.template_id) {
        return NextResponse.json(
          {
            success: false,
            error: 'This article has no template. Assign a template_id before saving.',
          },
          { status: 400 }
        )
      }
    }

    const updatedArticle = await DbService.updateArticle(context.params.id, updates as any)
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
