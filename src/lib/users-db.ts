/**
 * 用户数据库（JSON 文件持久化）
 * 用户数据保存在 data/users.json
 * Session 保存在 data/sessions.json（服务重启不丢失登录状态）
 */

import fs from "fs";
import path from "path";

export interface UserRecord {
  userId: string;
  username: string;
  password: string;
  displayName: string;
  agentName: string;
  role: "admin" | "user";
  createdAt: number;
}

// === 文件持久化 ===

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

// 预置管理员
const DEFAULT_ADMIN: UserRecord = {
  userId: "admin_001",
  username: "Admin",
  password: "ZJM",
  displayName: "Administrator",
  agentName: "AI Agent Pro",
  role: "admin",
  createdAt: Date.now(),
};

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// --- Users ---

function loadUsers(): UserRecord[] {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    const initial = [DEFAULT_ADMIN];
    fs.writeFileSync(USERS_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    const data = JSON.parse(raw) as UserRecord[];
    if (!data.find((u) => u.userId === "admin_001")) {
      data.unshift(DEFAULT_ADMIN);
      saveUsers(data);
    }
    return data;
  } catch {
    const initial = [DEFAULT_ADMIN];
    fs.writeFileSync(USERS_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

function saveUsers(users: UserRecord[]): void {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

// --- Sessions (也持久化到文件) ---

function loadSessions(): Record<string, string> {
  ensureDataDir();
  if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, "{}", "utf-8");
    return {};
  }
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, "utf-8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    fs.writeFileSync(SESSIONS_FILE, "{}", "utf-8");
    return {};
  }
}

function saveSessions(sessions: Record<string, string>): void {
  ensureDataDir();
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf-8");
}

// --- Next user ID ---

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
  agentName: string;
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
    agentName: data.agentName,
    role: "user",
    createdAt: Date.now(),
  };
  users.push(user);
  saveUsers(users);
  return user;
}

export function updateUser(
  userId: string,
  data: Partial<{ username: string; password: string; displayName: string; agentName: string }>
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
