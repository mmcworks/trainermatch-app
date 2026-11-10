import React from "react";
import { Clock, Award, HeartHandshake, Building2, Dumbbell, Zap, LucideIcon } from "lucide-react";
import { CriteriaBreakdown, GymCriteriaBreakdown } from "@/store/mock-data";

export interface HorizontalBarsProps {
  criteria?: CriteriaBreakdown | GymCriteriaBreakdown | Record<string, number | undefined> | null;
  type?: "professor" | "gym";
}

const CRITERIA_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon }
> = {
  // Professor Pillars
  pontualidade: { label: "Pontualidade & Presença", icon: Clock },
  tecnica: { label: "Domínio Técnico & Segurança", icon: Award },
  postura: { label: "Postura & Atendimento", icon: HeartHandshake },

  // Gym Pillars
  recepcao: { label: "Recepção & Organização", icon: Building2 },
  estrutura: { label: "Estrutura & Equipamentos", icon: Dumbbell },
  pagamento: { label: "Pontualidade do Pagamento", icon: Zap },

  // Backward compatibility fallback keys if any
  atendimento: { label: "Atendimento aos Alunos", icon: HeartHandshake },
  comportamento: { label: "Postura Profissional", icon: HeartHandshake },
  educacao: { label: "Comunicação", icon: HeartHandshake },
  apresentacao: { label: "Apresentação & Uniforme", icon: Award }
};

export const HorizontalBars: React.FC<HorizontalBarsProps> = ({ criteria, type }) => {
  if (!criteria) {
    return (
      <div className="text-xs text-slate-400 italic py-2">
        Sem avaliações detalhadas registradas ainda.
      </div>
    );
  }

  // Filter entries based on provided criteria
  const entries = Object.entries(criteria).filter(
    ([key, val]) => typeof val === "number" && CRITERIA_CONFIG[key]
  );

  if (entries.length === 0) {
    return (
      <div className="text-xs text-slate-400 italic py-2">
        Sem avaliações detalhadas registradas ainda.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(([key, rawValue]) => {
        const value = typeof rawValue === "number" ? rawValue : 5.0;
        const percentage = Math.min(100, (value / 5.0) * 100);
        const isLow = value < 3.5;
        const config = CRITERIA_CONFIG[key] || { label: key, icon: Award };
        const Icon = config.icon;

        return (
          <div key={key} className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5 font-medium text-navy-800 dark:text-slate-300">
                <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
                <span>{config.label}</span>
              </div>
              <span className={`font-semibold ${isLow ? "text-red-500" : "text-navy-900 dark:text-slate-200"}`}>
                ★ {value.toFixed(1)}
              </span>
            </div>

            <div className="h-1.5 w-full bg-slate-100 dark:bg-navy-900/80 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isLow ? "bg-red-500" : "bg-emerald-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
