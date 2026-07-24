import { describe, it, expect } from 'vitest'
import { runAutoQAChecks } from '../src/qa-checks'

describe('runAutoQAChecks', () => {
  const baseArticle: any = {
    content: '<h2>Introduction</h2><p>This is a test article.</p>',
  }

  const baseTranslation: any = {
    translated_content: '<h2>Introduction</h2><p>Ceci est un article test.</p>',
    translated_meta_title: 'Test Title',
    translated_meta_description: 'Test Description',
    translated_title: 'Test',
  }

  it('blocks empty translations', async () => {
    const result = await runAutoQAChecks(
      { ...baseTranslation, translated_content: '' },
      baseArticle,
      'French'
    )
    expect(result.passed).toBe(false)
    expect(result.errors).toContain('Translated content is empty.')
  })

  it('blocks identical translations', async () => {
    const result = await runAutoQAChecks(
      { ...baseTranslation, translated_content: baseArticle.content },
      baseArticle,
      'German'
    )
    expect(result.passed).toBe(false)
    expect(result.errors[0]).toContain('identical to original')
  })

  it('blocks unresolved placeholders', async () => {
    const result = await runAutoQAChecks(
      { ...baseTranslation, translated_content: '<p>Welcome to {company_name}!</p>' },
      baseArticle,
      'French'
    )
    expect(result.passed).toBe(false)
    expect(result.errors[0]).toContain('Unresolved placeholders found')
  })

  it('allows whitelisted placeholders', async () => {
    const result = await runAutoQAChecks(
      { ...baseTranslation, translated_content: '<p>Welcome to {tool_name}!</p>' },
      baseArticle,
      'French'
    )
    expect(result.passed).toBe(true)
  })

  it('blocks H1 count mismatch', async () => {
    const result = await runAutoQAChecks(
      { ...baseTranslation, translated_content: '<h1>Title</h1><p>Test</p>' }, // 1 H1
      baseArticle, // 0 H1
      'French'
    )
    expect(result.passed).toBe(false)
    expect(result.errors[0]).toContain('H1 count mismatch')
  })

  it('blocks missing primary keyword', async () => {
    const result = await runAutoQAChecks(
      baseTranslation,
      baseArticle,
      'French',
      'missingkeyword'
    )
    expect(result.passed).toBe(false)
    expect(result.errors[0]).toContain('Missing primary keyword')
  })

  it('blocks banned words', async () => {
    const result = await runAutoQAChecks(
      { ...baseTranslation, translated_content: '<p>Buy viagra today</p>' },
      baseArticle,
      'French'
    )
    expect(result.passed).toBe(false)
    expect(result.errors[0]).toContain('Banned word match detected')
  })
})
