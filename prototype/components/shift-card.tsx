"use client";

import React from "react";
import { Shift, Gym, formatDateDDMMAAAA } from "@/store/mock-data";
import { Star, Clock, CheckCircle2 } from "lucide-react";

interface ShiftCardProps {
  shift: Shift;
  gym: Gym;
  onApply?: () => void;
  isApplied?: boolean;
}

export const ShiftCard: React.FC<ShiftCardProps & { onOpenDetails?: () => void }> = ({
  shift,
  gym,
  onApply,
  isApplied,
  onOpenDetails
}) => {
  return (
    <article
      onClick={onOpenDetails}
      className="bg-card rounded-squircle p-4 shadow-soft hover:shadow-soft-hover transition-all duration-300 cursor-pointer active:scale-[0.99]"
    >
      <div className="flex gap-3.5 items-center">
        {/* Somente o Logotipo da Academia (Estilo Circular) */}
        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-slate-50 dark:bg-navy-900 border border-slate-100 dark:border-slate-700 p-0.5 flex items-center justify-center shadow-xs">
          <img
            src={gym.logo}
            alt={gym.name}
            className="w-full h-full object-cover rounded-full"
          />
        </div>

        {/* Informações Centrais */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-1">
            <div>
              <h2 className="text-sm font-extrabold text-navy-900 truncate">
                {gym.name}
              </h2>
              <p className="text-[11px] text-muted">
                {gym.neighborhood} · {shift.modality}
              </p>
            </div>

            {/* Avaliação */}
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full text-xs font-bold text-navy-800">
              <Star size={11} className="text-amber-400 fill-amber-400" />
              <span>{gym.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Horário & Valor */}
          <div className="mt-2 flex justify-between items-center">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary-subtle px-2.5 py-0.5 rounded-full">
              <Clock size={11} />
              {formatDateDDMMAAAA(shift.date)} · {shift.startTime} – {shift.endTime}
            </span>

            <div>
              <span className="text-base font-black text-navy-900">
                R$ {shift.maxRate ?? (shift as any).rate ?? 45}
                <span className="text-[10px] font-normal text-muted">/h</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
