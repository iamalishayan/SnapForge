import * as cheerio from 'cheerio'
import type { Tables } from '@snapforge/db'
import type { TranslationResponse } from './translate'

export interface QAWarning {
  message: string
  severity: 'minor' | 'moderate'
}

export interface QAResult {
  passed: boolean       // True only if no blocking errors
  errors: string[]      // Blocking: broken links, missing keywords, empty/identical content, banned words
  warnings: QAWarning[] // Non-blocking structured warnings
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

  // Guard: Ensure content exists
  if (!translation.translated_content) {
    errors.push('Translated content is empty.')
    return { passed: false, errors, warnings }
  }

  // Guard: Untranslated-content sanity check (identically echoed content)
  if (translation.translated_content.trim() === originalArticle.content.trim()) {
    errors.push('Translated content is identical to original — translation may have failed silently.')
  }

  const $ = cheerio.load(translation.translated_content)
  const $orig = cheerio.load(originalArticle.content)

  // 1. Ratio checks (Coping with non-whitespace-delimited CJK languages)
  const cjkLangs = ['Chinese', 'Japanese', 'Thai', 'Korean']
  const isCJK = cjkLangs.some(lang => targetLanguage.toLowerCase().includes(lang.toLowerCase()))

  if (!isCJK) {
    const originalWords = originalArticle.content.split(/\s+/).filter(Boolean).length
    const translatedWords = translation.translated_content.split(/\s+/).filter(Boolean).length
    const ratio = translatedWords / (originalWords || 1)
    if (ratio < 0.7 || ratio > 1.3) {
      warnings.push({
        message: `Word count ratio is borderline: ${ratio.toFixed(2)} (expected 0.7 - 1.3)`,
        severity: 'minor'
      })
    }
  } else {
    // Character-based length comparison for CJK
    const originalChars = originalArticle.content.length
    const translatedChars = translation.translated_content.length
    const ratio = translatedChars / (originalChars || 1)
    if (ratio < 0.5 || ratio > 2.0) {
      warnings.push({
        message: `CJK character length ratio is borderline: ${ratio.toFixed(2)} (expected 0.5 - 2.0)`,
        severity: 'minor'
      })
    }
  }

  // 2. Placeholder check (looks for raw variables like {site_name})
  const placeholderRegex = /\{[a-zA-Z0-9_-]+\}/g
  let placeholders = Array.from(translation.translated_content.match(placeholderRegex) || [])
  
  // Whitelist intentional placeholders that the frontend will resolve at render time
  const allowedPlaceholders = ['{tool_name}']
  placeholders = placeholders.filter(p => !allowedPlaceholders.includes(p))

  if (placeholders.length > 0) {
    errors.push(`Unresolved placeholders found: ${Array.from(new Set(placeholders)).join(', ')}`)
  }


  // 3. HTML tag validation (H1 tag count check)
  const originalH1Count = $orig('h1').length
  const translatedH1Count = $('h1').length
  if (translatedH1Count !== originalH1Count) {
    errors.push(`H1 count mismatch: original has ${originalH1Count}, translation has ${translatedH1Count}`)
  }

  // 4. Link count AND integrity validation (matches actual target values in order)
  const originalHrefs = $orig('a').map((_, el) => $orig(el).attr('href')).get()
  const translatedHrefs = $('a').map((_, el) => $(el).attr('href')).get()

  if (originalHrefs.length !== translatedHrefs.length) {
    errors.push(`Anchor link count mismatch: original has ${originalHrefs.length}, translation has ${translatedHrefs.length}`)
  } else {
    const mismatchedIndices: number[] = []
    const mismatchedValues: string[] = []
    
    for (let i = 0; i < originalHrefs.length; i++) {
      if (originalHrefs[i] !== translatedHrefs[i]) {
        mismatchedIndices.push(i)
        mismatchedValues.push(`"${translatedHrefs[i]}" (expected "${originalHrefs[i]}")`)
      }
    }

    if (mismatchedIndices.length > 0) {
      errors.push(`Anchor href values changed or drifted out of order: ${mismatchedValues.join(', ')}`)
    }
  }

  // 5. SEO metadata length boundaries with severity mapping
  const titleOverage = translation.translated_meta_title.length - 60
  if (titleOverage > 0) {
    warnings.push({
      message: `SEO Meta Title exceeds 60 characters (${translation.translated_meta_title.length} chars)`,
      severity: titleOverage > 6 ? 'moderate' : 'minor' // More than 10% over is moderate
    })
  }

  const descOverage = translation.translated_meta_description.length - 155
  if (descOverage > 0) {
    warnings.push({
      message: `SEO Meta Description exceeds 155 characters (${translation.translated_meta_description.length} chars)`,
      severity: descOverage > 15 ? 'moderate' : 'minor' // More than 10% over is moderate
    })
  }

  // 6. Keyword coverage check
  if (primaryKeyword) {
    const haystack = (translation.translated_content + ' ' + translation.translated_meta_description).toLowerCase()
    
    // Primary keyword MUST be present (blocking error)
    if (!haystack.includes(primaryKeyword.toLowerCase())) {
      errors.push(`Missing primary keyword: "${primaryKeyword}"`)
    }
    
    // Secondary keywords are often rephrased by the AI or translated differently.
    // Making them blocking errors fails too many valid translations, so we log them as warnings instead.
    for (const kw of secondaryKeywords) {
      if (!haystack.includes(kw.toLowerCase())) {
        warnings.push({
          message: `Secondary keyword "${kw}" not found verbatim in content.`,
          severity: 'minor'
        })
      }
    }
  }

  // 6a. Primary keyword should ideally appear in title / meta title (SEO-critical placement)
  if (primaryKeyword) {
    const titleHaystack = (translation.translated_title + ' ' + translation.translated_meta_title).toLowerCase()
    if (!titleHaystack.includes(primaryKeyword.toLowerCase())) {
      warnings.push({
        message: `Primary keyword "${primaryKeyword}" missing from title/meta title — recommended for SEO`,
        severity: 'moderate'
      })
    }
  }

  // 7. Banned words / Spam check
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
    warnings
  }
}