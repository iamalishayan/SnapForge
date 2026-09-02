'use client'

import type { ReactNode } from 'react'
import { type JobThemeSlots, type JobThemeSlug, listJobThemes } from '@/lib/job-themes'

interface JobThemePickerProps {
  value: JobThemeSlug
  onChange: (slug: JobThemeSlug) => void
}

export default function JobThemePicker({ value, onChange }: JobThemePickerProps) {
  const themes = listJobThemes()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {themes.map((theme) => {
        const selected = value === theme.slug
        return (
          <button
            key={theme.slug}
            type="button"
            onClick={() => onChange(theme.slug)}
            className={`text-left rounded-xl border p-4 transition-colors ${
              selected
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-primary/40'
            }`}
          >
            <div className="text-sm font-bold text-foreground">{theme.name}</div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{theme.description}</p>
          </button>
        )
      })}
    </div>
  )
}

interface JobFieldsFormProps {
  slots: JobThemeSlots
  onChange: (slots: JobThemeSlots) => void
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full bg-background border px-4 py-2.5 rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary'

export function JobFieldsForm({ slots, onChange }: JobFieldsFormProps) {
  const set = <K extends keyof JobThemeSlots>(key: K, value: JobThemeSlots[K]) =>
    onChange({ ...slots, [key]: value })

  return (
    <div className="space-y-4">
      <Field label="Headline *">
        <input
          className={inputClass}
          value={slots.headline}
          onChange={(e) => set('headline', e.target.value)}
          placeholder="Senior Product Designer"
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Company">
          <input className={inputClass} value={slots.company} onChange={(e) => set('company', e.target.value)} />
        </Field>
        <Field label="Location">
          <input
            className={inputClass}
            value={slots.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="Remote / Berlin"
          />
        </Field>
        <Field label="Employment type">
          <input
            className={inputClass}
            value={slots.employmentType}
            onChange={(e) => set('employmentType', e.target.value)}
            placeholder="Full-time"
          />
        </Field>
        <Field label="Salary">
          <input
            className={inputClass}
            value={slots.salary}
            onChange={(e) => set('salary', e.target.value)}
            placeholder="€70k–€90k"
          />
        </Field>
      </div>
      <Field label="Summary">
        <textarea
          className={`${inputClass} resize-y min-h-[80px]`}
          value={slots.summary}
          onChange={(e) => set('summary', e.target.value)}
          rows={3}
        />
      </Field>
      <Field label="Tags (comma or newline)">
        <input
          className={inputClass}
          value={slots.tags}
          onChange={(e) => set('tags', e.target.value)}
          placeholder="Design, Figma, Product"
        />
      </Field>
      <Field label="Requirements (one per line)">
        <textarea
          className={`${inputClass} resize-y min-h-[100px] font-mono text-sm`}
          value={slots.requirements}
          onChange={(e) => set('requirements', e.target.value)}
          rows={5}
        />
      </Field>
      <Field label="Benefits (one per line)">
        <textarea
          className={`${inputClass} resize-y min-h-[80px] font-mono text-sm`}
          value={slots.benefits}
          onChange={(e) => set('benefits', e.target.value)}
          rows={4}
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Apply CTA label">
          <input className={inputClass} value={slots.applyLabel} onChange={(e) => set('applyLabel', e.target.value)} />
        </Field>
        <Field label="Apply URL">
          <input
            className={inputClass}
            type="url"
            value={slots.applyUrl}
            onChange={(e) => set('applyUrl', e.target.value)}
            placeholder="https://..."
          />
        </Field>
      </div>
      <Field label="Hero image URL">
        <input
          className={inputClass}
          type="url"
          value={slots.heroImageUrl}
          onChange={(e) => set('heroImageUrl', e.target.value)}
          placeholder="https://..."
        />
      </Field>
    </div>
  )
}
