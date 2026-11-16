"use client";

import React, { useState } from "react";
import {
  Home,
  Calendar,
  Briefcase,
  User,
  Users,
  Search,
  Building2,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Compass
} from "lucide-react";

interface OnboardingModalProps {
  role: "professor" | "academia";
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  role,
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const professorSteps = [
    {
      tab: "inicio",
      section: "Início",
      badge: "Passo 1 de 4 · Área Inicial",
      icon: Home,
      title: "Boas-vindas ao TrainerMatch",
      description:
        "Boas-vindas, esta é sua área inicial onde poderá navegar por atualizações e informações do app.",
      highlight:
        "Aqui você encontra avisos urgentes, oportunidades em destaque e o resumo rápido das suas próximas aulas.",
      color: "from-blue-600 to-indigo-700"
    },
    {
      tab: "negociacoes",
      section: "Propostas",
      badge: "Passo 2 de 4 · Oportunidades",
      icon: Briefcase,
      title: "Acompanhe Propostas e Convites",
      description:
        "Em Propostas você acompanha convites recebidos de academias, negocia contrapropostas e visualiza oportunidades abertas.",
      highlight:
        "Tenha total transparência de valores por hora/aula, horários e localização antes de aceitar qualquer convite.",
      color: "from-amber-500 to-orange-600"
    },
    {
      tab: "agenda",
      section: "Agenda",
      badge: "Passo 3 de 4 · Seus Horários",
      icon: Calendar,
      title: "Configure sua Grade e Horários",
      description:
        "Na Agenda você configura seus horários disponíveis, cadastra sua grade semanal e gerencia seus plantões confirmados.",
      highlight:
        "Academias com vagas nos mesmos horários da sua grade verão seu perfil no topo das recomendações automáticas.",
      color: "from-emerald-600 to-teal-700"
    },
    {
      tab: "perfil",
      section: "Perfil",
      badge: "Passo 4 de 4 · Seus Dados e Avaliação",
      icon: User,
      title: "Gerencie seu Perfil e Reputação",
      description:
        "No Perfil você cadastra e atualiza seus dados pessoais, experiências, configurações e verifica sua avaliação.",
      highlight:
        "Mantenha seus documentos em dia e confira as notas nos 3 pilares: Pontualidade, Postura e Técnica.",
      color: "from-purple-600 to-indigo-800"
    }
  ];

  const academiaSteps = [
    {
      tab: "home",
      section: "Início",
      badge: "Passo 1 de 5 · Visão Geral",
      icon: Home,
      title: "Boas-vindas à Gestão da Unidade",
      description:
        "Esta é sua área inicial onde você acompanha o resumo dos plantões do dia, solicitações urgentes e avisos importantes da sua unidade.",
      highlight:
        "Visão imediata dos turnos com professores alocados e horários pendentes de cobertura.",
      color: "from-blue-600 to-indigo-700"
    },
    {
      tab: "agenda",
      section: "Agenda",
      badge: "Passo 2 de 5 · Grade de Turnos",
      icon: Calendar,
      title: "Gerencie a Grade de Turnos",
      description:
        "Na Agenda você cadastra turnos avulsos ou cria escalas recorrentes para o mês inteiro, controlando a cobertura da unidade.",
      highlight:
        "Defina valores máximos por hora, modalidade e acompanhe a confirmação dos professores em tempo real.",
      color: "from-indigo-600 to-purple-700"
    },
    {
      tab: "propostas",
      section: "Propostas",
      badge: "Passo 3 de 5 · Negociações",
      icon: Briefcase,
      title: "Acompanhe Propostas e Convites",
      description:
        "Em Propostas você acompanha convites enviados a professores, responde a contrapropostas e avalia candidaturas recebidas.",
      highlight:
        "Aprove com 1 clique o profissional ideal para cada vaga sem complicação burocrática.",
      color: "from-amber-500 to-orange-600"
    },
    {
      tab: "professores",
      section: "Buscar Professores",
      badge: "Passo 4 de 5 · Match de Profissionais",
      icon: Users,
      title: "Encontre Professores Qualificados",
      description:
        "Em Buscar Professores você pesquisa profissionais disponíveis na sua região, filtra por modalidade e consulta avaliações e CREF auditado.",
      highlight:
        "O sistema indica automaticamente os professores que têm grade compatível com os horários da sua vaga.",
      color: "from-teal-600 to-emerald-700"
    },
    {
      tab: "perfil",
      section: "Perfil",
      badge: "Passo 5 de 5 · Configurações",
      icon: Building2,
      title: "Dados da Unidade e Regras",
      description:
        "No Perfil você configura os dados cadastrais da academia, valores padrão por hora/aula, modalidades aceitas e regras operacionais.",
      highlight:
        "Mantenha as informações da unidade atualizadas para atrair os melhores instrutores da região.",
      color: "from-purple-600 to-slate-800"
    }
  ];

  const steps = role === "professor" ? professorSteps : academiaSteps;
  const totalSteps = steps.length;
  const step = steps[currentStep];
  const StepIcon = step.icon;

  const goToStep = (idx: number) => {
    if (idx >= 0 && idx < totalSteps) {
      setCurrentStep(idx);
      if (onNavigateTab && steps[idx]?.tab) {
        onNavigateTab(steps[idx].tab);
      }
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      goToStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
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
        {/* Barra Superior com Logo, Indicador de Seção e Botão Pular */}
        <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-navy-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary text-white font-black text-sm flex items-center justify-center shadow-xs">
              TM
            </div>
            <div>
              <span className="text-xs font-black text-navy-900 dark:text-white block leading-none">
                TrainerMatch
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Compass size={11} className="text-primary shrink-0" />
                <span className="text-[10px] font-bold text-primary truncate">
                  Tutorial · {step.section}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="text-xs font-bold text-muted dark:text-slate-400 hover:text-navy-900 dark:hover:text-white px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
          >
            Pular tutorial
          </button>
        </div>

        {/* Conteúdo do Slide */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-5">
          {/* Card Visual com Gradiente e Apontador de Seção */}
          <div
            className={`w-full rounded-2xl p-6 bg-gradient-to-br ${step.color} text-white shadow-lg flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden transition-all duration-300`}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
              <StepIcon size={32} strokeWidth={2} className="text-white" />
            </div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
              <span>{step.badge}</span>
            </div>
          </div>

          {/* Título e Texto */}
          <div className="space-y-3 text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-black text-navy-900 dark:text-white tracking-tight">
              {step.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
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

        {/* Rodapé com Stepper e Botões de Ação */}
        <div className="p-5 bg-slate-50 dark:bg-navy-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          {/* Indicador de Bolinhas (Dots) */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goToStep(idx)}
                className={`transition-all rounded-full ${
                  currentStep === idx
                    ? "w-6 h-2 bg-primary shadow-xs"
                    : "w-2 h-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
                }`}
                aria-label={`Ir para passo ${idx + 1}`}
              />
            ))}
          </div>

          {/* Botões de Navegação */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
              >
                <ArrowLeft size={13} />
                <span>Voltar</span>
              </button>
            )}

            {currentStep < totalSteps - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-primary hover:bg-primary-hover text-white font-extrabold px-5 py-2.5 rounded-full text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
              >
                <span>Próximo</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-full text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
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
