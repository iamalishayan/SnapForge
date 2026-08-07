import { useQuery } from "@tanstack/react-query"
import { fetchApi } from "../api"

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: () => fetchApi<{data: any[]}>("/templates"),
  })
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: ["template", id],
    queryFn: () => fetchApi<any>(`/templates/${id}`),
    enabled: !!id,
  })
}

export function useArticle(id: string) {
  return useQuery({
    queryKey: ["article", id],
    queryFn: () => fetchApi<{ data: any }>(`/articles/${id}`),
    enabled: !!id,
  })
}

export function useArticles() {
  return useQuery({
    queryKey: ["articles"],
    queryFn: () => fetchApi<{data: any[]}>("/articles"),
  })
}

export function useSiteConfigs() {
  return useQuery({
    queryKey: ["site-configs"],
    queryFn: () => fetchApi<{ data: any[] }>("/sites"),
  })
}

export function useTranslations(status?: string) {
  return useQuery({
    queryKey: ["translations", status],
    queryFn: () =>
      fetchApi<{ success: boolean; data: any[]; pagination?: { nextCursor: string | null; limit: number } }>(
        status ? `/translations?status=${status}` : "/translations"
      ),
    refetchInterval: status === "failed" || status === "processing" ? 15_000 : false,
  })
}

export function useTranslation(id: string) {
  return useQuery({
    queryKey: ["translation", id],
    queryFn: () => fetchApi<{ success: boolean; data: any }>(`/translations/${id}`),
    enabled: !!id,
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetchApi<{ success: boolean; data: any }>("/dashboard"),
    refetchInterval: 30000, // Poll every 30 seconds
  })
}

export function usePublishLogs(limit: number = 50, cursor?: string, siteId?: string) {
  return useQuery({
    queryKey: ["publish-logs", limit, cursor, siteId],
    queryFn: () => {
      const params = new URLSearchParams()
      if (limit) params.append("limit", limit.toString())
      if (cursor) params.append("cursor", cursor)
      if (siteId) params.append("siteId", siteId)
      return fetchApi<{ success: boolean; data: any[]; pagination?: { nextCursor: string | null } }>(
        `/publish-logs?${params.toString()}`
      )
    }
  })
}

export function useCostAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ["cost-analytics", days],
    queryFn: () => fetchApi<{ success: boolean; data: any }>(`/costs?days=${days}`),
  })
}

export function useMonitoringStats(days: number = 30) {
  return useQuery({
    queryKey: ["monitoring-stats", days],
    queryFn: () => fetchApi<{ success: boolean; data: any }>(`/monitoring?days=${days}`),
    refetchInterval: 30000, // Poll queue health every 30s
  })
}
