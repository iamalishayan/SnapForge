import type { Tables } from '@snapforge/db'
import {
  formatFingerprintForPrompt,
  getStructureFingerprint,
} from '../structure-fingerprint'

export interface PromptInput {
  article: Tables<'articles'>
  targetLanguage: string
  countryCode: string
  primaryKeyword?: string
  secondaryKeywords?: string[]
  templatePrompt?: string | null
}

/**
 * Builds the localized translation prompt instructions forcing a structured JSON output.
 */
export function buildTranslationPrompt({
  article,
  targetLanguage,
  countryCode,
  primaryKeyword = '',
  secondaryKeywords = [],
  templatePrompt = null,
}: PromptInput): string {
  const keywordsList =
    secondaryKeywords.length > 0 ? secondaryKeywords.join(', ') : 'None'

  const fingerprint = getStructureFingerprint(article.content || '')
  const structureLine = formatFingerprintForPrompt(fingerprint)

  const toolGuidance = templatePrompt
    ? `\n### Tool-Specific Tone (vocabulary and tone ONLY — never expand content):\n${templatePrompt}\nTemplate guidance applies to TONE and VOCABULARY only. Never use it to expand thin source content or add sections.\n`
    : ''

  const metaDescriptionHint = article.meta_description
    ? article.meta_description
    : 'None provided — derive a short meta description from the translated body only. Do NOT write a full landing page.'

  const faqRule = fingerprint.hasFaq
    ? 'Translate FAQ items that exist in the source. Do not add new FAQ entries.'
    : 'Source has no FAQ structure — return translated_faq as an empty array [].'

  return `You are a professional SEO content localizer and translator specialized in the ${targetLanguage} (${countryCode}) market.

Translate and culturally adapt the following English article into ${targetLanguage}.

### TRANSLATE ONLY — Strict Fidelity Rules:
1. Return ONLY a valid JSON object matching the output schema. Do NOT include markdown code blocks, conversational greetings, or notes.
2. TRANSLATE ONLY — never add sections, headings, paragraphs, lists, links, or FAQs that are not present in the source.
3. Preserve all HTML elements and inline tags (e.g. <h1>, <h2>, <p>, <ul>, <li>, <strong>, <a>, <nav>, <section>, <header>, <footer>, <div>) EXACTLY as they appear — same tag counts and nesting.
4. Preserve every class, id, and style attribute EXACTLY — do not rename, drop, or reorder attributes. Do not reorder sibling wrappers.
5. ${structureLine}
6. Do NOT translate or modify any "href" attributes inside <a> tags.
7. Do NOT introduce or inject new anchor <a> links that do not exist in the source article.
8. Do NOT translate placeholder strings in curly braces like {tool_name} or {site_name}.
9. Do NOT add H1, H2, H3, or other headings that are absent from the source.
10. ${faqRule}
11. If the source is minimal, the translation must remain minimal — do not invent marketing copy.
12. Put the primary keyword "${primaryKeyword}" in translated_title and the first existing paragraph only when natural — never by adding new headings.
13. Weave secondary keywords (${keywordsList}) only into existing headings and paragraphs — never by creating new sections.
14. Adapt local contexts such as currency, formatting, and cultural examples without changing structure.
${toolGuidance}
### JSON Output Schema:
{
  "translated_title": "The translated title",
  "translated_content": "The localized article content including original HTML tags intact",
  "translated_meta_title": "SEO Meta Title (max 60 chars)",
  "translated_meta_description": "SEO Meta Description (max 155 chars)",
  "translated_faq": []
}

### Source SEO Metadata:
Meta Title: ${article.meta_title || article.title}
Meta Description: ${metaDescriptionHint}

When localizing, adapt the meta title and description for ${targetLanguage} (${countryCode}) search intent. Keep translated_meta_title under 60 characters and translated_meta_description under 155 characters. Derive from translated content — do not invent a full landing page.

### Source Article To Translate:
Title: ${article.title}
Content:
${article.content}
`
}

/**
 * Prompt for translating one HTML chunk of a long landing page.
 * Returns only the translated HTML fragment (JSON wrapper).
 */
export function buildHtmlChunkPrompt(input: {
  htmlChunk: string
  targetLanguage: string
  countryCode: string
  chunkIndex: number
  totalChunks: number
}): string {
  const fingerprint = getStructureFingerprint(input.htmlChunk)
  const structureLine = formatFingerprintForPrompt(fingerprint)

  return `You are a professional HTML localizer for the ${input.targetLanguage} (${input.countryCode}) market.
Translate ONLY the visible text in this HTML fragment (chunk ${input.chunkIndex + 1} of ${input.totalChunks}).

### Strict rules:
1. Return ONLY JSON: { "translated_html": "..." }
2. Preserve every tag, nesting, class, id, and style attribute EXACTLY.
3. Do NOT modify href attributes.
4. Do NOT add or remove elements.
5. ${structureLine}

### HTML fragment:
${input.htmlChunk}
`
}

