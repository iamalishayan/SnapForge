import * as cheerio from 'cheerio'

export interface StructureFingerprint {
  h1: number
  h2: number
  h3: number
  p: number
  ul: number
  ol: number
  li: number
  a: number
  img: number
  wordCount: number
  hasFaq: boolean
  blockCount: number
}

export const MIN_TRANSLATION_WORDS = 50
export const MIN_TRANSLATION_BLOCKS = 2

const TAG_KEYS = ['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li', 'a'] as const

/** Parses HTML into a deterministic structure fingerprint for prompt + QA. */
export function getStructureFingerprint(html: string): StructureFingerprint {
  const $ = cheerio.load(html || '', null, false)

  const h1 = $('h1').length
  const h2 = $('h2').length
  const h3 = $('h3').length
  const p = $('p').length
  const ul = $('ul').length
  const ol = $('ol').length
  const li = $('li').length
  const a = $('a').length
  const img = $('img').length

  const text = $.root().text().replace(/\s+/g, ' ').trim()
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0

  const headingText = $('h1, h2, h3, h4, h5, h6')
    .map((_, el) => $(el).text())
    .get()
    .join(' ')
  const hasFaq = /\bfaq\b|frequently asked questions/i.test(headingText)

  const blockCount = p + h1 + h2 + h3 + ul + ol + li

  return { h1, h2, h3, p, ul, ol, li, a, img, wordCount, hasFaq, blockCount }
}

/** Formats fingerprint for injection into the translation prompt. */
export function formatFingerprintForPrompt(fp: StructureFingerprint): string {
  return (
    `Source structure: h1=${fp.h1}, h2=${fp.h2}, h3=${fp.h3}, p=${fp.p}, ` +
    `ul=${fp.ul}, ol=${fp.ol}, li=${fp.li}, a=${fp.a}, img=${fp.img}, ` +
    `wordCount=${fp.wordCount}, hasFaq=${fp.hasFaq}. Output MUST preserve the same tag counts.`
  )
}

/** Returns blocking errors when translated HTML drifts from source structure. */
export function getStructureMismatchErrors(
  sourceHtml: string,
  translatedHtml: string
): string[] {
  const source = getStructureFingerprint(sourceHtml)
  const translated = getStructureFingerprint(translatedHtml)
  const errors: string[] = []

  for (const tag of TAG_KEYS) {
    if (source[tag] !== translated[tag]) {
      errors.push(`${tag.toUpperCase()} count mismatch: original has ${source[tag]}, translation has ${translated[tag]}`)
    }
  }

  return errors
}

export type ArticleTranslatableResult =
  | { ok: true }
  | { ok: false; error: string }

/** Pre-translate gate: reject articles too thin to localize reliably. */
export function validateArticleForTranslation(content: string): ArticleTranslatableResult {
  const fp = getStructureFingerprint(content)

  if (fp.wordCount < MIN_TRANSLATION_WORDS) {
    return {
      ok: false,
      error: `Article too thin to translate (${fp.wordCount} words, minimum ${MIN_TRANSLATION_WORDS}). Add real content first.`,
    }
  }

  if (fp.blockCount < MIN_TRANSLATION_BLOCKS) {
    return {
      ok: false,
      error: `Article too thin to translate (${fp.blockCount} block elements, minimum ${MIN_TRANSLATION_BLOCKS}). Add real content first.`,
    }
  }

  return { ok: true }
}
