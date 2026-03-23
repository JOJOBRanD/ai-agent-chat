/**
 * 用户数据库（JSON 文件持久化）
 * 用户数据保存在项目根目录 data/users.json
 * Session 仍然保存在内存中（重启后需要重新登录）
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

function loadUsers(): UserRecord[] {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    // 首次运行，写入默认管理员
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

// Session -> username 映射（内存，重启后需重新登录）
const sessions = new Map<string, string>();

let nextUserId = 0;

// 初始化 nextUserId
function getNextUserId(): string {
  const users = loadUsers();
  // 找到当前最大的 user_xxx 编号
  let max = 0;
  for (const u of users) {
    const match = u.userId.match(/^user_(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > max) max = num;
    }
  }
  nextUserId = max + 1;
  return `user_${String(nextUserId).padStart(3, "0")}`;
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
  sessions.set(token, username);
  return token;
}

export function getUserBySession(token: string): UserRecord | undefined {
  const username = sessions.get(token);
  if (!username) return undefined;
  return findUserByUsername(username);
}

export function deleteSession(token: string): void {
  sessions.delete(token);
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
