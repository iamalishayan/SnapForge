import { jobCorporateTheme } from './corporate'
import { jobStartupTheme } from './startup'
import {
  type JobThemeDefinition,
  type JobThemeSlug,
  type JobThemeSlots,
  EMPTY_JOB_SLOTS,
  isJobThemeSlug,
} from './types'

const THEMES: Record<JobThemeSlug, JobThemeDefinition> = {
  'job-corporate': jobCorporateTheme,
  'job-startup': jobStartupTheme,
}

export function listJobThemes(): JobThemeDefinition[] {
  return Object.values(THEMES)
}

export function getJobTheme(slug: string | null | undefined): JobThemeDefinition | null {
  if (!isJobThemeSlug(slug)) return null
  return THEMES[slug]
}

export interface CompiledJobTheme {
  content: string
  article_css: string
  visual_theme: JobThemeSlug
  title: string
}

/**
 * Compile structured job slots into articles.content + articles.article_css.
 */
export function compileJobTheme(
  slug: JobThemeSlug,
  slots: JobThemeSlots
): CompiledJobTheme {
  const theme = THEMES[slug]
  const content = theme.renderHtml(slots)
  return {
    content,
    article_css: theme.css,
    visual_theme: slug,
    title: slots.headline.trim() || 'Untitled role',
  }
}

export function parseJobSlotsFromUnknown(raw: unknown): JobThemeSlots {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_JOB_SLOTS }
  const o = raw as Record<string, unknown>
  const str = (key: keyof JobThemeSlots) =>
    typeof o[key] === 'string' ? (o[key] as string) : EMPTY_JOB_SLOTS[key]
  return {
    headline: str('headline'),
    company: str('company'),
    location: str('location'),
    employmentType: str('employmentType'),
    salary: str('salary'),
    tags: str('tags'),
    requirements: str('requirements'),
    benefits: str('benefits'),
    applyLabel: str('applyLabel') || 'Apply Now',
    applyUrl: str('applyUrl'),
    heroImageUrl: str('heroImageUrl'),
    summary: str('summary'),
  }
}

export {
  EMPTY_JOB_SLOTS,
  isJobThemeSlug,
  type JobThemeSlug,
  type JobThemeSlots,
  type JobThemeDefinition,
}
