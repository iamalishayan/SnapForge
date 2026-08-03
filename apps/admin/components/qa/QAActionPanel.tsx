"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface QAActionPanelProps {
  busy: string | null;
  dirty: boolean;
  onSave: () => void;
  onApprove: () => void;
  onFlag: (notes: string) => void;
  onRetry: () => void;
}

export default function QAActionPanel({
  busy,
  dirty,
  onSave,
  onApprove,
  onFlag,
  onRetry,
}: QAActionPanelProps) {
  const [flagOpen, setFlagOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const disabled = !!busy;

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#27272a] bg-[#09090b]/95 px-4 py-3 backdrop-blur-xl">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || !dirty}
          onClick={onSave}
          className="border-[#27272a] hover:bg-white/5"
        >
          {busy === "save" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Edits
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={onRetry}
          className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
        >
          {busy === "retry" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Retry Translation
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => setFlagOpen(true)}
          className="border-red-500/40 text-red-400 hover:bg-red-500/10"
        >
          Flag
        </Button>
        <Button
          type="button"
          disabled={disabled}
          onClick={onApprove}
          className="bg-emerald-500 text-black hover:bg-emerald-400"
        >
          {busy === "approve" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Approve
        </Button>
      </div>

      <Dialog open={flagOpen} onOpenChange={setFlagOpen}>
        <DialogContent className="bg-[#09090b] border-[#27272a] text-foreground">
          <DialogHeader>
            <DialogTitle>Flag translation</DialogTitle>
            <DialogDescription>
              Reviewer notes are required. Flagged items leave the QA queue until retried or edited back in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="flag-notes">Notes</Label>
            <textarea
              id="flag-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-[#27272a] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="What should the next pass fix?"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setFlagOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!notes.trim() || disabled}
              className="bg-red-500 text-white hover:bg-red-400"
              onClick={() => {
                onFlag(notes.trim());
                setFlagOpen(false);
                setNotes("");
              }}
            >
              {busy === "flag" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
