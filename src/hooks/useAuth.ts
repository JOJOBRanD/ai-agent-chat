"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { fetchMe } from "@/lib/api";

/**
 * 鉴权 Hook：
 * - 页面加载时调用 GET /api/me 检查登录态
 * - 未登录自动跳转 /login
 * - 返回 { user, isLoading, isAuthenticated }
 */
export function useAuth(options?: { redirectTo?: string }) {
  const { user, isAuthenticated, isLoading, setUser, setLoading } = useAuthStore();
  const router = useRouter();
  const redirectTo = options?.redirectTo ?? "/login";

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        setLoading(true);
        const me = await fetchMe();
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          router.replace(redirectTo);
        }
      }
    }

    checkAuth();
    return () => { cancelled = true; };
  }, [redirectTo, router, setUser, setLoading]);

  return { user, isLoading, isAuthenticated };
}
