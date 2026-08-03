import { describe, it, expect } from 'vitest'
import { SiteCreateSchema, SiteUpdateSchema } from '../utils/schemas'

describe('SiteCreateSchema', () => {
  it('requires country_code and uppercases it', () => {
    const parsed = SiteCreateSchema.parse({
      domain: 'example.com',
      language_code: 'fr',
      country_code: 'fr',
    })

    expect(parsed.country_code).toBe('FR')
    expect(parsed.active).toBe(true)
  })

  it('rejects missing country_code', () => {
    const result = SiteCreateSchema.safeParse({
      domain: 'example.com',
      language_code: 'en',
    })

    expect(result.success).toBe(false)
  })

  it('converts empty optional strings to null', () => {
    const parsed = SiteCreateSchema.parse({
      domain: 'example.com',
      language_code: 'en',
      country_code: 'US',
      theme_name: '  ',
      adsense_publisher_id: '',
      indexnow_key: '',
      sitemap_url: '',
    })

    expect(parsed.theme_name).toBeNull()
    expect(parsed.adsense_publisher_id).toBeNull()
    expect(parsed.indexnow_key).toBeNull()
    expect(parsed.sitemap_url).toBeNull()
  })

  it('preserves active=false on create', () => {
    const parsed = SiteCreateSchema.parse({
      domain: 'inactive.example.com',
      language_code: 'en',
      country_code: 'US',
      active: false,
    })

    expect(parsed.active).toBe(false)
  })
})

describe('SiteUpdateSchema', () => {
  it('allows partial updates with nullified blanks', () => {
    const parsed = SiteUpdateSchema.parse({
      theme_name: '',
      active: false,
    })

    expect(parsed.theme_name).toBeNull()
    expect(parsed.active).toBe(false)
  })
})
