import { NextResponse } from 'next/server'
import { DbService } from '@snapforge/db'

// POST /api/articles — Upload a new article to the database
// Accepts either:
//   Mode A: raw HTML string with embedded <!-- META --> comment block (like testarticles/*.html)
//   Mode B: structured JSON with all fields explicitly provided
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''

    let articleData: {
      title: string
      content: string
      meta_title?: string
      meta_description?: string
      og_image_url?: string
      inner_links?: any[]
      outer_links?: any[]
      template_id?: string
      status?: string
      priority?: string
    }

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
      const body = await request.json() as {
        title?: string
        html?: string
        content?: string
        meta_title?: string
        meta_description?: string
        og_image_url?: string
        inner_links?: any[]
        outer_links?: any[]
        template_id?: string
        status?: string
        priority?: string
      }

      // If a 'html' field is passed in JSON, parse it like Mode A
      if (body.html) {
        articleData = parseHtmlArticle(body.html)
        // Allow JSON overrides on top of parsed values
        if (body.template_id) articleData.template_id = body.template_id
        if (body.status) articleData.status = body.status
        if (body.priority) articleData.priority = body.priority
      } else {
        if (!body.title || !body.content) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: title and content.' },
            { status: 400 }
          )
        }
        articleData = {
          title: body.title,
          content: body.content,
          meta_title: body.meta_title,
          meta_description: body.meta_description,
          og_image_url: body.og_image_url,
          inner_links: body.inner_links || [],
          outer_links: body.outer_links || [],
          template_id: body.template_id,
          status: body.status || 'draft',
          priority: body.priority || 'normal'
        }
      }
    }

    // Validate that title and template_id are present
    if (!articleData.title) {
      return NextResponse.json(
        { success: false, error: 'Could not extract article title. Ensure the HTML has an <h1> tag or provide title field.' },
        { status: 400 }
      )
    }

    if (!articleData.template_id) {
      return NextResponse.json(
        { success: false, error: 'A valid template_id is strictly required. Provide it in the JSON body or via the x-template-id header.' },
        { status: 400 }
      )
    }

    const article = await DbService.createArticle({
      title: articleData.title,
      content: articleData.content,
      meta_title: articleData.meta_title || null,
      meta_description: articleData.meta_description || null,
      og_image_url: articleData.og_image_url || null,
      inner_links: articleData.inner_links || [],
      outer_links: articleData.outer_links || [],
      template_id: articleData.template_id || null,
      status: articleData.status || 'draft',
      priority: articleData.priority || 'normal'
    })

    return NextResponse.json({ success: true, data: article }, { status: 201 })
  } catch (error: any) {
    console.error('Article upload error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// GET /api/articles — list all articles
export async function GET() {
  try {
    const articles = await DbService.getArticles()
    return NextResponse.json({ success: true, data: articles })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * Parses a raw HTML article file (like testarticles/*.html) into structured fields.
 * Extracts:
 *   - title from <h1> tag
 *   - content from <article> block
 *   - meta_title, meta_description, og_image, inner_links, outer_links from <!-- META --> comment block
 */
function parseHtmlArticle(html: string) {
  // Extract <article> block content
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
  const content = articleMatch ? articleMatch[0].trim() : html.trim()

  // Extract <h1> text as title
  const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const rawTitle = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : ''

  // Extract META comment block  <!-- META ...: --> at bottom
  const metaMatch = html.match(/<!--\s*META[\s\S]*?meta_title:\s*(.+)\s*\n[\s\S]*?meta_description:\s*(.+)\s*\n(?:[\s\S]*?og_image:\s*(.+)\s*\n)?([\s\S]*?)-->/i)

  let meta_title: string | undefined
  let meta_description: string | undefined
  let og_image_url: string | undefined
  let inner_links: any[] = []
  let outer_links: any[] = []

  if (metaMatch) {
    meta_title = metaMatch[1]?.trim()
    meta_description = metaMatch[2]?.trim()
    og_image_url = metaMatch[3]?.trim()

    // Extract inner_links JSON array
    const innerLinksMatch = html.match(/inner_links:\s*(\[[\s\S]*?\])/i)
    if (innerLinksMatch) {
      try { inner_links = JSON.parse(innerLinksMatch[1]) } catch {}
    }

    // Extract outer_links JSON array
    const outerLinksMatch = html.match(/outer_links:\s*(\[[\s\S]*?\])/i)
    if (outerLinksMatch) {
      try { outer_links = JSON.parse(outerLinksMatch[1]) } catch {}
    }
  }

  return {
    title: rawTitle,
    content,
    meta_title,
    meta_description,
    og_image_url,
    inner_links,
    outer_links,
    status: 'draft',
    priority: 'normal'
  }
}
