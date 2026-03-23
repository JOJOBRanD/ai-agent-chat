"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Loader2, User } from "lucide-react";
import { useAuthStore, useChatStore } from "@/lib/store";
import { updateProfile, uploadAvatar } from "@/lib/api";

export default function SettingsModal() {
  const { user, updateProfile: updateLocalProfile } = useAuthStore();
  const { settingsOpen, setSettingsOpen } = useChatStore();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!settingsOpen) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 本地预览
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);

    // 上传
    setUploading(true);
    setError("");
    try {
      const { url } = await uploadAvatar(file);
      updateLocalProfile({ avatar: url });
    } catch {
      setError("Avatar upload failed");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateProfile({ displayName: displayName.trim() });
      updateLocalProfile(updated);
      setSettingsOpen(false);
    } catch {
      setError("Save failed");
    }
    setSaving(false);
  };

  const currentAvatar = avatarPreview || user?.avatar;

  return (
    <AnimatePresence>
      {settingsOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setSettingsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md mx-4 bg-white/80 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl
                       rounded-3xl border border-black/[0.06] dark:border-white/[0.08]
                       shadow-[0_24px_80px_rgba(0,0,0,0.12)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.5)]
                       overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.04] dark:border-white/[0.06]">
              <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-1.5 rounded-full text-muted-foreground/60 hover:text-foreground
                           hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden
                                  bg-black/[0.04] dark:bg-white/[0.06]
                                  border-2 border-black/[0.06] dark:border-white/[0.1]
                                  flex items-center justify-center">
                    {currentAvatar ? (
                      <img
                        src={currentAvatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={36} className="text-muted-foreground/40" />
                    )}
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40
                               flex items-center justify-center transition-all duration-200"
                  >
                    {uploading ? (
                      <Loader2 size={22} className="text-white animate-spin" />
                    ) : (
                      <Camera
                        size={22}
                        className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    )}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground/50">
                  Click to upload avatar (max 5MB)
                </p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground/70 mb-1.5 uppercase tracking-wider">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl
                             bg-black/[0.03] dark:bg-white/[0.06]
                             border border-black/[0.06] dark:border-white/[0.08]
                             text-[15px] text-foreground placeholder:text-muted-foreground/35
                             focus:outline-none focus:border-primary/40
                             focus:shadow-[0_0_0_3px_rgba(0,113,227,0.08)]
                             dark:focus:shadow-[0_0_0_3px_rgba(41,151,255,0.12)]
                             transition-all duration-200"
                  placeholder="Your display name"
                />
              </div>

              {/* Username (read-only) */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground/70 mb-1.5 uppercase tracking-wider">
                  Username
                </label>
                <input
                  type="text"
                  value={user?.username || ""}
                  disabled
                  className="w-full px-4 py-3 rounded-xl
                             bg-black/[0.02] dark:bg-white/[0.03]
                             border border-black/[0.04] dark:border-white/[0.05]
                             text-[15px] text-muted-foreground/60
                             cursor-not-allowed"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-500 bg-red-500/10 px-4 py-2.5 rounded-xl border border-red-500/15">
                  {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setSettingsOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium
                           bg-black/[0.04] dark:bg-white/[0.06]
                           hover:bg-black/[0.07] dark:hover:bg-white/[0.1]
                           transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !displayName.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold
                           bg-primary text-primary-foreground
                           shadow-md shadow-primary/25
                           hover:shadow-lg hover:shadow-primary/30
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-200
                           flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><Loader2 size={14} className="animate-spin" /> Saving...</>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
