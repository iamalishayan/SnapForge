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
 * Returns a CSS @font-face block with base64-embedded Noto Sans fonts
 * appropriate for the given language code.
 * 
 * Noto Sans is used because it has near-universal script coverage, meaning
 * Urdu (Arabic script), Turkish, German, Japanese etc. all render correctly.
 */
export async function getFontFaceForLanguage(languageCode: string): Promise<string> {
  const lang = languageCode.toLowerCase().split('-')[0]
  const subset = LANG_SUBSET[lang] ?? 'latin'

  // Noto Sans covers: Latin, Arabic (Urdu/Ar/Fa), Hebrew, Cyrillic, Devanagari,
  // Bengali, Japanese, Korean, Chinese. This single family handles all SnapForge targets.
  const isRtl = ['ur', 'ar', 'fa'].includes(lang)

  if (isRtl) {
    // For RTL (Urdu/Arabic/Farsi) we embed BOTH Arabic AND Latin fonts.
    // This is needed because job postings often mix Arabic script with
    // Latin terms like "Python", "AWS", "Django" etc.
    const arabicUrl = 'https://fonts.gstatic.com/s/notosansarabic/v18/nwpxtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlhQ5l3sQWIHPqzCfyGydMWMtNqVeIQ.woff2'
    const latinUrl  = 'https://fonts.gstatic.com/s/notosans/v36/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A-9X6VLKzA.woff2'
    const latinBoldUrl = 'https://fonts.gstatic.com/s/notosans/v36/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A99a6VLKzA.woff2'
    try {
      const [arabicB64, latinB64, latinBoldB64] = await Promise.all([
        downloadFontAsBase64(arabicUrl, 'noto-arabic-regular'),
        downloadFontAsBase64(latinUrl, 'noto-latin-regular'),
        downloadFontAsBase64(latinBoldUrl, 'noto-latin-bold'),
      ])
      return `
        @font-face {
          font-family: 'NotoSans';
          font-style: normal;
          font-weight: 400;
          src: url('data:font/woff2;base64,${arabicB64}') format('woff2');
          unicode-range: U+0600-06FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE80-FEFC;
        }
        @font-face {
          font-family: 'NotoSans';
          font-style: normal;
          font-weight: 700;
          src: url('data:font/woff2;base64,${arabicB64}') format('woff2');
          unicode-range: U+0600-06FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE80-FEFC;
        }
        @font-face {
          font-family: 'NotoSans';
          font-style: normal;
          font-weight: 400;
          src: url('data:font/woff2;base64,${latinB64}') format('woff2');
        }
        @font-face {
          font-family: 'NotoSans';
          font-style: normal;
          font-weight: 700;
          src: url('data:font/woff2;base64,${latinBoldB64}') format('woff2');
        }
      `.trim()
    } catch {
      return `/* Font download failed — falling back to system fonts */`
    }
  }

  // Noto Sans Latin (covers Turkish, German, French, Spanish, Polish, etc.)
  const regularUrl = 'https://fonts.gstatic.com/s/notosans/v36/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A-9X6VLKzA.woff2'
  const boldUrl    = 'https://fonts.gstatic.com/s/notosans/v36/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A99a6VLKzA.woff2'

  try {
    const [regularB64, boldB64] = await Promise.all([
      downloadFontAsBase64(regularUrl, 'noto-latin-regular'),
      downloadFontAsBase64(boldUrl, 'noto-latin-bold'),
    ])
    return `
      @font-face {
        font-family: 'NotoSans';
        font-style: normal;
        font-weight: 400;
        src: url('data:font/woff2;base64,${regularB64}') format('woff2');
      }
      @font-face {
        font-family: 'NotoSans';
        font-style: normal;
        font-weight: 700;
        src: url('data:font/woff2;base64,${boldB64}') format('woff2');
      }
    `.trim()
  } catch {
    return `/* Font download failed — falling back to system fonts */`
  }
}
