"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

export interface PipelineFunnelProps {
  pipeline: Record<string, number>
}

const COLORS: Record<string, string> = {
  processing: "#a1a1aa",
  failed: "#dc2626",
  staging: "#ef4444",
  qa_queue: "#eab308",
  qa_approved: "#22c55e",
  flagged: "#f97316",
  published: "#3b82f6",
}

const LABELS: Record<string, string> = {
  processing: "Processing",
  failed: "Job Failed",
  staging: "Failed Auto-QA",
  qa_queue: "Needs Review",
  qa_approved: "Approved",
  flagged: "Flagged",
  published: "Published",
}

export function PipelineFunnel({ pipeline }: PipelineFunnelProps) {
  const data = Object.entries(pipeline).map(([key, value]) => ({
    name: LABELS[key] || key,
    key,
    count: value,
  }))

  const order = [
    "processing",
    "failed",
    "staging",
    "flagged",
    "qa_queue",
    "qa_approved",
    "published",
  ]
  data.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))

  return (
    <Card className="bg-[#131315] border-[#27272a] col-span-2">
      <CardHeader>
        <CardTitle className="text-white font-manrope">Translation Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#a1a1aa" }}
                width={120}
              />
              <Tooltip
                cursor={{ fill: "#27272a", opacity: 0.4 }}
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  color: "#fff",
                }}
                itemStyle={{ color: "#fff" }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.key] || "#8884d8"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
