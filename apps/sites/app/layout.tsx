import { headers } from 'next/headers'
import { DbService } from '@snapforge/db'
import './globals.css'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const host = headers().get('host') || ''
  const domain = host.split(':')[0]

  const siteConfig = await DbService.getSiteConfigByDomain(domain)
  
  // Default values
  const lang = siteConfig?.language_code || 'en'
  const isDark = siteConfig?.theme_name !== 'light'

  return (
    <html lang={lang} className={isDark ? 'dark' : ''}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`min-h-screen flex flex-col ${isDark ? 'bg-slate-950 text-slate-50' : 'bg-white text-slate-900'}`}>
        <header className={`border-b ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50/50'}`}>
          <div className="container mx-auto px-8 py-4 flex items-center justify-between">
            <a href="/" className="font-bold text-xl tracking-tight">
              {domain.toUpperCase()}
            </a>
            <nav className="hidden sm:flex gap-6 text-sm font-medium">
              <a href="/" className="hover:underline">Home</a>
              <a href="/sitemap.xml" className="hover:underline">Sitemap</a>
            </nav>
          </div>
        </header>

        <div className="flex-1">
          {children}
        </div>

        <footer className={`border-t py-8 mt-12 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50/50'}`}>
          <div className="container mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm opacity-70">© {new Date().getFullYear()} {domain}. All rights reserved.</p>
            <div className="flex gap-4 text-sm opacity-70">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Terms of Service</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
