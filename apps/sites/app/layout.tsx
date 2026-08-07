import { headers } from 'next/headers'
import { DbService } from '@snapforge/db'
import './globals.css'

/**
 * Root layout — html/lang/body only.
 * Site chrome lives in (chrome); custom-CSS articles use (bare).
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const host = headers().get('host') || ''
  const domain = host.split(':')[0]
  const siteConfig = await DbService.getSiteConfigByDomain(domain)
  const lang = siteConfig?.language_code || 'en'

  return (
    <html lang={lang}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
