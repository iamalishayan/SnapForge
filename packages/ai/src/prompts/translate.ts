import type { Tables } from '@snapforge/db'

export interface PromptInput {
  article: Tables<'articles'>
  targetLanguage: string
  countryCode: string
  primaryKeyword?: string
  secondaryKeywords?: string[]
  templatePrompt?: string | null  // Optional per-tool tone/style guidance from templates.gemini_prompt
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
  const keywordsList = secondaryKeywords.length > 0 
    ? secondaryKeywords.join(', ') 
    : 'None'

  // Optional tool-specific guidance section — appended AFTER base rules, never replaces them
  const toolGuidance = templatePrompt
    ? `\n### Tool-Specific Instructions (apply in addition to the above):\n${templatePrompt}\n`
    : ''

  return `You are a professional SEO content localizer and translator specialized in the ${targetLanguage} (${countryCode}) market.

Translate and culturally adapt the following English article into ${targetLanguage}.

### Strict Processing Instructions:
1. Return ONLY a valid JSON object matching the output schema. Do NOT include markdown code blocks, conversational greetings, or notes.
2. Preserve all HTML elements and inline tags (e.g. <h1>, <h2>, <p>, <ul>, <li>, <strong>, <a>) EXACTLY as they appear.
3. Do NOT translate or modify any "href" attributes inside <a> tags.
4. Do NOT introduce or inject new anchor <a> links that do not exist in the source article.
5. Do NOT translate placeholder strings in curly braces like {tool_name} or {site_name}.
6. Naturally incorporate the primary local keyword "${primaryKeyword}" in the translation title (H1) and the first paragraph of the content.
7. Naturally weave secondary keywords (${keywordsList}) into subheadings and content where appropriate.
8. Adapt local contexts such as currency, formatting, and cultural examples.
${toolGuidance}
### JSON Output Schema:
{
  "translated_title": "The translated meta/title header",
  "translated_content": "The localized article content including original HTML tags intact",
  "translated_meta_title": "SEO Meta Title (max 60 chars)",
  "translated_meta_description": "SEO Meta Description (max 155 chars)",
  "translated_faq": [
    { "question": "Translated question text", "answer": "Translated answer text" }
  ]
}

### Source Article To Translate:
Title: ${article.title}
Content:
${article.content}
`
}

