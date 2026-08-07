interface ArticleCardProps {
  href: string
  title: string
  description?: string | null
  isDark: boolean
  index: number
}

export function ArticleCard({
  href,
  title,
  description,
  isDark,
  index,
}: ArticleCardProps) {
  const floatDelay = `${(index % 3) * 0.7}s`

  return (
    <a
      href={href}
      className={`group relative block overflow-hidden rounded-2xl p-6 sm:p-8 animate-fade-up ${
        isDark ? 'glass-card-dark' : 'glass-card'
      }`}
      style={{
        animationDelay: `${Math.min(index, 8) * 80}ms`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-sky/15 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden
      />
      <div
        className="animate-float-card"
        style={{ animationDelay: floatDelay }}
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="h-1 w-12 rounded-sm bg-gradient-to-r from-sky via-sky-soft to-coral transition-all duration-300 group-hover:w-20" />
          <span
            className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
              isDark ? 'text-slate-500' : 'text-ink-muted'
            }`}
          >
            Article
          </span>
        </div>

        <h2 className="font-display text-lg font-semibold leading-snug tracking-tight text-white transition-colors duration-300 sm:text-xl group-hover:text-sky-soft">
          {title}
        </h2>

        {description ? (
          <p
            className={`mt-3 line-clamp-3 text-sm leading-relaxed ${
              isDark ? 'text-slate-400' : 'text-ink-muted'
            }`}
          >
            {description}
          </p>
        ) : null}

        <span
          className={`mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] ${
            isDark ? 'text-sky-soft' : 'text-sky-deep'
          }`}
        >
          Read more
          <span
            aria-hidden
            className="inline-block transition-transform duration-300 group-hover:translate-x-1.5"
          >
            →
          </span>
        </span>
      </div>
    </a>
  )
}
