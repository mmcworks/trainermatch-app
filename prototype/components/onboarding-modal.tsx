"use client";

import React, { useState } from "react";
import {
  Home,
  Calendar,
  Briefcase,
  User,
  Users,
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
      pointerOffset: "12.5%",
      title: "Boas-vindas ao TrainerMatch",
      description:
        "Boas-vindas, esta é sua área inicial onde poderá navegar por atualizações e informações do app.",
      highlight:
        "Aqui você encontra avisos urgentes, oportunidades em destaque e o resumo rápido das suas próximas aulas.",
      color: "from-blue-600 to-indigo-700"
    },
    {
      tab: "propostas",
      section: "Propostas",
      badge: "Passo 2 de 4 · Oportunidades",
      icon: Briefcase,
      pointerOffset: "37.5%",
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
      pointerOffset: "62.5%",
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
      pointerOffset: "87.5%",
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
      tab: "turnos",
      section: "Agenda",
      badge: "Passo 1 de 4 · Grade de Turnos",
      icon: Calendar,
      pointerOffset: "12.5%",
      title: "Gerencie a Grade de Turnos",
      description:
        "Na Agenda você cadastra turnos avulsos ou cria escalas recorrentes para o mês inteiro, controlando a cobertura da unidade.",
      highlight:
        "Defina valores por hora, modalidade e acompanhe a confirmação dos professores em tempo real.",
      color: "from-indigo-600 to-purple-700"
    },
    {
      tab: "propostas",
      section: "Propostas",
      badge: "Passo 2 de 4 · Negociações",
      icon: Briefcase,
      pointerOffset: "37.5%",
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
      badge: "Passo 3 de 4 · Match de Profissionais",
      icon: Users,
      pointerOffset: "62.5%",
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
      badge: "Passo 4 de 4 · Configurações",
      icon: Building2,
      pointerOffset: "87.5%",
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
  const step = steps[currentStep] || steps[0];
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
    <>
      {/* 1. Overlay Escuro que cobre a tela, destacando a tab bar e o card */}
      <div
        className="fixed inset-0 z-40 bg-black/80 backdrop-blur-xs animate-fade-in cursor-pointer"
        onClick={handleFinish}
        title="Toque para sair do tutorial"
      />

      {/* 2. Card do Tutorial posicionado acima da barra de navegação com Seta Apontadora */}
      <div className="fixed bottom-[calc(max(2rem,calc(1rem+env(safe-area-inset-bottom,24px)))+4.5rem)] left-0 right-0 max-w-md mx-auto px-4 z-50 pointer-events-auto">
        <div className="relative bg-card dark:bg-navy-900 border-2 border-primary/40 dark:border-primary/50 rounded-[28px] p-5 shadow-2xl animate-slide-up space-y-3.5">
          {/* Seta Apontadora para o botão da aba ativa */}
          <div
            className="absolute -bottom-2 w-4 h-4 bg-card dark:bg-navy-900 border-r-2 border-b-2 border-primary/40 dark:border-primary/50 transform rotate-45 transition-all duration-300"
            style={{ left: step.pointerOffset, transform: "translateX(-50%) rotate(45deg)" }}
          />

          {/* Cabeçalho do Card */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary text-white font-black text-xs flex items-center justify-center shadow-xs">
                TM
              </div>
              <div className="flex items-center gap-1.5">
                <Compass size={12} className="text-primary shrink-0" />
                <span className="text-xs font-black text-navy-900 dark:text-white">
                  {step.badge}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="text-[11px] font-bold text-muted dark:text-slate-400 hover:text-navy-900 dark:hover:text-white px-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            >
              Pular tutorial
            </button>
          </div>

          {/* Conteúdo com Ícone, Título e Descrição */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${step.color} text-white shadow-sm shrink-0`}>
                <StepIcon size={20} strokeWidth={2} />
              </div>
              <h3 className="text-sm sm:text-base font-black text-navy-900 dark:text-white leading-tight">
                {step.title}
              </h3>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              {step.description}
            </p>

            {/* Destaque / Dica */}
            <div className="p-2.5 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20 flex items-start gap-2">
              <Sparkles size={14} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-navy-900 dark:text-slate-200 leading-snug">
                {step.highlight}
              </p>
            </div>
          </div>

          {/* Rodapé com Stepper e Botões de Navegação */}
          <div className="pt-2 flex items-center justify-between gap-2">
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

            {/* Botões Voltar / Próximo */}
            <div className="flex items-center gap-1.5">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 text-xs font-bold transition-all flex items-center gap-1"
                >
                  <ArrowLeft size={12} />
                  <span>Voltar</span>
                </button>
              )}

              {currentStep < totalSteps - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-primary hover:bg-primary-hover text-white font-extrabold px-4 py-2 rounded-full text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span>Próximo</span>
                  <ArrowRight size={12} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-full text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span>Concluir</span>
                  <Check size={13} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
