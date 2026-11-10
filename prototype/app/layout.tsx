"use client";

import React, { useEffect } from "react";
import "./globals.css";
import { useAppStore } from "@/store/use-app-store";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDarkMode = useAppStore((state) => state.isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <html lang="pt-BR" className={isDarkMode ? "dark" : ""}>
      <head>
        <title>TrainerMatch · Contratação e Substituição de Professores</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background dark:bg-navy-900 text-navy-900 dark:text-slate-100 transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
