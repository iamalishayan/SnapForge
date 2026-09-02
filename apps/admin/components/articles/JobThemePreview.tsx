'use client'

import { useMemo } from 'react'
import { compileJobTheme, type JobThemeSlots, type JobThemeSlug } from '@/lib/job-themes'

interface JobThemePreviewProps {
  themeSlug: JobThemeSlug
  slots: JobThemeSlots
}

export default function JobThemePreview({ themeSlug, slots }: JobThemePreviewProps) {
  const srcDoc = useMemo(() => {
    const compiled = compileJobTheme(themeSlug, slots)
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>${compiled.article_css}</style>
</head><body style="margin:0;background:#fff;">${compiled.content}</body></html>`
  }, [themeSlug, slots])

  return (
    <div className="rounded-xl border overflow-hidden bg-white shadow-sm">
      <div className="px-4 py-2 border-b bg-muted/40 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Live preview
      </div>
      <iframe
        title="Job theme preview"
        srcDoc={srcDoc}
        className="w-full h-[520px] bg-white"
        sandbox=""
      />
    </div>
  )
}
