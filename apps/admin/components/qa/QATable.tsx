"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Eye, ImageIcon, Loader2, XCircle } from "lucide-react";

export type QAQueueRow = {
  id: string;
  article_id: string;
  status: string | null;
  language_code?: string | null;
  qa_auto_passed?: boolean | null;
  qa_auto_errors?: unknown;
  qa_auto_warnings?: unknown;
  image_translation_needed?: boolean | null;
  translated_title?: string | null;
  articles?: { title?: string | null } | null;
  site_configs?: { domain?: string | null; language_code?: string | null } | null;
};

function errorCount(value: unknown): number {
  if (!value) return 0;
  if (Array.isArray(value)) return value.length;
  if (typeof value === "string" && value) return 1;
  return 0;
}

interface QATableProps {
  rows: QAQueueRow[];
  isLoading: boolean;
  onInspect: (row: QAQueueRow) => void;
}

export default function QATable({ rows, isLoading, onInspect }: QATableProps) {
  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-[#09090b]/50 p-20 text-center">
        <CheckCircle2 className="mb-4 h-12 w-12 text-muted-foreground opacity-20" />
        <h3 className="text-xl font-semibold text-foreground">QA queue is empty</h3>
        <p className="mt-2 max-w-md text-muted-foreground">
          Translations that pass auto QA will appear here for human review.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-[#131315]/50 backdrop-blur-sm">
      <Table>
        <TableHeader className="bg-[#09090b]">
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Article
            </TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Target Site
            </TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Language
            </TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Auto QA
            </TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Images
            </TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const errors = errorCount(row.qa_auto_errors);
            const passed = row.qa_auto_passed && errors === 0;
            const lang = (row.site_configs?.language_code || row.language_code || "—").toUpperCase();

            return (
              <TableRow key={row.id} className="border-border/50 hover:bg-white/[0.02]">
                <TableCell className="font-medium text-foreground">
                  {row.articles?.title || row.translated_title || "Untitled"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.site_configs?.domain || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{lang}</TableCell>
                <TableCell>
                  {passed ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/20 bg-emerald-500/10 text-[10px] uppercase tracking-widest text-emerald-500"
                    >
                      Passed
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="gap-1 border-red-500/20 bg-red-500/10 text-[10px] uppercase tracking-widest text-red-400"
                    >
                      <XCircle className="h-3 w-3" />
                      {errors || "Issues"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {row.image_translation_needed ? (
                    <Badge
                      variant="outline"
                      className="gap-1 border-amber-500/20 bg-amber-500/10 text-[10px] uppercase tracking-widest text-amber-400"
                    >
                      <ImageIcon className="h-3 w-3" />
                      Review
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => onInspect(row)}
                  >
                    <Eye className="h-4 w-4" />
                    Inspect
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
