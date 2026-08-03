import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Layers, Globe, Type, Activity } from "lucide-react"

export interface StatCardsProps {
  stats: {
    templates: number
    activeSites: number
    totalTranslations: number
  }
}

export function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-[#131315] border-[#27272a]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Active Sites</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.activeSites}</div>
          <p className="text-xs text-muted-foreground">Live frontend domains</p>
        </CardContent>
      </Card>
      <Card className="bg-[#131315] border-[#27272a]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Templates</CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.templates}</div>
          <p className="text-xs text-muted-foreground">Active prompt configurations</p>
        </CardContent>
      </Card>
      <Card className="bg-[#131315] border-[#27272a]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Total Translations</CardTitle>
          <Type className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.totalTranslations}</div>
          <p className="text-xs text-muted-foreground">Across all stages</p>
        </CardContent>
      </Card>
      <Card className="bg-[#131315] border-[#27272a]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">System Status</CardTitle>
          <Activity className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">Healthy</div>
          <p className="text-xs text-muted-foreground">All queues operational</p>
        </CardContent>
      </Card>
    </div>
  )
}
