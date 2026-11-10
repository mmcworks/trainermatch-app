"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { Clock, RefreshCcw, User, Building2, ShieldCheck } from "lucide-react";

export const DevSimulator: React.FC = () => {
  const {
    currentRole,
    setRole,
    gymPlan,
    hiresThisMonth,
    isFirstHireFreeUsed,
    tickSimulationTime,
    resetAll
  } = useAppStore();

  const [expanded, setExpanded] = useState(false);

  return (
    <aside aria-label="Painel de Simulação" className="fixed bottom-4 right-4 z-50">
      <div className="bg-navy-900/95 backdrop-blur-md text-white rounded-squircle p-3 shadow-floating border border-slate-700/50">
        <div className="flex items-center gap-3">
          {/* Seletor de Perfil */}
          <div className="flex bg-navy-800 p-1 rounded-full text-xs font-medium">
            <button
              onClick={() => setRole("professor")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                currentRole === "professor"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <User size={13} />
              Professor
            </button>
            <button
              onClick={() => setRole("academia")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                currentRole === "academia"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Building2 size={13} />
              Academia
            </button>
          </div>

          {/* Botão Rápido de Tema Escuro / Claro */}
          <button
            onClick={() => useAppStore.getState().toggleDarkMode()}
            className="flex items-center gap-1 bg-navy-800 hover:bg-navy-700 text-xs px-2.5 py-1.5 rounded-full text-slate-300 hover:text-white transition-colors"
            title="Alternar Modo Escuro / Claro"
          >
            <span>{useAppStore.getState().isDarkMode ? "☀️ Claro" : "🌙 Escuro"}</span>
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 font-mono"
          >
            {expanded ? "Fechar ▲" : "Simulador ▼"}
          </button>
        </div>

        {/* Painel expandido de simulação */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-800 space-y-3 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>Status Plano:</span>
              <span className="font-bold uppercase text-primary-light">
                {gymPlan} ({hiresThisMonth} {hiresThisMonth === 1 ? "contratação" : "contratações"})
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span>1ª Grátis Usada:</span>
              <span className={isFirstHireFreeUsed ? "text-amber-400" : "text-green-400 font-bold"}>
                {isFirstHireFreeUsed ? "Sim (Exigirá Assinatura)" : "Não (Teste Ativo)"}
              </span>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => tickSimulationTime(30)}
                className="flex-1 flex items-center justify-center gap-1 bg-navy-800 hover:bg-slate-700 py-1.5 px-2 rounded-xl text-slate-200 transition-colors"
                title="Avança 30 minutos para testar contadores expirando"
              >
                <Clock size={12} />
                +30 min
              </button>
              <button
                onClick={() => tickSimulationTime(60)}
                className="flex-1 flex items-center justify-center gap-1 bg-navy-800 hover:bg-slate-700 py-1.5 px-2 rounded-xl text-slate-200 transition-colors"
                title="Avança 1 hora"
              >
                <Clock size={12} />
                +1h
              </button>
              <button
                onClick={resetAll}
                className="flex items-center justify-center gap-1 bg-red-950/40 hover:bg-red-900/60 text-red-300 py-1.5 px-3 rounded-xl transition-colors"
                title="Restaura os dados originais de teste"
              >
                <RefreshCcw size={12} />
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
