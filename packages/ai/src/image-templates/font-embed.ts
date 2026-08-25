import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

/**
 * sharp → libvips → librsvg resolves fonts ONLY via fontconfig.
 * CSS @font-face / base64 woff2 data-URIs are ignored (renders as □ tofu).
 *
 * Strategy: download Noto TTF files into a cache dir, write fonts.conf,
 * and set FONTCONFIG_PATH so librsvg can find them.
 */

const CACHE_DIR = join(tmpdir(), 'snapforge-fonts')
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** Google Fonts / notofonts TTF URLs (fontconfig-compatible). */
const FONT_FILES: Record<string, { url: string; file: string }[]> = {
  latin: [
    {
      file: 'NotoSans-Regular.ttf',
      url: 'https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf',
    },
    {
      file: 'NotoSans-Bold.ttf',
      url: 'https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf',
    },
  ],
  arabic: [
    {
      file: 'NotoSansArabic-Regular.ttf',
      url: 'https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSansArabic/NotoSansArabic-Regular.ttf',
    },
    {
      file: 'NotoSansArabic-Bold.ttf',
      url: 'https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSansArabic/NotoSansArabic-Bold.ttf',
    },
  ],
  hebrew: [
    {
      file: 'NotoSansHebrew-Regular.ttf',
      url: 'https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSansHebrew/NotoSansHebrew-Regular.ttf',
    },
    {
      file: 'NotoSansHebrew-Bold.ttf',
      url: 'https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSansHebrew/NotoSansHebrew-Bold.ttf',
    },
  ],
  cyrillic: [
    {
      file: 'NotoSans-Regular.ttf',
      url: 'https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf',
    },
    {
      file: 'NotoSans-Bold.ttf',
      url: 'https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf',
    },
  ],
  devanagari: [
    {
      file: 'NotoSansDevanagari-Regular.ttf',
      url: 'https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf',
    },
    {
      file: 'NotoSansDevanagari-Bold.ttf',
      url: 'https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Bold.ttf',
    },
  ],
  bengali: [
    {
      file: 'NotoSansBengali-Regular.ttf',
      url: 'https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSansBengali/NotoSansBengali-Regular.ttf',
    },
    {
      file: 'NotoSansBengali-Bold.ttf',
      url: 'https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSansBengali/NotoSansBengali-Bold.ttf',
    },
  ],
}

const LANG_SUBSET: Record<string, keyof typeof FONT_FILES | 'cjk'> = {
  ur: 'arabic',
  ar: 'arabic',
  fa: 'arabic',
  he: 'hebrew',
  zh: 'cjk',
  ja: 'cjk',
  ko: 'cjk',
  ru: 'cyrillic',
  uk: 'cyrillic',
  hi: 'devanagari',
  bn: 'bengali',
  de: 'latin',
  fr: 'latin',
  es: 'latin',
  pt: 'latin',
  it: 'latin',
  tr: 'latin',
  en: 'latin',
}

function writeFontsConf(): void {
  const conf = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
<fontconfig>
  <dir>${CACHE_DIR}</dir>
  <cachedir>${join(CACHE_DIR, 'cache')}</cachedir>
  <config>
    <rescan>
      <int>1</int>
    </rescan>
  </config>
</fontconfig>
`
  writeFileSync(join(CACHE_DIR, 'fonts.conf'), conf, 'utf-8')
  process.env.FONTCONFIG_PATH = CACHE_DIR
  // Some builds also honor FONTCONFIG_FILE
  process.env.FONTCONFIG_FILE = join(CACHE_DIR, 'fonts.conf')
}

async function downloadTtf(url: string, destPath: string): Promise<void> {
  const metaPath = `${destPath}.meta`
  if (existsSync(destPath) && existsSync(metaPath)) {
    try {
      const meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
      if (Date.now() - meta.fetchedAt < CACHE_TTL_MS) return
    } catch {
      /* re-download */
    }
  }

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SnapForge/1.0)' },
    signal: AbortSignal.timeout(60_000),
    redirect: 'follow',
  })
  if (!response.ok) {
    throw new Error(`Font download failed (${response.status}): ${url}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  writeFileSync(destPath, buffer)
  writeFileSync(metaPath, JSON.stringify({ fetchedAt: Date.now() }), 'utf-8')
}

/**
 * Ensure Noto TTFs for this language are on disk and visible to fontconfig.
 * Must run before sharp() rasterizes SVG text.
 */
export async function ensureFontsForLanguage(languageCode: string): Promise<void> {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true })
  }

  const lang = languageCode.toLowerCase().split('-')[0]
  const subset = LANG_SUBSET[lang] ?? 'latin'

  // Always include Latin for mixed strings (Python, AWS, brand names).
  const packs: (keyof typeof FONT_FILES)[] =
    subset === 'cjk' || subset === 'latin' ? ['latin'] : ['latin', subset]

  for (const pack of packs) {
    for (const font of FONT_FILES[pack]) {
      try {
        await downloadTtf(font.url, join(CACHE_DIR, font.file))
      } catch {
        // Continue — system fonts (if installed) may still cover glyphs.
      }
    }
  }

  writeFontsConf()
}

/**
 * @deprecated librsvg ignores @font-face data-URIs. Kept for API compatibility;
 * prefer ensureFontsForLanguage() + system/fontconfig fonts.
 */
export async function getFontFaceForLanguage(_languageCode: string): Promise<string> {
  return '/* @font-face unused: sharp/librsvg uses fontconfig only */'
}
