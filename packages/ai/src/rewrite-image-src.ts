import * as cheerio from 'cheerio'

/**
 * Replace an img src in HTML with a rendered image URL,
 * preserving the canonical source in data-original-src for QA/rollback.
 * `canonicalSrc` defaults to the matched src; pass it explicitly when the
 * current src is itself a previously rendered URL.
 */
export function rewriteImageSrc(
  html: string,
  matchSrc: string,
  newSrc: string,
  canonicalSrc?: string
): string {
  const $ = cheerio.load(html, null, false)

  $('img[src]').each((_, el) => {
    const node = $(el)
    if (node.attr('src') === matchSrc) {
      node.attr('data-original-src', canonicalSrc ?? matchSrc)
      node.attr('src', newSrc)
    }
  })

  return $.html()
}
