import { headers } from 'next/headers'
import { Instrument_Sans, Fraunces } from 'next/font/google'
import { resolveSiteFromHost } from './lib/request-domain'
import './globals.css'

const sitesSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sites',
  display: 'swap',
})

const sitesDisplay = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

/**
 * Root layout — html/lang/body + fonts.
 * Site chrome lives in (chrome); custom-CSS articles use (bare).
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const resolved = await resolveSiteFromHost(headers().get('host'))
  const lang = resolved?.siteConfig?.language_code || 'en'

  return (
    <html lang={lang} className={`${sitesSans.variable} ${sitesDisplay.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  )
}
