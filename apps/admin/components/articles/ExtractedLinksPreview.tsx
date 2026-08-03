"use client";

import { useMemo } from "react";

type ArticleLink = { text: string; href: string };

/** Client-side mirror of server link extraction for read-only preview. */
function extractLinksPreview(html: string): { inner: ArticleLink[]; outer: ArticleLink[] } {
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  const inner: ArticleLink[] = [];
  const outer: ArticleLink[] = [];

  doc.querySelectorAll("a[href]").forEach((el) => {
    const href = el.getAttribute("href")?.trim();
    const text = el.textContent?.trim() || "";
    if (!href) return;
    if (href.startsWith("http://") || href.startsWith("https://")) {
      outer.push({ text, href });
    } else {
      inner.push({ text, href });
    }
  });

  const dedupe = (links: ArticleLink[]) =>
    Array.from(new Map(links.map((l) => [l.href, l])).values());

  return { inner: dedupe(inner), outer: dedupe(outer) };
}

export default function ExtractedLinksPreview({ content }: { content: string }) {
  const { inner, outer } = useMemo(() => extractLinksPreview(content), [content]);

  return (
    <section className="bg-card rounded-xl overflow-hidden border shadow-sm">
      <div className="px-6 py-4 border-b">
        <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Extracted Links</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Auto-detected from links in the editor. Saved on submit.
        </p>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <LinkList label="Internal" links={inner} empty="No relative links in content." />
        <LinkList label="External" links={outer} empty="No absolute links in content." />
      </div>
    </section>
  );
}

function LinkList({
  label,
  links,
  empty,
}: {
  label: string;
  links: ArticleLink[];
  empty: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{label}</p>
      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">{empty}</p>
      ) : (
        links.map((link) => (
          <div key={link.href} className="p-2 border rounded bg-muted/50">
            <p className="text-sm font-medium">{link.text || link.href}</p>
            <p className="text-xs text-muted-foreground truncate">{link.href}</p>
          </div>
        ))
      )}
    </div>
  );
}
