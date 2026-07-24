import { z } from 'zod'

// Shared schemas
const uuidSchema = z.string().uuid()

export const TranslateRequestSchema = z.object({
  articleId: uuidSchema,
  siteConfigId: uuidSchema.optional(),
  targetLanguage: z.string().min(2).max(10).optional(),
  countryCode: z.string().length(2).optional(),
  primaryKeyword: z.string().max(100).optional(),
  secondaryKeywords: z.array(z.string().max(100)).optional(),
  force: z.boolean().default(false)
})

export const ArticleCreateSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  content: z.string().optional(),
  category: z.string().max(100).optional(),
  author: z.string().max(100).optional(),
  template_id: uuidSchema.optional(),
  meta_title: z.string().max(255).optional(),
  meta_description: z.string().max(500).optional(),
  og_image_url: z.string().url().optional(),
  inner_links: z.any().optional(),
  outer_links: z.any().optional(),
  target_keywords: z.array(z.string()).optional()
})

export const ArticleUpdateSchema = ArticleCreateSchema.partial()

export const SiteCreateSchema = z.object({
  domain: z.string().min(1).max(255),
  site_name: z.string().min(1).max(255),
  language_code: z.string().min(2).max(10).default('en'),
  country_code: z.string().length(2).optional(),
  active: z.boolean().default(true)
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

export const QAApproveSchema = z.object({
  translationId: uuidSchema,
  domain: z.string().min(1),
  templateSlug: z.string().min(1),
  reviewerNotes: z.string().max(1000).optional()
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
