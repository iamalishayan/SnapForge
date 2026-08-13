"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSiteConfigs } from "@/lib/hooks/use-data";
import { fetchApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Loader2, Info } from "lucide-react";

interface TranslateDialogProps {
  articleId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TranslateDialog({
  articleId,
  onClose,
  onSuccess,
}: TranslateDialogProps) {
  const { data: response, isLoading: isLoadingSites } = useSiteConfigs();
  const sites = response?.data || [];
  
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [forcePrompt, setForcePrompt] = useState(false);

  const handleToggleSite = (siteId: string) => {
    setForcePrompt(false); // Reset prompt if they change selection
    setSelectedSites((prev) =>
      prev.includes(siteId)
        ? prev.filter((id) => id !== siteId)
        : [...prev, siteId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSites.length === sites.length) {
      setSelectedSites([]);
    } else {
      setSelectedSites(sites.map((s: any) => s.id));
    }
  };

  const handleTranslate = async (force = false) => {
    if (!articleId || selectedSites.length === 0) return;

    setIsTranslating(true);
    try {
      // First ensure the article is marked as ready
      await fetchApi(`/articles/${articleId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ready" }),
      });

      // Submit translation jobs for selected sites
      const res = await fetchApi<{ message?: string }>("/translate", {
        method: "POST",
        body: JSON.stringify({ 
          articleId: articleId, 
          siteConfigIds: selectedSites,
          force 
        }),
      });
      
      toast({
        title: "Jobs queued",
        description:
          res.message ||
          "Translation jobs are processing. Failures will appear on the dashboard.",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.message?.includes("force") && err.message?.includes("overwrite")) {
        setForcePrompt(true);
      } else {
        toast({
          title: "Error",
          description: err.message || "Failed to queue translation",
          variant: "destructive",
        });
      }
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Dialog open={!!articleId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#09090b] border-[#27272a] text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-manrope">Select Target Languages</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose which sites/languages you want to translate this article into. 
            SEO keywords will be automatically generated from the article content.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoadingSites ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active sites found. Add a site first.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-[#27272a]">
                <span className="text-sm font-medium">Available Sites</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSelectAll}
                  className="text-xs h-8 text-muted-foreground hover:text-white"
                >
                  {selectedSites.length === sites.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {sites.map((site: any) => (
                  <label
                    key={site.id}
                    className="flex items-center space-x-3 p-3 rounded-md border border-[#27272a] hover:bg-[#27272a]/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSites.includes(site.id)}
                      onChange={() => handleToggleSite(site.id)}
                      className="rounded border-[#3f3f46] bg-transparent text-primary focus:ring-primary focus:ring-offset-0 h-4 w-4"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {site.domain}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase">
                        {site.language_code} - {site.country_code}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#131315] border border-[#27272a] rounded-md p-3 mb-4 text-xs text-muted-foreground flex gap-2 items-start">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p>
            Translations process in the background. You can track their status in the <strong>Monitoring</strong> tab, and review any errors in the <strong>Failed Translations</strong> section on your Dashboard.
          </p>
        </div>

        {forcePrompt && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 mb-4 text-sm text-red-400">
            <strong>Warning:</strong> Translations already exist for this article on the selected sites. Do you want to force overwrite them?
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-[#27272a]">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isTranslating}
            className="border-[#27272a] bg-transparent hover:bg-[#27272a] text-white"
          >
            Cancel
          </Button>
          {forcePrompt ? (
            <Button
              onClick={() => handleTranslate(true)}
              disabled={isTranslating}
              className="bg-red-600 text-white hover:bg-red-700 font-medium"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Force Overwrite"
              )}
            </Button>
          ) : (
            <Button
              onClick={() => handleTranslate(false)}
              disabled={isTranslating || selectedSites.length === 0}
              className="bg-white text-black hover:bg-white/90 font-medium"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Translate to ${selectedSites.length} site(s)`
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
