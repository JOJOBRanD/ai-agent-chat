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
        router.replace("/chat");
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
                          flex items-center justify-center shadow-2xl shadow-indigo-500/25 mb-4">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold gradient-text">AI Agent</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card
                         text-sm text-foreground placeholder:text-muted-foreground/40
                         focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10
                         transition-all"
              placeholder="Enter your username"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-border bg-card
                           text-sm text-foreground placeholder:text-muted-foreground/40
                           focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10
                           transition-all"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground
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
              className="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-lg"
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
            className="w-full py-2.5 rounded-xl text-sm font-medium
                       bg-primary text-primary-foreground
                       shadow-md shadow-primary/25
                       hover:shadow-lg hover:shadow-primary/30
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200
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
    </div>
  );
}
