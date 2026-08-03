import { describe, it, expect } from 'vitest'
import { extractLinksFromContent, prepareArticleContent } from '../app/api/v1/articles/utils'

describe('extractLinksFromContent', () => {
  it('splits relative and absolute links', () => {
    const html = '<p><a href="/blog/a">Internal</a> <a href="https://ex.com">External</a></p>'
    const { inner_links, outer_links } = extractLinksFromContent(html)

    expect(inner_links).toEqual([{ text: 'Internal', href: '/blog/a' }])
    expect(outer_links).toEqual([{ text: 'External', href: 'https://ex.com' }])
  })

  it('dedupes by href', () => {
    const html = '<a href="/x">One</a><a href="/x">Two</a>'
    const { inner_links } = extractLinksFromContent(html)
    expect(inner_links).toHaveLength(1)
  })
})

describe('prepareArticleContent', () => {
  it('strips scripts and derives links from sanitized html', () => {
    const { content, inner_links, outer_links } = prepareArticleContent(
      '<p><a href="/ok">Ok</a></p><script>evil()</script><a href="https://x.com">X</a>'
    )

    expect(content).not.toContain('script')
    expect(inner_links).toEqual([{ text: 'Ok', href: '/ok' }])
    expect(outer_links).toEqual([{ text: 'X', href: 'https://x.com' }])
  })
})
