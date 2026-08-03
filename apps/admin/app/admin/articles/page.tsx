"use client";

import { useArticles } from "@/lib/hooks/use-data";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ARTICLE_STATUS_LABELS, isArticleStatus } from "@/lib/article-status";
import TranslateDialog from "@/components/articles/TranslateDialog";

export default function ArticlesPage() {
  const { data, isLoading, isError, refetch } = useArticles();
  const articles = data?.data || [];
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedTranslateArticleId, setSelectedTranslateArticleId] = useState<string | null>(null);


  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this article?")) return;
    
    setIsDeleting(id);
    try {
      await fetchApi(`/articles/${id}`, { method: "DELETE" });
      toast.success("Article deleted successfully");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete article");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar bg-background text-foreground">
      <div className="max-w-[1440px] mx-auto">
        {/* Breadcrumbs & Header */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <nav className="flex items-center gap-2 text-muted-foreground text-[12px] mb-2 uppercase tracking-widest font-semibold">
              <Link href="/admin" className="hover:text-primary transition-colors">Dashboard</Link>
              <span>&gt;</span>
              <span className="text-primary">Articles</span>
            </nav>
            <h2 className="text-3xl font-bold tracking-tight text-primary">Articles</h2>
            <p className="text-muted-foreground mt-1">Manage and edit your article content.</p>
          </div>
          <Button asChild className="uppercase tracking-widest font-bold">
            <Link href="/admin/articles/new">New Article</Link>
          </Button>
        </div>

        {/* Content Area */}
        <div className="border border-border/50 rounded-xl bg-card overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse">Loading articles...</div>
          ) : isError ? (
            <div className="p-12 text-center text-destructive">Failed to load articles.</div>
          ) : articles.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <h3 className="text-lg font-medium text-foreground">No articles found</h3>
              <p className="text-muted-foreground mt-1 mb-6">You haven&apos;t created any articles yet.</p>
              <Button asChild variant="outline">
                <Link href="/admin/articles/new">Create your first article</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/50">
                  <TableHead className="w-[40%] text-xs uppercase tracking-widest">Title</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest">Template</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest">Priority</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article: any) => (
                  <TableRow key={article.id} className="border-border/50 transition-colors hover:bg-muted/10">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-foreground">{article.title}</span>
                        <span className="text-xs text-muted-foreground mt-1">
                          Updated {formatDistanceToNow(new Date(article.updated_at || article.created_at))} ago
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {article.templates?.name ? (
                        <span className="text-sm">{article.templates.name}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No template</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={article.status === "ready" ? "default" : "outline"}
                        className="uppercase text-[10px] tracking-wider"
                      >
                        {isArticleStatus(article.status)
                          ? ARTICLE_STATUS_LABELS[article.status]
                          : article.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`uppercase text-[10px] tracking-wider border ${article.priority === 'high' ? 'border-destructive text-destructive' : 'border-border/50 text-muted-foreground'}`}
                      >
                        {article.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-8 uppercase tracking-widest"
                          onClick={() => setSelectedTranslateArticleId(article.id)}
                        >
                          Translate
                        </Button>
                        <Button variant="ghost" size="sm" asChild className="text-xs h-8 uppercase tracking-widest">
                          <Link href={`/admin/articles/${article.id}`}>Edit</Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10 uppercase tracking-widest"
                          onClick={() => handleDelete(article.id)}
                          disabled={isDeleting === article.id}
                        >
                          {isDeleting === article.id ? '...' : 'Delete'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Translate Dialog Modal */}
      <TranslateDialog 
        articleId={selectedTranslateArticleId} 
        onClose={() => setSelectedTranslateArticleId(null)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
