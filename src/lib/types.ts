// === 消息状态机 ===
export type MessageStatus = "sending" | "streaming" | "done" | "error" | "interrupted";

// === 消息 ===
export interface Message {
  id: string;               // 本地临时 ID 或后端返回的 messageId
  role: "user" | "assistant";
  content: string;
  status: MessageStatus;
  timestamp: number;
  errorMessage?: string;    // error 状态时的提示文案
}

// === 用户信息（GET /api/me 返回） ===
export interface UserInfo {
  userId: string;
  username: string;
  displayName: string;
  agentName: string;        // 绑定的 agent 展示名
  agentAvatar?: string;     // agent 头像
}

// === SSE 事件类型 ===
export type SSEEventType =
  | "assistant_start"
  | "assistant_delta"
  | "assistant_final"
  | "error"
  | "done";

// === SSE 事件 payload ===
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
