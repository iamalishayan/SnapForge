#!/usr/bin/env tsx
/**
 * Smoke-test Gemini / Groq / xAI Grok API keys.
 * Prints PASS/FAIL only — never logs secret values.
 *
 *   pnpm tsx scripts/test-llm-keys.ts
 */
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import {
  callGeminiJson,
  callGroqJson,
  callGrokJson,
  getGrokModel,
  getGroqModel,
  SchemaType,
} from '../packages/ai/src/llm-providers'

const SMOKE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    ok: { type: SchemaType.BOOLEAN },
    provider: { type: SchemaType.STRING },
  },
  required: ['ok', 'provider'],
}

function redactError(message: string): string {
  return message
    .replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED]')
    .replace(/gsk_[A-Za-z0-9]+/g, '[REDACTED]')
    .replace(/xai-[A-Za-z0-9]+/g, '[REDACTED]')
    .replace(/AIza[A-Za-z0-9_-]+/g, '[REDACTED]')
    .slice(0, 240)
}

async function testProvider(
  name: string,
  model: string,
  hasKey: boolean,
  run: () => Promise<{ provider: string; model: string }>
) {
  if (!hasKey) {
    console.log(`${name.padEnd(8)} SKIP  (no API key in env)`)
    return
  }

  const started = Date.now()
  try {
    const result = await run()
    const ms = Date.now() - started
    console.log(
      `${name.padEnd(8)} PASS  model=${result.model}  ${ms}ms`
    )
  } catch (err) {
    const ms = Date.now() - started
    const msg = err instanceof Error ? err.message : String(err)
    console.log(`${name.padEnd(8)} FAIL  model=${model}  ${ms}ms`)
    console.log(`         ${redactError(msg)}`)
  }
}

async function main() {
  console.log('LLM key smoke test (secrets not printed)\n')

  const prompt =
    'Return JSON only: { "ok": true, "provider": "smoke-test" }'

  await testProvider(
    'Gemini',
    'gemini-2.5-flash',
    Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    async () => {
      const r = await callGeminiJson<{ ok: boolean; provider: string }>(
        prompt,
        SMOKE_SCHEMA,
        'Gemini smoke timeout'
      )
      if (!r.data?.ok) throw new Error('Unexpected JSON payload')
      return r
    }
  )

  await testProvider(
    'Groq',
    getGroqModel(),
    Boolean(process.env.GROQ_API_KEY),
    async () => {
      const r = await callGroqJson<{ ok: boolean; provider: string }>(
        prompt,
        'Groq smoke timeout'
      )
      if (!r.data?.ok) throw new Error('Unexpected JSON payload')
      return r
    }
  )

  await testProvider(
    'Grok',
    getGrokModel(),
    Boolean(process.env.GROK_API_KEY),
    async () => {
      const r = await callGrokJson<{ ok: boolean; provider: string }>(
        prompt,
        'Grok smoke timeout'
      )
      if (!r.data?.ok) throw new Error('Unexpected JSON payload')
      return r
    }
  )
}

main().catch((err) => {
  console.error('Smoke test crashed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
