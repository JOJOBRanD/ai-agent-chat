"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Plus, Trash2, Edit3, Save, X, Users,
  LogOut, ArrowLeft, Loader2, Eye, EyeOff, Bot,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { fetchMe, logout } from "@/lib/api";
import { ManagedUser, AgentInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

const AGENT_EMOJIS = ["🤖", "🧠", "💡", "🎨", "📊", "🔧", "🚀", "🌟", "🎯", "📝"];
const AGENT_COLORS = ["indigo", "blue", "green", "orange", "pink", "red", "teal", "violet"];

export default function AdminPage() {
  const router = useRouter();
  const { user, setUser, logout: clearAuth } = useAuthStore();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // User form
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formDisplayName, setFormDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Agent form (for the user being added/edited)
  const [formAgents, setFormAgents] = useState<AgentInfo[]>([
    { agentId: "agent_default", name: "AI Agent", avatar: "🤖", color: "indigo", description: "General purpose AI" },
  ]);

  // Auth check
  useEffect(() => {
    async function check() {
      try {
        const me = await fetchMe();
        setUser(me);
        if (me.role !== "admin") { router.replace("/chat"); return; }
        await loadUsers();
      } catch { router.replace("/login"); }
    }
    check();
  }, [router, setUser]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (res.ok) setUsers(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleAdd = useCallback(async () => {
    setError("");
    if (!formUsername || !formPassword) { setError("Username and password are required"); return; }
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: formUsername,
          password: formPassword,
          displayName: formDisplayName || formUsername,
          agents: formAgents.map((a) => ({
            ...a,
            agentId: a.agentId || `agent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          })),
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
      setShowAddForm(false);
      resetForm();
      await loadUsers();
    } catch { setError("Network error"); }
  }, [formUsername, formPassword, formDisplayName, formAgents]);

  const handleUpdate = useCallback(async (userId: string) => {
    setError("");
    try {
      const body: Record<string, unknown> = { userId };
      if (formDisplayName) body.displayName = formDisplayName;
      if (formPassword) body.password = formPassword;
      body.agents = formAgents.map((a) => ({
        ...a,
        agentId: a.agentId || `agent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      }));

      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
      setEditingId(null);
      resetForm();
      await loadUsers();
    } catch { setError("Network error"); }
  }, [formDisplayName, formPassword, formAgents]);

  const handleDelete = useCallback(async (userId: string) => {
    try {
      await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      await loadUsers();
    } catch { /* ignore */ }
  }, []);

  const handleLogout = async () => {
    try { await logout(); } catch {}
    clearAuth();
    router.replace("/login");
  };

  const resetForm = () => {
    setFormUsername(""); setFormPassword(""); setFormDisplayName("");
    setShowPassword(false); setError("");
    setFormAgents([{ agentId: "", name: "AI Agent", avatar: "🤖", color: "indigo", description: "General purpose AI" }]);
  };

  const startEdit = (u: ManagedUser) => {
    setEditingId(u.userId);
    setFormDisplayName(u.displayName);
    setFormPassword("");
    setFormAgents(u.agents && u.agents.length > 0
      ? u.agents
      : [{ agentId: "agent_default", name: "AI Agent", avatar: "🤖", color: "indigo" }]);
    setShowAddForm(false);
    setError("");
  };

  // Agent form helpers
  const addAgent = () => {
    setFormAgents((prev) => [...prev, {
      agentId: "",
      name: "",
      avatar: AGENT_EMOJIS[prev.length % AGENT_EMOJIS.length],
      color: AGENT_COLORS[prev.length % AGENT_COLORS.length],
      description: "",
    }]);
  };

  const removeAgent = (idx: number) => {
    setFormAgents((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateAgent = (idx: number, field: keyof AgentInfo, value: string) => {
    setFormAgents((prev) => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="glass border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600
                            flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">Admin Console</h1>
              <p className="text-[11px] text-muted-foreground">Manage users and agents</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/chat")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground
                         hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors">
              <ArrowLeft size={14} /> Chat
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground
                         hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glass rounded-2xl border border-border/50 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{users.length}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-2xl border border-border/50 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Bot size={20} className="text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {users.reduce((sum, u) => sum + (u.agents?.length || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Agents</p>
              </div>
            </div>
          </div>
        </div>

        {/* Header + Add button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">User Management</h2>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); resetForm(); }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium
                       bg-primary text-primary-foreground rounded-xl
                       shadow-md shadow-primary/20 hover:shadow-lg transition-all">
            <Plus size={14} /> Add User
          </motion.button>
        </div>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-500 text-xs border border-red-500/20">
            {error}
          </motion.div>
        )}

        {/* Add User Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
              <div className="glass rounded-2xl border border-border/50 p-5 space-y-4">
                <p className="text-xs font-semibold text-foreground">Create New User</p>
                <div className="grid grid-cols-2 gap-3">
                  <input value={formUsername} onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="Username *" className="admin-input" />
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"}
                      value={formPassword} onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Password *" className="admin-input pr-9" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <input value={formDisplayName} onChange={(e) => setFormDisplayName(e.target.value)}
                    placeholder="Display Name" className="admin-input col-span-2" />
                </div>

                {/* Agents section */}
                <AgentFormSection
                  agents={formAgents}
                  onAdd={addAgent}
                  onRemove={removeAgent}
                  onUpdate={updateAgent}
                />

                <div className="flex gap-2 pt-1">
                  <button onClick={handleAdd}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium
                               bg-primary text-primary-foreground rounded-lg shadow-sm">
                    <Save size={13} /> Create
                  </button>
                  <button onClick={() => { setShowAddForm(false); resetForm(); }}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs text-muted-foreground
                               hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors">
                    <X size={13} /> Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <Users size={40} className="mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground/50">No users yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <motion.div key={u.userId} layout
                className="glass rounded-2xl border border-border/50 p-4">
                {editingId === u.userId ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <input value={formDisplayName} onChange={(e) => setFormDisplayName(e.target.value)}
                        placeholder="Display Name" className="admin-input" />
                      <input type="password" value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="New password (optional)" className="admin-input" />
                    </div>
                    <AgentFormSection
                      agents={formAgents}
                      onAdd={addAgent}
                      onRemove={removeAgent}
                      onUpdate={updateAgent}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(u.userId)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary
                                   text-primary-foreground rounded-lg">
                        <Save size={12} /> Save
                      </button>
                      <button onClick={() => { setEditingId(null); resetForm(); }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-muted-foreground
                                   hover:text-foreground rounded-lg hover:bg-muted/50">
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="w-full h-full rounded-xl object-cover" />
                        ) : (
                          <span className="text-sm font-semibold text-primary">
                            {u.displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.displayName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">@{u.username}</span>
                          <span className="text-[10px] text-muted-foreground/40">·</span>
                          <div className="flex items-center gap-1">
                            {(u.agents || []).map((a) => (
                              <span key={a.agentId} className="text-sm" title={a.name}>
                                {a.avatar || "🤖"}
                              </span>
                            ))}
                          </div>
                          <span className="text-[10px] text-muted-foreground/40">
                            {(u.agents || []).length} agent{(u.agents || []).length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(u)}
                        className="p-2 text-muted-foreground hover:text-foreground
                                   rounded-lg hover:bg-muted/50 transition-colors">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(u.userId)}
                        className="p-2 text-muted-foreground hover:text-red-500
                                   rounded-lg hover:bg-red-500/10 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Agent form sub-component
function AgentFormSection({
  agents,
  onAdd,
  onRemove,
  onUpdate,
}: {
  agents: AgentInfo[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onUpdate: (idx: number, field: keyof AgentInfo, value: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Agents ({agents.length})
        </p>
        <button onClick={onAdd}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-primary
                     hover:bg-primary/10 rounded-lg transition-colors">
          <Plus size={11} /> Add Agent
        </button>
      </div>
      <div className="space-y-2">
        {agents.map((agent, idx) => (
          <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl
                                     bg-black/[0.02] dark:bg-white/[0.03]
                                     border border-black/[0.04] dark:border-white/[0.05]">
            {/* Emoji selector */}
            <select
              value={agent.avatar || "🤖"}
              onChange={(e) => onUpdate(idx, "avatar", e.target.value)}
              className="w-10 text-center text-lg bg-transparent cursor-pointer
                         focus:outline-none appearance-none"
            >
              {AGENT_EMOJIS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            <input
              value={agent.name}
              onChange={(e) => onUpdate(idx, "name", e.target.value)}
              placeholder="Agent name"
              className="flex-1 px-2 py-1 text-xs bg-transparent border-0 focus:outline-none
                         text-foreground placeholder:text-muted-foreground/40"
            />
            <input
              value={agent.description || ""}
              onChange={(e) => onUpdate(idx, "description", e.target.value)}
              placeholder="Description"
              className="flex-1 px-2 py-1 text-xs bg-transparent border-0 focus:outline-none
                         text-muted-foreground placeholder:text-muted-foreground/30"
            />
            <select
              value={agent.color || "indigo"}
              onChange={(e) => onUpdate(idx, "color", e.target.value)}
              className="px-1 py-1 text-[10px] bg-transparent border-0 focus:outline-none
                         text-muted-foreground cursor-pointer"
            >
              {AGENT_COLORS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {agents.length > 1 && (
              <button onClick={() => onRemove(idx)}
                className="p-1 text-muted-foreground/40 hover:text-red-500 transition-colors">
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
