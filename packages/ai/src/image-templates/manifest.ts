export const TEMPLATE_TYPES = ['banner', 'stat_grid', 'quote_card', 'comparison'] as const

export type TemplateType = (typeof TEMPLATE_TYPES)[number]

export interface TemplateManifestEntry {
  width: number
  height: number
  slots: string[]
}

export const TEMPLATE_MANIFEST: Record<TemplateType, TemplateManifestEntry> = {
  banner: {
    width: 920,
    height: 420,
    slots: ['headline', 'subhead'],
  },
  stat_grid: {
    width: 920,
    height: 520,
    slots: [
      'title',
      'stat1_label',
      'stat1_value',
      'stat2_label',
      'stat2_value',
      'stat3_label',
      'stat3_value',
      'stat4_label',
      'stat4_value',
    ],
  },
  quote_card: {
    width: 920,
    height: 420,
    slots: ['quote', 'attribution'],
  },
  comparison: {
    width: 920,
    height: 480,
    slots: ['title', 'left_label', 'left_value', 'right_label', 'right_value'],
  },
}
