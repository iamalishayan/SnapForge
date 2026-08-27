import { describe, expect, it } from 'vitest'
import { fillTemplateSvg } from '../src/image-templates/render'
import { TEMPLATE_MANIFEST, TEMPLATE_TYPES } from '../src/image-templates/manifest'
import { TEMPLATE_SVGS } from '../src/image-templates/svg'
import { rewriteImageSrc } from '../src/rewrite-image-src'

describe('image templates', () => {
  it('every manifest slot exists in its SVG', () => {
    for (const type of TEMPLATE_TYPES) {
      for (const slot of TEMPLATE_MANIFEST[type].slots) {
        expect(TEMPLATE_SVGS[type]).toContain(`data-slot="${slot}"`)
      }
    }
  })

  it('fills slots with translated values and escapes XML', () => {
    const svg = fillTemplateSvg(
      'banner',
      { headline: 'Öğrenim Ücreti İndirimi', subhead: 'A & B < C' },
      'tr'
    )
    expect(svg).toContain('Öğrenim Ücreti İndirimi')
    expect(svg).toContain('A &amp; B &lt; C')
    expect(svg).not.toContain('direction="rtl"')
  })

  it('clears unfilled slots so English defaults do not leak', () => {
    const svg = fillTemplateSvg('banner', { headline: 'Only headline' }, 'tr')
    expect(svg).not.toContain('Subhead')
  })

  it('populates slots for RTL languages', () => {
    const svg = fillTemplateSvg('banner', { headline: 'سرخی' }, 'ur')
    expect(svg).toContain('سرخی')
  })
})

describe('rewriteImageSrc', () => {
  it('swaps src and preserves original in data-original-src', () => {
    const html = '<p>Hi</p><img src="https://cdn.example.com/a.png" alt="A">'
    const out = rewriteImageSrc(
      html,
      'https://cdn.example.com/a.png',
      'https://storage.example.com/rendered.png'
    )
    expect(out).toContain('src="https://storage.example.com/rendered.png"')
    expect(out).toContain('data-original-src="https://cdn.example.com/a.png"')
    expect(out).toContain('alt="A"')
  })

  it('leaves non-matching images untouched', () => {
    const html = '<img src="https://cdn.example.com/logo.png">'
    const out = rewriteImageSrc(html, 'https://cdn.example.com/other.png', 'https://x/y.png')
    expect(out).toContain('src="https://cdn.example.com/logo.png"')
    expect(out).not.toContain('data-original-src')
  })
})
