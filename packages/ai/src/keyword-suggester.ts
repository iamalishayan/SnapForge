import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { withTimeout } from '@snapforge/shared'

/**
 * Calls Gemini to suggest the top 5 localized SEO search queries for a given template and locale.
 */
export async function suggestArticleKeywords(
  articleContent: string,
  languageCode: string,
  countryCode: string
): Promise<string[]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    throw new Error('Google Generative AI key is missing in environment.')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel(
    { model: 'gemini-3.6-flash' },
    { apiVersion: 'v1beta' }
  )

  const prompt = `You are an expert SEO specialist for the ${languageCode} (${countryCode}) market.
We need the top 5 highest search-volume, long-tail search queries (2-5 words) that local users in ${countryCode} type into Google that would lead them to an article with the following content.
Article Content Preview (first 1000 chars): "${articleContent.substring(0, 1000)}"
CRITICAL INSTRUCTION: You must provide the search queries STRICTLY AND ONLY in the native language corresponding to the language code '${languageCode}'. Do NOT output English keywords unless the language code is 'en'. Provide natural, highly-searched exact phrases.
Return only the 5 queries in a JSON array.`

  const result = await withTimeout(
    model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: 'Array of top 5 localized SEO search queries'
        }
      }
    }),
    20_000,
    'Gemini keyword suggestion timeout after 20s'
  )

  const responseText = result.response.text()
  if (!responseText) {
    throw new Error('Gemini API returned empty keyword suggestions.')
  }

  const parsed = JSON.parse(responseText)
  return Array.isArray(parsed) ? parsed : []
}

