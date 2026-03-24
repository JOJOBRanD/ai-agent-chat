"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Plus, Trash2, Edit3, Save, X, Users,
  LogOut, ArrowLeft, Loader2, Eye, EyeOff, Bot,
  Camera, User, ChevronDown, ChevronUp, Globe, Key,
  Check,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import {
  fetchMe, logout, uploadAvatar, uploadAgentAvatar,
  fetchAgentPool, upsertAgentPool, deleteAgentPool,
} from "@/lib/api";
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

  // Selected agent IDs for user form
  const [formSelectedAgentIds, setFormSelectedAgentIds] = useState<string[]>([]);

  // Admin self-config
  const [adminExpanded, setAdminExpanded] = useState(false);
  const [adminDisplayName, setAdminDisplayName] = useState("");
  const [adminSelectedAgentIds, setAdminSelectedAgentIds] = useState<string[]>([]);
  const [adminAvatarPreview, setAdminAvatarPreview] = useState<string | null>(null);
  const [adminUploading, setAdminUploading] = useState(false);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminError, setAdminError] = useState("");
  const adminFileRef = useRef<HTMLInputElement>(null);

  // === Agent Pool (global agent list) ===
  const [agentPool, setAgentPool] = useState<AgentInfo[]>([]);
  const [agentPoolLoading, setAgentPoolLoading] = useState(false);
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [agentForm, setAgentForm] = useState<AgentInfo>({
    agentId: "", name: "", description: "", avatar: "🤖", color: "indigo", gateway: "", token: "",
  });
  const [agentError, setAgentError] = useState("");
  const [agentSaving, setAgentSaving] = useState(false);

  // Auth check
  useEffect(() => {
    async function check() {
      try {
        const me = await fetchMe();
        setUser(me);
        if (me.role !== "admin") { router.replace("/chat"); return; }
        setAdminDisplayName(me.displayName || "");
        setAdminSelectedAgentIds((me.agents || []).map((a) => a.agentId));
        await Promise.all([loadUsers(), loadAgentPool()]);
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

  const loadAgentPool = useCallback(async () => {
    setAgentPoolLoading(true);
    try {
      const pool = await fetchAgentPool();
      if (Array.isArray(pool)) {
        setAgentPool(pool);
      } else {
        console.error("[Admin] fetchAgentPool returned non-array:", pool);
      }
    } catch (err) {
      console.error("[Admin] Failed to load agent pool:", err);
    }
    setAgentPoolLoading(false);
  }, []);

  // === Agent pool CRUD ===
  const resetAgentForm = () => {
    setAgentForm({ agentId: "", name: "", description: "", avatar: "🤖", color: "indigo", gateway: "", token: "" });
    setAgentError("");
    setEditingAgentId(null);
    setShowAgentForm(false);
  };

  const handleSaveAgent = useCallback(async () => {
    setAgentError("");
    if (!agentForm.name.trim()) { setAgentError("Agent name is required"); return; }
    if (!agentForm.gateway?.trim()) { setAgentError("Gateway URL is required"); return; }
    setAgentSaving(true);
    try {
      const data: AgentInfo = {
        ...agentForm,
        agentId: editingAgentId || agentForm.agentId || `agent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      };
      await upsertAgentPool(data);
      resetAgentForm();
      await loadAgentPool();
    } catch (e: any) {
      setAgentError(e?.message || "Failed to save agent");
    }
    setAgentSaving(false);
  }, [agentForm, editingAgentId, loadAgentPool]);

  const handleDeleteAgent = useCallback(async (agentId: string) => {
    try {
      await deleteAgentPool(agentId);
      await loadAgentPool();
    } catch { /* ignore */ }
  }, [loadAgentPool]);

  const startEditAgent = (agent: AgentInfo) => {
    setEditingAgentId(agent.agentId);
    setAgentForm({ ...agent });
    setShowAgentForm(true);
    setAgentError("");
  };

  // === User CRUD ===
  const handleAdd = useCallback(async () => {
    setError("");
    if (!formUsername || !formPassword) { setError("Username and password are required"); return; }
    if (formSelectedAgentIds.length === 0) { setError("Select at least one agent"); return; }
    try {
      const selectedAgents = agentPool.filter((a) => formSelectedAgentIds.includes(a.agentId));
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: formUsername,
          password: formPassword,
          displayName: formDisplayName || formUsername,
          agents: selectedAgents,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
      setShowAddForm(false);
      resetForm();
      await loadUsers();
    } catch { setError("Network error"); }
  }, [formUsername, formPassword, formDisplayName, formSelectedAgentIds, agentPool]);

  const handleUpdate = useCallback(async (userId: string) => {
    setError("");
    try {
      const selectedAgents = agentPool.filter((a) => formSelectedAgentIds.includes(a.agentId));
      const body: Record<string, unknown> = { userId };
      if (formDisplayName) body.displayName = formDisplayName;
      if (formPassword) body.password = formPassword;
      body.agents = selectedAgents;

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
  }, [formDisplayName, formPassword, formSelectedAgentIds, agentPool]);

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

  // === Admin self-config ===
  const handleAdminAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAdminAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    setAdminUploading(true);
    setAdminError("");
    try {
      const { url } = await uploadAvatar(file);
      const { updateProfile: updateLocalProfile } = useAuthStore.getState();
      updateLocalProfile({ avatar: url });
    } catch {
      setAdminError("Avatar upload failed");
    }
    setAdminUploading(false);
  };

  const handleAdminSave = useCallback(async () => {
    if (!user) return;
    setAdminSaving(true);
    setAdminError("");
    try {
      const selectedAgents = agentPool.filter((a) => adminSelectedAgentIds.includes(a.agentId));
      const body: Record<string, unknown> = { userId: user.userId };
      if (adminDisplayName.trim()) body.displayName = adminDisplayName.trim();
      body.agents = selectedAgents;
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        setAdminError(d.error || "Failed");
      } else {
        const me = await fetchMe();
        setUser(me);
        setAdminError("");
      }
    } catch {
      setAdminError("Network error");
    }
    setAdminSaving(false);
  }, [user, adminDisplayName, adminSelectedAgentIds, agentPool, setUser]);

  const handleLogout = async () => {
    try { await logout(); } catch {}
    clearAuth();
    router.replace("/login");
  };

  const resetForm = () => {
    setFormUsername(""); setFormPassword(""); setFormDisplayName("");
    setShowPassword(false); setError("");
    setFormSelectedAgentIds([]);
  };

  const startEdit = (u: ManagedUser) => {
    setEditingId(u.userId);
    setFormDisplayName(u.displayName);
    setFormPassword("");
    setFormSelectedAgentIds((u.agents || []).map((a) => a.agentId));
    setShowAddForm(false);
    setError("");
  };

  // Toggle agent selection
  const toggleAgentId = (ids: string[], setIds: (v: string[]) => void, agentId: string) => {
    if (ids.includes(agentId)) {
      setIds(ids.filter((id) => id !== agentId));
    } else {
      setIds([...ids, agentId]);
    }
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
              <p className="text-[11px] text-muted-foreground">Manage agents and users</p>
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

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-2xl border border-border/50 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Bot size={20} className="text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{agentPool.length}</p>
                <p className="text-xs text-muted-foreground">Deployed Agents</p>
              </div>
            </div>
          </div>
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
        </div>

        {/* ========== AGENT MANAGEMENT ========== */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Agent Management</h2>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setShowAgentForm(!showAgentForm); setEditingAgentId(null); setAgentForm({ agentId: "", name: "", description: "", avatar: "🤖", color: "indigo", gateway: "", token: "" }); setAgentError(""); }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium
                         bg-primary text-primary-foreground rounded-xl
                         shadow-md shadow-primary/20 hover:shadow-lg transition-all">
              <Plus size={14} /> Add Agent
            </motion.button>
          </div>

          {/* Agent Error */}
          {agentError && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-500 text-xs border border-red-500/20">
              {agentError}
            </motion.div>
          )}

          {/* Add/Edit Agent Form */}
          <AnimatePresence>
            {showAgentForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
                <div className="glass rounded-2xl border border-border/50 p-5 space-y-4">
                  <p className="text-xs font-semibold text-foreground">
                    {editingAgentId ? "Edit Agent" : "New Agent"}
                  </p>

                  {/* Avatar + Name row */}
                  <div className="flex items-start gap-4">
                    <AgentAvatarPicker
                      avatar={agentForm.avatar || "🤖"}
                      onChange={(v) => setAgentForm((f) => ({ ...f, avatar: v }))}
                    />
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input value={agentForm.name}
                          onChange={(e) => setAgentForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="Agent Name *" className="admin-input" />
                        <select value={agentForm.color || "indigo"}
                          onChange={(e) => setAgentForm((f) => ({ ...f, color: e.target.value }))}
                          className="admin-input">
                          {AGENT_COLORS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <input value={agentForm.description || ""}
                        onChange={(e) => setAgentForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Description" className="admin-input w-full" />
                    </div>
                  </div>

                  {/* Gateway + Token */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                      <input value={agentForm.gateway || ""}
                        onChange={(e) => setAgentForm((f) => ({ ...f, gateway: e.target.value }))}
                        placeholder="Gateway URL *  (e.g. https://api.example.com/v1/chat)"
                        style={{ paddingLeft: "2.25rem" }}
                        className="admin-input w-full" />
                    </div>
                    <div className="relative">
                      <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                      <input value={agentForm.token || ""}
                        onChange={(e) => setAgentForm((f) => ({ ...f, token: e.target.value }))}
                        placeholder="Token  (Bearer token for authentication)"
                        type="password"
                        style={{ paddingLeft: "2.25rem" }}
                        className="admin-input w-full" />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button onClick={handleSaveAgent} disabled={agentSaving}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium
                                 bg-primary text-primary-foreground rounded-lg shadow-sm
                                 disabled:opacity-50">
                      {agentSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={13} />}
                      {editingAgentId ? "Update" : "Create"}
                    </button>
                    <button onClick={resetAgentForm}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs text-muted-foreground
                                 hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors">
                      <X size={13} /> Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Agent List */}
          {agentPoolLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : agentPool.length === 0 ? (
            <div className="text-center py-12">
              <Bot size={40} className="mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground/50">No agents deployed yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {agentPool.map((agent) => (
                <div key={agent.agentId}
                  className="glass rounded-2xl border border-border/50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.06]
                                    flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {isImageAvatar(agent.avatar) ? (
                        <img src={agent.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">{agent.avatar || "🤖"}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{agent.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {agent.description && (
                          <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                            {agent.description}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground/40">·</span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                          <Globe size={9} />
                          <span className="truncate max-w-[180px]">{agent.gateway || "—"}</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground/40">·</span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full",
                          agent.token ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                        )}>
                          {agent.token ? "Token set" : "No token"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => startEditAgent(agent)}
                      className="p-2 text-muted-foreground hover:text-foreground
                                 rounded-lg hover:bg-muted/50 transition-colors">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDeleteAgent(agent.agentId)}
                      className="p-2 text-muted-foreground hover:text-red-500
                                 rounded-lg hover:bg-red-500/10 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========== ADMIN SELF-CONFIG ========== */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-4">Admin Profile</h2>
        <div className="glass rounded-2xl border border-border/50 overflow-hidden">
          <button
            onClick={() => setAdminExpanded(!adminExpanded)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600
                              flex items-center justify-center shadow-sm overflow-hidden">
                {(adminAvatarPreview || user?.avatar) ? (
                  <img src={adminAvatarPreview || user?.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Shield size={18} className="text-white" />
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Admin Profile</p>
                <p className="text-[11px] text-muted-foreground">
                  {user?.displayName} · {adminSelectedAgentIds.length} agent{adminSelectedAgentIds.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            {adminExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
          </button>

          <AnimatePresence>
            {adminExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-5 border-t border-border/30 pt-4">
                  {/* Avatar + Display Name */}
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden
                                      bg-black/[0.04] dark:bg-white/[0.06]
                                      border border-black/[0.06] dark:border-white/[0.1]
                                      flex items-center justify-center">
                        {(adminAvatarPreview || user?.avatar) ? (
                          <img src={adminAvatarPreview || user?.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User size={24} className="text-muted-foreground/40" />
                        )}
                      </div>
                      <button
                        onClick={() => adminFileRef.current?.click()}
                        disabled={adminUploading}
                        className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40
                                   flex items-center justify-center transition-all duration-200"
                      >
                        {adminUploading ? (
                          <Loader2 size={16} className="text-white animate-spin" />
                        ) : (
                          <Camera size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                      <input ref={adminFileRef} type="file" accept="image/*"
                        onChange={handleAdminAvatarChange} className="hidden" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-muted-foreground/60 mb-1 uppercase tracking-wider">
                        Display Name
                      </label>
                      <input
                        value={adminDisplayName}
                        onChange={(e) => setAdminDisplayName(e.target.value)}
                        placeholder="Admin display name"
                        className="admin-input w-full"
                      />
                    </div>
                  </div>

                  {/* Agent selection */}
                  <AgentSelector
                    pool={agentPool}
                    selectedIds={adminSelectedAgentIds}
                    onToggle={(id) => toggleAgentId(adminSelectedAgentIds, setAdminSelectedAgentIds, id)}
                  />

                  {adminError && (
                    <p className="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/20">
                      {adminError}
                    </p>
                  )}

                  <button
                    onClick={handleAdminSave}
                    disabled={adminSaving}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium
                               bg-primary text-primary-foreground rounded-xl
                               shadow-sm shadow-primary/20 hover:shadow-md transition-all
                               disabled:opacity-50"
                  >
                    {adminSaving ? (
                      <><Loader2 size={12} className="animate-spin" /> Saving...</>
                    ) : (
                      <><Save size={13} /> Save Admin Profile</>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>

        {/* ========== USER MANAGEMENT ========== */}
        <div>
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

                  {/* Agent selection */}
                  <AgentSelector
                    pool={agentPool}
                    selectedIds={formSelectedAgentIds}
                    onToggle={(id) => toggleAgentId(formSelectedAgentIds, setFormSelectedAgentIds, id)}
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
                      <AgentSelector
                        pool={agentPool}
                        selectedIds={formSelectedAgentIds}
                        onToggle={(id) => toggleAgentId(formSelectedAgentIds, setFormSelectedAgentIds, id)}
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
                                isImageAvatar(a.avatar) ? (
                                  <img key={a.agentId} src={a.avatar} alt="" title={a.name}
                                    className="w-5 h-5 rounded object-cover" />
                                ) : (
                                  <span key={a.agentId} className="text-sm" title={a.name}>
                                    {a.avatar || "🤖"}
                                  </span>
                                )
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
    </div>
  );
}

/** Check if avatar string is a URL (uploaded image) vs emoji */
function isImageAvatar(avatar?: string): boolean {
  if (!avatar) return false;
  return avatar.startsWith("/") || avatar.startsWith("http");
}

/** Agent selector — pick from existing agent pool */
function AgentSelector({
  pool,
  selectedIds,
  onToggle,
}: {
  pool: AgentInfo[];
  selectedIds: string[];
  onToggle: (agentId: string) => void;
}) {
  if (pool.length === 0) {
    return (
      <div className="text-xs text-muted-foreground/50 py-3 text-center
                       bg-black/[0.02] dark:bg-white/[0.03] rounded-xl border border-dashed border-border/50">
        No agents deployed. Add agents in Agent Management first.
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Assign Agents ({selectedIds.length} selected)
      </p>
      <div className="grid grid-cols-2 gap-2">
        {pool.map((agent) => {
          const selected = selectedIds.includes(agent.agentId);
          return (
            <button
              key={agent.agentId}
              type="button"
              onClick={() => onToggle(agent.agentId)}
              className={cn(
                "flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all",
                selected
                  ? "border-primary/40 bg-primary/[0.06] dark:bg-primary/[0.1]"
                  : "border-black/[0.04] dark:border-white/[0.05] bg-black/[0.02] dark:bg-white/[0.03] hover:border-primary/20"
              )}
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0
                              bg-black/[0.04] dark:bg-white/[0.06]">
                {isImageAvatar(agent.avatar) ? (
                  <img src={agent.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base">{agent.avatar || "🤖"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{agent.name}</p>
                {agent.description && (
                  <p className="text-[10px] text-muted-foreground/60 truncate">{agent.description}</p>
                )}
              </div>
              <div className={cn(
                "w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors",
                selected ? "bg-primary text-white" : "border border-black/[0.1] dark:border-white/[0.1]"
              )}>
                {selected && <Check size={12} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Agent avatar picker with portal popover (emoji grid + upload) */
function AgentAvatarPicker({
  avatar,
  onChange,
}: {
  avatar: string;
  onChange: (v: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!showPicker) return;
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPopoverPos({ top: rect.bottom + 8, left: rect.left });
    }
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadAgentAvatar(file);
      onChange(url);
    } catch { /* ignore */ }
    setUploading(false);
    setShowPicker(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const hasImage = isImageAvatar(avatar);

  return (
    <div className="flex-shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center
                   bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.1]
                   cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
      >
        {uploading ? (
          <Loader2 size={18} className="animate-spin text-muted-foreground" />
        ) : hasImage ? (
          <img src={avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">{avatar}</span>
        )}
      </button>

      {showPicker && createPortal(
        <div
          ref={popoverRef}
          style={{ position: "fixed", top: popoverPos.top, left: popoverPos.left, zIndex: 9999 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="w-48 p-2 rounded-xl
                       bg-white dark:bg-[#1a1a2e] border border-black/[0.08] dark:border-white/[0.1]
                       shadow-xl shadow-black/10 dark:shadow-black/40"
          >
            <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-1 mb-1.5">
              Emoji
            </p>
            <div className="grid grid-cols-5 gap-1 mb-2">
              {AGENT_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => { onChange(emoji); setShowPicker(false); }}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-base",
                    "hover:bg-primary/10 transition-colors",
                    avatar === emoji && !hasImage ? "bg-primary/15 ring-1 ring-primary/30" : ""
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="border-t border-black/[0.06] dark:border-white/[0.08] pt-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px]
                           text-muted-foreground hover:text-foreground hover:bg-black/[0.04]
                           dark:hover:bg-white/[0.06] transition-colors"
              >
                <Camera size={12} /> Upload Image
              </button>
            </div>
            {hasImage && (
              <button
                type="button"
                onClick={() => { onChange("🤖"); setShowPicker(false); }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px]
                           text-red-400 hover:bg-red-500/10 transition-colors mt-0.5"
              >
                <X size={12} /> Remove Image
              </button>
            )}
          </motion.div>
        </div>,
        document.body
      )}

      <input ref={fileRef} type="file" accept="image/*"
        onChange={handleImageUpload} className="hidden" />
    </div>
  );
}
