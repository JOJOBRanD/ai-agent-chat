import { create } from "zustand";
import { Message, MessageStatus, UserInfo, AgentInfo } from "./types";

// === Auth Store ===
interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: UserInfo | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  updateProfile: (data: Partial<UserInfo>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
  updateProfile: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    })),
}));

// === Chat Store（支持多 Agent 切换） ===
interface ChatState {
  // 当前活跃的 agentId
  currentAgentId: string | null;
  // agentId -> Message[] 的映射
  conversationMap: Record<string, Message[]>;
  isSending: boolean;
  sidebarOpen: boolean;
  theme: "light" | "dark";
  settingsOpen: boolean;

  // Getters
  currentMessages: () => Message[];

  // Agent actions
  setCurrentAgent: (agentId: string) => void;

  // Message actions
  addMessage: (message: Message) => void;
  updateMessageContent: (messageId: string, content: string) => void;
  appendMessageContent: (messageId: string, delta: string) => void;
  setMessageStatus: (messageId: string, status: MessageStatus, errorMessage?: string) => void;
  replaceMessageId: (tempId: string, realId: string) => void;
  setMessages: (agentId: string, messages: Message[]) => void;

  // UI actions
  setIsSending: (sending: boolean) => void;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
  setSettingsOpen: (open: boolean) => void;
}

function getMessages(state: ChatState): Message[] {
  if (!state.currentAgentId) return [];
  return state.conversationMap[state.currentAgentId] || [];
}

function updateMessages(
  state: ChatState,
  updater: (msgs: Message[]) => Message[]
): Partial<ChatState> {
  if (!state.currentAgentId) return {};
  const current = state.conversationMap[state.currentAgentId] || [];
  return {
    conversationMap: {
      ...state.conversationMap,
      [state.currentAgentId]: updater(current),
    },
  };
}

export const useChatStore = create<ChatState>((set, get) => ({
  currentAgentId: null,
  conversationMap: {},
  isSending: false,
  sidebarOpen: true,
  theme: "dark",
  settingsOpen: false,

  currentMessages: () => getMessages(get()),

  setCurrentAgent: (agentId) => set({ currentAgentId: agentId }),

  addMessage: (message) => {
    set((state) => updateMessages(state, (msgs) => [...msgs, message]));
  },

  updateMessageContent: (messageId, content) => {
    set((state) =>
      updateMessages(state, (msgs) =>
        msgs.map((m) => (m.id === messageId ? { ...m, content } : m))
      )
    );
  },

  appendMessageContent: (messageId, delta) => {
    set((state) =>
      updateMessages(state, (msgs) =>
        msgs.map((m) =>
          m.id === messageId ? { ...m, content: m.content + delta } : m
        )
      )
    );
  },

  setMessageStatus: (messageId, status, errorMessage) => {
    set((state) =>
      updateMessages(state, (msgs) =>
        msgs.map((m) =>
          m.id === messageId ? { ...m, status, errorMessage } : m
        )
      )
    );
  },

  replaceMessageId: (tempId, realId) => {
    set((state) =>
      updateMessages(state, (msgs) =>
        msgs.map((m) => (m.id === tempId ? { ...m, id: realId } : m))
      )
    );
  },

  setMessages: (agentId, messages) => {
    set((state) => ({
      conversationMap: {
        ...state.conversationMap,
        [agentId]: messages,
      },
    }));
  },

  setIsSending: (isSending) => set({ isSending }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
  setTheme: (theme) => set({ theme }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
}));
