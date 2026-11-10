"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Briefcase,
  Sparkles,
  CreditCard,
  CheckCircle2,
  CalendarPlus,
  Users,
  ShieldCheck,
  ArrowRight,
  X,
  Dumbbell,
  Building2,
  MapPin,
  Check
} from "lucide-react";

interface OnboardingModalProps {
  role: "professor" | "academia";
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ role, isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const professorSteps = [
    {
      badge: "Passo 1 de 3 · Sua Disponibilidade",
      icon: Calendar,
      title: "Defina sua Grade Semanal",
      description:
        "Na aba Agenda > Minha Grade, ative os dias da semana e defina os horários em que você está livre para dar aulas.",
      highlight:
        "Quando uma academia precisar de professor nessa mesma faixa de horário, você aparecerá no topo das recomendações!",
      color: "from-blue-500 to-indigo-600"
    },
    {
      badge: "Passo 2 de 3 · Vagas e Oportunidades",
      icon: Sparkles,
      title: "Receba Convites e Candidate-se",
      description:
        "Explore vagas avulsas na aba Início ou receba convites diretos de academias na aba Negociações.",
      highlight:
        "Você sempre visualiza a modalidade, valor da hora-aula e localização antes de aceitar. Conflitos de horários são prevenidos automaticamente.",
      color: "from-amber-500 to-orange-600"
    },
    {
      badge: "Passo 3 de 3 · Execução e Pagamento",
      icon: CheckCircle2,
      title: "Check-in e Pagamento via Pix",
      description:
        "No dia da aula, confirme sua presença com 1 toque no app. A gerência da academia valida sua aula e o pagamento é feito diretamente para sua chave Pix cadastrada.",
      highlight:
        "Sem desconto sobre seu valor-hora: você recebe 100% do combinado diretamente da academia!",
      color: "from-emerald-500 to-teal-600"
    }
  ];

  const academiaSteps = [
    {
      badge: "Passo 1 de 3 · Planejamento da Escala",
      icon: CalendarPlus,
      title: "Publique Vagas e Horários",
      description:
        "Na aba Agenda, cadastre horários avulsos ou monte a grade recorrente de múltiplos dias do mês inteiro em poucos segundos.",
      highlight:
        "Acompanhe tudo na Grade Semanal e no Calendário Mensal com controle total dos horários da sua unidade.",
      color: "from-blue-500 to-indigo-600"
    },
    {
      badge: "Passo 2 de 3 · Match Inteligente",
      icon: Users,
      title: "Recomendações com Match de Horário",
      description:
        "Nosso algoritmo prioriza no topo da lista os professores com grade cadastrada no mesmo intervalo da sua vaga, com CREF ativo e auditado.",
      highlight:
        "Convide os profissionais ideais com apenas 1 clique ou aprove candidaturas diretamente pelo painel.",
      color: "from-indigo-500 to-purple-600"
    },
    {
      badge: "Passo 3 de 3 · Gestão e Presença",
      icon: ShieldCheck,
      title: "Validação de Presença e Histórico",
      description:
        "Receba alertas imediatos quando o professor iniciar a aula na sua unidade e valide a presença com 1 clique para manter o relatório auditado.",
      highlight:
        "Controle total de faltas, pontualidade e histórico de horas ministradas mês a mês.",
      color: "from-emerald-500 to-teal-600"
    }
  ];

  const steps = role === "professor" ? professorSteps : academiaSteps;
  const step = steps[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    try {
      localStorage.setItem(`trainermatch_onboarding_${role}`, "true");
    } catch (e) {
      // safe fallback
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-navy-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-card dark:bg-navy-900 rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        {/* Barra Superior com Logo e Botão Pular */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary text-white font-black text-sm flex items-center justify-center shadow-xs">
              TM
            </div>
            <div>
              <span className="text-xs font-black text-navy-900 dark:text-white block leading-none">TrainerMatch</span>
              <span className="text-[10px] text-muted dark:text-slate-400">
                {role === "professor" ? "Guia Rápido do Professor" : "Guia Rápido da Academia"}
              </span>
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="text-xs font-bold text-muted dark:text-slate-400 hover:text-navy-900 dark:hover:text-white px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
          >
            Pular
          </button>
        </div>

        {/* Conteúdo do Slide */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
          {/* Card Visual com Gradiente */}
          <div className={`w-full rounded-2xl p-6 bg-gradient-to-br ${step.color} text-white shadow-lg flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden`}>
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
              <StepIcon size={32} strokeWidth={2} className="text-white" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
              {step.badge}
            </span>
          </div>

          {/* Título e Texto */}
          <div className="space-y-3 text-center sm:text-left">
            <h2 className="text-xl font-black text-navy-900 dark:text-white tracking-tight">
              {step.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {step.description}
            </p>

            {/* Caixa de Destaque / Dica */}
            <div className="p-3.5 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 text-left flex items-start gap-2.5">
              <Sparkles size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-navy-900 dark:text-slate-200 leading-snug">
                {step.highlight}
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé com Stepper e Botão de Ação */}
        <div className="p-5 bg-slate-50 dark:bg-navy-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          {/* Indicador de Bolinhas (Dots) */}
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`transition-all rounded-full ${
                  currentStep === idx
                    ? "w-7 h-2 bg-primary shadow-xs"
                    : "w-2 h-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
                }`}
                aria-label={`Ir para passo ${idx + 1}`}
              />
            ))}
          </div>

          {/* Botões de Navegação */}
          <div className="flex items-center gap-2">
            {currentStep < 2 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-primary hover:bg-primary-hover text-white font-extrabold px-6 py-2.5 rounded-full text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
              >
                <span>Próximo</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-2.5 rounded-full text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 animate-pulse"
              >
                <span>Começar a Usar</span>
                <Check size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
