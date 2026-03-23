import type { UserInfo, Message } from "./types";

const BASE = "";

// === 通用 fetch 封装 ===
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 401 || res.status === 403) {
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

// === Auth ===
export async function login(username: string, password: string): Promise<UserInfo> {
  return apiFetch<UserInfo>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function logout(): Promise<void> {
  await fetch(`${BASE}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function fetchMe(): Promise<UserInfo> {
  return apiFetch<UserInfo>("/api/me");
}

// === Chat History (per agent) ===
export async function fetchChatHistory(agentId: string): Promise<Message[]> {
  return apiFetch<Message[]>(`/api/chat/history?agentId=${agentId}`);
}

export async function saveChatMessages(agentId: string, messages: Message[]): Promise<void> {
  await apiFetch<void>("/api/chat/history", {
    method: "POST",
    body: JSON.stringify({ agentId, messages }),
  });
}

// === Profile ===
export async function updateProfile(data: {
  displayName?: string;
  avatar?: string;
}): Promise<UserInfo> {
  return apiFetch<UserInfo>("/api/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// === Upload avatar ===
export async function uploadAvatar(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload/avatar", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

// === Upload file/image for chat ===
export async function uploadFile(file: File): Promise<{
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  previewUrl?: string;
}> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload/file", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}
