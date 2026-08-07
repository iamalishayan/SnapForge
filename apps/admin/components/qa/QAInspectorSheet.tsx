"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useArticle, useTranslation } from "@/lib/hooks/use-data";
import { fetchApi } from "@/lib/api";
import QAIssuesBanner from "./QAIssuesBanner";
import ImageTranslationPanel from "./ImageTranslationPanel";
import SideBySidePreview, { type TranslationEditState } from "./SideBySidePreview";
import QAActionPanel from "./QAActionPanel";
import type { QAQueueRow } from "./QATable";

interface QAInspectorSheetProps {
  row: QAQueueRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toEditState(data: any): TranslationEditState {
  return {
    translated_title: data?.translated_title || "",
    translated_content: data?.translated_content || "",
    translated_meta_title: data?.translated_meta_title || "",
    translated_meta_description: data?.translated_meta_description || "",
  };
}

export default function QAInspectorSheet({ row, open, onOpenChange }: QAInspectorSheetProps) {
  const queryClient = useQueryClient();
  const translationId = row?.id || "";
  const { data: translationRes, isLoading: translationLoading } = useTranslation(translationId);
  const translation = translationRes?.data;

  const articleId = translation?.article_id || row?.article_id || "";
  const { data: articleRes, isLoading: articleLoading } = useArticle(articleId);
  const article = articleRes?.data;

  const [edit, setEdit] = useState<TranslationEditState>({
    translated_title: "",
    translated_content: "",
    translated_meta_title: "",
    translated_meta_description: "",
  });
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (translation) {
      setEdit(toEditState(translation));
    }
  }, [translation]);

  const baseline = useMemo(() => toEditState(translation), [translation]);
  const dirty =
    edit.translated_title !== baseline.translated_title ||
    edit.translated_content !== baseline.translated_content ||
    edit.translated_meta_title !== baseline.translated_meta_title ||
    edit.translated_meta_description !== baseline.translated_meta_description;

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["translations", "qa_queue"] });
    if (translationId) {
      await queryClient.invalidateQueries({ queryKey: ["translation", translationId] });
    }
  };

  const domain = row?.site_configs?.domain || "";

  const handleSave = async () => {
    if (!translationId) return;
    setBusy("save");
    try {
      await fetchApi(`/translations/${translationId}`, {
        method: "PATCH",
        body: JSON.stringify(edit),
      });
      toast.success("Edits saved.");
      await invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to save edits");
    } finally {
      setBusy(null);
    }
  };

  const handleApprove = async () => {
    if (!translationId || !domain) {
      toast.error("Missing translation domain for revalidation.");
      return;
    }
    setBusy("approve");
    try {
      if (dirty) {
        await fetchApi(`/translations/${translationId}`, {
          method: "PATCH",
          body: JSON.stringify(edit),
        });
      }
      await fetchApi("/qa/approve", {
        method: "POST",
        body: JSON.stringify({ translationId, domain }),
      });
      toast.success("Approved — page revalidation queued.");
      await invalidate();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to approve");
    } finally {
      setBusy(null);
    }
  };

  const handleFlag = async (notes: string) => {
    if (!translationId) return;
    setBusy("flag");
    try {
      await fetchApi("/qa/flag", {
        method: "POST",
        body: JSON.stringify({ translationId, reviewerNotes: notes }),
      });
      toast.success("Translation flagged.");
      await invalidate();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to flag");
    } finally {
      setBusy(null);
    }
  };

  const handleRetry = async () => {
    if (!translationId) return;
    setBusy("retry");
    try {
      await fetchApi("/qa/retry", {
        method: "POST",
        body: JSON.stringify({ translationId }),
      });
      toast.success("Translation re-queued.");
      await invalidate();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to retry");
    } finally {
      setBusy(null);
    }
  };

  const loading = translationLoading || articleLoading;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-[#27272a] bg-[#09090b]/98 p-0 sm:max-w-[1100px]"
      >
        <SheetHeader className="space-y-1 border-b border-[#27272a] px-6 py-4 text-left">
          <SheetTitle className="font-manrope text-xl">
            QA Inspector
          </SheetTitle>
          <SheetDescription>
            {row?.site_configs?.domain || "Target site"} ·{" "}
            {(row?.site_configs?.language_code || row?.language_code || "").toUpperCase()} · Approve
            goes live as <span className="text-foreground">qa_approved</span>
          </SheetDescription>
        </SheetHeader>

        {loading || !translation ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-4 overflow-y-auto px-6 py-4">
              <QAIssuesBanner
                errors={translation.qa_auto_errors}
                warnings={translation.qa_auto_warnings}
              />
              <ImageTranslationPanel
                imageTranslationNeeded={translation.image_translation_needed}
                imageTexts={translation.image_texts}
              />
              <div className="flex min-h-[60vh] flex-col">
                <SideBySidePreview
                  sourceTitle={article?.title || row?.articles?.title || "Source article"}
                  sourceContent={article?.content || ""}
                  articleCss={article?.article_css}
                  edit={edit}
                  onChange={setEdit}
                />
              </div>
            </div>
            <QAActionPanel
              busy={busy}
              dirty={dirty}
              onSave={handleSave}
              onApprove={handleApprove}
              onFlag={handleFlag}
              onRetry={handleRetry}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
