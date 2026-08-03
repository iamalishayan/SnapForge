"use client";

import { useEffect, useState } from "react";
import { ZodError } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import { SiteCreateSchema, SiteUpdateSchema } from "@/utils/schemas";
import { Loader2 } from "lucide-react";

interface SiteFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

const EMPTY_FORM = {
  domain: "",
  language_code: "en",
  country_code: "",
  active: true,
  theme_name: "",
  adsense_publisher_id: "",
  adsense_slot_id: "",
  monetization_type: "adsense" as const,
  indexnow_key: "",
  sitemap_url: "",
};

export default function SiteFormDialog({ isOpen, onClose, onSuccess, initialData }: SiteFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData;

  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormData({
        domain: initialData.domain || "",
        language_code: initialData.language_code || "en",
        country_code: initialData.country_code || "",
        active: initialData.active ?? true,
        theme_name: initialData.theme_name || "",
        adsense_publisher_id: initialData.adsense_publisher_id || "",
        adsense_slot_id: initialData.adsense_slot_id || "",
        monetization_type: initialData.monetization_type || "adsense",
        indexnow_key: initialData.indexnow_key || "",
        sitemap_url: initialData.sitemap_url || "",
      });
    } else {
      setFormData(EMPTY_FORM);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const schema = isEditing ? SiteUpdateSchema : SiteCreateSchema;
      const parsed = schema.parse(formData);

      if (isEditing) {
        await fetchApi(`/sites/${initialData.id}`, {
          method: "PATCH",
          body: JSON.stringify(parsed),
        });
        toast.success("Site updated successfully!");
      } else {
        await fetchApi("/sites", {
          method: "POST",
          body: JSON.stringify(parsed),
        });
        toast.success("Site configured successfully!");
      }

      onSuccess();
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        toast.error(err.issues[0]?.message || "Validation failed");
      } else if (err instanceof Error) {
        toast.error(err.message || "An error occurred while saving the site.");
      } else {
        toast.error("An error occurred while saving the site.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] bg-[#09090b]/95 backdrop-blur-xl border-[#27272a] text-[#fafafa] shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-manrope text-xl font-semibold">
            {isEditing ? "Edit Site Configuration" : "Add New Site"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing
              ? "Update the configuration for this target site."
              : "Register a new target site to push translated content to."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full grid grid-cols-2 bg-[#131315]/50 border border-[#27272a]">
              <TabsTrigger value="general" className="data-[state=active]:bg-[#27272a] data-[state=active]:text-white">General</TabsTrigger>
              <TabsTrigger value="advanced" className="data-[state=active]:bg-[#27272a] data-[state=active]:text-white">Advanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="domain" className="text-muted-foreground">Domain</Label>
                <Input
                  id="domain"
                  placeholder="e.g., example.com"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value.toLowerCase() })}
                  className="bg-transparent border-[#27272a] focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground/50"
                  disabled={isEditing}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-muted-foreground">Language Code</Label>
                  <Input
                    id="language"
                    placeholder="en"
                    value={formData.language_code}
                    onChange={(e) => setFormData({ ...formData, language_code: e.target.value.toLowerCase() })}
                    className="bg-transparent border-[#27272a] focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-muted-foreground">Country Code</Label>
                  <Input
                    id="country"
                    placeholder="US"
                    value={formData.country_code}
                    onChange={(e) => setFormData({ ...formData, country_code: e.target.value.toUpperCase() })}
                    className="bg-transparent border-[#27272a] focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                    maxLength={2}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme" className="text-muted-foreground">Theme</Label>
                <Select
                  value={formData.theme_name}
                  onValueChange={(value) => setFormData({ ...formData, theme_name: value })}
                >
                  <SelectTrigger className="bg-transparent border-[#27272a] focus:ring-1 focus:ring-primary text-white">
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#131315] border-[#27272a] text-white">
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded-sm border-[#27272a] bg-transparent text-primary focus:ring-1 focus:ring-primary focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer"
                />
                <Label htmlFor="active" className="text-sm font-medium leading-none cursor-pointer">
                  Site Active
                </Label>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Monetization Type</Label>
                <Select
                  value={formData.monetization_type}
                  onValueChange={(value: typeof formData.monetization_type) =>
                    setFormData({ ...formData, monetization_type: value })
                  }
                >
                  <SelectTrigger className="bg-transparent border-[#27272a] focus:ring-1 focus:ring-primary">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#131315] border-[#27272a] text-white">
                    <SelectItem value="adsense">Google AdSense</SelectItem>
                    <SelectItem value="affiliate">Affiliate Links</SelectItem>
                    <SelectItem value="own_service">Own Service/Product</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pub_id" className="text-muted-foreground">AdSense Publisher ID</Label>
                  <Input
                    id="pub_id"
                    placeholder="pub-xxxxxxxx"
                    value={formData.adsense_publisher_id}
                    onChange={(e) => setFormData({ ...formData, adsense_publisher_id: e.target.value })}
                    className="bg-transparent border-[#27272a] focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slot_id" className="text-muted-foreground">AdSense Slot ID</Label>
                  <Input
                    id="slot_id"
                    placeholder="xxxxxxxx"
                    value={formData.adsense_slot_id}
                    onChange={(e) => setFormData({ ...formData, adsense_slot_id: e.target.value })}
                    className="bg-transparent border-[#27272a] focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="indexnow" className="text-muted-foreground">IndexNow API Key</Label>
                <Input
                  id="indexnow"
                  placeholder="For automated Bing/Yandex indexation"
                  value={formData.indexnow_key}
                  onChange={(e) => setFormData({ ...formData, indexnow_key: e.target.value })}
                  className="bg-transparent border-[#27272a] focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sitemap" className="text-muted-foreground">Custom Sitemap URL</Label>
                <Input
                  id="sitemap"
                  placeholder="https://example.com/sitemap.xml"
                  value={formData.sitemap_url}
                  onChange={(e) => setFormData({ ...formData, sitemap_url: e.target.value })}
                  className="bg-transparent border-[#27272a] focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-[#27272a]">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="hover:bg-white/5 border border-transparent">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-white text-black hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Site"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
