/**
 * Mock 用户数据库（内存存储）
 * 后续对接真实数据库时替换此模块
 */

export interface UserRecord {
  userId: string;
  username: string;
  password: string;
  displayName: string;
  agentName: string;
  role: "admin" | "user";
  createdAt: number;
}

// Session -> username 映射
const sessions = new Map<string, string>();

// 用户数据（预置管理员）
const users: UserRecord[] = [
  {
    userId: "admin_001",
    username: "Admin",
    password: "ZJM",
    displayName: "Administrator",
    agentName: "AI Agent Pro",
    role: "admin",
    createdAt: Date.now(),
  },
];

let nextUserId = 1;

// === CRUD ===

export function findUserByUsername(username: string): UserRecord | undefined {
  return users.find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export function findUserById(userId: string): UserRecord | undefined {
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
  const user: UserRecord = {
    userId: `user_${String(++nextUserId).padStart(3, "0")}`,
    username: data.username,
    password: data.password,
    displayName: data.displayName,
    agentName: data.agentName,
    role: "user",
    createdAt: Date.now(),
  };
  users.push(user);
  return user;
}

export function updateUser(
  userId: string,
  data: Partial<{ username: string; password: string; displayName: string; agentName: string }>
): UserRecord | null {
  const idx = users.findIndex((u) => u.userId === userId);
  if (idx === -1) return null;
  // 如果改用户名，检查重复
  if (data.username && data.username !== users[idx].username) {
    if (findUserByUsername(data.username)) {
      throw new Error("Username already exists");
    }
  }
  users[idx] = { ...users[idx], ...data };
  return users[idx];
}

export function deleteUser(userId: string): boolean {
  const idx = users.findIndex((u) => u.userId === userId && u.role !== "admin");
  if (idx === -1) return false;
  users.splice(idx, 1);
  return true;
}
