import sharp from 'sharp'
import { TEMPLATE_MANIFEST, type TemplateType } from './manifest'
import { TEMPLATE_SVGS } from './svg'
import { ensureFontsForLanguage } from './font-embed'

const RTL_LANGS = new Set(['ur', 'ar', 'fa', 'he'])

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * For RTL languages, transform each <text> element.
 * librsvg shapes Arabic/Hebrew via Pango without forcing direction="rtl".
 */
function applyRtlTransform(svg: string): string {
  return svg
}

/**
 * Fill a template's data-slot text nodes with translated values.
 * Slots without a value are emptied so no English defaults leak through.
 */
export function fillTemplateSvg(
  templateType: TemplateType,
  slots: Record<string, string>,
  languageCode: string
): string {
  let svg = TEMPLATE_SVGS[templateType]

  for (const slotName of TEMPLATE_MANIFEST[templateType].slots) {
    const value = escapeXml(slots[slotName] ?? '')
    const pattern = new RegExp(
      `(<text[^>]*data-slot="${slotName}"[^>]*>)[\\s\\S]*?(</text>)`
    )
    svg = svg.replace(pattern, (_match, open: string, close: string) => `${open}${value}${close}`)
  }

  const lang = languageCode.toLowerCase().split('-')[0]
  if (RTL_LANGS.has(lang)) {
    svg = applyRtlTransform(svg)
  }

  // Drop unused FONT_FACE placeholder (librsvg ignores @font-face).
  svg = svg.replace('<!-- FONT_FACE -->', '')

  return svg
}

/**
 * Render a filled SVG string to a PNG buffer.
 * Downloads Noto TTFs into a fontconfig-visible cache so sharp/librsvg
 * can paint glyphs (CSS @font-face data-URIs are not supported).
 */
export async function renderSvgToPng(svg: string, languageCode?: string): Promise<Buffer> {
  if (languageCode) {
    try {
      await ensureFontsForLanguage(languageCode)
    } catch {
      /* system fonts may still work */
    }
  }

  return sharp(Buffer.from(svg)).png().toBuffer()
}
