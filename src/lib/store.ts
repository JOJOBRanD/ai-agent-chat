import { create } from "zustand";
import { Message, MessageStatus, UserInfo } from "./types";

// === Auth Store ===
interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: UserInfo | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // 初始加载态

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
}));

// === Chat Store（单通道） ===
interface ChatState {
  messages: Message[];
  isSending: boolean;       // 发送中（禁用输入）
  sidebarOpen: boolean;
  theme: "light" | "dark";

  // Message actions
  addMessage: (message: Message) => void;
  updateMessageContent: (messageId: string, content: string) => void;
  appendMessageContent: (messageId: string, delta: string) => void;
  setMessageStatus: (messageId: string, status: MessageStatus, errorMessage?: string) => void;
  replaceMessageId: (tempId: string, realId: string) => void;
  setMessages: (messages: Message[]) => void;

  // UI actions
  setIsSending: (sending: boolean) => void;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isSending: false,
  sidebarOpen: true,
  theme: "dark",

  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  updateMessageContent: (messageId, content) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, content } : m
      ),
    }));
  },

  appendMessageContent: (messageId, delta) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, content: m.content + delta } : m
      ),
    }));
  },

  setMessageStatus: (messageId, status, errorMessage) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, status, errorMessage } : m
      ),
    }));
  },

  replaceMessageId: (tempId, realId) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === tempId ? { ...m, id: realId } : m
      ),
    }));
  },

  setMessages: (messages) => set({ messages }),

  setIsSending: (isSending) => set({ isSending }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),

  setTheme: (theme) => set({ theme }),
}));
