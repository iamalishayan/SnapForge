import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

/**
 * Language → Google Fonts subset param.
 * Maps ISO 639-1 language code to the appropriate subset so we fetch only
 * the glyphs we need, keeping font size manageable.
 */
const LANG_SUBSET: Record<string, string> = {
  ur: 'arabic',   // Urdu — Arabic script
  ar: 'arabic',
  fa: 'arabic',
  he: 'hebrew',
  zh: 'chinese-simplified',
  ja: 'japanese',
  ko: 'korean',
  tr: 'latin',
  de: 'latin',
  fr: 'latin',
  es: 'latin',
  pt: 'latin',
  it: 'latin',
  ru: 'cyrillic',
  uk: 'cyrillic',
  hi: 'devanagari',
  bn: 'bengali',
  // default (latin)
}

const CACHE_DIR = join(tmpdir(), 'snapforge-fonts')
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Download a font file and return it as a base64 string.
 * Results are cached to disk so we don't re-download on every render.
 */
async function downloadFontAsBase64(url: string, cacheKey: string): Promise<string> {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true })
  }

  const cachePath = join(CACHE_DIR, `${cacheKey}.b64`)
  const metaPath = join(CACHE_DIR, `${cacheKey}.meta`)

  // Return cached version if fresh
  if (existsSync(cachePath) && existsSync(metaPath)) {
    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
    if (Date.now() - meta.fetchedAt < CACHE_TTL_MS) {
      return readFileSync(cachePath, 'utf-8')
    }
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SnapForge/1.0)',
    },
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    throw new Error(`Font download failed (${response.status}): ${url}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const b64 = buffer.toString('base64')

  writeFileSync(cachePath, b64, 'utf-8')
  writeFileSync(metaPath, JSON.stringify({ fetchedAt: Date.now() }), 'utf-8')

  return b64
}

/**
 * Helper to download fonts and build the CSS string.
 */
async function downloadAndBuildCss(regularUrl: string, boldUrl: string, cacheKeyPrefix: string, unicodeRange?: string): Promise<string> {
  try {
    const [regularB64, boldB64] = await Promise.all([
      downloadFontAsBase64(regularUrl, `${cacheKeyPrefix}-regular`),
      downloadFontAsBase64(boldUrl, `${cacheKeyPrefix}-bold`),
    ])
    
    const rangeRule = unicodeRange ? `\n          unicode-range: ${unicodeRange};` : ''
    
    return `
      @font-face {
        font-family: 'NotoSans';
        font-style: normal;
        font-weight: 400;
        src: url('data:font/woff2;base64,${regularB64}') format('woff2');${rangeRule}
      }
      @font-face {
        font-family: 'NotoSans';
        font-style: normal;
        font-weight: 700;
        src: url('data:font/woff2;base64,${boldB64}') format('woff2');${rangeRule}
      }
    `.trim()
  } catch {
    return `/* Font download failed for ${cacheKeyPrefix} — falling back to system fonts */`
  }
}

/**
 * Returns a CSS @font-face block with base64-embedded Noto Sans fonts
 * appropriate for the given language code.
 * 
 * Noto Sans is used because it has near-universal script coverage.
 * For CJK, we skip embedding due to massive file sizes (15MB+) and rely on OS fonts.
 */
export async function getFontFaceForLanguage(languageCode: string): Promise<string> {
  const lang = languageCode.toLowerCase().split('-')[0]
  const subset = LANG_SUBSET[lang] ?? 'latin'

  // If CJK, don't embed base64. Let librsvg fall back to the OS 'Noto Sans CJK' font.
  if (['chinese-simplified', 'japanese', 'korean'].includes(subset)) {
    return `/* CJK fonts are too large for base64 embedding. Relying on host OS fonts (e.g. fonts-noto-cjk). */`
  }

  // Base Latin URLs (always included as fallback for mixed text like "Python")
  const latinRegularUrl = 'https://fonts.gstatic.com/s/notosans/v36/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A-9X6VLKzA.woff2'
  const latinBoldUrl = 'https://fonts.gstatic.com/s/notosans/v36/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A99a6VLKzA.woff2'
  const latinCss = await downloadAndBuildCss(latinRegularUrl, latinBoldUrl, 'noto-latin')

  switch (subset) {
    case 'arabic': {
      const arabicRegularUrl = 'https://fonts.gstatic.com/s/notosansarabic/v18/nwpxtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlhQ5l3sQWIHPqzCfyGydMWMtNqVeIQ.woff2'
      const arabicBoldUrl = arabicRegularUrl // Using same for now as previous implementation did
      const arabicRange = 'U+0600-06FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE80-FEFC'
      const arabicCss = await downloadAndBuildCss(arabicRegularUrl, arabicBoldUrl, 'noto-arabic', arabicRange)
      return `${arabicCss}\n${latinCss}`
    }

    case 'hebrew': {
      const regularUrl = 'https://fonts.gstatic.com/s/notosanshebrew/v50/or30Q7v33eiDljA1IufXTtVf7V6RvEEdhQlk0LlGxCyaePiWTNzWNf72cWk.woff2'
      const boldUrl = 'https://fonts.gstatic.com/s/notosanshebrew/v50/or30Q7v33eiDljA1IufXTtVf7V6RvEEdhQlk0LlGxCyaePiWTNzWNf72cWk.woff2'
      const css = await downloadAndBuildCss(regularUrl, boldUrl, 'noto-hebrew')
      return `${css}\n${latinCss}`
    }

    case 'devanagari': {
      const regularUrl = 'https://fonts.gstatic.com/s/notosansdevanagari/v30/TuG7UUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHN5TV_5Kl4-GIB.woff2'
      const boldUrl = 'https://fonts.gstatic.com/s/notosansdevanagari/v30/TuG7UUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHN5TV_5Kl4-GIB.woff2'
      const css = await downloadAndBuildCss(regularUrl, boldUrl, 'noto-devanagari')
      return `${css}\n${latinCss}`
    }

    case 'bengali': {
      const regularUrl = 'https://fonts.gstatic.com/s/notosansbengali/v33/Cn-fJsCGWQxOjaGwMQ6fIiMywrNJIky6nvd8BjzVMvJx2mc4I3mYrtU3_I-n.woff2'
      const boldUrl = 'https://fonts.gstatic.com/s/notosansbengali/v33/Cn-fJsCGWQxOjaGwMQ6fIiMywrNJIky6nvd8BjzVMvJx2mc4I3mYrtU3_I-n.woff2'
      const css = await downloadAndBuildCss(regularUrl, boldUrl, 'noto-bengali')
      return `${css}\n${latinCss}`
    }

    case 'cyrillic': {
      const regularUrl = 'https://fonts.gstatic.com/s/notosans/v42/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5ardu3mhPy1Fig.woff2'
      const boldUrl = 'https://fonts.gstatic.com/s/notosans/v42/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5ardu3mhPy1Fig.woff2'
      // No extra latin css needed since Cyrillic font file often covers basic Latin too, but we append it anyway for safety
      const css = await downloadAndBuildCss(regularUrl, boldUrl, 'noto-cyrillic')
      return `${css}\n${latinCss}`
    }

    case 'latin':
    default:
      return latinCss
  }
}
