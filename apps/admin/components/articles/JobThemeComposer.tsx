'use client'

import JobThemePicker, { JobFieldsForm } from '@/components/articles/JobThemeFields'
import JobThemePreview from '@/components/articles/JobThemePreview'
import type { JobThemeSlots, JobThemeSlug } from '@/lib/job-themes'

interface JobThemeComposerProps {
  themeSlug: JobThemeSlug
  slots: JobThemeSlots
  onThemeChange: (slug: JobThemeSlug) => void
  onSlotsChange: (slots: JobThemeSlots) => void
  onSwitchToAdvanced: () => void
}

export default function JobThemeComposer({
  themeSlug,
  slots,
  onThemeChange,
  onSlotsChange,
  onSwitchToAdvanced,
}: JobThemeComposerProps) {
  return (
    <div className="space-y-6">
      <section className="bg-card rounded-xl overflow-hidden border shadow-sm">
        <div className="px-6 py-4 border-b flex items-center justify-between gap-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary">
            Visual theme
          </h3>
          <button
            type="button"
            onClick={onSwitchToAdvanced}
            className="text-xs text-primary hover:underline font-mono"
          >
            Use TipTap / HTML instead
          </button>
        </div>
        <div className="p-6 space-y-6">
          <JobThemePicker value={themeSlug} onChange={onThemeChange} />
          <JobFieldsForm slots={slots} onChange={onSlotsChange} />
        </div>
      </section>
      <JobThemePreview themeSlug={themeSlug} slots={slots} />
    </div>
  )
}
