"use client";

import { usePublishLogs } from "@/lib/hooks/use-data";
import { fetchApi } from "@/lib/api";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ShieldAlert, AlertTriangle, Link, Globe, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function PublishLogPage() {
  const { data, isLoading, isError, refetch } = usePublishLogs(50);
  const logs = data?.data || [];
  
  const [killingId, setKillingId] = useState<string | null>(null);

  const handleKillSwitch = async (translationId: string, domain: string) => {
    if (!window.confirm("EMERGENCY KILL SWITCH: This will flag the translation and queue a revalidation to remove it from the live site immediately. Proceed?")) {
      return;
    }

    setKillingId(translationId);
    try {
      const res = await fetchApi<{ success: boolean; message: string }>("/publish/kill", {
        method: "POST",
        body: JSON.stringify({
          translationId,
          domain,
          reason: "Emergency kill switch activated by admin"
        })
      });
      toast.success(res.message || "Kill switch activated successfully.");
      refetch(); // Reload the logs
    } catch (err: any) {
      toast.error(err.message || "Failed to activate kill switch");
    } finally {
      setKillingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-6 py-8">
      <div>
        <h1 className="font-manrope text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          Publish Operations Log
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Audit trail of all translation publish and emergency unpublish actions.
        </p>
      </div>

      <div className="rounded-xl border border-[#27272a] bg-[#131315] overflow-hidden">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="p-6 text-red-500">Failed to load publish logs.</div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">No publish actions recorded yet.</div>
        ) : (
          <Table>
            <TableHeader className="bg-[#18181b]">
              <TableRow className="border-[#27272a] hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium w-[250px]">Translation</TableHead>
                <TableHead className="text-muted-foreground font-medium">Domain</TableHead>
                <TableHead className="text-muted-foreground font-medium">Action</TableHead>
                <TableHead className="text-muted-foreground font-medium">Date</TableHead>
                <TableHead className="text-right text-muted-foreground font-medium">Emergency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: any) => (
                <TableRow key={log.id} className="border-[#27272a] hover:bg-[#18181b]/50">
                  <TableCell className="font-medium text-white max-w-[250px] truncate">
                    {log.translations?.translated_title || "Unknown Title"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Link className="h-3 w-3" />
                      {log.site_configs?.domain || "Unknown"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.action_type === 'published' ? 'default' : 'destructive'} className="capitalize">
                      {log.action_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={killingId === log.translation_id}
                      onClick={() => handleKillSwitch(log.translation_id, log.site_configs?.domain)}
                      className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 gap-1.5 transition-all"
                    >
                      {killingId === log.translation_id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ShieldAlert className="h-3.5 w-3.5" />
                      )}
                      Kill Switch
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
