"use client";

import { useCostAnalytics } from "@/lib/hooks/use-data";
import { CostCharts } from "@/components/costs/CostCharts";
import { useState } from "react";
import { DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function CostsPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading, isError } = useCostAnalytics(days);

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-manrope text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Cost Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track AI token spend across all translation pipelines.
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
          Failed to load cost analytics.
        </div>
      ) : (
        <div className="space-y-6">
          <CostCharts 
            dailySpend={data.data.dailySpend} 
            costByModel={data.data.costByModel} 
          />

          <div className="rounded-xl border border-[#27272a] bg-[#131315] overflow-hidden">
            <div className="p-4 border-b border-[#27272a] bg-[#18181b]">
              <h2 className="font-manrope font-semibold text-white">Recent Transactions</h2>
            </div>
            {data.data.rawLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No cost logs found for this period.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-[#27272a] hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium w-[250px]">Translation</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Model</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">Tokens (In / Out)</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">Total Cost</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.rawLogs.slice(0, 50).map((log: any) => (
                    <TableRow key={log.id} className="border-[#27272a] hover:bg-[#18181b]/50">
                      <TableCell className="font-medium text-white max-w-[250px] truncate">
                        {log.translations?.translated_title || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-primary/30 text-primary/80">
                          {log.model}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground font-mono text-xs">
                        {log.input_tokens?.toLocaleString()} / {log.output_tokens?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-white font-mono">
                        ${Number(log.estimated_cost_usd).toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
