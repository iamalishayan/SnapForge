import { headers } from 'next/headers'
import { SiteHeader } from '../../components/SiteHeader'
import { SiteFooter } from '../../components/SiteFooter'
import { FloatingOrbs } from '../../components/FloatingOrbs'
import { resolveSiteFromHost } from '../lib/request-domain'

/**
 * Marketing/home chrome — shared SaaS shell for every site config.
 */
export default async function ChromeLayout({ children }: { children: React.ReactNode }) {
  const resolved = await resolveSiteFromHost(headers().get('host'))
  const domain = resolved?.domain || hostDomainFallback(headers().get('host'))

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden sites-atmosphere-dark text-slate-50">
      <FloatingOrbs isDark />
      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteHeader domain={domain} isDark />
        <div className="flex-1">{children}</div>
        <SiteFooter domain={domain} isDark />
      </div>
    </div>
  )
}

function hostDomainFallback(host: string | null): string {
  return (host || '').split(':')[0]
}
