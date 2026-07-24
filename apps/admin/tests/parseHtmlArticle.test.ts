import { describe, it, expect } from 'vitest'
import { parseHtmlArticle } from '../app/api/v1/articles/utils'

describe('parseHtmlArticle', () => {
  it('extracts title and content correctly', () => {
    const html = `
      <h1>  My Awesome Article </h1>
      <article>
        <p>This is the content.</p>
      </article>
    `
    const parsed = parseHtmlArticle(html)
    expect(parsed.title).toBe('My Awesome Article')
    expect(parsed.content).toBe('<article>\n        <p>This is the content.</p>\n      </article>')
  })

  it('extracts META fields correctly', () => {
    const html = `
      <!-- META
        meta_title: SEO Title
        meta_description: SEO Description
        og_image: https://example.com/image.png
        inner_links: ["link1", "link2"]
        outer_links: ["out1", "out2"]
      -->
      <h1>Title</h1><article>content</article>
    `
    const parsed = parseHtmlArticle(html)
    expect(parsed.meta_title).toBe('SEO Title')
    expect(parsed.meta_description).toBe('SEO Description')
    expect(parsed.og_image_url).toBe('https://example.com/image.png')
    expect(parsed.inner_links).toEqual(['link1', 'link2'])
    expect(parsed.outer_links).toEqual(['out1', 'out2'])
  })

  it('handles missing META fields gracefully', () => {
    const html = `<h1>Title</h1><article>content</article>`
    const parsed = parseHtmlArticle(html)
    expect(parsed.meta_title).toBeUndefined()
    expect(parsed.inner_links).toEqual([])
  })
})
