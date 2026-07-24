import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'
import { ArticleCreateSchema } from '../../../../utils/schemas'
import { parseHtmlArticle } from './utils'
import { handleRouteError } from '../../../../utils/error'
// POST /api/articles — Upload a new article to the database
// Accepts either:
//   Mode A: raw HTML string with embedded <!-- META --> comment block (like testarticles/*.html)
//   Mode B: structured JSON with all fields explicitly provided
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''

    let articleData: any = {}

    // --- MODE A: raw HTML string ---
    if (contentType.includes('text/html') || contentType.includes('text/plain')) {
      const rawHtml = await request.text()
      articleData = parseHtmlArticle(rawHtml)
      
      // Extract template ID from headers since HTML doesn't include it
      const templateIdHeader = request.headers.get('x-template-id')
      if (templateIdHeader) {
        articleData.template_id = templateIdHeader
      }
    }
    // --- MODE B: structured JSON ---
    else {
      let body: any
      try {
        body = await request.json()
      } catch (e) {
        return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 })
      }

      // If a 'html' field is passed in JSON, parse it like Mode A
      if (body.html) {
        articleData = parseHtmlArticle(body.html)
        // Allow JSON overrides on top of parsed values
        if (body.template_id) articleData.template_id = body.template_id
        if (body.status) articleData.status = body.status
        if (body.priority) articleData.priority = body.priority
      } else {
        articleData = body
      }
    }

    // Validate the final articleData against the Zod schema
    const parsed = ArticleCreateSchema.safeParse(articleData)
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten()
      }, { status: 422 })
    }

    const validData = parsed.data

    if (!validData.template_id) {
      return NextResponse.json(
        { success: false, error: 'A valid template_id is strictly required. Provide it in the JSON body or via the x-template-id header.' },
        { status: 400 }
      )
    }

    const article = await DbService.createArticle({
      title: validData.title,
      content: validData.content,
      meta_title: validData.meta_title || null,
      meta_description: validData.meta_description || null,
      og_image_url: validData.og_image_url || null,
      inner_links: validData.inner_links || [],
      outer_links: validData.outer_links || [],
      template_id: validData.template_id || null,
      status: articleData.status || 'draft',
      priority: articleData.priority || 'normal'
    } as any)

    return NextResponse.json({ success: true, data: article }, { status: 201 })
  } catch (error: any) {
    return handleRouteError(error, 'POST /api/articles')
  }
}

// GET /api/articles — list all articles (with pagination)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 20
    const cursor = searchParams.get('cursor') || undefined

    const articles = await DbService.getArticles({ limit, cursor })
    
    const nextCursor = articles.length > 0 ? articles[articles.length - 1].created_at : null

    return NextResponse.json({ 
      success: true, 
      data: articles,
      pagination: {
        nextCursor,
        limit
      }
    })
  } catch (error: any) {
    return handleRouteError(error, 'GET /api/articles')
  }
}

