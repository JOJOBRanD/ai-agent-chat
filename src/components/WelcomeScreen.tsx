"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function WelcomeScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center max-w-lg"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mx-auto w-[72px] h-[72px] rounded-[22px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
                     flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-7
                     ring-1 ring-white/20"
        >
          <Sparkles size={30} className="text-white" />
        </motion.div>

        <h1 className="text-[28px] font-bold tracking-tight mb-2">
          <span className="gradient-text">AI Agent</span>
        </h1>
        <p className="text-muted-foreground/70 text-[15px] leading-relaxed">
          Your intelligent assistant for coding, analysis, and creative tasks.
          <br />
          How can I help you today?
        </p>
      </motion.div>
    </div>
  );
}
