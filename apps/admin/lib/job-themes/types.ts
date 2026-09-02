/**
 * Shared slot schema for job-post visual themes.
 * Both Corporate and Startup themes consume the same fields.
 */
export type JobThemeSlug = 'job-corporate' | 'job-startup'

export interface JobThemeSlots {
  headline: string
  company: string
  location: string
  employmentType: string
  salary: string
  /** Comma or newline separated tags */
  tags: string
  /** Newline-separated bullet requirements */
  requirements: string
  /** Newline-separated benefits */
  benefits: string
  applyLabel: string
  applyUrl: string
  heroImageUrl: string
  summary: string
}

export interface JobThemeDefinition {
  slug: JobThemeSlug
  name: string
  description: string
  css: string
  renderHtml: (slots: JobThemeSlots) => string
}

export const EMPTY_JOB_SLOTS: JobThemeSlots = {
  headline: '',
  company: '',
  location: '',
  employmentType: '',
  salary: '',
  tags: '',
  requirements: '',
  benefits: '',
  applyLabel: 'Apply Now',
  applyUrl: '',
  heroImageUrl: '',
  summary: '',
}

export const JOB_THEME_SLUGS: JobThemeSlug[] = ['job-corporate', 'job-startup']

export function isJobThemeSlug(value: string | null | undefined): value is JobThemeSlug {
  return value === 'job-corporate' || value === 'job-startup'
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function splitLines(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function listToUl(items: string[], className: string): string {
  if (items.length === 0) return ''
  const lis = items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
  return `<ul class="${className}">${lis}</ul>`
}
