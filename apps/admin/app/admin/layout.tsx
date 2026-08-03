import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShaderBackground } from "@/components/ui/shader-background";
import {
  LayoutDashboard,
  FileText,
  FileBox,
  CheckCircle,
  Settings,
  History,
  DollarSign,
  Activity
} from "lucide-react";
import { SignOutButton } from "@/components/ui/SignOutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Templates", href: "/admin/templates", icon: FileBox },
    { name: "Articles", href: "/admin/articles", icon: FileText },
    { name: "QA Queue", href: "/admin/qa-queue", icon: CheckCircle },
    { name: "Sites Config", href: "/admin/sites", icon: Settings },
    { name: "Publish Log", href: "/admin/publish-log", icon: History },
    { name: "Costs", href: "/admin/costs", icon: DollarSign },
    { name: "Monitoring", href: "/admin/monitoring", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-transparent text-foreground flex relative overflow-hidden">
      {/* Global Animated Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <ShaderBackground />
      </div>

      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border/20 bg-background/40 backdrop-blur-2xl flex flex-col relative z-10">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border/50">
          <Image src="/logo.png" alt="SnapForge" width={28} height={28} className="rounded-md" />
          <span className="font-bold text-lg text-primary tracking-tight">SnapForge</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
              {user.email}
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10">
        {/* Top Header */}
        <header className="h-16 border-b border-border/20 bg-background/20 backdrop-blur-xl flex items-center px-8 sticky top-0 z-20">
          <h1 className="text-sm font-medium text-muted-foreground">Admin Workspace</h1>
        </header>

        {/* Page Content */}
        <div className="p-8 flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
