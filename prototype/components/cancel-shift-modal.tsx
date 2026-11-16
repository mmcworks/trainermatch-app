"use client";

import React, { useState } from "react";
import { Shift, canCancelShift, formatDateDDMMAAAA } from "@/store/mock-data";
import {
  X,
  AlertTriangle,
  Calendar,
  Clock,
  Building2,
  User,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck
} from "lucide-react";

interface CancelShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
  role: "professor" | "academia";
  userName: string;
  counterpartName: string;
  onConfirmCancel: (reason: string) => Promise<void> | void;
}

const PROFESSOR_REASONS = [
  "Imprevisto de saúde / Atestado médico",
  "Problema de transporte / Deslocamento ou trânsito",
  "Conflito emergencial de escala / Compromisso pessoal",
  "Cancelamento solicitado pela academia",
  "Problemas pessoais urgentes",
  "Outro motivo (especificar)"
];

const GYM_REASONS = [
  "Mudança na grade de aulas / Cronograma alterado",
  "Fechamento temporário / Manutenção da unidade",
  "Professor titular reassumiu o horário",
  "Baixa adesão de alunos para a turma",
  "Cancelamento solicitado pelo professor",
  "Outro motivo operacional"
];

export const CancelShiftModal: React.FC<CancelShiftModalProps> = ({
  isOpen,
  onClose,
  shift,
  role,
  userName,
  counterpartName,
  onConfirmCancel
}) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customNotes, setCustomNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !shift) return null;

  const cancelEligibility = canCancelShift(shift);
  const reasonsList = role === "professor" ? PROFESSOR_REASONS : GYM_REASONS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelEligibility.canCancel) return;
    if (!selectedReason) {
      alert("Por favor, selecione um motivo para o cancelamento.");
      return;
    }

    const fullReason = customNotes.trim()
      ? `${selectedReason} — Obs: ${customNotes.trim()}`
      : selectedReason;

    try {
      setIsSubmitting(true);
      await onConfirmCancel(fullReason);
      onClose();
    } catch (err) {
      console.error("Erro ao cancelar:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy-900/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-card dark:bg-navy-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 animate-slide-up">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/60 dark:border-rose-800/40">
              <AlertTriangle size={18} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-black text-navy-900 dark:text-white leading-tight">
                Cancelar Aula Contratada
              </h3>
              <p className="text-[11px] text-muted dark:text-slate-400">
                Cancelamento e aviso prévio
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Card Resumo da Aula */}
          <div className="bg-slate-50 dark:bg-navy-900/70 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3.5 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-primary tracking-wider block">
                  {shift.modality}
                </span>
                <span className="text-xs font-black text-navy-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                  {role === "professor" ? (
                    <>
                      <Building2 size={13} strokeWidth={1.5} className="text-slate-400" />
                      <span>{counterpartName || "Academia"}</span>
                    </>
                  ) : (
                    <>
                      <User size={13} strokeWidth={1.5} className="text-slate-400" />
                      <span>{counterpartName || "Professor Contratado"}</span>
                    </>
                  )}
                </span>
              </div>
              <span className="text-xs font-black text-navy-900 dark:text-white bg-white dark:bg-navy-800 px-2 py-0.5 rounded-md border border-slate-200/70 dark:border-slate-700">
                R$ {shift.agreedRate || shift.maxRate || (shift as any).rate || 45}/h
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1 font-semibold">
                <Calendar size={12} strokeWidth={1.5} className="text-slate-400" />
                {formatDateDDMMAAAA(shift.date)}
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <Clock size={12} strokeWidth={1.5} className="text-slate-400" />
                {shift.startTime} – {shift.endTime}
              </span>
            </div>
          </div>

          {/* Validação de Horário de Início */}
          {!cancelEligibility.canCancel ? (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-start gap-2.5 text-rose-800 dark:text-rose-300">
              <Lock size={16} strokeWidth={1.5} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div>
                <p className="font-bold text-xs">Cancelamento indisponível</p>
                <p className="text-[11px] mt-0.5 leading-relaxed">
                  {cancelEligibility.reason || "A aula já foi iniciada ou o horário previsto já passou."}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Alerta de Regra de Faltas / Antecedência de 30 minutos */}
              {cancelEligibility.isWithinGracePeriod !== false ? (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-start gap-2.5 text-emerald-900 dark:text-emerald-200 shadow-2xs">
                  <ShieldCheck size={18} strokeWidth={2} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="font-extrabold text-xs">
                      Cancelamento com antecedência: não será considerado falta
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5 leading-relaxed">
                      Como você está cancelando com mais de 30 minutos de antecedência do início da aula, nenhuma penalidade ou falta será registrada em seu histórico.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-start gap-2.5 text-amber-900 dark:text-amber-200 shadow-2xs">
                  <AlertTriangle size={18} strokeWidth={2} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="font-extrabold text-xs">
                      Atenção: Menos de 30 minutos para o início
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
                      Faltam menos de 30 minutos para a aula. O cancelamento tardio ficará registrado no relatório da unidade com a justificativa apresentada.
                    </p>
                  </div>
                </div>
              )}

              {/* Combobox de Motivos Obrigatórios */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-navy-900 dark:text-white">
                  Selecione o motivo do cancelamento <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-700 font-semibold text-navy-900 dark:text-white focus:outline-primary cursor-pointer"
                >
                  <option value="">Selecione um motivo...</option>
                  {reasonsList.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              {/* Observação Adicional */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Descrição adicional (opcional)
                </label>
                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Detalhes ou justificativa adicional para o cancelamento..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-700 text-navy-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none font-medium"
                />
              </div>
            </>
          )}
        </div>

        {/* Rodapé com Ações */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-navy-900/50 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors text-center"
          >
            Manter Aula
          </button>
          {cancelEligibility.canCancel && (
            <button
              type="button"
              disabled={!selectedReason || isSubmitting}
              onClick={handleSubmit}
              className="flex-1 py-2.5 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <span>{isSubmitting ? "Cancelando..." : "Confirmar Cancelamento"}</span>
              <ArrowRight size={13} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
