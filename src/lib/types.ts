// === 消息状态机 ===
export type MessageStatus = "sending" | "streaming" | "done" | "error" | "interrupted";

// === 附件 ===
export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;            // /api/uploads/xxx
  previewUrl?: string;    // 缩略图（图片才有）
}

// === 消息 ===
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: MessageStatus;
  timestamp: number;
  errorMessage?: string;
  attachments?: Attachment[];
}

// === 用户角色 ===
export type UserRole = "admin" | "user";

// === Agent 定义 ===
export interface AgentInfo {
  agentId: string;
  name: string;
  description?: string;
  avatar?: string;    // emoji or url
  color?: string;     // gradient color key
}

// === 用户信息（GET /api/me 返回） ===
export interface UserInfo {
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;        // 用户头像 URL
  role: UserRole;
  agents: AgentInfo[];    // 该用户可用的 agent 列表
}

// === 管理用户列表项 ===
export interface ManagedUser {
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  agents: AgentInfo[];
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
