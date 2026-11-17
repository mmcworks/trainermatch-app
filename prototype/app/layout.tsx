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
      const isTouch =
        window.matchMedia("(pointer: coarse)").matches ||
        "ontouchstart" in window ||
        (navigator.maxTouchPoints || 0) > 0;
      const isLandscape = window.innerWidth > window.innerHeight;
      const isMobileHeight = window.innerHeight <= 700;
      setIsLandscapeMobile((isTouch || window.innerWidth <= 960) && isLandscape && isMobileHeight);
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
          id="orientation-landscape-blocker"
          className={`fixed inset-0 z-[99999999] bg-slate-950/95 backdrop-blur-2xl text-white items-center justify-center p-4 sm:p-6 text-center select-none transition-all duration-300 ${
            isLandscapeMobile
              ? "flex pointer-events-auto opacity-100"
              : "hidden pointer-events-none opacity-0"
          }`}
        >
          <div className="relative max-w-lg w-full bg-slate-900/95 border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.2)] flex flex-row items-center gap-5 text-left">
            {/* Ícone de smartphone com animação de rotação */}
            <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <span className="absolute -inset-1 rounded-2xl bg-amber-500/20 animate-ping opacity-40 pointer-events-none" />
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10 animate-phone-rotate relative z-10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="14" height="20" x="5" y="2" rx="3" ry="3" />
                <path d="M12 18h.01" />
              </svg>
            </div>

            {/* Mensagem e instrução clara */}
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Gire o Aparelho
              </div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight mb-1">
                Modo Retrato Obrigatório
              </h3>
              <p className="text-xs text-slate-300 leading-snug">
                Para garantir a melhor visualização e precisão nos seus agendamentos, o TrainerMatch funciona exclusivamente na <strong>posição vertical</strong>.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
