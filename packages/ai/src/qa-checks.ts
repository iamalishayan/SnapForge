import * as cheerio from 'cheerio'
import type { Tables } from '@snapforge/db'
import type { TranslationResponse } from './translate'
import {
  getStructureFingerprint,
  getStructureMismatchErrors,
} from './structure-fingerprint'

export interface QAWarning {
  message: string
  severity: 'minor' | 'moderate'
}

export interface QAResult {
  passed: boolean
  errors: string[]
  warnings: QAWarning[]
}

/**
 * Validates translated content structures, HTML formats, link counts, and SEO constraints
 * before advancing translations to the human review queue.
 */
export async function runAutoQAChecks(
  translation: TranslationResponse,
  originalArticle: Tables<'articles'>,
  targetLanguage: string,
  primaryKeyword?: string,
  secondaryKeywords: string[] = []
): Promise<QAResult> {
  const errors: string[] = []
  const warnings: QAWarning[] = []

  if (!translation.translated_content) {
    errors.push('Translated content is empty.')
    return { passed: false, errors, warnings }
  }

  if (translation.translated_content.trim() === originalArticle.content.trim()) {
    errors.push('Translated content is identical to original — translation may have failed silently.')
  }

  const $ = cheerio.load(translation.translated_content)
  const $orig = cheerio.load(originalArticle.content)

  const sourceFp = getStructureFingerprint(originalArticle.content)

  errors.push(
    ...getStructureMismatchErrors(originalArticle.content, translation.translated_content)
  )

  if (!sourceFp.hasFaq && (translation.translated_faq?.length ?? 0) > 0) {
    errors.push(
      `FAQ invented: source has no FAQ structure but translation has ${translation.translated_faq.length} FAQ entries`
    )
  }

  const cjkLangs = ['Chinese', 'Japanese', 'Thai', 'Korean']
  const isCJK = cjkLangs.some((lang) =>
    targetLanguage.toLowerCase().includes(lang.toLowerCase())
  )

  if (!isCJK) {
    const originalWords = originalArticle.content.split(/\s+/).filter(Boolean).length
    const translatedWords = translation.translated_content.split(/\s+/).filter(Boolean).length
    const ratio = translatedWords / (originalWords || 1)

    if (ratio > 2.0 || ratio < 0.5) {
      errors.push(
        `Word count ratio out of bounds: ${ratio.toFixed(2)} (allowed 0.5 - 2.0)`
      )
    } else if (ratio < 0.7 || ratio > 1.3) {
      warnings.push({
        message: `Word count ratio is borderline: ${ratio.toFixed(2)} (expected 0.7 - 1.3)`,
        severity: 'minor',
      })
    }
  } else {
    const originalChars = originalArticle.content.length
    const translatedChars = translation.translated_content.length
    const ratio = translatedChars / (originalChars || 1)

    if (ratio > 3.0 || ratio < 0.3) {
      errors.push(
        `CJK character length ratio out of bounds: ${ratio.toFixed(2)} (allowed 0.3 - 3.0)`
      )
    } else if (ratio < 0.5 || ratio > 2.0) {
      warnings.push({
        message: `CJK character length ratio is borderline: ${ratio.toFixed(2)} (expected 0.5 - 2.0)`,
        severity: 'minor',
      })
    }
  }

  const placeholderRegex = /\{[a-zA-Z0-9_-]+\}/g
  let placeholders = Array.from(translation.translated_content.match(placeholderRegex) || [])
  const allowedPlaceholders = ['{tool_name}']
  placeholders = placeholders.filter((p) => !allowedPlaceholders.includes(p))

  if (placeholders.length > 0) {
    errors.push(`Unresolved placeholders found: ${Array.from(new Set(placeholders)).join(', ')}`)
  }

  const originalHrefs = $orig('a').map((_, el) => $orig(el).attr('href')).get()
  const translatedHrefs = $('a').map((_, el) => $(el).attr('href')).get()

  if (originalHrefs.length !== translatedHrefs.length) {
    errors.push(
      `Anchor link count mismatch: original has ${originalHrefs.length}, translation has ${translatedHrefs.length}`
    )
  } else {
    const mismatchedValues: string[] = []

    for (let i = 0; i < originalHrefs.length; i++) {
      if (originalHrefs[i] !== translatedHrefs[i]) {
        mismatchedValues.push(`"${translatedHrefs[i]}" (expected "${originalHrefs[i]}")`)
      }
    }

    if (mismatchedValues.length > 0) {
      errors.push(
        `Anchor href values changed or drifted out of order: ${mismatchedValues.join(', ')}`
      )
    }
  }

  const titleOverage = translation.translated_meta_title.length - 60
  if (titleOverage > 0) {
    warnings.push({
      message: `SEO Meta Title exceeds 60 characters (${translation.translated_meta_title.length} chars)`,
      severity: titleOverage > 6 ? 'moderate' : 'minor',
    })
  }

  const descOverage = translation.translated_meta_description.length - 155
  if (descOverage > 0) {
    warnings.push({
      message: `SEO Meta Description exceeds 155 characters (${translation.translated_meta_description.length} chars)`,
      severity: descOverage > 15 ? 'moderate' : 'minor',
    })
  }

  if (primaryKeyword) {
    const haystack = (
      translation.translated_content + ' ' + translation.translated_meta_description
    ).toLowerCase()

    if (!haystack.includes(primaryKeyword.toLowerCase())) {
      errors.push(`Missing primary keyword: "${primaryKeyword}"`)
    }

    for (const kw of secondaryKeywords) {
      if (!haystack.includes(kw.toLowerCase())) {
        warnings.push({
          message: `Secondary keyword "${kw}" not found verbatim in content.`,
          severity: 'minor',
        })
      }
    }
  }

  if (primaryKeyword) {
    const titleHaystack = (
      translation.translated_title + ' ' + translation.translated_meta_title
    ).toLowerCase()
    if (!titleHaystack.includes(primaryKeyword.toLowerCase())) {
      warnings.push({
        message: `Primary keyword "${primaryKeyword}" missing from title/meta title — recommended for SEO`,
        severity: 'moderate',
      })
    }
  }

  const bannedWords = ['casino', 'viagra', 'click here', 'buy now']
  const contentLower = translation.translated_content.toLowerCase()
  for (const word of bannedWords) {
    if (contentLower.includes(word)) {
      errors.push(`Banned word match detected: "${word}"`)
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  }
}
