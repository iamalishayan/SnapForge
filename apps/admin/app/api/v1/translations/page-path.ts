import { DbService } from '@snapforge/db'

/** Resolves URL path segments for a translation's public page. */
export async function getTranslationPageSlugs(translationId: string) {
  const translation = await DbService.getTranslationById(translationId)
  const article = await DbService.getArticleById(translation.article_id)
  const templateSlug = (article as { templates?: { slug?: string } }).templates?.slug
  const articleSlug = (article as { slug?: string }).slug

  if (!templateSlug || !articleSlug) {
    throw new Error('Translation is missing template or article slug for revalidation.')
  }

  return { templateSlug, articleSlug, articleId: article.id }
}

export function buildPublicPagePath(templateSlug: string, articleSlug: string) {
  return `/${templateSlug}/${articleSlug}`
}

export function buildPublicPageUrl(domain: string, templateSlug: string, articleSlug: string) {
  const protocol = domain.includes('localhost') ? 'http' : 'https'
  return `${protocol}://${domain}${buildPublicPagePath(templateSlug, articleSlug)}`
}
