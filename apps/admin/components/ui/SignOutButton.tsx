"use client";

import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      router.refresh();
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="mt-2 flex items-center w-full gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
      Sign Out
    </button>
  );
}
