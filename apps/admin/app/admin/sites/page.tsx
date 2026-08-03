"use client";

import { useSiteConfigs } from "@/lib/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import SitesDataTable from "@/components/sites/SitesDataTable";
import SiteFormDialog from "@/components/sites/SiteFormDialog";

export default function SitesPage() {
  const { data: response, isLoading, refetch } = useSiteConfigs();
  const sites = response?.data || [];
  
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredSites = sites.filter((site: any) => 
    site.domain.toLowerCase().includes(search.toLowerCase()) || 
    site.language_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-manrope text-2xl font-bold tracking-tight text-white">Sites Configuration</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search domains..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#131315]/50 border-[#27272a] focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground/50 transition-all"
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-white text-black hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.1)] gap-2">
            <Plus className="h-4 w-4" />
            Add Site
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <SitesDataTable 
        sites={filteredSites} 
        isLoading={isLoading}
        totalCount={sites.length}
        searchQuery={search}
        onSiteUpdated={() => refetch()} 
      />

      <SiteFormDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={() => {
          setIsAddDialogOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
