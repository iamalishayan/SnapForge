"use client";

import ArticleForm from "@/components/articles/ArticleForm";
import { useArticle } from "@/lib/hooks/use-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EditArticlePage({ params }: { params: { id: string } }) {
  const { data, isLoading, isError } = useArticle(params.id);
  const article = data?.data;

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading article...</div>;
  }

  if (isError || !article) {
    return (
      <div className="p-12 text-center">
        <p className="text-destructive mb-4">Article not found.</p>
        <Button asChild variant="outline">
          <Link href="/admin/articles">Back to Articles</Link>
        </Button>
      </div>
    );
  }

  return (
    <ArticleForm
      mode="edit"
      articleId={params.id}
      initialData={{
        title: article.title,
        content: article.content,
        template_id: article.template_id,
        slug: article.slug,
        status: article.status,
        priority: article.priority,
        meta_title: article.meta_title,
        meta_description: article.meta_description,
        og_image_url: article.og_image_url,
      }}
    />
  );
}
