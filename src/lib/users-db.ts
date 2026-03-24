/**
 * 用户数据库（JSON 文件持久化）
 * - data/users.json   用户 + agent 配置
 * - data/sessions.json 登录 session
 * - data/chats/       聊天记录 (per user per agent)
 * - data/avatars/     用户头像文件
 */

import fs from "fs";
import path from "path";
import type { AgentInfo, Message } from "./types";

export interface UserRecord {
  userId: string;
  username: string;
  password: string;
  displayName: string;
  avatar?: string;            // 头像文件路径 (relative to /data/avatars/)
  role: "admin" | "user";
  agents: AgentInfo[];        // 分配给该用户的 agents
  createdAt: number;
}

// === 路径 ===
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
const CHATS_DIR = path.join(DATA_DIR, "chats");
const AVATARS_DIR = path.join(DATA_DIR, "avatars");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

// 默认 Agent
const DEFAULT_AGENT: AgentInfo = {
  agentId: "main",
  name: "AI Agent",
  description: "General purpose AI assistant",
  avatar: "🤖",
  color: "indigo",
};

// 预置管理员
const DEFAULT_ADMIN: UserRecord = {
  userId: "admin_001",
  username: "Admin",
  password: "ZJM",
  displayName: "Administrator",
  role: "admin",
  agents: [DEFAULT_AGENT],
  createdAt: Date.now(),
};

// === 目录初始化 ===
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function ensureAllDirs(): void {
  ensureDir(DATA_DIR);
  ensureDir(CHATS_DIR);
  ensureDir(AVATARS_DIR);
  ensureDir(UPLOADS_DIR);
}

// === Users 持久化 ===

function loadUsers(): UserRecord[] {
  ensureAllDirs();
  if (!fs.existsSync(USERS_FILE)) {
    const initial = [DEFAULT_ADMIN];
    fs.writeFileSync(USERS_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    const data = JSON.parse(raw) as UserRecord[];
    // 确保管理员始终存在
    if (!data.find((u) => u.userId === "admin_001")) {
      data.unshift(DEFAULT_ADMIN);
      saveUsers(data);
    }
    // 确保每个用户至少有 agents 数组
    let dirty = false;
    for (const u of data) {
      if (!u.agents || u.agents.length === 0) {
        u.agents = [DEFAULT_AGENT];
        dirty = true;
      }
    }
    if (dirty) saveUsers(data);
    return data;
  } catch {
    const initial = [DEFAULT_ADMIN];
    fs.writeFileSync(USERS_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

function saveUsers(users: UserRecord[]): void {
  ensureAllDirs();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

// === Sessions 持久化 ===

function loadSessions(): Record<string, string> {
  ensureAllDirs();
  if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, "{}", "utf-8");
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8"));
  } catch {
    fs.writeFileSync(SESSIONS_FILE, "{}", "utf-8");
    return {};
  }
}

function saveSessions(sessions: Record<string, string>): void {
  ensureAllDirs();
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf-8");
}

// === Chat History 持久化 ===

function chatFilePath(userId: string, agentId: string): string {
  return path.join(CHATS_DIR, `${userId}_${agentId}.json`);
}

export function loadChatHistory(userId: string, agentId: string): Message[] {
  ensureAllDirs();
  const fp = chatFilePath(userId, agentId);
  if (!fs.existsSync(fp)) return [];
  try {
    return JSON.parse(fs.readFileSync(fp, "utf-8"));
  } catch {
    return [];
  }
}

export function saveChatHistory(userId: string, agentId: string, messages: Message[]): void {
  ensureAllDirs();
  fs.writeFileSync(chatFilePath(userId, agentId), JSON.stringify(messages, null, 2), "utf-8");
}

export function appendChatMessage(userId: string, agentId: string, message: Message): void {
  const messages = loadChatHistory(userId, agentId);
  // 如果已存在同 ID 消息则更新
  const idx = messages.findIndex((m) => m.id === message.id);
  if (idx >= 0) {
    messages[idx] = message;
  } else {
    messages.push(message);
  }
  saveChatHistory(userId, agentId, messages);
}

export function updateChatMessage(userId: string, agentId: string, messageId: string, updates: Partial<Message>): void {
  const messages = loadChatHistory(userId, agentId);
  const idx = messages.findIndex((m) => m.id === messageId);
  if (idx >= 0) {
    messages[idx] = { ...messages[idx], ...updates };
    saveChatHistory(userId, agentId, messages);
  }
}

// === 头像文件路径 ===
export function getAvatarDir(): string {
  ensureAllDirs();
  return AVATARS_DIR;
}

export function getUploadsDir(): string {
  ensureAllDirs();
  return UPLOADS_DIR;
}

// === Next user ID ===

function getNextUserId(): string {
  const users = loadUsers();
  let max = 0;
  for (const u of users) {
    const match = u.userId.match(/^user_(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > max) max = num;
    }
  }
  return `user_${String(max + 1).padStart(3, "0")}`;
}

// === CRUD ===

export function findUserByUsername(username: string): UserRecord | undefined {
  const users = loadUsers();
  return users.find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export function findUserById(userId: string): UserRecord | undefined {
  const users = loadUsers();
  return users.find((u) => u.userId === userId);
}

export function authenticateUser(username: string, password: string): UserRecord | null {
  const user = findUserByUsername(username);
  if (!user || user.password !== password) return null;
  return user;
}

export function createSession(username: string): string {
  const token = "sess_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
  const sessions = loadSessions();
  sessions[token] = username;
  saveSessions(sessions);
  return token;
}

export function getUserBySession(token: string): UserRecord | undefined {
  const sessions = loadSessions();
  const username = sessions[token];
  if (!username) return undefined;
  return findUserByUsername(username);
}

export function deleteSession(token: string): void {
  const sessions = loadSessions();
  delete sessions[token];
  saveSessions(sessions);
}

export function getAllUsers(): UserRecord[] {
  const users = loadUsers();
  return users.filter((u) => u.role !== "admin");
}

export function addUser(data: {
  username: string;
  password: string;
  displayName: string;
  agents?: AgentInfo[];
}): UserRecord {
  if (findUserByUsername(data.username)) {
    throw new Error("Username already exists");
  }
  const users = loadUsers();
  const userId = getNextUserId();
  const user: UserRecord = {
    userId,
    username: data.username,
    password: data.password,
    displayName: data.displayName,
    role: "user",
    agents: data.agents && data.agents.length > 0 ? data.agents : [DEFAULT_AGENT],
    createdAt: Date.now(),
  };
  users.push(user);
  saveUsers(users);
  return user;
}

export function updateUser(
  userId: string,
  data: Partial<{
    username: string;
    password: string;
    displayName: string;
    avatar: string;
    agents: AgentInfo[];
  }>
): UserRecord | null {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.userId === userId);
  if (idx === -1) return null;
  if (data.username && data.username !== users[idx].username) {
    if (users.find((u) => u.username.toLowerCase() === data.username!.toLowerCase())) {
      throw new Error("Username already exists");
    }
  }
  users[idx] = { ...users[idx], ...data };
  saveUsers(users);
  return users[idx];
}

export function deleteUser(userId: string): boolean {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.userId === userId && u.role !== "admin");
  if (idx === -1) return false;
  users.splice(idx, 1);
  saveUsers(users);
  return true;
}

// 导出默认 agent 供其他模块使用
export { DEFAULT_AGENT };
