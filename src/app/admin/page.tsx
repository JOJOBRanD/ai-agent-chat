"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Plus, Trash2, Edit3, Save, X, Users,
  LogOut, ArrowLeft, Loader2, Eye, EyeOff,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { fetchMe, logout } from "@/lib/api";
import { ManagedUser } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const router = useRouter();
  const { user, setUser, logout: clearAuth } = useAuthStore();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formAgentName, setFormAgentName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Auth check
  useEffect(() => {
    async function check() {
      try {
        const me = await fetchMe();
        setUser(me);
        if (me.role !== "admin") {
          router.replace("/chat");
          return;
        }
        await loadUsers();
      } catch {
        router.replace("/login");
      }
    }
    check();
  }, [router, setUser]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleAdd = useCallback(async () => {
    setError("");
    if (!formUsername || !formPassword) {
      setError("Username and password are required");
      return;
    }
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: formUsername,
          password: formPassword,
          displayName: formDisplayName || formUsername,
          agentName: formAgentName || "AI Agent",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create user");
        return;
      }
      setShowAddForm(false);
      resetForm();
      await loadUsers();
    } catch {
      setError("Network error");
    }
  }, [formUsername, formPassword, formDisplayName, formAgentName]);

  const handleUpdate = useCallback(async (userId: string) => {
    setError("");
    try {
      const body: Record<string, string> = { userId };
      if (formDisplayName) body.displayName = formDisplayName;
      if (formAgentName) body.agentName = formAgentName;
      if (formPassword) body.password = formPassword;

      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update");
        return;
      }
      setEditingId(null);
      resetForm();
      await loadUsers();
    } catch {
      setError("Network error");
    }
  }, [formDisplayName, formAgentName, formPassword]);

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
    try { await logout(); } catch { /* ignore */ }
    clearAuth();
    router.replace("/login");
  };

  const resetForm = () => {
    setFormUsername("");
    setFormPassword("");
    setFormDisplayName("");
    setFormAgentName("");
    setShowPassword(false);
    setError("");
  };

  const startEdit = (u: ManagedUser) => {
    setEditingId(u.userId);
    setFormDisplayName(u.displayName);
    setFormAgentName(u.agentName);
    setFormPassword("");
    setShowAddForm(false);
    setError("");
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
              <p className="text-[11px] text-muted-foreground">Manage users and access</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/chat")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground
                         hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft size={14} /> Chat
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground
                         hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
            >
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
                <Shield size={20} className="text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">Active</p>
                <p className="text-xs text-muted-foreground">System Status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Header + Add button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">User Management</h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); resetForm(); }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium
                       bg-primary text-primary-foreground rounded-xl
                       shadow-md shadow-primary/20 hover:shadow-lg transition-all"
          >
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
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="glass rounded-2xl border border-border/50 p-5 space-y-3">
                <p className="text-xs font-semibold text-foreground mb-3">Create New User</p>
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
                    placeholder="Display Name" className="admin-input" />
                  <input value={formAgentName} onChange={(e) => setFormAgentName(e.target.value)}
                    placeholder="Agent Name" className="admin-input" />
                </div>
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
            <p className="text-sm text-muted-foreground/50">No users yet. Click "Add User" to create one.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <motion.div key={u.userId} layout
                className="glass rounded-2xl border border-border/50 p-4">
                {editingId === u.userId ? (
                  /* Edit mode */
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <input value={formDisplayName} onChange={(e) => setFormDisplayName(e.target.value)}
                        placeholder="Display Name" className="admin-input" />
                      <input value={formAgentName} onChange={(e) => setFormAgentName(e.target.value)}
                        placeholder="Agent Name" className="admin-input" />
                      <input type="password" value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="New password (optional)" className="admin-input" />
                    </div>
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
                  /* Display mode */
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {u.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.displayName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          @{u.username} · Agent: {u.agentName}
                        </p>
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
