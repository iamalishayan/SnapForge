import * as cheerio from 'cheerio'
import sanitizeHtml from 'sanitize-html'
import { emptyToNull } from '../../../../utils/normalize-seo'

/** Shared XSS blocklist used by Mode A parse + Mode B/PATCH sanitize. */
const SANITIZE_OPTIONS = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img', 'video', 'audio', 'source', 'iframe', 'button',
    'nav', 'header', 'footer', 'section', 'article', 'main', 'aside', 'figure', 'figcaption',
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    '*': ['class', 'id', 'style', 'data-*'],
    button: ['type', 'aria-label', 'disabled'],
    iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen'],
    video: ['src', 'controls', 'width', 'height', 'autoplay', 'loop', 'muted', 'poster'],
    audio: ['src', 'controls', 'autoplay', 'loop', 'muted'],
    source: ['src', 'type'],
  },
  enforceHtmlBoundary: true,
  allowProtocolRelative: false,
}

const REVEAL_OVERRIDE = `
/* SnapForge: scripts stripped — show reveal sections without IntersectionObserver */
.reveal{opacity:1!important;transform:none!important}
`.trim()

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
 * Collect Google Fonts stylesheet URLs from <link> tags as @import rules.
 */
export function extractFontImportsFromHtml(html: string): string[] {
  const $ = cheerio.load(html || '')
  const imports: string[] = []

  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr('href')?.trim()
    if (!href) return
    if (!/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(href)) return
    imports.push(`@import url('${href}');`)
  })

  return imports
}

/**
 * Normalize stored article CSS: font imports + .reveal visibility when scripts are gone.
 */
export function normalizeArticleCss(
  css: string | null | undefined,
  options?: { fontImports?: string[] }
): string | null {
  const chunks: string[] = []
  const fontImports = options?.fontImports || []

  for (const rule of fontImports) {
    if (rule && !(css || '').includes(rule)) {
      chunks.push(rule)
    }
  }

  if (css?.trim()) {
    chunks.push(css.trim())
  }

  if (chunks.length === 0) {
    return null
  }

  let combined = chunks.join('\n')

  // Scripts are always stripped at ingest — keep .reveal sections visible
  if (/\.reveal\b/.test(combined) && !combined.includes('SnapForge: scripts stripped')) {
    combined = `${combined}\n${REVEAL_OVERRIDE}`
  }

  return combined
}

/**
 * Extract <style> bodies + font links from a full HTML document into article_css.
 */
export function extractArticleCssFromHtml(html: string): string | null {
  const $ = cheerio.load(html || '')
  const cssChunks: string[] = []

  $('style').each((_, el) => {
    const text = $(el).html()?.trim()
    if (text) cssChunks.push(text)
  })

  return normalizeArticleCss(cssChunks.length > 0 ? cssChunks.join('\n') : null, {
    fontImports: extractFontImportsFromHtml(html),
  })
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
 * True when the document has landing-page chrome outside <article>/<main>
 * (nav, footer, ambient layers) — keep the full body so Mode A matches Import.
 */
function hasLandingChrome($: ReturnType<typeof cheerio.load>): boolean {
  const body = $('body')
  if (body.length === 0) return false

  const hasNavOrFooter =
    body.children('nav').length > 0 ||
    body.children('footer').length > 0 ||
    body.find('> nav, > footer').length > 0

  const hasAmbient =
    body.children('.ambient, .grain').length > 0 ||
    body.find('> .ambient, > .grain').length > 0

  return hasNavOrFooter || hasAmbient
}

/**
 * Parses a raw HTML string into structured fields for the database.
 *
 * Pipeline:
 * 1. CSS Extraction — Capture <style> + Google Fonts, apply .reveal override
 * 2. Strip scripts/styles/iframes/forms
 * 3. Keep full body when landing chrome exists; else isolate article/main
 * 4. Extract metadata, title, body, links
 */
export function parseHtmlArticle(html: string) {
  const $ = cheerio.load(html)

  const article_css = extractArticleCssFromHtml(html)

  // Strip Dangerous / Irrelevant Tags (CSS already extracted)
  $('script, style, iframe, form').remove()

  const useFullBody = hasLandingChrome($)

  let contentContainer = useFullBody ? $('body') : $('article')
  if (!useFullBody) {
    if (contentContainer.length === 0) contentContainer = $('main')
    if (contentContainer.length === 0) contentContainer = $('body')
  }

  const title =
    (useFullBody
      ? $('article h1').first().text().trim() || $('h1').first().text().trim()
      : contentContainer.find('h1').first().text().trim()) || 'Untitled Article'

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
    article_css,
    inner_links,
    outer_links,
    status: 'draft',
    priority: 'normal',
  }
}
