import { describe, it, expect } from 'vitest'
import { emptyToNull, normalizeArticleSeoFields } from '../utils/normalize-seo'
import { ArticleCreateSchema, ArticleUpdateSchema } from '../utils/schemas'

describe('emptyToNull', () => {
  it('converts blank strings to null', () => {
    expect(emptyToNull('')).toBeNull()
    expect(emptyToNull('   ')).toBeNull()
    expect(emptyToNull(undefined)).toBeNull()
    expect(emptyToNull(null)).toBeNull()
  })

  it('trims and keeps non-empty values', () => {
    expect(emptyToNull('  hello  ')).toBe('hello')
  })
})

describe('normalizeArticleSeoFields', () => {
  it('normalizes only seo keys that are present', () => {
    const result = normalizeArticleSeoFields({
      title: 'Keep',
      meta_title: '  ',
      meta_description: '',
    })
    expect(result.title).toBe('Keep')
    expect(result.meta_title).toBeNull()
    expect(result.meta_description).toBeNull()
  })
})

describe('ArticleCreateSchema SEO fields', () => {
  const base = {
    title: 'Test',
    content: '<p>Hi</p>',
    template_id: '00000000-0000-0000-0000-000000000001',
  }

  it('defaults status to draft', () => {
    const parsed = ArticleCreateSchema.parse(base)
    expect(parsed.status).toBe('draft')
  })

  it('rejects legacy translation pipeline statuses on articles', () => {
    expect(() =>
      ArticleCreateSchema.parse({ ...base, status: 'published' })
    ).toThrow()
  })

  it('coerces empty SEO strings to null', () => {
    const parsed = ArticleCreateSchema.parse({
      ...base,
      meta_title: '   ',
      meta_description: '',
      og_image_url: '',
    })
    expect(parsed.meta_title).toBeNull()
    expect(parsed.meta_description).toBeNull()
    expect(parsed.og_image_url).toBeNull()
  })

  it('accepts valid og_image_url', () => {
    const parsed = ArticleCreateSchema.parse({
      ...base,
      og_image_url: 'https://cdn.example.com/og.jpg',
    })
    expect(parsed.og_image_url).toBe('https://cdn.example.com/og.jpg')
  })

  it('rejects invalid og_image_url', () => {
    expect(() =>
      ArticleCreateSchema.parse({
        ...base,
        og_image_url: 'not-a-url',
      })
    ).toThrow()
  })
})

describe('ArticleUpdateSchema SEO fields', () => {
  it('coerces empty patch values to null', () => {
    const parsed = ArticleUpdateSchema.parse({ meta_title: '' })
    expect(parsed.meta_title).toBeNull()
  })
})
