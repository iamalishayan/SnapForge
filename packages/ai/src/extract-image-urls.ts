import * as cheerio from 'cheerio'

export interface LocalizableImage {
  /** Current src in the HTML (may already be a rendered translation). */
  src: string
  /** Canonical source image — data-original-src when already localized. */
  originalSrc: string
}

/**
 * Collect images for the localization pipeline. Images previously rewritten
 * carry data-original-src, which is used as the canonical source so re-runs
 * stay idempotent (never classify our own rendered output).
 */
export function extractLocalizableImages(html: string): LocalizableImage[] {
  if (!html || !html.trim()) {
    return []
  }

  const $ = cheerio.load(html)
  const seen = new Set<string>()
  const images: LocalizableImage[] = []

  $('img[src]').each((_, el) => {
    const node = $(el)
    const src = node.attr('src')?.trim()
    if (!src || seen.has(src)) {
      return
    }
    seen.add(src)
    images.push({ src, originalSrc: node.attr('data-original-src')?.trim() || src })
  })

  return images
}

/**
 * Collect unique non-empty img src values from article HTML.
 */
export function extractImageUrlsFromHtml(html: string): string[] {
  if (!html || !html.trim()) {
    return []
  }

  const $ = cheerio.load(html)
  const seen = new Set<string>()
  const urls: string[] = []

  $('img[src]').each((_, el) => {
    const src = $(el).attr('src')?.trim()
    if (!src || seen.has(src)) {
      return
    }
    seen.add(src)
    urls.push(src)
  })

  return urls
}
