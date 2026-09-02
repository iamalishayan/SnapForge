/** Parse imported HTML into article form fields. */
export function parseImportedHtml(htmlString: string): {
  title: string
  content: string
  metaTitle: string
  metaDescription: string
  ogImageUrl: string
  articleCss: string
} {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlString, 'text/html')
  const styles = Array.from(doc.querySelectorAll('style'))
    .map((s) => s.textContent?.trim())
    .filter(Boolean) as string[]
  const fontImports = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
    .map((link) => link.getAttribute('href') || '')
    .filter((href) => /fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(href))
    .map((href) => `@import url('${href}');`)

  return {
    title: doc.querySelector('title')?.textContent || doc.querySelector('h1')?.textContent || '',
    content: doc.querySelector('body')?.innerHTML || htmlString,
    metaTitle:
      doc.querySelector('title')?.textContent ||
      doc.querySelector('meta[name="title"]')?.getAttribute('content') ||
      doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      '',
    metaDescription:
      doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      '',
    ogImageUrl: doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
    articleCss: [...fontImports, ...styles].join('\n'),
  }
}
