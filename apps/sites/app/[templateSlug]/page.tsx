import { headers } from 'next/headers'
import { DbService } from '@snapforge/db'
import { notFound } from 'next/navigation'

// ISR template page — fetches published translation by domain + templateSlug
// revalidate = 3600 (1hr cache with on-demand ISR revalidation support)
export default async function TemplatePage({ params }: { params: { templateSlug: string } }) {
  const host = headers().get('host') || ''
  
  // Clean port if needed, but in local testing it includes port (localhost:3001)
  const domain = host

  const translation = await DbService.getPublishedTranslation(domain, params.templateSlug)

  if (!translation) {
    return notFound()
  }

  return (
    <main className="container mx-auto p-8 max-w-4xl prose lg:prose-xl">
      <div dangerouslySetInnerHTML={{ __html: translation.translated_content }} />
    </main>
  )
}

export async function generateStaticParams() {
  // Returns all template slugs for static pre-generation at build time
  return []
}
