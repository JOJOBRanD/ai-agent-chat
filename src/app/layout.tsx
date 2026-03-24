"use client";

import "./globals.css";
import "highlight.js/styles/github-dark-dimmed.css";
import { useChatStore } from "@/lib/store";
import { useEffect } from "react";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useChatStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <html lang="en" className={theme}>
      <head>
        <title>AI Agent Chat</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-background text-foreground antialiased">
        <AnimatedBackground />
        {children}
      </body>
    </html>
  );
}
