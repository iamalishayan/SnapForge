import type { TemplateType } from './manifest'

// Shared palette keeps rendered images visually consistent across templates.
const INK = '#0F1E3D'
const INK_SOFT = '#33456B'
const PAPER = '#FBFAF7'
const PANEL = '#EEF1F8'
const GOLD = '#C9971F'
const LINE = '#D8DCE8'
const FONT = "Helvetica, Arial, sans-serif"

const BANNER = `<svg xmlns="http://www.w3.org/2000/svg" width="920" height="420" viewBox="0 0 920 420">
  <rect width="920" height="420" fill="${PAPER}"/>
  <rect x="0" y="0" width="920" height="8" fill="${GOLD}"/>
  <rect x="60" y="150" width="72" height="4" fill="${GOLD}"/>
  <text data-slot="headline" x="60" y="215" font-family="${FONT}" font-size="44" font-weight="700" fill="${INK}">Headline</text>
  <text data-slot="subhead" x="60" y="270" font-family="${FONT}" font-size="24" fill="${INK_SOFT}">Subhead</text>
  <rect x="0" y="412" width="920" height="8" fill="${INK}"/>
</svg>`

const STAT_GRID = `<svg xmlns="http://www.w3.org/2000/svg" width="920" height="520" viewBox="0 0 920 520">
  <rect width="920" height="520" fill="${PAPER}"/>
  <rect x="0" y="0" width="920" height="8" fill="${GOLD}"/>
  <text data-slot="title" x="60" y="90" font-family="${FONT}" font-size="34" font-weight="700" fill="${INK}">Title</text>
  <rect x="60" y="130" width="380" height="150" rx="12" fill="${PANEL}" stroke="${LINE}"/>
  <text data-slot="stat1_label" x="90" y="180" font-family="${FONT}" font-size="18" fill="${INK_SOFT}">Label 1</text>
  <text data-slot="stat1_value" x="90" y="235" font-family="${FONT}" font-size="34" font-weight="700" fill="${INK}">Value 1</text>
  <rect x="480" y="130" width="380" height="150" rx="12" fill="${PANEL}" stroke="${LINE}"/>
  <text data-slot="stat2_label" x="510" y="180" font-family="${FONT}" font-size="18" fill="${INK_SOFT}">Label 2</text>
  <text data-slot="stat2_value" x="510" y="235" font-family="${FONT}" font-size="34" font-weight="700" fill="${INK}">Value 2</text>
  <rect x="60" y="310" width="380" height="150" rx="12" fill="${PANEL}" stroke="${LINE}"/>
  <text data-slot="stat3_label" x="90" y="360" font-family="${FONT}" font-size="18" fill="${INK_SOFT}">Label 3</text>
  <text data-slot="stat3_value" x="90" y="415" font-family="${FONT}" font-size="34" font-weight="700" fill="${INK}">Value 3</text>
  <rect x="480" y="310" width="380" height="150" rx="12" fill="${PANEL}" stroke="${LINE}"/>
  <text data-slot="stat4_label" x="510" y="360" font-family="${FONT}" font-size="18" fill="${INK_SOFT}">Label 4</text>
  <text data-slot="stat4_value" x="510" y="415" font-family="${FONT}" font-size="34" font-weight="700" fill="${INK}">Value 4</text>
</svg>`

const QUOTE_CARD = `<svg xmlns="http://www.w3.org/2000/svg" width="920" height="420" viewBox="0 0 920 420">
  <rect width="920" height="420" fill="${INK}"/>
  <text x="60" y="140" font-family="Georgia, serif" font-size="110" fill="${GOLD}">&#8220;</text>
  <text data-slot="quote" x="60" y="220" font-family="Georgia, serif" font-size="30" font-style="italic" fill="${PAPER}">Quote</text>
  <rect x="60" y="290" width="48" height="3" fill="${GOLD}"/>
  <text data-slot="attribution" x="60" y="330" font-family="${FONT}" font-size="20" fill="${LINE}">Attribution</text>
</svg>`

const COMPARISON = `<svg xmlns="http://www.w3.org/2000/svg" width="920" height="480" viewBox="0 0 920 480">
  <rect width="920" height="480" fill="${PAPER}"/>
  <rect x="0" y="0" width="920" height="8" fill="${GOLD}"/>
  <text data-slot="title" x="60" y="90" font-family="${FONT}" font-size="34" font-weight="700" fill="${INK}">Title</text>
  <rect x="60" y="130" width="380" height="280" rx="12" fill="${PANEL}" stroke="${LINE}"/>
  <text data-slot="left_label" x="90" y="200" font-family="${FONT}" font-size="22" font-weight="700" fill="${INK_SOFT}">Left label</text>
  <text data-slot="left_value" x="90" y="280" font-family="${FONT}" font-size="38" font-weight="700" fill="${INK}">Left value</text>
  <rect x="480" y="130" width="380" height="280" rx="12" fill="${INK}"/>
  <text data-slot="right_label" x="510" y="200" font-family="${FONT}" font-size="22" font-weight="700" fill="${LINE}">Right label</text>
  <text data-slot="right_value" x="510" y="280" font-family="${FONT}" font-size="38" font-weight="700" fill="${PAPER}">Right value</text>
</svg>`

export const TEMPLATE_SVGS: Record<TemplateType, string> = {
  banner: BANNER,
  stat_grid: STAT_GRID,
  quote_card: QUOTE_CARD,
  comparison: COMPARISON,
}
