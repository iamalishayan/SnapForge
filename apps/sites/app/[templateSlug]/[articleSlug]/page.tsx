import { headers } from 'next/headers'
import { DbService } from '@snapforge/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Script from 'next/script'

type Props = {
  params: { templateSlug: string; articleSlug: string }
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
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
      canonical: `https://${domain}/${params.templateSlug}/${params.articleSlug}`
    }
  }
}

export default async function ArticlePage({ params }: Props) {
  const host = headers().get('host') || ''
  const domain = host

  const [translation, siteConfig] = await Promise.all([
    DbService.getPublishedTranslation(domain, params.templateSlug, params.articleSlug),
    DbService.getSiteConfigByDomain(domain)
  ])

  if (!translation || !siteConfig || !siteConfig.active) {
    return notFound()
  }

  // Parse FAQ for JSON-LD if available
  let faqSchema = null
  if (translation.translated_faq && typeof translation.translated_faq === 'object') {
    const rawFaq: any = translation.translated_faq
    if (Array.isArray(rawFaq)) {
      faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": rawFaq.map((item) => ({
          "@type": "Question",
          "name": item.question || item.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer || item.a
          }
        }))
      }
    }
  }

  // Default theme is dark if none specified
  const isDark = siteConfig.theme_name !== 'light'

  return (
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

      {/* Force theme via parent div */}
      <div className={isDark ? 'dark bg-slate-950 text-slate-50' : 'bg-white text-slate-900'}>
        <main className={`container mx-auto p-8 max-w-4xl prose lg:prose-xl min-h-screen ${isDark ? 'prose-invert' : ''}`}>
          <div dangerouslySetInnerHTML={{ __html: translation.translated_content || '' }} />
        </main>
      </div>
    </>
  )
}
