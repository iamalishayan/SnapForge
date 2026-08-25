import sharp from 'sharp'
import { TEMPLATE_MANIFEST, type TemplateType } from './manifest'
import { TEMPLATE_SVGS } from './svg'
import { getFontFaceForLanguage } from './font-embed'

const RTL_LANGS = new Set(['ur', 'ar', 'fa', 'he'])

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Parse an SVG tag string and return its attributes as a key-value map.
 * Handles both single and double-quoted attribute values.
 */
function parseAttrs(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const pattern = /(\w[\w-]*)="([^"]*)"/g
  let m: RegExpExecArray | null
  while ((m = pattern.exec(tag)) !== null) {
    attrs[m[1]] = m[2]
  }
  return attrs
}

/**
 * For RTL languages, transform each <text> element:
 * - Replace x with data-rtl-x value
 * - Add text-anchor="end" direction="rtl" unicode-bidi="embed"
 * - Remove textLength/lengthAdjust (librsvg doesn't support them well with RTL)
 *
 * Uses simple line-by-line processing instead of complex regex to avoid corruption.
 */
function applyRtlTransform(svg: string): string {
  // For RTL (Urdu, Arabic, Farsi, Hebrew):
  // librsvg/Pango correctly shapes Arabic/Hebrew glyphs as connected RTL characters
  // even without explicit direction="rtl". Adding direction="rtl" causes text to
  // overflow past x=0 (left edge) since librsvg reverses the flow direction.
  //
  // Solution: just keep the text at x=60 with textLength=800 so the RTL glyphs
  // fill the space. The connected Arabic letterforms look correct visually.
  // No transformation needed — the template SVG already has textLength set.
  return svg
}


/**
 * Inject the @font-face CSS into the SVG's <style> block.
 */
function injectFontFace(svg: string, fontFaceCss: string): string {
  return svg.replace('<!-- FONT_FACE -->', fontFaceCss)
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

  return svg
}

/**
 * Render a filled SVG string to a PNG buffer.
 * Downloads and embeds the appropriate Noto Sans font for the given language
 * so text renders correctly on any server regardless of installed system fonts.
 * Arabic/Urdu glyphs are shaped correctly by HarfBuzz/Pango with textLength
 * constraining the text to fit within the template bounds.
 */
export async function renderSvgToPng(svg: string, languageCode?: string): Promise<Buffer> {
  if (languageCode) {
    try {
      const fontFaceCss = await getFontFaceForLanguage(languageCode)
      svg = injectFontFace(svg, fontFaceCss)
    } catch {
      svg = injectFontFace(svg, '')
    }
  } else {
    svg = injectFontFace(svg, '')
  }

  return sharp(Buffer.from(svg)).png().toBuffer()
}
