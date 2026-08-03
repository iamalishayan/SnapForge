"use client";

import { ShaderBackground } from "@/components/ui/shader-background";
import { createClient } from "@/lib/supabase-browser";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/admin/dashboard");
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-background text-foreground text-sm overflow-hidden antialiased selection:bg-primary selection:text-primary-foreground min-h-screen flex flex-col">
      
      {/* Full Page Shader Background */}
      <div className="absolute inset-0 z-0">
        <ShaderBackground />
        {/* Ambient Dark Overlay to ensure form readability over the full screen shader */}
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px]"></div>
      </div>

      {/* Top Navigation */}
      <header className="relative z-50 w-full flex justify-between items-center px-6 md:px-10 py-4">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="SnapForge Logo" width={36} height={36} className="rounded-md" />
          <div className="font-bold text-2xl tracking-tighter text-primary">SnapForge</div>
        </div>
        <div className="hidden md:flex gap-6 items-center">
          <Link
            className="text-muted-foreground hover:text-primary transition-colors duration-200"
            href="#"
          >
            Support
          </Link>
          <Link
            className="text-muted-foreground hover:text-primary transition-colors duration-200"
            href="#"
          >
            Documentation
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-col md:flex-row flex-1 w-full">
        {/* Left Panel: Visual Experience */}
        <section className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 md:p-10 mt-12 md:mt-0">
          <div className="flex flex-col items-center text-center max-w-xl">
            {/* 3D Graphic */}
            <h1 className="font-extrabold text-3xl md:text-5xl text-primary leading-tight mb-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              The Next Generation AI Forge
            </h1>
            <p className="text-base md:text-lg text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              Manage enterprise translation workflows, review AI-generated content, and publish seamlessly across your global sites.
            </p>
          </div>
        </section>

        {/* Right Panel: Authentication */}
        <section className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-10">
          {/* Login Container */}
          <div 
            className="p-6 md:p-12 rounded-xl w-full max-w-[460px] animate-fade-in-up shadow-2xl" 
            style={{ 
              animationDelay: "0.3s",
              background: "rgba(24, 24, 27, 0.6)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)"
            }}
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-8 gap-2">
              <h2 className="font-bold text-3xl text-primary">Welcome Back</h2>
              <span className="text-muted-foreground text-sm">
                New here?{" "}
                <Link className="text-primary font-bold hover:underline" href="#">
                  Sign up
                </Link>
              </span>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/50 text-red-500 text-sm">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleEmailSignIn}>
              {/* Email Field */}
              <div className="space-y-1.5">
                <label
                  className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-background/50 border border-border/50 text-foreground px-4 py-3 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-300 placeholder:text-muted-foreground/50 backdrop-blur-sm"
                    id="email"
                    placeholder="name@company.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label
                    className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <button
                    className="text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    className="w-full bg-background/50 border border-border/50 text-foreground px-4 py-3 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-300 placeholder:text-muted-foreground/50 backdrop-blur-sm"
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between text-sm py-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    className="rounded border-border/50 bg-transparent text-primary focus:ring-0 focus:ring-offset-0 transition-all"
                    type="checkbox"
                  />
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">
                    Remember me
                  </span>
                </label>
                <Link className="text-primary hover:underline text-sm" href="#">
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-md active:scale-[0.98] transition-all duration-200 hover:opacity-90 mt-2 disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-[#18181b] px-4 text-muted-foreground rounded">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleOAuthSignIn("google")}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 border border-border/50 rounded-md hover:bg-secondary/50 transition-all group backdrop-blur-sm bg-background/30 disabled:opacity-50"
              >
                <svg
                  className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.248 1.248-3.224 2.592-7.392 2.592-6.528 0-11.592-5.28-11.592-11.808 0-6.528 5.064-11.808 11.592-11.808 3.528 0 6.144 1.392 8.016 3.168l2.304-2.304c-2.424-2.328-5.64-4.104-10.32-4.104-8.832 0-16 7.168-16 16s7.168 16 16 16c4.776 0 8.352-1.584 11.136-4.512 2.88-2.88 3.792-6.912 3.792-10.272 0-.984-.072-1.92-.216-2.832h-14.712z"></path>
                </svg>
                <span className="text-foreground text-sm">Google</span>
              </button>
              <button 
                onClick={() => handleOAuthSignIn("github")}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 border border-border/50 rounded-md hover:bg-secondary/50 transition-all group backdrop-blur-sm bg-background/30 disabled:opacity-50"
              >
                <svg
                  className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path>
                </svg>
                <span className="text-foreground text-sm">GitHub</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-50 w-full flex flex-col md:flex-row justify-between items-center px-6 md:px-10 py-4 text-muted-foreground text-xs uppercase tracking-widest bg-background/30 backdrop-blur-md">
        <div className="font-bold text-primary mb-2 md:mb-0">
          © 2024 SnapForge.
        </div>
        <div className="flex gap-6">
          <Link className="hover:text-primary transition-colors" href="#">
            Privacy Policy
          </Link>
          <Link className="hover:text-primary transition-colors" href="#">
            Terms of Service
          </Link>
          <Link className="hover:text-primary transition-colors" href="#">
            Security
          </Link>
        </div>
      </footer>
    </div>
  );
}
