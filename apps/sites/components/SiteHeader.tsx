import Link from 'next/link'

interface SiteHeaderProps {
  domain: string
  isDark: boolean
}

export function SiteHeader({ domain, isDark }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 px-4 pt-5 sm:px-6">
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-5 py-3.5 sm:px-7 ${
          isDark ? 'glass-panel-dark' : 'glass-panel'
        }`}
      >
        <Link
          href="/"
          className={`font-display text-lg font-semibold tracking-tight sm:text-xl ${
            isDark ? 'text-white' : 'text-ink'
          }`}
        >
          {domain}
          <span className="text-gradient-saas">.</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-1.5">
          {[
            { href: '/', label: 'Home' },
            { href: '/sitemap.xml', label: 'Sitemap' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                  : 'text-ink-muted hover:bg-sky/10 hover:text-ink'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
