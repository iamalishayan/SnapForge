/** Source-article lifecycle — distinct from translations.status pipeline. */
export const ARTICLE_STATUSES = ['draft', 'ready'] as const
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number]

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: 'Draft',
  ready: 'Ready for Translation',
}

export function isArticleStatus(value: string): value is ArticleStatus {
  return ARTICLE_STATUSES.includes(value as ArticleStatus)
}
