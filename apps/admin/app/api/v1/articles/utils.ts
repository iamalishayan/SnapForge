import * as cheerio from 'cheerio'

/**
 * Parses a raw HTML article file (like testarticles/*.html) into structured fields.
 * Extracts:
 *   - title from <h1> tag
 *   - content from <article> block
 *   - meta_title, meta_description, og_image, inner_links, outer_links from <!-- META --> comment block
 */
export function parseHtmlArticle(html: string) {
  const $ = cheerio.load(html)

  // Extract <article> block content
  const articleNode = $('article')
  const content = articleNode.length > 0 ? $.html(articleNode) : html.trim()

  // Extract <h1> text as title
  const rawTitle = $('h1').first().text().trim() || ''

  // Extract META comment block  <!-- META ... -->
  let meta_title: string | undefined
  let meta_description: string | undefined
  let og_image_url: string | undefined
  let inner_links: any[] = []
  let outer_links: any[] = []

  const metaMatch = html.match(/<!--\s*META([\s\S]*?)-->/i)
  if (metaMatch) {
    const metaComment = metaMatch[1]
    
    const metaTitleMatch = metaComment.match(/meta_title:\s*(.+)/i)
    if (metaTitleMatch) meta_title = metaTitleMatch[1].trim()

    const metaDescMatch = metaComment.match(/meta_description:\s*(.+)/i)
    if (metaDescMatch) meta_description = metaDescMatch[1].trim()

    const ogImageMatch = metaComment.match(/og_image:\s*(.+)/i)
    if (ogImageMatch) og_image_url = ogImageMatch[1].trim()

    const innerLinksMatch = metaComment.match(/inner_links:\s*(\[[\s\S]*?\])/i)
    if (innerLinksMatch) {
      try { inner_links = JSON.parse(innerLinksMatch[1]) } catch {}
    }

    const outerLinksMatch = metaComment.match(/outer_links:\s*(\[[\s\S]*?\])/i)
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
