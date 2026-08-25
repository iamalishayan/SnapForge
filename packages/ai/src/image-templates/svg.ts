import type { TemplateType } from './manifest'

// Shared palette keeps rendered images visually consistent across templates.
const INK = '#0F1E3D'
const INK_SOFT = '#33456B'
const PAPER = '#FBFAF7'
const PANEL = '#EEF1F8'
const GOLD = '#C9971F'
const LINE = '#D8DCE8'
// Noto Sans family names must match fontconfig (system packages or FONTCONFIG_PATH cache).
// sharp/librsvg ignores CSS @font-face — do not rely on embedded woff2.
const FONT = "'Noto Sans', 'Noto Sans Arabic', 'Noto Sans Hebrew', 'Noto Sans Devanagari', 'Noto Sans Bengali', 'Noto Sans CJK SC', 'Noto Sans CJK JP', 'Noto Sans CJK KR', sans-serif"

// ─── LTR coordinates (left-aligned) ──────────────────────────────────────────
// data-ltr-x: x position when text-anchor="start"
// data-rtl-x: x position when text-anchor="end" (right-edge anchor)
// For RTL: x is set to 860 (920 - 60 padding) so text grows left into the canvas.

const BANNER_LTR = `<svg xmlns="http://www.w3.org/2000/svg" width="920" height="420" viewBox="0 0 920 420">
  <defs><style><!-- FONT_FACE --></style></defs>
  <rect width="920" height="420" fill="${PAPER}"/>
  <rect x="0" y="0" width="920" height="8" fill="${GOLD}"/>
  <!-- Gold accent bar: LTR=left, RTL=right -->
  <rect class="ltr-only" x="60" y="150" width="72" height="4" fill="${GOLD}"/>
  <text data-slot="headline" data-ltr-x="60" data-rtl-x="860" x="60" y="215" font-family="${FONT}" font-size="44" font-weight="700" fill="${INK}" textLength="800" lengthAdjust="spacingAndGlyphs">Headline</text>
  <text data-slot="subhead"  data-ltr-x="60" data-rtl-x="860" x="60" y="270" font-family="${FONT}" font-size="24" fill="${INK_SOFT}" textLength="800" lengthAdjust="spacingAndGlyphs">Subhead</text>
  <rect x="0" y="412" width="920" height="8" fill="${INK}"/>
</svg>`

const STAT_GRID_LTR = `<svg xmlns="http://www.w3.org/2000/svg" width="920" height="520" viewBox="0 0 920 520">
  <defs><style><!-- FONT_FACE --></style></defs>
  <rect width="920" height="520" fill="${PAPER}"/>
  <rect x="0" y="0" width="920" height="8" fill="${GOLD}"/>
  <text data-slot="title" data-ltr-x="60" data-rtl-x="860" x="60" y="90" font-family="${FONT}" font-size="34" font-weight="700" fill="${INK}" textLength="800" lengthAdjust="spacingAndGlyphs">Title</text>
  <rect x="60" y="130" width="380" height="150" rx="12" fill="${PANEL}" stroke="${LINE}"/>
  <text data-slot="stat1_label" data-ltr-x="90" data-rtl-x="430" x="90" y="180" font-family="${FONT}" font-size="18" fill="${INK_SOFT}" textLength="320" lengthAdjust="spacingAndGlyphs">Label 1</text>
  <text data-slot="stat1_value" data-ltr-x="90" data-rtl-x="430" x="90" y="235" font-family="${FONT}" font-size="34" font-weight="700" fill="${INK}" textLength="320" lengthAdjust="spacingAndGlyphs">Value 1</text>
  <rect x="480" y="130" width="380" height="150" rx="12" fill="${PANEL}" stroke="${LINE}"/>
  <text data-slot="stat2_label" data-ltr-x="510" data-rtl-x="850" x="510" y="180" font-family="${FONT}" font-size="18" fill="${INK_SOFT}" textLength="320" lengthAdjust="spacingAndGlyphs">Label 2</text>
  <text data-slot="stat2_value" data-ltr-x="510" data-rtl-x="850" x="510" y="235" font-family="${FONT}" font-size="34" font-weight="700" fill="${INK}" textLength="320" lengthAdjust="spacingAndGlyphs">Value 2</text>
  <rect x="60" y="310" width="380" height="150" rx="12" fill="${PANEL}" stroke="${LINE}"/>
  <text data-slot="stat3_label" data-ltr-x="90" data-rtl-x="430" x="90" y="360" font-family="${FONT}" font-size="18" fill="${INK_SOFT}" textLength="320" lengthAdjust="spacingAndGlyphs">Label 3</text>
  <text data-slot="stat3_value" data-ltr-x="90" data-rtl-x="430" x="90" y="415" font-family="${FONT}" font-size="34" font-weight="700" fill="${INK}" textLength="320" lengthAdjust="spacingAndGlyphs">Value 3</text>
  <rect x="480" y="310" width="380" height="150" rx="12" fill="${PANEL}" stroke="${LINE}"/>
  <text data-slot="stat4_label" data-ltr-x="510" data-rtl-x="850" x="510" y="360" font-family="${FONT}" font-size="18" fill="${INK_SOFT}" textLength="320" lengthAdjust="spacingAndGlyphs">Label 4</text>
  <text data-slot="stat4_value" data-ltr-x="510" data-rtl-x="850" x="510" y="415" font-family="${FONT}" font-size="34" font-weight="700" fill="${INK}" textLength="320" lengthAdjust="spacingAndGlyphs">Value 4</text>
</svg>`

const QUOTE_CARD_LTR = `<svg xmlns="http://www.w3.org/2000/svg" width="920" height="420" viewBox="0 0 920 420">
  <defs><style><!-- FONT_FACE --></style></defs>
  <rect width="920" height="420" fill="${INK}"/>
  <text x="60" y="140" font-family="${FONT}" font-size="110" fill="${GOLD}">&ldquo;</text>
  <text data-slot="quote"       data-ltr-x="60" data-rtl-x="860" x="60" y="220" font-family="${FONT}" font-size="30" font-style="italic" fill="${PAPER}" textLength="800" lengthAdjust="spacingAndGlyphs">Quote</text>
  <rect x="60" y="290" width="48" height="3" fill="${GOLD}"/>
  <text data-slot="attribution" data-ltr-x="60" data-rtl-x="860" x="60" y="330" font-family="${FONT}" font-size="20" fill="${LINE}" textLength="800" lengthAdjust="spacingAndGlyphs">Attribution</text>
</svg>`

const COMPARISON_LTR = `<svg xmlns="http://www.w3.org/2000/svg" width="920" height="480" viewBox="0 0 920 480">
  <defs><style><!-- FONT_FACE --></style></defs>
  <rect width="920" height="480" fill="${PAPER}"/>
  <rect x="0" y="0" width="920" height="8" fill="${GOLD}"/>
  <text data-slot="title"       data-ltr-x="60" data-rtl-x="860" x="60" y="90" font-family="${FONT}" font-size="34" font-weight="700" fill="${INK}" textLength="800" lengthAdjust="spacingAndGlyphs">Title</text>
  <rect x="60" y="130" width="380" height="280" rx="12" fill="${PANEL}" stroke="${LINE}"/>
  <text data-slot="left_label"  data-ltr-x="90" data-rtl-x="430" x="90" y="200" font-family="${FONT}" font-size="22" font-weight="700" fill="${INK_SOFT}" textLength="320" lengthAdjust="spacingAndGlyphs">Left label</text>
  <text data-slot="left_value"  data-ltr-x="90" data-rtl-x="430" x="90" y="280" font-family="${FONT}" font-size="38" font-weight="700" fill="${INK}" textLength="320" lengthAdjust="spacingAndGlyphs">Left value</text>
  <rect x="480" y="130" width="380" height="280" rx="12" fill="${INK}"/>
  <text data-slot="right_label" data-ltr-x="510" data-rtl-x="850" x="510" y="200" font-family="${FONT}" font-size="22" font-weight="700" fill="${LINE}" textLength="320" lengthAdjust="spacingAndGlyphs">Right label</text>
  <text data-slot="right_value" data-ltr-x="510" data-rtl-x="850" x="510" y="280" font-family="${FONT}" font-size="38" font-weight="700" fill="${PAPER}" textLength="320" lengthAdjust="spacingAndGlyphs">Right value</text>
</svg>`

export const TEMPLATE_SVGS: Record<TemplateType, string> = {
  banner:     BANNER_LTR,
  stat_grid:  STAT_GRID_LTR,
  quote_card: QUOTE_CARD_LTR,
  comparison: COMPARISON_LTR,
}
