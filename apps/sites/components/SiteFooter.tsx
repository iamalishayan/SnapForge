interface SiteFooterProps {
  domain: string
  isDark: boolean
}

export function SiteFooter({ domain, isDark }: SiteFooterProps) {
  return (
    <footer className="mt-auto px-4 pb-8 pt-14 sm:px-6">
      <div
        className={`mx-auto max-w-6xl rounded-2xl px-5 py-6 sm:px-8 ${
          isDark ? 'glass-panel-dark' : 'glass-panel'
        }`}
      >
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-ink-muted'}`}>
            © {new Date().getFullYear()} {domain}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <a
              href="#"
              className={
                isDark
                  ? 'text-slate-400 transition-colors hover:text-sky-soft'
                  : 'text-ink-muted transition-colors hover:text-sky-deep'
              }
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className={
                isDark
                  ? 'text-slate-400 transition-colors hover:text-sky-soft'
                  : 'text-ink-muted transition-colors hover:text-sky-deep'
              }
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
