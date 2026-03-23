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
  },
  {
    icon: FileText,
    title: "Analyze Data",
    description: "Parse and visualize CSV data",
    prompt: "Help me analyze a CSV dataset and create meaningful visualizations",
  },
  {
    icon: Lightbulb,
    title: "Brainstorm Ideas",
    description: "Creative problem solving",
    prompt: "Help me brainstorm innovative solutions for improving user engagement in a web application",
  },
];

export default function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
                     flex items-center justify-center shadow-2xl shadow-indigo-500/25 mb-6"
        >
          <Sparkles size={28} className="text-white" />
        </motion.div>

        <h1 className="text-2xl font-semibold mb-2">
          <span className="gradient-text">AI Agent</span>
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSuggestionClick(item.prompt)}
            className="group flex flex-col items-start gap-2 p-4 rounded-2xl
                       border border-border bg-card hover:border-primary/30
                       hover:shadow-lg hover:shadow-primary/5
                       transition-all duration-200 text-left"
          >
            <div className="p-2 rounded-lg bg-primary/10 text-primary
                            group-hover:bg-primary group-hover:text-primary-foreground
                            transition-colors duration-200">
              <item.icon size={16} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
            </div>
            <ArrowRight
              size={14}
              className="text-muted-foreground/30 group-hover:text-primary
                         transition-colors ml-auto"
            />
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
