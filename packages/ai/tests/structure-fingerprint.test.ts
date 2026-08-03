import { describe, it, expect } from 'vitest'
import {
  getStructureFingerprint,
  getStructureMismatchErrors,
  validateArticleForTranslation,
  formatFingerprintForPrompt,
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
  })
})
