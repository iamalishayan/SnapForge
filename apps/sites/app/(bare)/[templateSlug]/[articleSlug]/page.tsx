import { headers } from 'next/headers'
import { DbService } from '@snapforge/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Script from 'next/script'

type Props = {
  params: { templateSlug: string; articleSlug: string }
}

function SiteChrome({
  domain,
  isDark,
  children,
}: {
  domain: string
  isDark: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={`min-h-screen flex flex-col ${
        isDark ? 'bg-slate-950 text-slate-50' : 'bg-white text-slate-900'
      }`}
    >
      <header
        className={`border-b ${
          isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50/50'
        }`}
      >
        <div className="container mx-auto px-8 py-4 flex items-center justify-between">
          <a href="/" className="font-bold text-xl tracking-tight">
            {domain.toUpperCase()}
          </a>
          <nav className="hidden sm:flex gap-6 text-sm font-medium">
            <a href="/" className="hover:underline">
              Home
            </a>
            <a href="/sitemap.xml" className="hover:underline">
              Sitemap
            </a>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer
        className={`border-t py-8 mt-12 ${
          isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50/50'
        }`}
      >
        <div className="container mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm opacity-70">
            © {new Date().getFullYear()} {domain}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const host = headers().get('host') || ''
  const domain = host

  const translation = await DbService.getPublishedTranslation(
    domain,
    params.templateSlug,
    params.articleSlug
  )

  if (!translation) return {}

  return {
    title: translation.translated_meta_title || translation.translated_title,
    description: translation.translated_meta_description || undefined,
    openGraph: {
      title: translation.translated_meta_title || translation.translated_title,
      description: translation.translated_meta_description || undefined,
      type: 'article',
      url: `https://${domain}/${params.templateSlug}/${params.articleSlug}`,
    },
    alternates: {
      canonical: `https://${domain}/${params.templateSlug}/${params.articleSlug}`,
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const host = headers().get('host') || ''
  const domain = host

  const [translation, siteConfig] = await Promise.all([
    DbService.getPublishedTranslation(domain, params.templateSlug, params.articleSlug),
    DbService.getSiteConfigByDomain(domain),
  ])

  if (!translation || !siteConfig || !siteConfig.active) {
    return notFound()
  }

  let faqSchema = null
  if (translation.translated_faq && typeof translation.translated_faq === 'object') {
    const rawFaq: any = translation.translated_faq
    if (Array.isArray(rawFaq)) {
      faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: rawFaq.map((item) => ({
          '@type': 'Question',
          name: item.question || item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer || item.a,
          },
        })),
      }
    }
  }

  const articleCss = (translation as any).articles?.article_css as string | null | undefined
  const isDark = siteConfig.theme_name !== 'light'
  const hasCustomCss = Boolean(articleCss)

  const body = (
    <>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {siteConfig.adsense_publisher_id && (
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.adsense_publisher_id}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}

      {articleCss && <style dangerouslySetInnerHTML={{ __html: articleCss }} />}

      {hasCustomCss ? (
        <div dangerouslySetInnerHTML={{ __html: translation.translated_content || '' }} />
      ) : (
        <div className={isDark ? 'dark bg-slate-950 text-slate-50' : 'bg-white text-slate-900'}>
          <main
            className={`container mx-auto p-8 max-w-4xl prose lg:prose-xl min-h-screen ${
              isDark ? 'prose-invert' : ''
            }`}
          >
            <div dangerouslySetInnerHTML={{ __html: translation.translated_content || '' }} />
          </main>
        </div>
      )}
    </>
  )

  // Custom-CSS landings own their chrome — skip SnapForge header/footer to avoid
  // unscoped nav/footer selectors restyling site chrome.
  if (hasCustomCss) {
    return body
  }

  return (
    <SiteChrome domain={domain} isDark={isDark}>
      {body}
    </SiteChrome>
  )
}
