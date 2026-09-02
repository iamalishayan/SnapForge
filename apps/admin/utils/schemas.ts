import { z } from 'zod'
import { emptyToNull } from './normalize-seo'
import { ARTICLE_STATUSES } from '../lib/article-status'

// Shared schemas
const uuidSchema = z.string().uuid()

const optionalSeoText = (max: number) =>
  z.preprocess(
    (val) => (val === undefined ? undefined : emptyToNull(val as string | null | undefined)),
    z.string().max(max).nullable().optional()
  )

const optionalSeoUrl = z.preprocess(
  (val) => (val === undefined ? undefined : emptyToNull(val as string | null | undefined)),
  z.union([z.string().url(), z.null()]).optional()
)

export const TranslateRequestSchema = z.object({
  articleId: uuidSchema,
  siteConfigIds: z.array(uuidSchema).optional(),
  targetLanguage: z.string().min(2).max(10).optional(),
  countryCode: z.string().length(2).optional(),
  primaryKeyword: z.string().max(100).optional(),
  secondaryKeywords: z.array(z.string().max(100)).optional(),
  force: z.boolean().default(false)
})

const JobSlotsSchema = z
  .object({
    headline: z.string().optional(),
    company: z.string().optional(),
    location: z.string().optional(),
    employmentType: z.string().optional(),
    salary: z.string().optional(),
    tags: z.string().optional(),
    requirements: z.string().optional(),
    benefits: z.string().optional(),
    applyLabel: z.string().optional(),
    applyUrl: z.string().optional(),
    heroImageUrl: z.string().optional(),
    summary: z.string().optional(),
  })
  .nullable()
  .optional()

export const ArticleCreateSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1, 'Content is required'),
  template_id: uuidSchema,
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens')
    .optional(),
  meta_title: optionalSeoText(255),
  meta_description: optionalSeoText(500),
  og_image_url: optionalSeoUrl,
  article_css: z.string().nullable().optional(),
  visual_theme: z
    .enum(['job-corporate', 'job-startup'])
    .nullable()
    .optional(),
  job_slots: JobSlotsSchema,
  status: z.enum(ARTICLE_STATUSES).optional().default('draft'),
  priority: z.enum(['high', 'normal', 'low']).optional(),
})

export const ArticleUpdateSchema = ArticleCreateSchema.partial().refine(
  (data) => data.template_id !== null,
  { message: 'template_id cannot be cleared once set', path: ['template_id'] }
)

const optionalSiteText = z.preprocess(
  (val) => emptyToNull(val as string | null | undefined),
  z.string().nullable().optional()
)

const optionalSiteUrl = z.preprocess(
  (val) => emptyToNull(val as string | null | undefined),
  z.union([z.string().url(), z.null()]).optional()
)

export const SiteCreateSchema = z.object({
  domain: z.string().min(1).max(255),
  language_code: z.string().min(2).max(10).default('en'),
  country_code: z
    .string()
    .length(2, 'Country code must be a 2-letter ISO code')
    .transform((v) => v.toUpperCase()),
  active: z.boolean().default(true),
  theme_name: z.preprocess(
    (val) => emptyToNull(val as string | null | undefined),
    z.enum(['light', 'dark']).nullable().optional().default('dark')
  ),
  adsense_publisher_id: optionalSiteText,
  adsense_slot_id: optionalSiteText,
  monetization_type: z.enum(['adsense', 'affiliate', 'own_service', 'mixed']).optional(),
  indexnow_key: optionalSiteText,
  sitemap_url: optionalSiteUrl,
})

export const SiteUpdateSchema = SiteCreateSchema.partial()

export const TemplateCreateSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  category: z.string().max(100).optional(),
  gemini_prompt: z.string().optional(),
  meta_title: z.string().max(255).optional(),
  meta_description: z.string().max(500).optional(),
  active: z.boolean().default(true)
})

export const TemplateUpdateSchema = TemplateCreateSchema.partial()

export const TranslationUpdateSchema = z
  .object({
    translated_title: z.string().min(1).max(500).optional(),
    translated_content: z.string().min(1, 'Content is required').optional(),
    translated_meta_title: optionalSeoText(255),
    translated_meta_description: optionalSeoText(500),
    translated_faq: z
      .array(
        z.object({
          question: z.string().min(1),
          answer: z.string().min(1),
        })
      )
      .optional(),
  })
  .refine(
    (data) =>
      data.translated_title !== undefined ||
      data.translated_content !== undefined ||
      data.translated_meta_title !== undefined ||
      data.translated_meta_description !== undefined ||
      data.translated_faq !== undefined,
    { message: 'At least one translation field is required' }
  )

export const QAApproveSchema = z.object({
  translationId: uuidSchema,
  domain: z.string().min(1),
  templateSlug: z.string().min(1).optional(),
  reviewerNotes: z.string().max(1000).optional(),
})

export const QAFlagSchema = z.object({
  translationId: uuidSchema,
  reviewerNotes: z.string().min(1, 'Reviewer notes are required when flagging').max(1000)
})

export const QARetrySchema = z.object({
  translationId: uuidSchema
})

export const PublishKillSchema = z.object({
  translationId: uuidSchema,
  domain: z.string().min(1),
  templateSlug: z.string().min(1),
  reason: z.string().max(1000).optional()
})
