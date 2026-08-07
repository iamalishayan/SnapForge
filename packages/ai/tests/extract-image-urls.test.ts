import { describe, expect, it } from 'vitest'
import { extractImageUrlsFromHtml, extractLocalizableImages } from '../src/extract-image-urls'

describe('extractLocalizableImages', () => {
  it('uses data-original-src as canonical source for already-localized imgs', () => {
    const html = `
      <img src="https://storage.example.com/rendered.png" data-original-src="https://cdn.example.com/a.png" />
      <img src="https://cdn.example.com/b.jpg" />
    `
    expect(extractLocalizableImages(html)).toEqual([
      { src: 'https://storage.example.com/rendered.png', originalSrc: 'https://cdn.example.com/a.png' },
      { src: 'https://cdn.example.com/b.jpg', originalSrc: 'https://cdn.example.com/b.jpg' },
    ])
  })
})

describe('extractImageUrlsFromHtml', () => {
  it('returns unique img src values', () => {
    const html = `
      <p>Hello</p>
      <img src="https://cdn.example.com/a.png" alt="A" />
      <img src="https://cdn.example.com/b.jpg" />
      <img src="https://cdn.example.com/a.png" />
    `
    expect(extractImageUrlsFromHtml(html)).toEqual([
      'https://cdn.example.com/a.png',
      'https://cdn.example.com/b.jpg',
    ])
  })

  it('returns empty array when no images', () => {
    expect(extractImageUrlsFromHtml('<p>No images</p>')).toEqual([])
  })
})
