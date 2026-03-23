// === 消息状态机 ===
export type MessageStatus = "sending" | "streaming" | "done" | "error" | "interrupted";

// === 消息 ===
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: MessageStatus;
  timestamp: number;
  errorMessage?: string;
}

// === 用户角色 ===
export type UserRole = "admin" | "user";

// === 用户信息（GET /api/me 返回） ===
export interface UserInfo {
  userId: string;
  username: string;
  displayName: string;
  agentName: string;
  agentAvatar?: string;
  role: UserRole;
}

// === 管理用户列表项 ===
export interface ManagedUser {
  userId: string;
  username: string;
  displayName: string;
  agentName: string;
  createdAt: number;
}

// === SSE 事件类型 ===
export type SSEEventType =
  | "assistant_start"
  | "assistant_delta"
  | "assistant_final"
  | "error"
  | "done";

export interface SSEAssistantStart {
  messageId: string;
  createdAt: number;
}

export interface SSEAssistantDelta {
  messageId: string;
  delta: string;
}

export interface SSEAssistantFinal {
  messageId: string;
  content: string;
  usage?: Record<string, number>;
}

export interface SSEError {
  message: string;
  code: string;
}

export interface SSEDone {
  ok: boolean;
}
