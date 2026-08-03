"use client";

import { useMonitoringStats } from "@/lib/hooks/use-data";
import { GscCharts } from "@/components/monitoring/GscCharts";
import { useState } from "react";
import { Activity, Loader2, Database, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MonitoringPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading, isError } = useMonitoringStats(days);

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-manrope text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            System Monitoring
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Google Search Console indexing stats and live BullMQ worker health.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-[#131315] border border-[#27272a] rounded-lg p-1">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              variant={days === d ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDays(d)}
              className={days === d ? "bg-[#27272a] text-white" : "text-muted-foreground hover:text-white"}
            >
              Last {d} Days
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError || !data?.data ? (
        <div className="flex h-[400px] items-center justify-center text-red-500">
          Failed to load monitoring stats.
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Queue Health Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Translation Queue */}
            <Card className="bg-[#131315] border-[#27272a]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-[#27272a]/50">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  Translation Queue (BullMQ)
                </CardTitle>
                {data.data.queues.translation.failed > 0 ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">{data.data.queues.translation.waiting}</div>
                    <p className="text-xs text-muted-foreground">Waiting</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-500">{data.data.queues.translation.active}</div>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-500">{data.data.queues.translation.completed}</div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-500">{data.data.queues.translation.failed}</div>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revalidation Queue */}
            <Card className="bg-[#131315] border-[#27272a]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-[#27272a]/50">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  Revalidation Queue (BullMQ)
                </CardTitle>
                {data.data.queues.revalidation.failed > 0 ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">{data.data.queues.revalidation.waiting}</div>
                    <p className="text-xs text-muted-foreground">Waiting</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-500">{data.data.queues.revalidation.active}</div>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-500">{data.data.queues.revalidation.completed}</div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-500">{data.data.queues.revalidation.failed}</div>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <GscCharts dailyStats={data.data.gsc.dailyStats} />

        </div>
      )}
    </div>
  );
}
