"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

export default function NewTemplatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    gemini_prompt: "",
    active: true,
    category: "Content Marketing",
    meta_title: "",
    meta_description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await fetchApi("/templates", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      
      toast.success("Template created successfully");
      router.push("/admin/templates");
    } catch (error: any) {
      toast.error(error.message || "Failed to create template");
      setIsSubmitting(false);
    }
  };

  const handleSlugify = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
      <div className="max-w-[1200px] mx-auto">
        
        <form onSubmit={handleSubmit}>
          {/* Breadcrumbs & Title Bar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
            <div>
              <nav className="flex items-center space-x-2 mb-2 text-muted-foreground text-xs font-medium">
                <Link href="/admin/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                <Link href="/admin/templates" className="hover:text-foreground transition-colors">Templates</Link>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                <span className="text-primary">New</span>
              </nav>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Create Template</h1>
            </div>
            
            <div className="flex items-center space-x-4 mt-6 md:mt-0">
              <Link 
                href="/admin/templates"
                className="px-6 py-2 border border-border/50 rounded-lg text-foreground text-sm font-medium hover:bg-secondary/50 transition-all active:scale-95"
              >
                Cancel
              </Link>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:brightness-110 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Template"}
              </button>
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Primary Config */}
            <div className="lg:col-span-2 space-y-8">
              
              <div className="glass-card p-8 rounded-xl shadow-xl">
                <div className="flex items-center space-x-3 mb-6">
                  <svg className="text-primary" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M12 12 2 12"/><path d="M12 12 22 12"/></svg>
                  <h2 className="text-xl font-semibold text-foreground">Template Configuration</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground block">Template Name</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({
                            ...formData, 
                            name: e.target.value,
                            slug: formData.slug ? formData.slug : handleSlugify(e.target.value)
                          });
                        }}
                        className="w-full bg-[#0A0A0A] border border-border/30 rounded-xl p-4 text-foreground focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-sm" 
                        placeholder="e.g. Technical SEO Audit" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground block">URL Slug</label>
                      <div className="flex items-center">
                        <div className="bg-secondary/30 border border-r-0 border-border/30 rounded-l-xl px-4 py-4 text-xs text-muted-foreground flex items-center h-full">/templates/</div>
                        <input 
                          required
                          type="text" 
                          value={formData.slug}
                          onChange={(e) => setFormData({...formData, slug: e.target.value})}
                          className="flex-1 bg-[#0A0A0A] border border-border/30 rounded-r-xl p-4 text-foreground focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-sm" 
                          placeholder="technical-seo" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-muted-foreground block">Gemini System Prompt</label>
                      <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-widest">Supports Markdown</span>
                    </div>
                    <textarea 
                      required
                      value={formData.gemini_prompt}
                      onChange={(e) => setFormData({...formData, gemini_prompt: e.target.value})}
                      className="w-full bg-[#0A0A0A] border border-border/30 rounded-xl p-4 text-foreground focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-sm resize-y" 
                      placeholder="Enter the base AI prompt instructions here..." 
                      rows={8}
                    ></textarea>
                    <p className="text-[11px] text-muted-foreground italic">This is the AI prompt used for generation. Use context-rich variables like {'{{INPUT}}'} for dynamic content.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column: Meta & Status */}
            <div className="space-y-8">
              
              <div className="glass-card p-8 rounded-xl shadow-xl">
                <h3 className="text-lg font-semibold text-foreground mb-6">Status & Category</h3>
                <div className="space-y-6">
                  
                  <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-border/30">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">Template Active</span>
                      <span className="text-[10px] text-muted-foreground">Visible to users</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, active: !formData.active})}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${formData.active ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
                    >
                      <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${formData.active ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground block">Category</label>
                    {isCustomCategory ? (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          required
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="flex-1 bg-[#0A0A0A] border border-border/30 rounded-xl p-4 text-foreground focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-sm"
                          placeholder="Type custom category..."
                          autoFocus
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            setIsCustomCategory(false);
                            setFormData({...formData, category: "Content Marketing"});
                          }}
                          className="px-4 bg-secondary/30 border border-border/30 rounded-xl text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <select 
                          value={formData.category}
                          onChange={(e) => {
                            if (e.target.value === "Other") {
                              setIsCustomCategory(true);
                              setFormData({...formData, category: ""});
                            } else {
                              setFormData({...formData, category: e.target.value});
                            }
                          }}
                          className="w-full bg-[#0A0A0A] border border-border/30 rounded-xl p-4 text-foreground focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-sm appearance-none cursor-pointer"
                        >
                          <option>Content Marketing</option>
                          <option>SEO Automation</option>
                          <option>Social Media</option>
                          <option>Code Generation</option>
                          <option>Email Campaigns</option>
                          <option value="Other">Other (Custom...)</option>
                        </select>
                        <svg className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="glass-card p-8 rounded-xl shadow-xl">
                <div className="flex items-center space-x-3 mb-6">
                  <svg className="text-primary" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                  <h3 className="text-lg font-semibold text-foreground">SEO Metadata</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground block">Meta Title</label>
                    <input 
                      type="text" 
                      value={formData.meta_title}
                      onChange={(e) => setFormData({...formData, meta_title: e.target.value})}
                      className="w-full bg-[#0A0A0A] border border-border/30 rounded-xl p-4 text-foreground focus:ring-1 focus:ring-primary outline-none text-sm" 
                      placeholder="Optimal SEO Title" 
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground italic">Character count: {formData.meta_title.length}/60</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground block">Meta Description</label>
                    <textarea 
                      value={formData.meta_description}
                      onChange={(e) => setFormData({...formData, meta_description: e.target.value})}
                      className="w-full bg-[#0A0A0A] border border-border/30 rounded-xl p-4 text-foreground focus:ring-1 focus:ring-primary outline-none text-sm resize-y" 
                      placeholder="Briefly describe what this template creates..." 
                      rows={4}
                    ></textarea>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground italic">Character count: {formData.meta_description.length}/160</span>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
