"use client";

import { Badge } from "@/components/ui/badge";
import { AlertTriangle, XCircle } from "lucide-react";

function asStringList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item : JSON.stringify(item)));
  }
  if (typeof value === "string") return value ? [value] : [];
  return [];
}

interface QAIssuesBannerProps {
  errors?: unknown;
  warnings?: unknown;
}

export default function QAIssuesBanner({ errors, warnings }: QAIssuesBannerProps) {
  const errorList = asStringList(errors);
  const warningList = asStringList(warnings);

  if (errorList.length === 0 && warningList.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
        Auto QA reported no errors or warnings.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {errorList.length > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-400">
            <XCircle className="h-4 w-4" />
            Auto QA Errors
            <Badge variant="outline" className="border-red-500/30 text-red-400 text-[10px] uppercase tracking-widest">
              {errorList.length}
            </Badge>
          </div>
          <ul className="space-y-1 text-sm text-red-300/90">
            {errorList.map((item, i) => (
              <li key={`err-${i}`}>• {item}</li>
            ))}
          </ul>
        </div>
      )}
      {warningList.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            Auto QA Warnings
            <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px] uppercase tracking-widest">
              {warningList.length}
            </Badge>
          </div>
          <ul className="space-y-1 text-sm text-amber-200/90">
            {warningList.map((item, i) => (
              <li key={`warn-${i}`}>• {item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
