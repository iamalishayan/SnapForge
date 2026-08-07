import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { withTimeout } from '@snapforge/shared'

const GEMINI_MODEL = 'gemini-2.5-flash'
const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile'
const DEFAULT_GROK_MODEL = 'grok-3-mini'
const MAX_OUTPUT_TOKENS = 65_536
const CALL_TIMEOUT_MS = 120_000

export type LlmProviderId = 'gemini' | 'groq' | 'grok'

export interface LlmJsonResult<T> {
  data: T
  model: string
  inputTokens: number
  outputTokens: number
  provider: LlmProviderId
}

type JsonSchemaHint = Record<string, unknown>

export function getGroqModel(): string {
  return process.env.GROQ_TRANSLATE_MODEL || DEFAULT_GROQ_MODEL
}

export function getGrokModel(): string {
  return process.env.GROK_TRANSLATE_MODEL || DEFAULT_GROK_MODEL
}

export function isTransientLlmError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return /503|429|UNAVAILABLE|high demand|Too Many Requests|quota|fetch failed|timeout|ECONNRESET|ETIMEDOUT|overloaded/i.test(
    message
  )
}

/**
 * Ordered fallback providers after Gemini (only those with API keys configured).
 * Locked order: Groq → xAI Grok.
 */
export function getConfiguredFallbackProviders(): LlmProviderId[] {
  const providers: LlmProviderId[] = []
  if (process.env.GROQ_API_KEY) providers.push('groq')
  if (process.env.GROK_API_KEY) providers.push('grok')
  return providers
}

/**
 * Call Gemini with JSON schema response. Throws on truncation or empty body.
 */
export async function callGeminiJson<T>(
  prompt: string,
  responseSchema: JsonSchemaHint,
  timeoutLabel = 'Gemini timeout'
): Promise<LlmJsonResult<T>> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    throw new Error('Google Generative AI key is missing in environment.')
  }

  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel(
    { model: GEMINI_MODEL },
    { apiVersion: 'v1beta' }
  )

  const result = await withTimeout(
    model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        responseMimeType: 'application/json',
        responseSchema: responseSchema as any,
        thinkingConfig: { thinkingBudget: 0 },
      } as any,
    }),
    CALL_TIMEOUT_MS,
    timeoutLabel
  )

  const finishReason = result.response.candidates?.[0]?.finishReason
  if (finishReason === 'MAX_TOKENS') {
    throw new Error('Gemini translation truncated (MAX_TOKENS).')
  }

  const text = result.response.text()
  if (!text) {
    throw new Error('Gemini API returned an empty response string.')
  }

  return {
    data: JSON.parse(text) as T,
    model: GEMINI_MODEL,
    inputTokens: result.response.usageMetadata?.promptTokenCount || 0,
    outputTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
    provider: 'gemini',
  }
}

async function callOpenAiCompatibleJson<T>(opts: {
  provider: 'groq' | 'grok'
  apiKey: string
  baseUrl: string
  model: string
  prompt: string
  timeoutLabel: string
}): Promise<LlmJsonResult<T>> {
  // Groq free tier TPM is low — large max_tokens counts against the budget
  const maxTokens = opts.provider === 'groq' ? 8_192 : 16_384

  const result = await withTimeout(
    fetch(`${opts.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: opts.model,
        temperature: 0,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a JSON-only API. Reply with a single valid JSON object matching the user schema. No markdown.',
          },
          { role: 'user', content: opts.prompt },
        ],
      }),
    }).then(async (res) => {
      const body = await res.text()
      if (!res.ok) {
        throw new Error(
          `${opts.provider} API error ${res.status}: ${body.slice(0, 400)}`
        )
      }
      return JSON.parse(body) as {
        choices?: Array<{ message?: { content?: string } }>
        usage?: { prompt_tokens?: number; completion_tokens?: number }
      }
    }),
    CALL_TIMEOUT_MS,
    opts.timeoutLabel
  )

  const content = result.choices?.[0]?.message?.content
  if (!content) {
    throw new Error(`${opts.provider} API returned an empty response string.`)
  }

  return {
    data: JSON.parse(content) as T,
    model: opts.model,
    inputTokens: result.usage?.prompt_tokens || 0,
    outputTokens: result.usage?.completion_tokens || 0,
    provider: opts.provider,
  }
}

/** Groq OpenAI-compatible chat completions. */
export async function callGroqJson<T>(
  prompt: string,
  timeoutLabel = 'Groq timeout'
): Promise<LlmJsonResult<T>> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY is missing in environment.')

  return callOpenAiCompatibleJson<T>({
    provider: 'groq',
    apiKey,
    baseUrl: 'https://api.groq.com/openai/v1',
    model: getGroqModel(),
    prompt,
    timeoutLabel,
  })
}

/** xAI Grok OpenAI-compatible chat completions. */
export async function callGrokJson<T>(
  prompt: string,
  timeoutLabel = 'Grok timeout'
): Promise<LlmJsonResult<T>> {
  const apiKey = process.env.GROK_API_KEY
  if (!apiKey) throw new Error('GROK_API_KEY is missing in environment.')

  return callOpenAiCompatibleJson<T>({
    provider: 'grok',
    apiKey,
    baseUrl: 'https://api.x.ai/v1',
    model: getGrokModel(),
    prompt,
    timeoutLabel,
  })
}

async function callFallbackProvider<T>(
  provider: LlmProviderId,
  prompt: string,
  timeoutLabel: string
): Promise<LlmJsonResult<T>> {
  if (provider === 'groq') {
    return callGroqJson<T>(prompt, `Groq fallback (${timeoutLabel})`)
  }
  if (provider === 'grok') {
    return callGrokJson<T>(prompt, `Grok fallback (${timeoutLabel})`)
  }
  throw new Error(`Unknown fallback provider: ${provider}`)
}

/**
 * Prefer Gemini; on transient errors fall back Groq → xAI Grok (when keys set).
 */
export async function generateJsonWithFallback<T>(
  prompt: string,
  responseSchema: JsonSchemaHint,
  timeoutLabel = 'LLM timeout'
): Promise<LlmJsonResult<T>> {
  try {
    return await callGeminiJson<T>(prompt, responseSchema, timeoutLabel)
  } catch (geminiErr) {
    if (!isTransientLlmError(geminiErr)) {
      throw geminiErr
    }

    const fallbacks = getConfiguredFallbackProviders()
    if (fallbacks.length === 0) {
      throw geminiErr
    }

    const errors: string[] = [
      `Gemini: ${geminiErr instanceof Error ? geminiErr.message : String(geminiErr)}`,
    ]

    for (const provider of fallbacks) {
      try {
        return await callFallbackProvider<T>(provider, prompt, timeoutLabel)
      } catch (err) {
        errors.push(
          `${provider}: ${err instanceof Error ? err.message : String(err)}`
        )
      }
    }

    throw new Error(`All LLM providers failed — ${errors.join(' | ')}`)
  }
}

/** Re-export SchemaType for callers that build Gemini schemas. */
export { SchemaType }
