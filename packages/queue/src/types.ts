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


