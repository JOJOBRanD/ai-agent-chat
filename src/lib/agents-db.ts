/**
 * Agent pool database (JSON file persistence)
 * - data/agents.json
 */

import fs from "fs";
import path from "path";
import type { AgentInfo } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const AGENTS_FILE = path.join(DATA_DIR, "agents.json");

const DEFAULT_AGENTS: AgentInfo[] = [
  {
    agentId: "main",
    name: "Main",
    description: "Default OpenClaw agent",
    avatar: "🤖",
    color: "indigo",
  },
];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadAgents(): AgentInfo[] {
  ensureDataDir();
  if (!fs.existsSync(AGENTS_FILE)) {
    fs.writeFileSync(AGENTS_FILE, JSON.stringify(DEFAULT_AGENTS, null, 2), "utf-8");
    return structuredClone(DEFAULT_AGENTS);
  }
  try {
    const raw = fs.readFileSync(AGENTS_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      // File exists but is invalid — rewrite with defaults
      fs.writeFileSync(AGENTS_FILE, JSON.stringify(DEFAULT_AGENTS, null, 2), "utf-8");
      return structuredClone(DEFAULT_AGENTS);
    }
    // Allow empty array (user deleted all agents)
    return data as AgentInfo[];
  } catch {
    fs.writeFileSync(AGENTS_FILE, JSON.stringify(DEFAULT_AGENTS, null, 2), "utf-8");
    return structuredClone(DEFAULT_AGENTS);
  }
}

function saveAgents(agents: AgentInfo[]) {
  ensureDataDir();
  fs.writeFileSync(AGENTS_FILE, JSON.stringify(agents, null, 2), "utf-8");
}

export function getAgentPool(): AgentInfo[] {
  return loadAgents();
}

export function upsertAgent(agent: AgentInfo): AgentInfo {
  if (!agent?.agentId || !agent?.name) throw new Error("agentId and name required");
  const agents = loadAgents();
  const idx = agents.findIndex((a) => a.agentId === agent.agentId);
  if (idx >= 0) agents[idx] = { ...agents[idx], ...agent };
  else agents.push(agent);
  saveAgents(agents);
  return agent;
}

export function deleteAgentFromPool(agentId: string): boolean {
  const agents = loadAgents();
  const idx = agents.findIndex((a) => a.agentId === agentId);
  if (idx === -1) return false;
  agents.splice(idx, 1);
  saveAgents(agents);
  return true;
}

export function findAgentInPool(agentId: string): AgentInfo | undefined {
  return loadAgents().find((a) => a.agentId === agentId);
}
