"use client";

import { useState } from "react";
import { useTemplates } from "@/lib/hooks/use-data";
import Link from "next/link";
import { formatDistanceToNow, subDays, isAfter } from "date-fns";

export default function TemplatesPage() {
  const { data, isLoading, isError } = useTemplates();
  const templates = data?.data || [];
  
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "drafts">("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredTemplates = templates.filter((t: any) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "active") return t.active;
    if (filterStatus === "drafts") return !t.active;
    return true;
  });

  const templatesLast7Days = templates.filter((t: any) => 
    isAfter(new Date(t.created_at || t.updated_at), subDays(new Date(), 7))
  ).length;

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
      <div className="max-w-[1440px] mx-auto">
        {/* Breadcrumbs & Header */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-muted-foreground text-[12px] mb-2">
            <span>Dashboard</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            <span className="text-foreground font-medium">Templates</span>
          </nav>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground tracking-tight">Templates</h2>
              <p className="text-muted-foreground mt-1">Manage and configure your global content blueprints.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors active:scale-95 text-foreground ${isFilterOpen || filterStatus !== 'all' ? 'border-primary/50 bg-primary/10' : 'border-border/50 hover:bg-secondary/50'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  <span className="text-sm font-medium">
                    {filterStatus === "all" ? "Filter" : filterStatus === "active" ? "Active Only" : "Drafts Only"}
                  </span>
                </button>
                
                {isFilterOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-surface-container border border-border/30 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-1">
                      <button 
                        onClick={() => { setFilterStatus("all"); setIsFilterOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white/5 transition-colors ${filterStatus === 'all' ? 'text-primary bg-primary/5' : 'text-foreground'}`}
                      >
                        All Templates
                      </button>
                      <button 
                        onClick={() => { setFilterStatus("active"); setIsFilterOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white/5 transition-colors ${filterStatus === 'active' ? 'text-green-400 bg-green-500/10' : 'text-foreground'}`}
                      >
                        Active Only
                      </button>
                      <button 
                        onClick={() => { setFilterStatus("drafts"); setIsFilterOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white/5 transition-colors ${filterStatus === 'drafts' ? 'text-orange-400 bg-orange-500/10' : 'text-foreground'}`}
                      >
                        Drafts Only
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <Link 
                href="/admin/templates/new"
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm font-semibold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>Create Template</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-semibold mb-1">Total Templates</p>
              <p className="text-3xl font-bold">{isLoading ? "..." : templates.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
          </div>
          <div className="glass-card p-6 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-semibold mb-1">Active</p>
              <p className="text-3xl font-bold">{isLoading ? "..." : templates.filter((t: any) => t.active).length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
          </div>
          <div className="glass-card p-6 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-semibold mb-1">Drafts</p>
              <p className="text-3xl font-bold">{isLoading ? "..." : templates.filter((t: any) => !t.active).length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3"/><polyline points="14 2 14 8 20 8"/><path d="M9 13v-1h5v1"/><path d="M12 17v-1h2v1"/></svg>
            </div>
          </div>
          <div className="glass-card p-6 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-semibold mb-1">New This Week</p>
              <p className="text-3xl font-bold">{isLoading ? "..." : templatesLast7Days}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            </div>
          </div>
        </div>

        {/* Main Data Table Container */}
        <section className="glass-card rounded-xl shadow-2xl overflow-hidden mb-16">
          <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between bg-white/5">
            <h3 className="text-lg font-semibold text-foreground">Recent Templates</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-2">Showing {filteredTemplates.length} templates</span>
            </div>
          </div>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/20">
                <th className="px-6 py-4 text-muted-foreground uppercase tracking-wider text-[11px] font-semibold border-b border-border/20">Template Name & Slug</th>
                <th className="px-6 py-4 text-muted-foreground uppercase tracking-wider text-[11px] font-semibold border-b border-border/20">Category</th>
                <th className="px-6 py-4 text-muted-foreground uppercase tracking-wider text-[11px] font-semibold border-b border-border/20">Status</th>
                <th className="px-6 py-4 text-muted-foreground uppercase tracking-wider text-[11px] font-semibold border-b border-border/20">Updated</th>
                <th className="px-6 py-4 text-muted-foreground uppercase tracking-wider text-[11px] font-semibold border-b border-border/20 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">
                    Loading templates...
                  </td>
                </tr>
              ) : filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      </div>
                      <p className="text-foreground font-medium mb-1">No templates found</p>
                      <p className="text-sm text-muted-foreground">Get started by creating a new template blueprint.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template: any) => (
                  <tr key={template.id} className="group hover:bg-secondary/10 transition-colors cursor-pointer">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{template.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{template.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-secondary/30 border border-border/30 rounded-full text-xs font-medium text-muted-foreground">
                        {template.category || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {template.active ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full w-fit border border-green-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full w-fit border border-border/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 font-medium text-foreground text-sm">
                      {template.updated_at ? formatDistanceToNow(new Date(template.updated_at), { addSuffix: true }) : "-"}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/templates/${template.id}`} className="p-2 hover:bg-secondary/50 rounded-lg text-muted-foreground hover:text-foreground transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z"/></svg>
                        </Link>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if(confirm("Are you sure you want to delete this template?")) {
                              // Use the API we just created!
                              fetch(`/api/v1/templates/${template.id}`, { method: 'DELETE' }).then(() => window.location.reload());
                            }
                          }}
                          className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
