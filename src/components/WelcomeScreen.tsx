"use client";

import { motion } from "framer-motion";
import { Sparkles, Code, FileText, Lightbulb, ArrowRight } from "lucide-react";

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

const suggestions = [
  {
    icon: Code,
    title: "Write Code",
    description: "Help me build a REST API",
    prompt: "Help me design and implement a REST API with authentication using Node.js and Express",
    gradient: "from-blue-500 to-cyan-500",
    shadow: "shadow-blue-500/20",
  },
  {
    icon: FileText,
    title: "Analyze Data",
    description: "Parse and visualize CSV data",
    prompt: "Help me analyze a CSV dataset and create meaningful visualizations",
    gradient: "from-purple-500 to-pink-500",
    shadow: "shadow-purple-500/20",
  },
  {
    icon: Lightbulb,
    title: "Brainstorm Ideas",
    description: "Creative problem solving",
    prompt: "Help me brainstorm innovative solutions for improving user engagement in a web application",
    gradient: "from-amber-500 to-orange-500",
    shadow: "shadow-amber-500/20",
  },
];

export default function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
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
        <p className="text-muted-foreground/70 text-[15px] leading-relaxed mb-10">
          Your intelligent assistant for coding, analysis, and creative tasks.
          <br />
          How can I help you today?
        </p>
      </motion.div>

      {/* Suggestion cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl w-full"
      >
        {suggestions.map((item, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 + i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSuggestionClick(item.prompt)}
            className="group flex flex-col items-start gap-3 p-5 rounded-2xl
                       bg-white/50 dark:bg-white/[0.04] backdrop-blur-xl
                       border border-black/[0.04] dark:border-white/[0.06]
                       hover:border-primary/20 dark:hover:border-primary/30
                       hover:shadow-xl hover:shadow-black/[0.03] dark:hover:shadow-black/30
                       transition-all duration-300 text-left"
          >
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.gradient}
                            shadow-lg ${item.shadow}
                            group-hover:scale-110 transition-transform duration-300`}>
              <item.icon size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground tracking-tight">{item.title}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">{item.description}</p>
            </div>
            <ArrowRight
              size={13}
              className="text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1
                         transition-all duration-300 ml-auto"
            />
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
