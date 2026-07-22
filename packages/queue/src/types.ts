export interface TranslationJobPayload {
  articleId: string
  siteConfigId: string
  targetLanguage: string
  countryCode: string
  primaryKeyword?: string
  secondaryKeywords: string[]
}

export interface RevalidationJobPayload {
  domain: string
  templateSlug: string
}


