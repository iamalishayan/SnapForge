import sharp from 'sharp'
import { TEMPLATE_MANIFEST, type TemplateType } from './manifest'
import { TEMPLATE_SVGS } from './svg'

const RTL_LANGS = new Set(['ur', 'ar', 'fa', 'he'])

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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
    // Replacer function avoids `$` in slot values being treated as group refs
    svg = svg.replace(pattern, (_match, open: string, close: string) => `${open}${value}${close}`)
  }

  if (RTL_LANGS.has(languageCode.toLowerCase().split('-')[0])) {
    svg = svg.replace('<svg ', '<svg direction="rtl" ')
  }

  return svg
}

/**
 * Render a filled SVG string to a PNG buffer.
 */
export async function renderSvgToPng(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg)).png().toBuffer()
}
