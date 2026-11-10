"use client";

import React, { useState, useEffect } from "react";
import { AnimatedModal } from "@/components/animated-modal";
import {
  Share,
  MoreVertical,
  PlusSquare,
  Download,
  Smartphone,
  Sparkles,
  Zap,
  Check,
  X,
  Compass
} from "lucide-react";

export interface InstallShortcutModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  autoTrigger?: boolean;
}

export const InstallShortcutModal: React.FC<InstallShortcutModalProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  autoTrigger = true
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android">("ios");
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  // Auto-detect platform (iOS vs Android)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userAgent = navigator.userAgent || "";
      const isIos =
        /iPad|iPhone|iPod/.test(userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      setPlatform(isIos ? "ios" : "android");
    }
  }, []);

  // Auto-trigger on first access if not seen
  useEffect(() => {
    if (!autoTrigger || isControlled) return;

    try {
      const hasSeen = localStorage.getItem("trainermatch_install_prompt_seen");
      if (!hasSeen) {
        const timer = setTimeout(() => {
          setInternalIsOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // Ignora erro em iframes com cookies restritos
    }
  }, [autoTrigger, isControlled]);

  // Listener para abrir via evento global disparado por botões de menu
  useEffect(() => {
    const handleOpenEvent = () => {
      setInternalIsOpen(true);
    };
    window.addEventListener("open-install-shortcut-modal", handleOpenEvent);
    return () => {
      window.removeEventListener("open-install-shortcut-modal", handleOpenEvent);
    };
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem("trainermatch_install_prompt_seen", "true");
      } catch (e) {}
    }

    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleConfirm = () => {
    try {
      localStorage.setItem("trainermatch_install_prompt_seen", "true");
    } catch (e) {}

    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="max-w-md"
      className="p-5 space-y-4 max-h-[90vh] overflow-y-auto"
      showHandle={true}
      align="bottom"
      ariaLabel="Adicionar Atalho à Tela Inicial"
    >
      {/* Top Header com Ícone Oficial do TrainerMatch */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-700 text-white shadow-md flex items-center justify-center p-2.5 shrink-0 border border-white/20">
            <svg viewBox="0 0 64 64" className="w-full h-full fill-white" xmlns="http://www.w3.org/2000/svg">
              <rect x="18" y="29.5" width="28" height="5" rx="2.5" fill="#ffffff" />
              <rect x="12" y="21" width="5" height="22" rx="2.5" fill="#ffffff" />
              <rect x="7" y="24" width="4" height="16" rx="2" fill="#34d399" />
              <rect x="47" y="21" width="5" height="22" rx="2.5" fill="#ffffff" />
              <rect x="53" y="24" width="4" height="16" rx="2" fill="#34d399" />
              <circle cx="32" cy="19" r="3.5" fill="#34d399" />
            </svg>
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary dark:text-blue-400 bg-primary/10 px-2 py-0.5 rounded-full mb-1">
              <Sparkles size={11} strokeWidth={1.5} />
              <span>Experiência de App Nativo</span>
            </div>
            <h3 className="text-base font-extrabold text-navy-900 dark:text-white leading-tight">
              Instale o TrainerMatch no Celular
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Adicione o atalho na sua tela inicial em 3 passos rápidos.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-400 hover:text-navy-900 dark:hover:text-white flex items-center justify-center transition-colors shrink-0"
          aria-label="Fechar"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Seletor de Plataforma: iPhone / Android */}
      <div className="flex p-1 bg-slate-100 dark:bg-navy-800/80 rounded-xl">
        <button
          type="button"
          onClick={() => setPlatform("ios")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
            platform === "ios"
              ? "bg-white dark:bg-navy-900 text-navy-900 dark:text-white shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white"
          }`}
        >
          <span> iPhone (Safari)</span>
        </button>
        <button
          type="button"
          onClick={() => setPlatform("android")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
            platform === "android"
              ? "bg-white dark:bg-navy-900 text-navy-900 dark:text-white shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white"
          }`}
        >
          <span>🤖 Android (Chrome)</span>
        </button>
      </div>

      {/* ===================== AS 3 INDICAÇÕES NA MESMA TELA ===================== */}
      <div className="space-y-2.5">
        {platform === "ios" ? (
          <>
            {/* Passo 1 - iOS */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/70 dark:border-navy-700/60 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                1
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-navy-900 dark:text-white">
                    Abra o menu Compartilhar do Safari
                  </h4>
                  <Share size={13} className="text-primary shrink-0" strokeWidth={1.5} />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  Na barra inferior do <strong>Safari</strong>, toque no ícone de <strong>Compartilhar</strong> (quadrado com uma seta apontando para cima).
                </p>
              </div>
            </div>

            {/* Passo 2 - iOS */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/70 dark:border-navy-700/60 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                2
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-navy-900 dark:text-white">
                    Selecione &quot;Adicionar à Tela de Início&quot;
                  </h4>
                  <PlusSquare size={13} className="text-primary shrink-0" strokeWidth={1.5} />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  Role a lista de opções para baixo e toque em <strong>&quot;Adicionar à Tela de Início&quot;</strong> (ícone com sinal de <strong>+</strong>).
                </p>
              </div>
            </div>

            {/* Passo 3 - iOS */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                3
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    Toque em &quot;Adicionar&quot; no topo
                  </h4>
                  <Sparkles size={13} className="text-emerald-600 shrink-0" strokeWidth={1.5} />
                </div>
                <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 mt-0.5 leading-relaxed">
                  Confirme no canto superior direito. O ícone oficial do <strong>TrainerMatch</strong> será criado e abrirá em tela cheia como app!
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Passo 1 - Android */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/70 dark:border-navy-700/60 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                1
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-navy-900 dark:text-white">
                    Abra o menu de 3 pontinhos
                  </h4>
                  <MoreVertical size={13} className="text-primary shrink-0" strokeWidth={1.5} />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  No canto superior direito do <strong>Google Chrome</strong>, toque no menu de <strong>3 pontinhos verticais (⋮)</strong>.
                </p>
              </div>
            </div>

            {/* Passo 2 - Android */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/70 dark:border-navy-700/60 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                2
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-navy-900 dark:text-white">
                    Toque em &quot;Instalar&quot; ou &quot;Adicionar&quot;
                  </h4>
                  <Download size={13} className="text-primary shrink-0" strokeWidth={1.5} />
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  Selecione a opção <strong>&quot;Instalar aplicativo&quot;</strong> ou <strong>&quot;Adicionar à tela inicial&quot;</strong>.
                </p>
              </div>
            </div>

            {/* Passo 3 - Android */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                3
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    Confirme a Instalação
                  </h4>
                  <Sparkles size={13} className="text-emerald-600 shrink-0" strokeWidth={1.5} />
                </div>
                <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 mt-0.5 leading-relaxed">
                  Toque em <strong>&quot;Instalar&quot;</strong>. O TrainerMatch ficará disponível junto aos seus apps nativos com acesso rápido!
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Vantagens do App */}
      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-800">
          <Zap size={14} className="text-amber-500 mx-auto mb-1" strokeWidth={1.5} />
          <span className="text-[10px] font-bold text-navy-900 dark:text-white block">Super Rápido</span>
          <span className="text-[9px] text-slate-400">Sem barra de URL</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-800">
          <Smartphone size={14} className="text-primary mx-auto mb-1" strokeWidth={1.5} />
          <span className="text-[10px] font-bold text-navy-900 dark:text-white block">Tela Cheia</span>
          <span className="text-[9px] text-slate-400">100% Imersivo</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-800">
          <Sparkles size={14} className="text-emerald-600 mx-auto mb-1" strokeWidth={1.5} />
          <span className="text-[10px] font-bold text-navy-900 dark:text-white block">1 Toque</span>
          <span className="text-[9px] text-slate-400">Acesso direto</span>
        </div>
      </div>

      {/* Checkbox "Não mostrar novamente" */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="dont-show-install-again"
          checked={dontShowAgain}
          onChange={(e) => setDontShowAgain(e.target.checked)}
          className="w-4 h-4 rounded accent-primary cursor-pointer"
        />
        <label
          htmlFor="dont-show-install-again"
          className="text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer select-none"
        >
          Não mostrar este aviso novamente
        </label>
      </div>

      {/* Botões de Ação */}
      <div className="pt-1 flex gap-2">
        <button
          type="button"
          onClick={handleClose}
          className="flex-1 py-3 rounded-full text-xs font-bold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors"
        >
          Agora Não
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="flex-1 py-3 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
        >
          <Check size={14} strokeWidth={2} />
          <span>Entendi, vou adicionar!</span>
        </button>
      </div>
    </AnimatedModal>
  );
};
