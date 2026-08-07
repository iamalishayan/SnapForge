"use client";

import TipTapEditor from "@/components/editor/TipTapEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface TranslationEditState {
  translated_title: string;
  translated_content: string;
  translated_meta_title: string;
  translated_meta_description: string;
}

interface SideBySidePreviewProps {
  sourceTitle: string;
  sourceContent: string;
  edit: TranslationEditState;
  onChange: (next: TranslationEditState) => void;
  /** Language-agnostic article CSS — when set, panes render bare (no prose). */
  articleCss?: string | null;
}

export default function SideBySidePreview({
  sourceTitle,
  sourceContent,
  edit,
  onChange,
  articleCss,
}: SideBySidePreviewProps) {
  const hasCustomCss = Boolean(articleCss?.trim());

  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
      {hasCustomCss && <style dangerouslySetInnerHTML={{ __html: articleCss! }} />}

      <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/50 bg-[#09090b]/60">
        <header className="border-b border-border/40 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Original (English)
          </p>
          <h3 className="mt-1 text-base font-semibold text-foreground">
            {sourceTitle || "—"}
          </h3>
        </header>
        <div
          className={
            hasCustomCss
              ? "min-h-0 flex-1 overflow-y-auto"
              : "prose prose-invert max-w-none flex-1 overflow-y-auto p-4 text-sm prose-a:text-primary"
          }
          dangerouslySetInnerHTML={{
            __html: sourceContent || "<p class='text-muted-foreground'>No content</p>",
          }}
        />
      </section>

      <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/50 bg-[#131315]/70">
        <header className="space-y-3 border-b border-border/40 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Translation (editable)
          </p>
          <div className="space-y-2">
            <Label htmlFor="translated_title" className="text-muted-foreground">
              Title
            </Label>
            <Input
              id="translated_title"
              value={edit.translated_title}
              onChange={(e) => onChange({ ...edit, translated_title: e.target.value })}
              className="bg-transparent border-[#27272a]"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="translated_meta_title" className="text-muted-foreground">
                Meta Title
              </Label>
              <Input
                id="translated_meta_title"
                value={edit.translated_meta_title}
                onChange={(e) =>
                  onChange({ ...edit, translated_meta_title: e.target.value })
                }
                className="bg-transparent border-[#27272a]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="translated_meta_description" className="text-muted-foreground">
                Meta Description
              </Label>
              <Input
                id="translated_meta_description"
                value={edit.translated_meta_description}
                onChange={(e) =>
                  onChange({ ...edit, translated_meta_description: e.target.value })
                }
                className="bg-transparent border-[#27272a]"
              />
            </div>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {hasCustomCss ? (
            <div className="flex h-full min-h-[320px] flex-col gap-3">
              <textarea
                value={edit.translated_content}
                onChange={(e) =>
                  onChange({ ...edit, translated_content: e.target.value })
                }
                className="min-h-[160px] w-full flex-none resize-y rounded-md border border-[#27272a] bg-transparent p-3 font-mono text-xs"
                spellCheck={false}
              />
              <div
                className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border/40"
                dangerouslySetInnerHTML={{ __html: edit.translated_content || "" }}
              />
            </div>
          ) : (
            <TipTapEditor
              content={edit.translated_content}
              onChange={(html) => onChange({ ...edit, translated_content: html })}
            />
          )}
        </div>
      </section>
    </div>
  );
}
