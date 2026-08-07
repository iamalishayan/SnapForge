import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { withTimeout } from '@snapforge/shared'
import type { Tables } from '@snapforge/db'
import { buildHtmlChunkPrompt, buildTranslationPrompt } from './prompts/translate'
import {
  CHUNK_TRANSLATE_THRESHOLD,
  splitHtmlIntoChunks,
} from './structure-fingerprint'

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

const MODEL_NAME = 'gemini-2.5-flash'
const MAX_OUTPUT_TOKENS = 65_536
const TRANSLATE_TIMEOUT_MS = 120_000

export const model = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')
  .getGenerativeModel({ model: MODEL_NAME }, { apiVersion: 'v1beta' })

function assertNotTruncated(result: Awaited<ReturnType<typeof model.generateContent>>) {
  const finishReason = result.response.candidates?.[0]?.finishReason
  if (finishReason === 'MAX_TOKENS') {
    throw new Error('Gemini translation truncated (MAX_TOKENS). Retry with chunked translate.')
  }
}

/**
 * Translate a full article. Long HTML is split into top-level chunks so
 * Gemini cannot silently drop middle sections under output pressure.
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
  const useChunks = content.length >= CHUNK_TRANSLATE_THRESHOLD

  if (useChunks) {
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

  const result = await withTimeout(
    model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        responseMimeType: 'application/json',
        responseSchema: {
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
        },
        // Prefer output tokens over thinking for long HTML fidelity
        thinkingConfig: { thinkingBudget: 0 },
      } as any,
    }),
    TRANSLATE_TIMEOUT_MS,
    'Gemini translation timeout'
  )

  assertNotTruncated(result)

  const responseText = result.response.text()
  if (!responseText) {
    throw new Error('Gemini API returned an empty response string.')
  }

  const parsed = JSON.parse(responseText)
  return {
    translated_title: parsed.translated_title,
    translated_content: parsed.translated_content,
    translated_meta_title: parsed.translated_meta_title,
    translated_meta_description: parsed.translated_meta_description,
    translated_faq: parsed.translated_faq ?? [],
    model_used: MODEL_NAME,
    input_tokens: result.response.usageMetadata?.promptTokenCount || 0,
    output_tokens: result.response.usageMetadata?.candidatesTokenCount || 0,
  }
}

/**
 * Meta/title via one call with empty body stub; body via per-chunk HTML translates.
 */
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
    // Short stub so the meta call stays small; body comes from chunks
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

    const result = await withTimeout(
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              translated_html: { type: SchemaType.STRING },
            },
            required: ['translated_html'],
          },
          thinkingConfig: { thinkingBudget: 0 },
        } as any,
      }),
      TRANSLATE_TIMEOUT_MS,
      `Gemini chunk ${i + 1} translation timeout`
    )

    assertNotTruncated(result)

    const parsed = JSON.parse(result.response.text()) as { translated_html: string }
    if (!parsed.translated_html) {
      throw new Error(`Empty translated_html for chunk ${i + 1}`)
    }

    translatedParts.push(parsed.translated_html)
    input_tokens += result.response.usageMetadata?.promptTokenCount || 0
    output_tokens += result.response.usageMetadata?.candidatesTokenCount || 0
  }

  return {
    translated_title: metaResult.translated_title,
    translated_content: translatedParts.join('\n'),
    translated_meta_title: metaResult.translated_meta_title,
    translated_meta_description: metaResult.translated_meta_description,
    translated_faq: metaResult.translated_faq,
    model_used: MODEL_NAME,
    input_tokens,
    output_tokens,
  }
}
