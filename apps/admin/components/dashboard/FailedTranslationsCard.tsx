"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/lib/hooks/use-data"
import { fetchApi } from "@/lib/api"
import { toast } from "sonner"

/**
 * Lists permanently failed translation jobs with a one-click Retry.
 */
export function FailedTranslationsCard() {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useTranslations("failed")
  const rows = data?.data || []
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const handleRetry = async (translationId: string) => {
    setRetryingId(translationId)
    try {
      await fetchApi("/qa/retry", {
        method: "POST",
        body: JSON.stringify({ translationId }),
      })
      toast.success("Translation re-queued.")
      await queryClient.invalidateQueries({ queryKey: ["translations", "failed"] })
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    } catch (err: any) {
      toast.error(err.message || "Failed to retry translation")
    } finally {
      setRetryingId(null)
    }
  }

  return (
    <Card className="bg-[#131315] border-[#27272a]">
      <CardHeader>
        <CardTitle className="text-white font-manrope flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          Failed translations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : isError ? (
          <p className="text-sm text-red-400">Could not load failed jobs.</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No permanently failed translation jobs.
          </p>
        ) : (
          <ul className="space-y-3 max-h-[320px] overflow-y-auto">
            {rows.map((row: any) => (
              <li
                key={row.id}
                className="rounded-md border border-red-500/20 bg-red-500/5 px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">
                      {row.articles?.title || row.translated_title || "Untitled"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {row.site_configs?.domain || "—"} ·{" "}
                      {(row.language_code || "").toUpperCase()}
                    </p>
                    {row.last_error && (
                      <p className="mt-2 text-xs text-red-300/90 line-clamp-3">
                        {row.last_error}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-red-500/30 text-red-200 hover:bg-red-500/10"
                    disabled={retryingId === row.id}
                    onClick={() => handleRetry(row.id)}
                  >
                    {retryingId === row.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        Retry
                      </>
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
