"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Globe, Loader2, SearchX } from "lucide-react";
import { useState } from "react";
import SiteFormDialog from "./SiteFormDialog";

interface SitesDataTableProps {
  sites: any[];
  isLoading: boolean;
  totalCount: number;
  searchQuery: string;
  onSiteUpdated: () => void;
}

export default function SitesDataTable({
  sites,
  isLoading,
  totalCount,
  searchQuery,
  onSiteUpdated,
}: SitesDataTableProps) {
  const [editingSite, setEditingSite] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEdit = (site: any) => {
    setEditingSite(site);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingSite(null);
  };

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center border border-border/50 rounded-xl bg-[#09090b]/50">
        <Globe className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <h3 className="text-xl font-semibold text-foreground">No sites configured yet</h3>
        <p className="text-muted-foreground mt-2 mb-6 max-w-md">
          Add your first site configuration to start generating translated content for it.
        </p>
      </div>
    );
  }

  if (sites.length === 0 && searchQuery.trim()) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center border border-border/50 rounded-xl bg-[#09090b]/50">
        <SearchX className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <h3 className="text-xl font-semibold text-foreground">No matching sites</h3>
        <p className="text-muted-foreground mt-2 max-w-md">
          No sites match “{searchQuery}”. Try a different domain or language code.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border/50 bg-[#131315]/50 overflow-hidden backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-[#09090b]">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Domain</TableHead>
              <TableHead className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Language</TableHead>
              <TableHead className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Theme</TableHead>
              <TableHead className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Status</TableHead>
              <TableHead className="text-right font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sites.map((site) => (
              <TableRow key={site.id} className="border-border/50 hover:bg-white/[0.02] transition-colors">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${site.active ? "bg-emerald-500/60" : "bg-neutral-500/40"}`} />
                    {site.domain}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {site.language_code.toUpperCase()} {site.country_code ? `(${site.country_code.toUpperCase()})` : ""}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {site.theme_name || "—"}
                </TableCell>
                <TableCell>
                  {site.active ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase tracking-widest text-[10px]">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-neutral-500/10 text-neutral-400 border-neutral-500/20 uppercase tracking-widest text-[10px]">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(site)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SiteFormDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSuccess={() => {
          handleDialogClose();
          onSiteUpdated();
        }}
        initialData={editingSite}
      />
    </>
  );
}
