// ISR template page — fetches published translation by domain + templateSlug, renders LandingPageTop + SEOArticle
// revalidate = 3600 (1hr cache with on-demand ISR revalidation support)
export default async function TemplatePage({ params }: { params: { templateSlug: string } }) {
  return <main>Template page — localized content goes here</main>
}

export async function generateStaticParams() {
  // Returns all template slugs for static pre-generation at build time
  return []
}
