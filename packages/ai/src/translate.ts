import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

import { buildTranslationPrompt } from './prompts/translate'
import { withTimeout } from '@snapforge/shared'
import type { Tables } from '@snapforge/db'

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

/**
 * Direct interface to translate content using Google Gemini API.
 * Configured with strict JSON Schema output to guarantee structural validity.
 */
export async function translateArticle(
  article: Tables<'articles'>,
  targetLanguage: string,
  countryCode: string,
  primaryKeyword?: string,
  secondaryKeywords?: string[],
  templatePrompt?: string | null
): Promise<TranslationResponse> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    throw new Error('Google Generative AI key is missing in environments.')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const modelName = 'gemini-2.5-flash'
  // Using gemini-1.5-flash for cost-efficient, fast schema localization
  const model = genAI.getGenerativeModel(
    { model: modelName },
    { apiVersion: 'v1beta' }
  )

  const prompt = buildTranslationPrompt({
    article,
    targetLanguage,
    countryCode,
    primaryKeyword,
    secondaryKeywords,
    templatePrompt
  })

  const result = await withTimeout(
    model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
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
                  answer: { type: SchemaType.STRING }
                },
                required: ['question', 'answer']
              }
            }
          },
          required: [
            'translated_title',
            'translated_content',
            'translated_meta_title',
            'translated_meta_description',
            'translated_faq'
          ]
        }
      }
    }),
    60_000,
    'Gemini translation timeout after 60s'
  )


  const responseText = result.response.text()

  if (!responseText) {
    throw new Error('Gemini API returned an empty response string.')
  }

  const parsed = JSON.parse(responseText)
  
  // Extract token counts safely from metadata if available (otherwise mock/estimate)
  const input_tokens = result.response.usageMetadata?.promptTokenCount || 0
  const output_tokens = result.response.usageMetadata?.candidatesTokenCount || 0

  return {
    translated_title: parsed.translated_title,
    translated_content: parsed.translated_content,
    translated_meta_title: parsed.translated_meta_title,
    translated_meta_description: parsed.translated_meta_description,
    translated_faq: parsed.translated_faq,
    model_used: modelName,
    input_tokens,
    output_tokens
  }
}

