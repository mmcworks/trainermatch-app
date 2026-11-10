"use client";

import React, { useEffect, useState } from "react";

export interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
  overlayClassName?: string;
  showHandle?: boolean;
  align?: "bottom" | "center" | "responsive";
  ariaLabel?: string;
  role?: string;
  expandable?: boolean;
  defaultExpanded?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: (expanded: boolean) => void;
}

export function AnimatedModal({
  isOpen,
  onClose,
  children,
  maxWidth = "max-w-md",
  className = "p-5 space-y-4",
  overlayClassName = "",
  showHandle = true,
  align = "bottom",
  ariaLabel,
  role = "dialog",
  expandable = true,
  defaultExpanded = false,
  isExpanded: controlledExpanded,
  onToggleExpand,
}: AnimatedModalProps) {
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [mounted, setMounted] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [cachedChildren, setCachedChildren] = useState<React.ReactNode>(children);
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggleExpand = () => {
    if (!expandable) return;
    if (onToggleExpand) {
      onToggleExpand(!isExpanded);
    }
    if (controlledExpanded === undefined) {
      setInternalExpanded(!internalExpanded);
    }
  };

  // Sincroniza o estado de fechamento no ciclo de render para iniciar a animação imediatamente
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setMounted(true);
      setIsClosing(false);
      setInternalExpanded(defaultExpanded);
    } else if (mounted) {
      setIsClosing(true);
    }
  }

  // Mantém os filhos em cache para que o conteúdo não desapareça durante o slide-down
  useEffect(() => {
    if (isOpen && children) {
      setCachedChildren(children);
    }
  }, [isOpen, children]);

  // Tempo da animação de saída (280ms) coincidente com a curva CSS cubic-bezier(0.16, 1, 0.3, 1)
  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        setMounted(false);
        setIsClosing(false);
        if (isOpen) {
          onClose();
        }
      }, 280);
      return () => clearTimeout(timer);
    }
  }, [isClosing, isOpen, onClose]);

  // Fecha ao pressionar ESC
  useEffect(() => {
    if (!isOpen || isClosing) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isClosing]);

  // Previne rolagem de fundo enquanto a modal está aberta
  useEffect(() => {
    if (mounted) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mounted]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
  };

  if (!mounted && !isOpen) return null;

  // Modais que surgem de baixo para cima: ocupam a largura total da área mobile (w-full max-w-md)
  // perfeitamente alinhadas com a tela do app mobile em qualquer resolução
  const isBottomAlign = align !== "center";
  const alignOverlay = isBottomAlign
    ? "items-end p-0"
    : "items-center p-3 sm:p-4";

  const roundedClasses = isBottomAlign
    ? "rounded-t-[28px] sm:rounded-t-[32px] rounded-b-none border-b-0 border-x-0"
    : "rounded-squircle";

  const heightClasses = isBottomAlign
    ? isExpanded
      ? "h-[98dvh] sm:h-[96dvh]"
      : "max-h-[96dvh] sm:max-h-[94dvh] h-auto"
    : "max-h-[92vh]";

  const overflowClass = className.includes("overflow-hidden")
    ? "overflow-hidden"
    : "overflow-y-auto";

  return (
    <div
      className={`fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-xs flex justify-center ${alignOverlay} ${
        isClosing ? "animate-backdrop-out" : "animate-backdrop-in"
      } ${overlayClassName}`}
      onClick={handleClose}
      role={role}
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        className={`bg-card dark:bg-navy-800 w-full max-w-md ${roundedClasses} shadow-floating ${
          isBottomAlign ? "border-t" : "border"
        } border-slate-100 dark:border-slate-700 ${heightClasses} flex flex-col ${overflowClass} transition-all duration-300 ${className} ${
          isClosing ? "animate-sheet-down" : "animate-sheet-up"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra de Puxar / Handle estilo Bottom Sheet com opção de expandir para cima */}
        {showHandle && isBottomAlign && (
          <button
            type="button"
            onClick={handleToggleExpand}
            className="w-full pt-3 pb-1.5 flex flex-col items-center justify-center cursor-pointer group select-none shrink-0 bg-transparent border-0 focus:outline-none"
            aria-label={isExpanded ? "Recolher modal" : "Expandir modal para cima"}
            title={expandable ? (isExpanded ? "Toque na barra para recolher" : "Toque na barra para expandir para cima") : undefined}
          >
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isExpanded
                  ? "bg-primary w-16"
                  : "bg-slate-300 dark:bg-slate-600 w-12 group-hover:bg-primary group-hover:scale-105"
              }`}
            />
          </button>
        )}
        {isOpen ? children : cachedChildren}
      </div>
    </div>
  );
}

export default AnimatedModal;
