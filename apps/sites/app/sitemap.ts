import { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { DbService } from '@snapforge/db'
import { resolveSiteFromHost } from './lib/request-domain'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const resolved = await resolveSiteFromHost(headers().get('host'))
  if (!resolved) return []

  const { domain } = resolved
  const translations = await DbService.getPublishedArticlesForDomain(domain, 50000)

  return translations.map((t: any) => ({
    url: `https://${domain}/${t.articles?.templates?.slug}/${t.articles?.slug}`,
    lastModified: t.updated_at,
    changeFrequency: 'daily',
    priority: 0.8,
  }))
}
