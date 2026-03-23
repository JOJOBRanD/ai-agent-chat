import type { UserInfo, Message } from "./types";

const BASE = "";  // same-origin, 走 Next.js API 路由代理

// === 通用 fetch 封装 ===
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 401 || res.status === 403) {
    // 鉴权失败，跳转登录
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("AUTH_REQUIRED");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API Error ${res.status}: ${text}`);
  }

  return res.json();
}

// === 登录 ===
export async function login(username: string, password: string): Promise<UserInfo> {
  return apiFetch<UserInfo>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

// === 登出 ===
export async function logout(): Promise<void> {
  await fetch(`${BASE}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

// === 获取当前用户信息 ===
export async function fetchMe(): Promise<UserInfo> {
  return apiFetch<UserInfo>("/api/me");
}

// === 获取聊天历史 ===
export async function fetchChatHistory(): Promise<Message[]> {
  return apiFetch<Message[]>("/api/chat/history");
}
