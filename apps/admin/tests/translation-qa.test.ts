import { describe, it, expect } from 'vitest'
import { TranslationUpdateSchema, QAApproveSchema } from '../utils/schemas'

describe('TranslationUpdateSchema', () => {
  it('requires at least one field', () => {
    expect(TranslationUpdateSchema.safeParse({}).success).toBe(false)
  })

  it('accepts content-only updates', () => {
    const parsed = TranslationUpdateSchema.parse({
      translated_content: '<p>Bonjour</p>',
    })
    expect(parsed.translated_content).toBe('<p>Bonjour</p>')
  })

  it('converts empty meta fields to null', () => {
    const parsed = TranslationUpdateSchema.parse({
      translated_title: 'Titre',
      translated_meta_title: '  ',
      translated_meta_description: '',
    })
    expect(parsed.translated_meta_title).toBeNull()
    expect(parsed.translated_meta_description).toBeNull()
  })
})

describe('QAApproveSchema', () => {
  it('allows omit templateSlug', () => {
    const parsed = QAApproveSchema.parse({
      translationId: '00000000-0000-0000-0000-000000000001',
      domain: 'example.com',
    })
    expect(parsed.domain).toBe('example.com')
    expect(parsed.templateSlug).toBeUndefined()
  })
})
