import { describe, it, expect } from 'vitest'
import { slugify } from '../utils/slugify'
import { buildPublicPagePath, buildPublicPageUrl } from '../app/api/v1/translations/page-path'

describe('slugify', () => {
  it('lowercases and hyphenates titles', () => {
    expect(slugify('Hello World!')).toBe('hello-world')
  })

  it('falls back when title has no alphanumerics', () => {
    expect(slugify('---')).toBe('article')
  })
})

describe('public page paths', () => {
  it('builds template + article path', () => {
    expect(buildPublicPagePath('ghibli-filter', 'how-to-use')).toBe('/ghibli-filter/how-to-use')
  })

  it('builds full URL with localhost protocol', () => {
    expect(buildPublicPageUrl('localhost:3001', 'tool-a', 'guide')).toBe(
      'http://localhost:3001/tool-a/guide'
    )
  })
})
