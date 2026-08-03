import { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { DbService } from '@snapforge/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = headers().get('host') || ''
  const domain = host.split(':')[0]

  const translations = await DbService.getPublishedArticlesForDomain(domain, 50000) // Next.js sitemap limit is 50,000

  return translations.map((t: any) => ({
    url: `https://${domain}/${t.articles?.templates?.slug}/${t.articles?.slug}`,
    lastModified: t.updated_at,
    changeFrequency: 'daily',
    priority: 0.8,
  }))
}
