"use client";

import { useDashboardStats } from "@/lib/hooks/use-data";
import { StatCards } from "@/components/dashboard/StatCards";
import { PipelineFunnel } from "@/components/dashboard/PipelineFunnel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-red-500">
        Failed to load dashboard statistics.
      </div>
    );
  }

  const { overview, pipeline, recentActivity } = data.data;

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-6 py-8">
      <div>
        <h1 className="font-manrope text-2xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          System overview, active pipelines, and recent operations.
        </p>
      </div>

      <StatCards stats={overview} />

      <div className="grid gap-4 md:grid-cols-3">
        <PipelineFunnel pipeline={pipeline} />

        <Card className="bg-[#131315] border-[#27272a] col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle className="text-white font-manrope flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5 rounded-full bg-primary/20 p-1">
                      <Activity className="h-3 w-3 text-primary" />
                    </div>
                    <div>
                      <p className="text-white font-medium line-clamp-1">
                        {log.translations?.translated_title || "Unknown Translation"}
                      </p>
                      <p className="text-muted-foreground text-xs flex gap-2">
                        <span className="capitalize">{log.action_type}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
