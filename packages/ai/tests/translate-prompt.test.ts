import { describe, it, expect } from 'vitest'
import { buildTranslationPrompt } from '../src/prompts/translate'

describe('buildTranslationPrompt', () => {
  const article = {
    title: 'How to Resize Images',
    content: '<h2>Intro</h2><p>Step one with enough words for context.</p>',
    meta_title: 'Image Resize Guide',
    meta_description: 'Learn to resize images online.',
  } as any

  it('includes source SEO metadata in the prompt', () => {
    const prompt = buildTranslationPrompt({
      article,
      targetLanguage: 'French',
      countryCode: 'FR',
    })

    expect(prompt).toContain('Meta Title: Image Resize Guide')
    expect(prompt).toContain('Meta Description: Learn to resize images online.')
    expect(prompt).toContain('adapt the meta title and description')
  })

  it('includes structure fingerprint line', () => {
    const prompt = buildTranslationPrompt({
      article,
      targetLanguage: 'French',
      countryCode: 'FR',
    })

    expect(prompt).toContain('Source structure:')
    expect(prompt).toContain('h2=1')
    expect(prompt).toContain('TRANSLATE ONLY')
  })

  it('requires empty FAQ when source has no FAQ', () => {
    const prompt = buildTranslationPrompt({
      article,
      targetLanguage: 'French',
      countryCode: 'FR',
    })

    expect(prompt).toContain('translated_faq as an empty array')
  })

  it('falls back to title when meta_title is null', () => {
    const prompt = buildTranslationPrompt({
      article: { ...article, meta_title: null, meta_description: null },
      targetLanguage: 'German',
      countryCode: 'DE',
    })

    expect(prompt).toContain('Meta Title: How to Resize Images')
    expect(prompt).toContain('derive a short meta description')
  })
})
