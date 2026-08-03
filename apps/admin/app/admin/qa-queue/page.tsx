"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/hooks/use-data";
import QATable, { type QAQueueRow } from "@/components/qa/QATable";
import QAInspectorSheet from "@/components/qa/QAInspectorSheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function QAQueuePage() {
  const [statusTab, setStatusTab] = useState<string>("qa_queue");
  const { data, isLoading, isError } = useTranslations(statusTab);
  const rows = (data?.data || []) as QAQueueRow[];
  const [selected, setSelected] = useState<QAQueueRow | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-6 py-8">
      <div>
        <h1 className="font-manrope text-2xl font-bold tracking-tight text-white">Translations Pipeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review AI translations side-by-side. View flagged, approved, or published translations.
        </p>
      </div>

      <Tabs value={statusTab} onValueChange={setStatusTab} className="w-full">
        <TabsList className="bg-[#131315]/50 border border-[#27272a] mb-6">
          <TabsTrigger value="qa_queue" className="data-[state=active]:bg-[#27272a] data-[state=active]:text-white">Needs Review</TabsTrigger>
          <TabsTrigger value="staging" className="data-[state=active]:bg-[#27272a] data-[state=active]:text-white">Failed Auto-QA</TabsTrigger>
          <TabsTrigger value="qa_approved" className="data-[state=active]:bg-[#27272a] data-[state=active]:text-white">Approved</TabsTrigger>
          <TabsTrigger value="flagged" className="data-[state=active]:bg-[#27272a] data-[state=active]:text-white">Flagged</TabsTrigger>
          <TabsTrigger value="published" className="data-[state=active]:bg-[#27272a] data-[state=active]:text-white">Published</TabsTrigger>
        </TabsList>

        {isError ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
            Failed to load translations.
          </div>
        ) : (
          <QATable
            rows={rows}
            isLoading={isLoading}
            onInspect={(row) => {
              setSelected(row);
              setOpen(true);
            }}
          />
        )}
      </Tabs>

      <QAInspectorSheet
        row={selected}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSelected(null);
        }}
      />
    </div>
  );
}
