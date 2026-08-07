import { describe, it, expect } from 'vitest'
import {
  getStructureFingerprint,
  getStructureMismatchErrors,
  validateArticleForTranslation,
  formatFingerprintForPrompt,
  splitHtmlIntoChunks,
} from '../src/structure-fingerprint'

describe('getStructureFingerprint', () => {
  it('counts tags and words from HTML', () => {
    const fp = getStructureFingerprint('<h2>Intro</h2><p>Hello world test.</p>')
    expect(fp.h2).toBe(1)
    expect(fp.p).toBe(1)
    expect(fp.h1).toBe(0)
    expect(fp.wordCount).toBeGreaterThanOrEqual(3)
    expect(fp.hasFaq).toBe(false)
    expect(fp.blockCount).toBe(2)
  })

  it('detects FAQ headings', () => {
    const fp = getStructureFingerprint('<h2>Frequently Asked Questions</h2><p>Q1</p>')
    expect(fp.hasFaq).toBe(true)
  })
})

describe('getStructureMismatchErrors', () => {
  it('reports tag count drift', () => {
    const errors = getStructureMismatchErrors('<p>Ok</p>', '<h1>Title</h1><p>Ok</p>')
    expect(errors.some((e) => e.includes('H1 count mismatch'))).toBe(true)
  })
})

describe('validateArticleForTranslation', () => {
  it('rejects thin content', () => {
    const result = validateArticleForTranslation('<p>Ok</p>')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('too thin')
    }
  })

  it('accepts content with enough words and blocks', () => {
    const words = Array.from({ length: 55 }, (_, i) => `word${i}`).join(' ')
    const html = `<h2>Section</h2><p>${words}</p>`
    expect(validateArticleForTranslation(html).ok).toBe(true)
  })
})

describe('formatFingerprintForPrompt', () => {
  it('includes tag counts', () => {
    const line = formatFingerprintForPrompt(getStructureFingerprint('<p>Hi</p>'))
    expect(line).toContain('h1=0')
    expect(line).toContain('p=1')
    expect(line).toContain('section=0')
    expect(line).toContain('class/id/style')
  })
})

describe('splitHtmlIntoChunks', () => {
  it('splits top-level siblings', () => {
    const html = '<nav>Nav</nav><footer>Foot</footer>'
    const chunks = splitHtmlIntoChunks(html)
    expect(chunks.length).toBe(2)
    expect(chunks[0].html).toContain('nav')
    expect(chunks[1].html).toContain('footer')
  })

  it('unwraps large article into section children', () => {
    const section = (n: number) =>
      `<section id="s${n}"><h2>Title ${n}</h2><p>${'word '.repeat(200)}</p></section>`
    const html = `<nav>N</nav><article>${section(1)}${section(2)}${section(3)}</article><footer>F</footer>`
    const chunks = splitHtmlIntoChunks(html)
    expect(chunks.some((c) => c.html.startsWith('<article'))).toBe(true)
    expect(chunks.some((c) => c.html.includes('</article>'))).toBe(true)
    expect(chunks.filter((c) => c.html.includes('<section')).length).toBeGreaterThanOrEqual(3)
  })
})
