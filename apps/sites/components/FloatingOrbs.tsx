/**
 * Soft floating color orbs for SaaS-style atmosphere.
 * Opacity-based depth — no hard glow rings.
 */
export function FloatingOrbs({ isDark }: { isDark: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className={`orb animate-float left-[-8%] top-[8%] h-[280px] w-[280px] sm:h-[380px] sm:w-[380px] ${
          isDark ? 'bg-sky/30' : 'bg-sky/25'
        }`}
      />
      <div
        className={`orb animate-float-slow right-[-6%] top-[18%] h-[240px] w-[240px] sm:h-[320px] sm:w-[320px] ${
          isDark ? 'bg-coral/25' : 'bg-coral/20'
        }`}
        style={{ animationDelay: '-3s' }}
      />
      <div
        className={`orb animate-float bottom-[8%] left-[28%] h-[200px] w-[200px] sm:h-[260px] sm:w-[260px] ${
          isDark ? 'bg-sky-soft/20' : 'bg-sky-soft/30'
        }`}
        style={{ animationDelay: '-6s' }}
      />
    </div>
  )
}
