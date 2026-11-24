"use client";

import React, { useEffect, useState } from "react";
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

  // Previne zoom indesejado (pinch/double-tap) mantendo a fluidez de aplicativo nativo
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Previne pinça/pinch-to-zoom em navegadores WebKit/Safari
    const handleGesture = (e: Event) => {
      e.preventDefault();
    };

    // Previne double-tap zoom em dispositivos móveis
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      // Ignora se estiver interagindo com elementos de texto ou botões normais com múltiplos toques
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        // Apenas cancela se o alvo não for um campo de texto selecionável
        const target = e.target as HTMLElement | null;
        if (target && !["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
          e.preventDefault();
        }
      }
      lastTouchEnd = now;
    };

    document.addEventListener("gesturestart", handleGesture as any, { passive: false });
    document.addEventListener("gesturechange", handleGesture as any, { passive: false });
    document.addEventListener("gestureend", handleGesture as any, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", handleGesture as any);
      document.removeEventListener("gesturechange", handleGesture as any);
      document.removeEventListener("gestureend", handleGesture as any);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <html lang="pt-BR" className={isDarkMode ? "dark" : ""}>
      <head>
        <title>TrainerMatch · Contratação e Substituição de Professores</title>
        <meta name="description" content="Plataforma de contratação e substituição rápida de professores e instrutores de academias." />
        
        {/* Viewport para Fullscreen e Safe Area (Notch / Dynamic Island) */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />

        {/* PWA / Standalone no iOS (Abre em tela cheia sem barras do Safari) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TrainerMatch" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon-precomposed.png" />

        {/* PWA / Standalone no Android e Navegadores Modernos */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="application-name" content="TrainerMatch" />
        <link rel="manifest" href="/manifest.webmanifest" />

        {/* Favicons */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/icon-192.png" type="image/png" />

        {/* Fontes */}
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
