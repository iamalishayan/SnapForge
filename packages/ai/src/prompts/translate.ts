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
3. Preserve all HTML elements and inline tags (e.g. <h1>, <h2>, <p>, <ul>, <li>, <strong>, <a>) EXACTLY as they appear — same tag counts and nesting.
4. ${structureLine}
5. Do NOT translate or modify any "href" attributes inside <a> tags.
6. Do NOT introduce or inject new anchor <a> links that do not exist in the source article.
7. Do NOT translate placeholder strings in curly braces like {tool_name} or {site_name}.
8. Do NOT add H1, H2, H3, or other headings that are absent from the source.
9. ${faqRule}
10. If the source is minimal, the translation must remain minimal — do not invent marketing copy.
11. Put the primary keyword "${primaryKeyword}" in translated_title and the first existing paragraph only when natural — never by adding new headings.
12. Weave secondary keywords (${keywordsList}) only into existing headings and paragraphs — never by creating new sections.
13. Adapt local contexts such as currency, formatting, and cultural examples without changing structure.
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
