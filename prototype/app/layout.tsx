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

  // Previne zoom indesejado (pinch/double-tap) e trava orientação retrato no mobile
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detecção ativa de celular no modo paisagem (landscape)
    const checkOrientation = () => {
      const isTouch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window || (navigator.maxTouchPoints || 0) > 0;
      const isLandscape = window.innerWidth > window.innerHeight;
      const isMobileHeight = window.innerHeight <= 680;
      setIsLandscapeMobile(isTouch && isLandscape && isMobileHeight);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    // Tenta travar orientação na tela em modo portrait (se suportado pelo navegador)
    try {
      if (window.screen && (window.screen as any).orientation?.lock) {
        (window.screen as any).orientation.lock("portrait").catch(() => {});
      }
    } catch (e) {}

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
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
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

        {/* Bloqueio de rotação para celulares e telas móveis no modo paisagem */}
        <div
          className={`fixed inset-0 z-[999999] bg-navy-950/98 backdrop-blur-lg text-white flex-col items-center justify-center p-6 text-center select-none transition-opacity duration-300 ${
            isLandscapeMobile
              ? "flex pointer-events-auto opacity-100"
              : "hidden [@media(orientation:landscape)_and_(max-height:680px)_and_(pointer:coarse)]:flex pointer-events-none opacity-0"
          }`}
        >
          <div className="w-16 h-16 rounded-3xl bg-primary/20 text-primary flex items-center justify-center mb-4 border border-primary/30 shadow-lg shadow-primary/10">
            <svg
              className="w-8 h-8 animate-pulse"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="14" height="20" x="5" y="2" rx="3" ry="3" />
              <path d="M12 18h.01" />
            </svg>
          </div>
          <h3 className="text-base font-black text-white mb-1.5 tracking-tight">
            Gire o celular para a vertical
          </h3>
          <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
            O TrainerMatch foi desenhado exclusivamente para uso no <strong>Modo Retrato (vertical)</strong> para garantir a segurança e precisão dos agendamentos.
          </p>
        </div>
      </body>
    </html>
  );
}
