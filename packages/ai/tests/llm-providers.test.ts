import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import {
  getConfiguredFallbackProviders,
  isTransientLlmError,
} from '../src/llm-providers'

describe('isTransientLlmError', () => {
  it('detects Gemini 503 high demand', () => {
    expect(
      isTransientLlmError(
        new Error(
          '[503 Service Unavailable] This model is currently experiencing high demand'
        )
      )
    ).toBe(true)
  })

  it('detects 429 quota', () => {
    expect(isTransientLlmError(new Error('[429 Too Many Requests] quota'))).toBe(true)
  })

  it('rejects auth errors', () => {
    expect(isTransientLlmError(new Error('API key is invalid'))).toBe(false)
  })
})

describe('getConfiguredFallbackProviders', () => {
  const original = { ...process.env }

  beforeEach(() => {
    delete process.env.GROQ_API_KEY
    delete process.env.GROK_API_KEY
  })

  afterEach(() => {
    process.env = { ...original }
  })

  it('returns empty when no fallback keys', () => {
    expect(getConfiguredFallbackProviders()).toEqual([])
  })

  it('orders Groq before xAI Grok', () => {
    process.env.GROQ_API_KEY = 'test-groq'
    process.env.GROK_API_KEY = 'test-grok'
    expect(getConfiguredFallbackProviders()).toEqual(['groq', 'grok'])
  })

  it('includes only Grok when Groq is unset', () => {
    process.env.GROK_API_KEY = 'test-grok'
    expect(getConfiguredFallbackProviders()).toEqual(['grok'])
  })
})
