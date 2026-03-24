"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Square, Sparkles, X, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Attachment } from "@/lib/types";
import { uploadFile } from "@/lib/api";

interface ChatInputProps {
  onSend: (message: string, attachments?: Attachment[]) => void;
  disabled: boolean;
  onStop?: () => void;
}

interface PendingFile {
  file: File;
  previewUrl?: string; // for images
  uploading: boolean;
  uploaded?: Attachment;
  error?: string;
}

export default function ChatInput({ onSend, disabled, onStop }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const dragCounterRef = useRef(0);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
  }, [input]);

  // 通用：处理一组 File 对象（上传 + 预览）
  const processFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const newPending: PendingFile[] = files.map((file) => ({
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      uploading: true,
    }));

    setPendingFiles((prev) => [...prev, ...newPending]);

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await uploadFile(files[i]);
        setPendingFiles((prev) =>
          prev.map((pf) =>
            pf.file === files[i] ? { ...pf, uploading: false, uploaded: result } : pf
          )
        );
      } catch {
        setPendingFiles((prev) =>
          prev.map((pf) =>
            pf.file === files[i] ? { ...pf, uploading: false, error: "Upload failed" } : pf
          )
        );
      }
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    if (fileRef.current) fileRef.current.value = "";
  }, [processFiles]);

  // === Drag & Drop ===
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  }, [processFiles]);

  // === Paste images ===
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageFiles: File[] = [];

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault(); // 阻止粘贴图片的默认行为
      await processFiles(imageFiles);
    }
    // 如果不是图片，正常粘贴文本
  }, [processFiles]);

  const removeFile = useCallback((file: File) => {
    setPendingFiles((prev) => {
      const item = prev.find((pf) => pf.file === file);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((pf) => pf.file !== file);
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    const attachments = pendingFiles
      .filter((pf) => pf.uploaded)
      .map((pf) => pf.uploaded!);

    if (!trimmed && attachments.length === 0) return;
    if (disabled) return;

    onSend(trimmed, attachments.length > 0 ? attachments : undefined);
    setInput("");
    setPendingFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, disabled, onSend, pendingFiles]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const hasContent = input.trim() || pendingFiles.some((pf) => pf.uploaded);
  const isUploading = pendingFiles.some((pf) => pf.uploading);

  return (
    <div
      ref={dropRef}
      className="relative px-4 pb-5 pt-2 md:px-8 lg:px-16"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-20 rounded-2xl mx-4 md:mx-8 lg:mx-16
                        border-2 border-dashed border-primary/50
                        bg-primary/5 dark:bg-primary/10 backdrop-blur-sm
                        flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-2">
            <Paperclip size={28} className="text-primary/70" />
            <span className="text-sm font-medium text-primary/70">Drop files here</span>
          </div>
        </div>
      )}

      {/* File preview area */}
      <AnimatePresence>
        {pendingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 mb-2 px-2"
          >
            {pendingFiles.map((pf, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group"
              >
                {pf.previewUrl ? (
                  /* Image preview */
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border
                                  border-black/[0.06] dark:border-white/[0.08]">
                    <img
                      src={pf.previewUrl}
                      alt=""
                      className={cn(
                        "w-full h-full object-cover",
                        pf.uploading && "opacity-50"
                      )}
                    />
                    {pf.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {pf.error && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                        <span className="text-[9px] text-red-500 font-bold">Error</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* File preview */
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border",
                    "bg-white/50 dark:bg-white/[0.04]",
                    "border-black/[0.06] dark:border-white/[0.08]",
                    pf.uploading && "opacity-60"
                  )}>
                    <FileText size={14} className="text-primary flex-shrink-0" />
                    <span className="text-[11px] max-w-[120px] truncate">{pf.file.name}</span>
                    {pf.uploading && (
                      <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                )}
                {/* Remove button */}
                <button
                  onClick={() => removeFile(pf.file)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full
                             bg-black/70 dark:bg-white/20 text-white
                             flex items-center justify-center
                             opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input container */}
      <motion.div
        className={cn(
          "relative flex items-end gap-2 rounded-2xl border transition-all duration-300",
          "bg-white/30 dark:bg-white/[0.05] backdrop-blur-xl backdrop-saturate-150",
          "shadow-[0_2px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.3)]",
          disabled && "opacity-80",
          isFocused
            ? "border-primary/40 shadow-[0_0_0_3px_rgba(99,102,241,0.1),0_2px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_0_0_3px_rgba(129,140,248,0.15),0_2px_20px_rgba(0,0,0,0.3)]"
            : "border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.12]"
        )}
      >
        {/* Attachment button */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 p-3 pb-3.5 text-muted-foreground/60 hover:text-foreground
                     transition-colors disabled:opacity-40"
          aria-label="Attach file"
        >
          <Paperclip size={18} />
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.json,.csv,.zip,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={disabled ? "Waiting for response..." : "Drop files or type a message..."}
          rows={1}
          className="flex-1 bg-transparent py-3.5 text-[0.9375rem] leading-relaxed
                     placeholder:text-muted-foreground/40 focus:outline-none
                     max-h-[200px] disabled:cursor-not-allowed"
        />

        {/* Send / Stop */}
        <div className="flex items-center gap-1 p-2">
          {disabled ? (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onStop}
              className="p-2.5 rounded-xl bg-red-500/10 text-red-500
                         hover:bg-red-500/20 transition-all duration-200"
              aria-label="Stop generating"
            >
              <Square size={14} fill="currentColor" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleSubmit}
              disabled={!hasContent || isUploading}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-300",
                hasContent && !isUploading
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                  : "bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground/40 cursor-not-allowed"
              )}
              aria-label="Send message"
            >
              <Send size={15} />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Bottom hint */}
      <div className="flex items-center justify-center gap-1.5 mt-2.5">
        <Sparkles size={10} className="text-muted-foreground/30" />
        <p className="text-[10px] text-muted-foreground/30 tracking-wide">
          AI Agent may produce inaccurate information
        </p>
      </div>
    </div>
  );
}
