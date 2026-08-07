import type { Tables } from '@snapforge/db'
import { buildHtmlChunkPrompt, buildTranslationPrompt } from './prompts/translate'
import {
  CHUNK_TRANSLATE_THRESHOLD,
  splitHtmlIntoChunks,
} from './structure-fingerprint'
import { SchemaType, generateJsonWithFallback } from './llm-providers'

export interface TranslationResponse {
  translated_title: string
  translated_content: string
  translated_meta_title: string
  translated_meta_description: string
  translated_faq: Array<{ question: string; answer: string }>
  model_used: string
  input_tokens: number
  output_tokens: number
}

const ARTICLE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    translated_title: { type: SchemaType.STRING },
    translated_content: { type: SchemaType.STRING },
    translated_meta_title: { type: SchemaType.STRING },
    translated_meta_description: { type: SchemaType.STRING },
    translated_faq: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          question: { type: SchemaType.STRING },
          answer: { type: SchemaType.STRING },
        },
        required: ['question', 'answer'],
      },
    },
  },
  required: [
    'translated_title',
    'translated_content',
    'translated_meta_title',
    'translated_meta_description',
  ],
}

const CHUNK_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    translated_html: { type: SchemaType.STRING },
  },
  required: ['translated_html'],
}

/**
 * Translate a full article. Long HTML is split into top-level chunks so
 * the model cannot silently drop middle sections under output pressure.
 * Uses Gemini with automatic Groq fallback on transient provider errors.
 */
export async function translateArticle(
  article: Tables<'articles'>,
  targetLanguage: string,
  countryCode: string,
  primaryKeyword?: string,
  secondaryKeywords?: string[],
  templatePrompt?: string | null
): Promise<TranslationResponse> {
  const content = article.content || ''
  if (content.length >= CHUNK_TRANSLATE_THRESHOLD) {
    return translateArticleChunked(
      article,
      targetLanguage,
      countryCode,
      primaryKeyword,
      secondaryKeywords,
      templatePrompt
    )
  }

  return translateArticleSingle(
    article,
    targetLanguage,
    countryCode,
    primaryKeyword,
    secondaryKeywords,
    templatePrompt
  )
}

async function translateArticleSingle(
  article: Tables<'articles'>,
  targetLanguage: string,
  countryCode: string,
  primaryKeyword?: string,
  secondaryKeywords?: string[],
  templatePrompt?: string | null
): Promise<TranslationResponse> {
  const prompt = buildTranslationPrompt({
    article,
    targetLanguage,
    countryCode,
    primaryKeyword,
    secondaryKeywords,
    templatePrompt,
  })

  const { data, model, inputTokens, outputTokens } = await generateJsonWithFallback<{
    translated_title: string
    translated_content: string
    translated_meta_title: string
    translated_meta_description: string
    translated_faq?: Array<{ question: string; answer: string }>
  }>(prompt, ARTICLE_SCHEMA, 'Gemini translation timeout')

  return {
    translated_title: data.translated_title,
    translated_content: data.translated_content,
    translated_meta_title: data.translated_meta_title,
    translated_meta_description: data.translated_meta_description,
    translated_faq: data.translated_faq ?? [],
    model_used: model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
  }
}

async function translateArticleChunked(
  article: Tables<'articles'>,
  targetLanguage: string,
  countryCode: string,
  primaryKeyword?: string,
  secondaryKeywords?: string[],
  templatePrompt?: string | null
): Promise<TranslationResponse> {
  const chunks = splitHtmlIntoChunks(article.content || '')
  const metaArticle = {
    ...article,
    content: '<p>See localized HTML body in translated_content chunks.</p>',
  } as Tables<'articles'>

  const metaResult = await translateArticleSingle(
    metaArticle,
    targetLanguage,
    countryCode,
    primaryKeyword,
    secondaryKeywords,
    templatePrompt
  )

  let input_tokens = metaResult.input_tokens
  let output_tokens = metaResult.output_tokens
  let model_used = metaResult.model_used
  const translatedParts: string[] = []

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    if (!chunk.needsTranslation) {
      translatedParts.push(chunk.html)
      continue
    }

    const prompt = buildHtmlChunkPrompt({
      htmlChunk: chunk.html,
      targetLanguage,
      countryCode,
      chunkIndex: i,
      totalChunks: chunks.length,
    })

    const { data, model, inputTokens, outputTokens } = await generateJsonWithFallback<{
      translated_html: string
    }>(prompt, CHUNK_SCHEMA, `Chunk ${i + 1} translation timeout`)

    if (!data.translated_html) {
      throw new Error(`Empty translated_html for chunk ${i + 1}`)
    }

    translatedParts.push(data.translated_html)
    input_tokens += inputTokens
    output_tokens += outputTokens
    if (model !== metaResult.model_used) {
      model_used = `${metaResult.model_used}+${model}`
    }
  }

  return {
    translated_title: metaResult.translated_title,
    translated_content: translatedParts.join('\n'),
    translated_meta_title: metaResult.translated_meta_title,
    translated_meta_description: metaResult.translated_meta_description,
    translated_faq: metaResult.translated_faq,
    model_used,
    input_tokens,
    output_tokens,
  }
}

/** @deprecated Prefer generateJsonWithFallback — kept for callers importing model */
export { generateJsonWithFallback }
