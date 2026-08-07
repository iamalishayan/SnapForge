import { headers } from 'next/headers'
import { DbService } from '@snapforge/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const host = headers().get('host') || ''
  const domain = host
  return {
    title: `${domain.toUpperCase()} - Latest Articles`,
    description: `Read the latest articles and guides on ${domain}.`,
  }
}

export default async function HomePage() {
  const host = headers().get('host') || ''
  const domain = host

  const [siteConfig, articles] = await Promise.all([
    DbService.getSiteConfigByDomain(domain),
    DbService.getPublishedArticlesForDomain(domain, 100) // Fetch latest 100
  ])

  if (!siteConfig || !siteConfig.active) {
    return notFound()
  }

  const isDark = siteConfig.theme_name !== 'light'

  return (
    <main className="container mx-auto p-8 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
          Welcome to {domain}
        </h1>
        <p className={`text-xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Explore our latest guides and articles below.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {articles.length === 0 ? (
          <p className="col-span-2 text-center py-12 opacity-50">No articles published yet.</p>
        ) : (
          articles.map((article) => (
            <a 
              key={article.id} 
              href={`/${(article as any).articles?.templates?.slug}/${(article as any).articles?.slug}`}
              className={`block p-6 rounded-xl border transition-colors hover:border-primary ${
                isDark 
                  ? 'bg-slate-900/50 border-slate-800 hover:bg-slate-900' 
                  : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-sm'
              }`}
            >
              <h2 className="text-xl font-bold mb-2 line-clamp-2">
                {(article as any).translated_meta_title || (article as any).translated_title || (article as any).articles?.slug}
              </h2>
              {article.translated_meta_description && (
                <p className={`line-clamp-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {article.translated_meta_description}
                </p>
              )}
              <div className="mt-4 text-xs font-medium text-primary uppercase tracking-wider">
                Read More →
              </div>
            </a>
          ))
        )}
      </div>
    </main>
  )
}
