'use client'

import type { ChangeEvent, RefObject } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ARTICLE_STATUSES, ARTICLE_STATUS_LABELS, type ArticleStatus } from '@/lib/article-status'

interface TemplateOption {
  id: string
  name: string
}

interface ArticleFormSidebarProps {
  templateId: string
  onTemplateIdChange: (id: string) => void
  templates: TemplateOption[]
  status: ArticleStatus
  onStatusChange: (s: ArticleStatus) => void
  priority: string
  onPriorityChange: (p: string) => void
  metaTitle: string
  onMetaTitleChange: (v: string) => void
  metaDescription: string
  onMetaDescriptionChange: (v: string) => void
  ogImageUrl: string
  onOgImageUrlChange: (v: string) => void
}

export default function ArticleFormSidebar({
  templateId,
  onTemplateIdChange,
  templates,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  metaTitle,
  onMetaTitleChange,
  metaDescription,
  onMetaDescriptionChange,
  ogImageUrl,
  onOgImageUrlChange,
}: ArticleFormSidebarProps) {
  return (
    <div className="space-y-6">
      <section className="bg-card rounded-xl overflow-hidden border shadow-sm">
        <div className="px-6 py-4 border-b">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Target Template</h3>
        </div>
        <div className="p-6">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            Parent Blueprint *
          </label>
          <select
            className="w-full bg-background border px-4 py-3 rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={templateId}
            onChange={(e) => onTemplateIdChange(e.target.value)}
            required
          >
            <option value="">Select a template...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-2">
            Pipeline / URL template — separate from visual theme.
          </p>
        </div>
      </section>

      <section className="bg-card rounded-xl overflow-hidden border shadow-sm">
        <div className="px-6 py-4 border-b">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Configuration</h3>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Source Status
            </label>
            <select
              className="w-full bg-background border px-4 py-3 rounded"
              value={status}
              onChange={(e) => onStatusChange(e.target.value as ArticleStatus)}
            >
              {ARTICLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ARTICLE_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Translation Priority
            </label>
            <select
              className="w-full bg-background border px-4 py-3 rounded"
              value={priority}
              onChange={(e) => onPriorityChange(e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </section>

      <section className="bg-card rounded-xl overflow-hidden border shadow-sm">
        <div className="px-6 py-4 border-b">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary">SEO Metadata</h3>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Meta Title
              </label>
              <span
                className={`text-xs ${metaTitle.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}
              >
                {metaTitle.length}/60
              </span>
            </div>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => onMetaTitleChange(e.target.value)}
              className="w-full bg-background border px-4 py-2 rounded"
              placeholder="SEO title..."
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Meta Description
              </label>
              <span
                className={`text-xs ${
                  metaDescription.length > 160 ? 'text-destructive' : 'text-muted-foreground'
                }`}
              >
                {metaDescription.length}/160
              </span>
            </div>
            <textarea
              rows={4}
              value={metaDescription}
              onChange={(e) => onMetaDescriptionChange(e.target.value)}
              className="w-full bg-background border px-4 py-2 rounded resize-none"
              placeholder="Search snippet summary..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              OG Image URL
            </label>
            <input
              type="url"
              value={ogImageUrl}
              onChange={(e) => onOgImageUrlChange(e.target.value)}
              className="w-full bg-background border px-4 py-2 rounded"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>
      </section>
    </div>
  )
}

interface ArticleFormHeaderProps {
  pageLabel: string
  heading: string
  loading: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  onImportClick: () => void
  onImportHtml: (e: ChangeEvent<HTMLInputElement>) => void
  onSaveDraft: () => void
  onSendToTranslation: () => void
}

export function ArticleFormHeader({
  pageLabel,
  heading,
  loading,
  fileInputRef,
  onImportClick,
  onImportHtml,
  onSaveDraft,
  onSendToTranslation,
}: ArticleFormHeaderProps) {
  return (
    <header className="sticky top-0 right-0 left-0 h-16 bg-background/80 backdrop-blur-md border-b flex items-center justify-between px-6 z-40 -mx-6 -mt-6 mb-6">
      <div className="flex flex-col">
        <nav className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
          <Link href="/admin" className="hover:text-primary transition-colors">
            Dashboard
          </Link>
          <span>&gt;</span>
          <Link href="/admin/articles" className="hover:text-primary transition-colors">
            Articles
          </Link>
          <span>&gt;</span>
          <span className="text-primary">{pageLabel}</span>
        </nav>
        <h2 className="text-xl text-primary font-bold">{heading}</h2>
      </div>
      <div className="flex items-center gap-4">
        <input
          type="file"
          accept=".html"
          ref={fileInputRef}
          className="hidden"
          onChange={onImportHtml}
        />
        <Button variant="outline" onClick={onImportClick} className="text-xs uppercase tracking-widest">
          Import HTML
        </Button>
        <div className="h-6 w-[1px] bg-border mx-2" />
        <Button variant="ghost" asChild className="text-xs uppercase tracking-widest">
          <Link href="/admin/articles">Cancel</Link>
        </Button>
        <Button
          variant="outline"
          onClick={onSaveDraft}
          disabled={loading}
          className="text-xs uppercase tracking-widest"
        >
          {loading ? 'Saving...' : 'Save Draft'}
        </Button>
        <Button
          onClick={onSendToTranslation}
          disabled={loading}
          className="text-xs uppercase tracking-widest font-bold"
        >
          {loading ? 'Queuing...' : 'Send to Translation'}
        </Button>
      </div>
    </header>
  )
}
