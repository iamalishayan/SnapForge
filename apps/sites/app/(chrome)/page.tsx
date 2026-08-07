import { headers } from 'next/headers'
import { DbService } from '@snapforge/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArticleCard } from '../../components/ArticleCard'
import { resolveSiteFromHost } from '../lib/request-domain'

export async function generateMetadata(): Promise<Metadata> {
  const resolved = await resolveSiteFromHost(headers().get('host'))
  const domain = resolved?.domain || (headers().get('host') || '').split(':')[0]
  return {
    title: `${domain} — Latest Articles`,
    description: `Read the latest articles and guides on ${domain}.`,
  }
}

export default async function HomePage() {
  const resolved = await resolveSiteFromHost(headers().get('host'))
  if (!resolved?.siteConfig?.active) {
    return notFound()
  }

  const { domain } = resolved
  const articles = await DbService.getPublishedArticlesForDomain(domain, 100)

  return (
    <main className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16">
      <section className="relative mb-12 max-w-3xl animate-fade-up sm:mb-16">
        <div className="mb-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-soft">
          <span className="h-1.5 w-1.5 rounded-sm bg-coral" aria-hidden />
          Editorial index
        </div>

        <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
          Welcome to <span className="text-gradient-saas">{domain}</span>
        </h1>

        <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
          Explore our latest guides and articles below — crafted for clarity,
          speed, and discovery.
        </p>

        <div className="mt-8 h-px w-24 bg-gradient-to-r from-sky via-coral to-transparent opacity-80" />
      </section>

      {articles.length === 0 ? (
        <div className="glass-panel-dark rounded-2xl px-6 py-16 text-center">
          <p className="text-slate-400">No articles published yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:gap-7">
          {articles.map((article, index) => {
            const title =
              (article as any).translated_meta_title ||
              (article as any).translated_title ||
              (article as any).articles?.slug ||
              'Untitled'
            const href = `/${(article as any).articles?.templates?.slug}/${(article as any).articles?.slug}`

            return (
              <ArticleCard
                key={article.id}
                href={href}
                title={title}
                description={article.translated_meta_description}
                isDark
                index={index}
              />
            )
          })}
        </div>
      )}
    </main>
  )
}
