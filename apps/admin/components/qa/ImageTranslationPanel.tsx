"use client";

import { Badge } from "@/components/ui/badge";
import { ImageIcon, AlertTriangle, CheckCircle2, ShieldOff, XCircle } from "lucide-react";

export interface TranslatedSlot {
  name: string;
  original: string;
  translated: string;
}

export type ImageOutcomeStatus =
  | "kept"
  | "skipped_logo"
  | "rendered"
  | "needs_review"
  | "failed";

export interface ImageOutcomeEntry {
  src: string;
  status: ImageOutcomeStatus;
  template_type?: string;
  confidence?: number;
  extracted_text?: string;
  slots?: TranslatedSlot[];
  rendered_src?: string;
  error?: string;
  cached?: boolean;
}

function parseEntries(value: unknown): ImageOutcomeEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is ImageOutcomeEntry =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as ImageOutcomeEntry).src === "string"
  );
}

const STATUS_CONFIG: Record<
  ImageOutcomeStatus,
  { label: string; className: string; Icon: typeof ImageIcon }
> = {
  rendered: {
    label: "Rendered",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    Icon: CheckCircle2,
  },
  kept: {
    label: "Kept",
    className: "border-border/50 bg-white/5 text-muted-foreground",
    Icon: ImageIcon,
  },
  skipped_logo: {
    label: "Logo — skipped",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-400",
    Icon: ShieldOff,
  },
  needs_review: {
    label: "Needs review",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    Icon: AlertTriangle,
  },
  failed: {
    label: "Failed",
    className: "border-red-500/30 bg-red-500/10 text-red-400",
    Icon: XCircle,
  },
};

interface ImageTranslationPanelProps {
  imageTranslationNeeded?: boolean | null;
  imageTexts?: unknown;
}

export default function ImageTranslationPanel({
  imageTranslationNeeded,
  imageTexts,
}: ImageTranslationPanelProps) {
  const entries = parseEntries(imageTexts);

  if (entries.length === 0 && !imageTranslationNeeded) {
    return null;
  }

  const borderClass = imageTranslationNeeded
    ? "border-amber-500/30 bg-amber-500/5"
    : "border-border/50 bg-[#131315]/50";

  return (
    <div className={`space-y-3 rounded-lg border px-4 py-4 ${borderClass}`}>
      <div className="flex flex-wrap items-center gap-2">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">Image localization</span>
        {imageTranslationNeeded && (
          <Badge
            variant="outline"
            className="border-amber-500/30 text-[10px] uppercase tracking-widest text-amber-400"
          >
            Action needed
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {entries.map((entry, index) => {
          const config = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.needs_review;
          const { Icon } = config;

          return (
            <div
              key={`${entry.src}-${index}`}
              className="rounded-md border border-border/40 bg-[#09090b]/60 p-3"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={`gap-1 text-[10px] uppercase tracking-widest ${config.className}`}
                >
                  <Icon className="h-3 w-3" />
                  {config.label}
                </Badge>
                {entry.template_type && entry.template_type !== "none" && (
                  <Badge
                    variant="outline"
                    className="border-border/50 text-[10px] uppercase tracking-widest text-muted-foreground"
                  >
                    {entry.template_type.replace("_", " ")}
                  </Badge>
                )}
                {typeof entry.confidence === "number" && (
                  <span className="text-[11px] text-muted-foreground">
                    {(entry.confidence * 100).toFixed(0)}% confidence
                  </span>
                )}
                {entry.cached && (
                  <span className="text-[11px] text-muted-foreground">cached</span>
                )}
              </div>

              <p className="truncate text-xs text-muted-foreground">{entry.src}</p>

              {entry.error && (
                <p className="mt-2 text-xs text-red-300/90">{entry.error}</p>
              )}

              {entry.status === "rendered" && entry.rendered_src && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <figure>
                    <figcaption className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      Original
                    </figcaption>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.src}
                      alt="Original"
                      className="w-full rounded border border-border/40"
                    />
                  </figure>
                  <figure>
                    <figcaption className="mb-1 text-[10px] uppercase tracking-wider text-emerald-500/80">
                      Rendered translation
                    </figcaption>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.rendered_src}
                      alt="Rendered translation"
                      className="w-full rounded border border-emerald-500/30"
                    />
                  </figure>
                </div>
              )}

              {entry.slots && entry.slots.length > 0 && (
                <ul className="mt-3 space-y-2 text-sm">
                  {entry.slots.map((slot, slotIndex) => (
                    <li key={`slot-${slotIndex}`} className="rounded bg-black/30 px-2 py-2">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {slot.name}
                      </span>
                      <p className="text-foreground/90">{slot.original}</p>
                      <p className="mt-1 text-emerald-300/90">{slot.translated}</p>
                    </li>
                  ))}
                </ul>
              )}

              {entry.status === "needs_review" && entry.extracted_text && (
                <p className="mt-2 text-sm text-amber-200/80">
                  Extracted text: {entry.extracted_text}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
