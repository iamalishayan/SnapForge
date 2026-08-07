"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import TipTapEditor from "@/components/editor/TipTapEditor";
import ExtractedLinksPreview from "@/components/articles/ExtractedLinksPreview";
import { Button } from "@/components/ui/button";
import { useTemplates } from "@/lib/hooks/use-data";
import { ARTICLE_STATUSES, ARTICLE_STATUS_LABELS, type ArticleStatus } from "@/lib/article-status";

interface ArticleFormProps {
  mode: "create" | "edit";
  articleId?: string;
  initialData?: {
    title?: string;
    content?: string;
    template_id?: string | null;
    slug?: string;
    status?: string;
    priority?: string;
    meta_title?: string | null;
    meta_description?: string | null;
    og_image_url?: string | null;
    article_css?: string | null;
  };
}

export default function ArticleForm({ mode, articleId, initialData }: ArticleFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [templateId, setTemplateId] = useState(initialData?.template_id || "");
  const [status, setStatus] = useState<ArticleStatus>(
    initialData?.status === "ready" ? "ready" : "draft"
  );
  const [priority, setPriority] = useState(initialData?.priority || "normal");
  const [metaTitle, setMetaTitle] = useState(initialData?.meta_title || "");
  const [metaDescription, setMetaDescription] = useState(initialData?.meta_description || "");
  const [ogImageUrl, setOgImageUrl] = useState(initialData?.og_image_url || "");
  const [articleCss, setArticleCss] = useState(initialData?.article_css || "");
  const [isCodeMode, setIsCodeMode] = useState(false);
  const { data: templatesData, isError: templatesError } = useTemplates();
  const templates = templatesData?.data || [];
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (templatesError) toast.error("Failed to load templates");
  }, [templatesError]);

  const handleImportHtml = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const htmlString = event.target?.result as string;
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, "text/html");

      // Extract Core Content
      setTitle(doc.querySelector("title")?.textContent || doc.querySelector("h1")?.textContent || "");
      setContent(doc.querySelector("body")?.innerHTML || htmlString);
      setIsCodeMode(true); // Automatically switch to code mode to preserve structure

      // Extract SEO Meta
      setMetaTitle(
        doc.querySelector('title')?.textContent ||
        doc.querySelector('meta[name="title"]')?.getAttribute("content") ||
        doc.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
        ""
      );
      setMetaDescription(
        doc.querySelector('meta[name="description"]')?.getAttribute("content") ||
        doc.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
        ""
      );
      setOgImageUrl(
        doc.querySelector('meta[property="og:image"]')?.getAttribute("content") || ""
      );

      // Extract CSS + Google Fonts; .reveal override applied server-side on save
      const styles = Array.from(doc.querySelectorAll('style'))
        .map((s) => s.textContent?.trim())
        .filter(Boolean) as string[];
      const fontImports = Array.from(
        doc.querySelectorAll('link[rel="stylesheet"]')
      )
        .map((link) => link.getAttribute('href') || '')
        .filter((href) => /fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(href))
        .map((href) => `@import url('${href}');`);
      const cssParts = [...fontImports, ...styles];
      if (cssParts.length > 0) {
        setArticleCss(cssParts.join('\n'));
      }

      toast.success("HTML imported successfully!");
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const buildPayload = (statusOverride: ArticleStatus) => ({
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
  });

  const validateForm = () => {
    if (!title || !content) {
      toast.error("Title and Content are required.");
      return false;
    }
    if (!templateId) {
      toast.error("A template is required.");
      return false;
    }
    return true;
  };

  const persistArticle = async (statusOverride: ArticleStatus): Promise<string> => {
    const payload = buildPayload(statusOverride);

    if (mode === "create") {
      const res = await fetchApi<{ data: { id: string } }>("/articles", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.data.id;
    }

    await fetchApi(`/articles/${articleId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return articleId!;
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await persistArticle("draft");
      setStatus("draft");
      toast.success(mode === "create" ? "Article saved as draft." : "Draft saved.");
      router.push("/admin/articles");
    } catch (err: any) {
      toast.error(err.message || "Failed to save article");
    } finally {
      setLoading(false);
    }
  };

  const handleSendToTranslation = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const id = await persistArticle("ready");
      const res = await fetchApi<{ message?: string }>("/translate", {
        method: "POST",
        body: JSON.stringify({ articleId: id }),
      });
      setStatus("ready");
      toast.success(res.message || "Translation jobs queued.");
      router.push("/admin/articles");
    } catch (err: any) {
      toast.error(err.message || "Failed to queue translation");
    } finally {
      setLoading(false);
    }
  };

  const pageLabel = mode === "create" ? "New" : "Edit";
  const heading = mode === "create" ? "Create Article" : "Edit Article";

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col bg-background">
      <header className="sticky top-0 right-0 left-0 h-16 bg-background/80 backdrop-blur-md border-b flex items-center justify-between px-6 z-40 -mx-6 -mt-6 mb-6">
        <div className="flex flex-col">
          <nav className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
            <Link href="/admin" className="hover:text-primary transition-colors">Dashboard</Link>
            <span>&gt;</span>
            <Link href="/admin/articles" className="hover:text-primary transition-colors">Articles</Link>
            <span>&gt;</span>
            <span className="text-primary">{pageLabel}</span>
          </nav>
          <h2 className="text-xl text-primary font-bold">{heading}</h2>
        </div>
        <div className="flex items-center gap-4">
          <input type="file" accept=".html" ref={fileInputRef} className="hidden" onChange={handleImportHtml} />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="text-xs uppercase tracking-widest">
            Import HTML
          </Button>
          <div className="h-6 w-[1px] bg-border mx-2"></div>
          <Button variant="ghost" asChild className="text-xs uppercase tracking-widest">
            <Link href="/admin/articles">Cancel</Link>
          </Button>
          <Button variant="outline" onClick={handleSaveDraft} disabled={loading} className="text-xs uppercase tracking-widest">
            {loading ? "Saving..." : "Save Draft"}
          </Button>
          <Button onClick={handleSendToTranslation} disabled={loading} className="text-xs uppercase tracking-widest font-bold">
            {loading ? "Queuing..." : "Send to Translation"}
          </Button>
        </div>
      </header>

      <div className="flex-1">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-card rounded-xl overflow-hidden border shadow-sm">
              <div className="px-6 py-4 border-b">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Content Strategy</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Article Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-background border px-4 py-3 rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Enter a high-impact title..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">URL Slug</label>
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
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">Main Body</label>
                    <button 
                      type="button"
                      onClick={() => setIsCodeMode(!isCodeMode)}
                      className="text-xs text-primary hover:underline font-mono"
                    >
                      {isCodeMode ? "Switch to Visual Editor" : "Switch to Code Editor"}
                    </button>
                  </div>
                  {isCodeMode ? (
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full h-[600px] bg-slate-950 text-slate-50 font-mono text-sm p-4 rounded-md focus:outline-none focus:ring-1 focus:ring-primary shadow-inner resize-y"
                      placeholder="Enter raw HTML here..."
                    />
                  ) : (
                    <div className="border rounded-md shadow-sm bg-background">
                      <TipTapEditor content={content} onChange={setContent} />
                    </div>
                  )}
                </div>
              </div>
            </section>

            <ExtractedLinksPreview content={content} />
          </div>

          <div className="space-y-6">
            <section className="bg-card rounded-xl overflow-hidden border shadow-sm">
              <div className="px-6 py-4 border-b">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Target Template</h3>
              </div>
              <div className="p-6">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Parent Blueprint *</label>
                <select
                  className="w-full bg-background border px-4 py-3 rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  required
                >
                  <option value="">Select a template...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </section>

            <section className="bg-card rounded-xl overflow-hidden border shadow-sm">
              <div className="px-6 py-4 border-b">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Configuration</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Source Status</label>
                  <select
                    className="w-full bg-background border px-4 py-3 rounded"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                  >
                    {ARTICLE_STATUSES.map((s) => (
                      <option key={s} value={s}>{ARTICLE_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Draft = editing. Ready = eligible for translation. Publish happens on translations, not here.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Translation Priority</label>
                  <select className="w-full bg-background border px-4 py-3 rounded" value={priority} onChange={(e) => setPriority(e.target.value)}>
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
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">Meta Title</label>
                    <span className={`text-xs ${metaTitle.length > 60 ? "text-destructive" : "text-muted-foreground"}`}>{metaTitle.length}/60</span>
                  </div>
                  <input type="text" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="w-full bg-background border px-4 py-2 rounded" placeholder="SEO title..." />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest">Meta Description</label>
                    <span className={`text-xs ${metaDescription.length > 160 ? "text-destructive" : "text-muted-foreground"}`}>{metaDescription.length}/160</span>
                  </div>
                  <textarea rows={4} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="w-full bg-background border px-4 py-2 rounded resize-none" placeholder="Search snippet summary..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">OG Image URL</label>
                  <input
                    type="url"
                    value={ogImageUrl}
                    onChange={(e) => setOgImageUrl(e.target.value)}
                    className="w-full bg-background border px-4 py-2 rounded"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
