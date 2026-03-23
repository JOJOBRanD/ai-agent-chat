"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Eye, EyeOff, Loader2 } from "lucide-react";
import { login } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!username.trim() || !password.trim()) return;

      setError("");
      setLoading(true);

      try {
        const user = await login(username.trim(), password);
        setUser(user);
        // Admin goes to /admin, regular users go to /chat
        if (user.role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/chat");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Login failed";
        setError(msg.includes("401") ? "Invalid username or password" : msg);
      } finally {
        setLoading(false);
      }
    },
    [username, password, router, setUser]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Ambient gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[600px] h-[600px] rounded-full
                        bg-gradient-to-br from-indigo-500/[0.07] to-purple-500/[0.05] blur-3xl" />
        <div className="absolute -bottom-[30%] -right-[10%] w-[500px] h-[500px] rounded-full
                        bg-gradient-to-br from-pink-500/[0.05] to-orange-500/[0.03] blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-[380px] relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mx-auto w-16 h-16 rounded-[18px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
                        flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-5
                        ring-1 ring-white/20"
          >
            <Zap size={26} className="text-white" />
          </motion.div>
          <h1 className="text-[22px] font-bold gradient-text tracking-tight">AI Agent</h1>
          <p className="text-sm text-muted-foreground/60 mt-1.5">Sign in to continue</p>
        </div>

        {/* Glass card form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/60 dark:bg-white/[0.04] backdrop-blur-2xl rounded-3xl
                     border border-black/[0.06] dark:border-white/[0.08]
                     shadow-[0_8px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)]
                     p-7"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground/70 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                className="w-full px-4 py-3 rounded-xl
                           bg-black/[0.03] dark:bg-white/[0.06]
                           border border-black/[0.06] dark:border-white/[0.08]
                           text-[15px] text-foreground placeholder:text-muted-foreground/35
                           focus:outline-none focus:border-primary/40
                           focus:shadow-[0_0_0_3px_rgba(0,113,227,0.08)]
                           dark:focus:shadow-[0_0_0_3px_rgba(41,151,255,0.12)]
                           transition-all duration-200"
                placeholder="Enter your username"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground/70 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl
                             bg-black/[0.03] dark:bg-white/[0.06]
                             border border-black/[0.06] dark:border-white/[0.08]
                             text-[15px] text-foreground placeholder:text-muted-foreground/35
                             focus:outline-none focus:border-primary/40
                             focus:shadow-[0_0_0_3px_rgba(0,113,227,0.08)]
                             dark:focus:shadow-[0_0_0_3px_rgba(41,151,255,0.12)]
                             transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40
                             hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 bg-red-500/10 px-4 py-2.5 rounded-xl
                           border border-red-500/15"
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="w-full py-3 rounded-xl text-[15px] font-semibold
                         bg-primary text-primary-foreground
                         shadow-lg shadow-primary/25
                         hover:shadow-xl hover:shadow-primary/30
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-300
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Footer text */}
        <p className="text-center text-[10px] text-muted-foreground/30 mt-5 tracking-wide">
          Powered by AI Agent · Secured Connection
        </p>
      </motion.div>
    </div>
  );
}
