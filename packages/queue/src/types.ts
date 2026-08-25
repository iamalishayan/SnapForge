export interface TranslationJobPayload {
  articleId: string
  siteConfigId: string
  targetLanguage: string
  countryCode: string
  requestId?: string
}

export interface RevalidationJobPayload {
  domain: string
  templateSlug: string
  articleSlug: string
  requestId?: string
}

export interface ImageTranslationJobPayload {
  translationId: string
  requestId?: string
  /** When true, skip stale PNG cache and re-rasterize with current fonts. */
  forceRefresh?: boolean
}


