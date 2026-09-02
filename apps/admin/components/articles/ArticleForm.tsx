'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchApi } from '@/lib/api'
import { toast } from 'sonner'
import ExtractedLinksPreview from '@/components/articles/ExtractedLinksPreview'
import JobThemeComposer from '@/components/articles/JobThemeComposer'
import AdvancedContentEditor from '@/components/articles/AdvancedContentEditor'
import ArticleFormSidebar, { ArticleFormHeader } from '@/components/articles/ArticleFormChrome'
import { useTemplates } from '@/lib/hooks/use-data'
import type { ArticleStatus } from '@/lib/article-status'
import TranslateDialog from '@/components/articles/TranslateDialog'
import {
  compileJobTheme,
  isJobThemeSlug,
  parseJobSlotsFromUnknown,
  type JobThemeSlots,
  type JobThemeSlug,
} from '@/lib/job-themes'
import { parseImportedHtml } from '@/lib/parse-imported-html'

interface ArticleFormProps {
  mode: 'create' | 'edit'
  articleId?: string
  initialData?: {
    title?: string
    content?: string
    template_id?: string | null
    slug?: string
    status?: string
    priority?: string
    meta_title?: string | null
    meta_description?: string | null
    og_image_url?: string | null
    article_css?: string | null
    visual_theme?: string | null
    job_slots?: unknown
  }
}

type ComposerMode = 'job-theme' | 'advanced'

function initialSlots(data?: ArticleFormProps['initialData']): JobThemeSlots {
  const parsed = parseJobSlotsFromUnknown(data?.job_slots)
  if (!parsed.headline && data?.title) parsed.headline = data.title
  return parsed
}

export default function ArticleForm({ mode, articleId, initialData }: ArticleFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initialTheme = isJobThemeSlug(initialData?.visual_theme)
    ? initialData!.visual_theme!
    : 'job-corporate'
  const [composerMode, setComposerMode] = useState<ComposerMode>(() =>
    mode === 'edit' && !isJobThemeSlug(initialData?.visual_theme) ? 'advanced' : 'job-theme'
  )
  const [themeSlug, setThemeSlug] = useState<JobThemeSlug>(initialTheme)
  const [jobSlots, setJobSlots] = useState<JobThemeSlots>(() => initialSlots(initialData))
  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [templateId, setTemplateId] = useState(initialData?.template_id || '')
  const [status, setStatus] = useState<ArticleStatus>(
    initialData?.status === 'ready' ? 'ready' : 'draft'
  )
  const [priority, setPriority] = useState(initialData?.priority || 'normal')
  const [metaTitle, setMetaTitle] = useState(initialData?.meta_title || '')
  const [metaDescription, setMetaDescription] = useState(initialData?.meta_description || '')
  const [ogImageUrl, setOgImageUrl] = useState(initialData?.og_image_url || '')
  const [articleCss, setArticleCss] = useState(initialData?.article_css || '')
  const [isCodeMode, setIsCodeMode] = useState(false)
  const { data: templatesData, isError: templatesError } = useTemplates()
  const templates = templatesData?.data || []
  const [loading, setLoading] = useState(false)
  const [translateArticleId, setTranslateArticleId] = useState<string | null>(null)

  useEffect(() => {
    if (templatesError) toast.error('Failed to load templates')
  }, [templatesError])

  const handleSlotsChange = (slots: JobThemeSlots) => {
    setJobSlots(slots)
    if (slots.headline.trim()) setTitle(slots.headline.trim())
  }

  const handleImportHtml = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const parsed = parseImportedHtml(event.target?.result as string)
      setTitle(parsed.title)
      setContent(parsed.content)
      setMetaTitle(parsed.metaTitle)
      setMetaDescription(parsed.metaDescription)
      setOgImageUrl(parsed.ogImageUrl)
      if (parsed.articleCss) setArticleCss(parsed.articleCss)
      setComposerMode('advanced')
      setIsCodeMode(true)
      toast.success('HTML imported — advanced editor mode.')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsText(file)
  }

  const buildPayload = (statusOverride: ArticleStatus) => {
    if (composerMode === 'job-theme') {
      const compiled = compileJobTheme(themeSlug, jobSlots)
      return {
        title: compiled.title,
        ...(slug.trim() ? { slug: slug.trim() } : {}),
        content: compiled.content,
        template_id: templateId,
        status: statusOverride,
        priority,
        meta_title: metaTitle,
        meta_description: metaDescription,
        og_image_url: ogImageUrl || jobSlots.heroImageUrl || null,
        article_css: compiled.article_css,
        visual_theme: compiled.visual_theme,
        job_slots: jobSlots,
      }
    }
    return {
      title,
      ...(slug.trim() ? { slug: slug.trim() } : {}),
      content,
      template_id: templateId,
      status: statusOverride,
      priority,
      meta_title: metaTitle,
      meta_description: metaDescription,
      og_image_url: ogImageUrl,
      article_css: articleCss || null,
      visual_theme: null,
      job_slots: null,
    }
  }

  const validateForm = () => {
    if (!templateId) {
      toast.error('A template is required.')
      return false
    }
    if (composerMode === 'job-theme') {
      if (!jobSlots.headline.trim()) {
        toast.error('Headline is required.')
        return false
      }
      return true
    }
    if (!title || !content) {
      toast.error('Title and Content are required.')
      return false
    }
    return true
  }

  const persistArticle = async (statusOverride: ArticleStatus): Promise<string> => {
    const payload = buildPayload(statusOverride)
    if (mode === 'create') {
      const res = await fetchApi<{ data: { id: string } }>('/articles', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      return res.data.id
    }
    await fetchApi(`/articles/${articleId}`, { method: 'PATCH', body: JSON.stringify(payload) })
    return articleId!
  }

  const handleSaveDraft = async () => {
    if (!validateForm()) return
    setLoading(true)
    try {
      await persistArticle('draft')
      setStatus('draft')
      toast.success(mode === 'create' ? 'Article saved as draft.' : 'Draft saved.')
      router.push('/admin/articles')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save article')
    } finally {
      setLoading(false)
    }
  }

  const handleSendToTranslation = async () => {
    if (!validateForm()) return
    setLoading(true)
    try {
      const id = await persistArticle('ready')
      setStatus('ready')
      setTranslateArticleId(id)
    } catch (err: any) {
      toast.error(err.message || 'Failed to prepare article for translation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col bg-background">
      {translateArticleId && (
        <TranslateDialog
          articleId={translateArticleId}
          onClose={() => setTranslateArticleId(null)}
          onSuccess={() => {
            setTranslateArticleId(null)
            router.push('/admin/articles')
          }}
        />
      )}
      <ArticleFormHeader
        pageLabel={mode === 'create' ? 'New' : 'Edit'}
        heading={mode === 'create' ? 'Create Article' : 'Edit Article'}
        loading={loading}
        fileInputRef={fileInputRef}
        onImportClick={() => fileInputRef.current?.click()}
        onImportHtml={handleImportHtml}
        onSaveDraft={handleSaveDraft}
        onSendToTranslation={handleSendToTranslation}
      />

      <div className="flex-1">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {composerMode === 'job-theme' ? (
              <JobThemeComposer
                themeSlug={themeSlug}
                slots={jobSlots}
                onThemeChange={setThemeSlug}
                onSlotsChange={handleSlotsChange}
                onSwitchToAdvanced={() => setComposerMode('advanced')}
              />
            ) : (
              <AdvancedContentEditor
                title={title}
                onTitleChange={setTitle}
                content={content}
                onContentChange={setContent}
                isCodeMode={isCodeMode}
                onToggleCodeMode={() => setIsCodeMode(!isCodeMode)}
                onSwitchToTheme={() => setComposerMode('job-theme')}
              />
            )}
            {composerMode === 'advanced' && <ExtractedLinksPreview content={content} />}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                URL Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-background border px-4 py-3 rounded font-mono text-sm"
                placeholder="auto-generated-from-title"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Public path: /{'{template}'}/{'{slug}'}. Leave blank to auto-generate on save.
              </p>
            </div>
          </div>
          <ArticleFormSidebar
            templateId={templateId}
            onTemplateIdChange={setTemplateId}
            templates={templates}
            status={status}
            onStatusChange={setStatus}
            priority={priority}
            onPriorityChange={setPriority}
            metaTitle={metaTitle}
            onMetaTitleChange={setMetaTitle}
            metaDescription={metaDescription}
            onMetaDescriptionChange={setMetaDescription}
            ogImageUrl={ogImageUrl}
            onOgImageUrlChange={setOgImageUrl}
          />
        </div>
      </div>
    </div>
  )
}
