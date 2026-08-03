import * as cheerio from 'cheerio'
import sanitizeHtml from 'sanitize-html'
import { emptyToNull } from '../../../../utils/normalize-seo'

/** Shared XSS blocklist used by Mode A parse + Mode B/PATCH sanitize. */
const SANITIZE_OPTIONS = {
  allowedTags: false as const,
  allowedAttributes: false as const,
  nonTextTags: ['script', 'style', 'iframe', 'noscript', 'object', 'embed', 'applet'],
  exclusiveFilter: function (frame: { tag: string }) {
    return frame.tag === 'script' || frame.tag === 'style'
  },
  enforceHtmlBoundary: true,
  allowProtocolRelative: false,
}

/** Decode HTML entities when TipTap stored raw markup as escaped text. */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/**
 * Normalizes article HTML before storage: decode entity-escaped markup, then sanitize.
 */
export function normalizeArticleContent(html: string): string {
  let normalized = html || ''

  // TipTap wraps pasted raw HTML as escaped text inside one paragraph
  const escapedInParagraph = normalized.match(/^<p>([\s\S]*)<\/p>$/i)
  if (escapedInParagraph && /&lt;\/?[a-z]/i.test(escapedInParagraph[1])) {
    normalized = decodeHtmlEntities(escapedInParagraph[1])
  } else if (/&lt;\/?[a-z]/i.test(normalized)) {
    normalized = decodeHtmlEntities(normalized)
  }

  return sanitizeArticleContent(normalized)
}

/**
 * Sanitizes article body HTML for safe storage (Mode B TipTap / PATCH path).
 * Strips scripts, styles, iframes, and javascript: URLs.
 */
export function sanitizeArticleContent(html: string): string {
  // Fragment mode — avoid wrapping TipTap HTML in <html><body>
  const $ = cheerio.load(html || '', null, false)
  $('script, style, iframe, noscript, object, embed, applet').remove()
  $('*').removeAttr('onerror').removeAttr('onload').removeAttr('onclick')

  return sanitizeHtml($.html() || '', SANITIZE_OPTIONS)
}

export type ArticleLink = { text: string; href: string }

function dedupeLinks(links: ArticleLink[]): ArticleLink[] {
  return Array.from(new Map(links.map((item) => [item.href, item])).values())
}

/**
 * Extracts inner (relative) and outer (absolute) links from sanitized article HTML.
 * Single source of truth: anchor tags in content.
 */
export function extractLinksFromContent(html: string): {
  inner_links: ArticleLink[]
  outer_links: ArticleLink[]
} {
  const $ = cheerio.load(html || '', null, false)
  const inner_links: ArticleLink[] = []
  const outer_links: ArticleLink[] = []

  $('a').each((_, el) => {
    const $el = $(el)
    const href = $el.attr('href')?.trim()
    const text = $el.text().trim()
    if (!href) return

    if (href.startsWith('http://') || href.startsWith('https://')) {
      outer_links.push({ text, href })
    } else {
      inner_links.push({ text, href })
    }
  })

  return {
    inner_links: dedupeLinks(inner_links),
    outer_links: dedupeLinks(outer_links),
  }
}

/** Normalizes content and derives link JSONB fields from anchor tags. */
export function prepareArticleContent(content: string) {
  const safeContent = normalizeArticleContent(content)
  const links = extractLinksFromContent(safeContent)
  return { content: safeContent, ...links }
}

/**
 * Parses a raw HTML string into structured fields for the database.
 *
 * Pipeline:
 * 1. DOM Parsing & Element Stripping (Removes scripts, styles, iframes, inline styles)
 * 2. Isolate Content Container (Focuses on <article> or <main> if available)
 * 3. Extraction Engine (Metadata, Title, Body, Links)
 * 4. Fallbacks (Extracts description from first paragraph if missing)
 */
export function parseHtmlArticle(html: string) {
  const $ = cheerio.load(html)

  // Step 1: Strip Dangerous / Irrelevant Tags
  $('script, style, iframe, nav, header, footer, form').remove()
  $('*').removeAttr('style') // Strip all inline styles for clean semantic HTML

  // Step 2: Isolate Content Container
  let contentContainer = $('article')
  if (contentContainer.length === 0) contentContainer = $('main')
  if (contentContainer.length === 0) contentContainer = $('body')

  // Step 3: Extractor Engine

  // Title (h1)
  const title = contentContainer.find('h1').first().text().trim() || 'Untitled Article'

  // Metadata
  let meta_title =
    $('title').text().trim() ||
    $('meta[name="title"]').attr('content')?.trim() ||
    $('meta[property="og:title"]').attr('content')?.trim()

  let meta_description =
    $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[property="og:description"]').attr('content')?.trim()

  let og_image_url =
    $('meta[property="og:image"]').attr('content')?.trim() ||
    contentContainer.find('img').first().attr('src')?.trim()

  // Step 4: Fallbacks
  if (!meta_description) {
    const firstParagraph = contentContainer.find('p').first().text().trim()
    if (firstParagraph) {
      meta_description =
        firstParagraph.substring(0, 150) + (firstParagraph.length > 150 ? '...' : '')
    }
  }

  const rawContent = contentContainer.html()?.trim() || ''
  const { content: safeContent, inner_links, outer_links } = prepareArticleContent(rawContent)

  return {
    title,
    content: safeContent,
    meta_title: emptyToNull(meta_title) ?? title,
    meta_description: emptyToNull(meta_description),
    og_image_url: emptyToNull(og_image_url),
    inner_links,
    outer_links,
    status: 'draft',
    priority: 'normal',
  }
}
