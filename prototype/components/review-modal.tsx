"use client";

import React, { useState } from "react";
import {
  Star,
  X,
  Clock,
  Heart,
  Award,
  ShieldCheck,
  Sparkles,
  Zap,
  Smile,
  Dumbbell,
  ClipboardCheck,
  Sun,
  Building2,
  ThumbsUp,
  ThumbsDown,
  HeartHandshake,
  Check,
  LucideIcon
} from "lucide-react";
import { AnimatedModal } from "./animated-modal";
import {
  PROFESSOR_QUALITY_BADGES,
  GYM_QUALITY_BADGES,
  QualityBadge,
  CriteriaBreakdown,
  GymCriteriaBreakdown
} from "../store/mock-data";

export interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "gym_reviews_instructor" | "instructor_reviews_gym";
  targetName: string;
  targetAvatarOrLogo?: string;
  shiftTitle: string;
  shiftDateFormatted: string;
  onSubmit: (data: {
    rating: number;
    criteria: CriteriaBreakdown | GymCriteriaBreakdown;
    badges: string[];
    recommend: boolean;
    comment?: string;
  }) => void;
}

const BADGE_ICONS: Record<string, LucideIcon> = {
  Clock,
  Heart,
  Award,
  ShieldCheck,
  Sparkles,
  Zap,
  Smile,
  Dumbbell,
  ClipboardCheck,
  Sun
};

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  type,
  targetName,
  targetAvatarOrLogo,
  shiftTitle,
  shiftDateFormatted,
  onSubmit
}) => {
  const isGymReviewing = type === "gym_reviews_instructor";

  // General rating: 1 to 5
  const [overallRating, setOverallRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Criteria ratings (1 to 5)
  // Professor pillars: pontualidade, tecnica, postura
  const [instructorCriteria, setInstructorCriteria] = useState<CriteriaBreakdown>({
    pontualidade: 5,
    tecnica: 5,
    postura: 5
  });

  // Gym pillars: recepcao, estrutura, pagamento
  const [gymCriteria, setGymCriteria] = useState<GymCriteriaBreakdown>({
    recepcao: 5,
    estrutura: 5,
    pagamento: 5
  });

  // Badges selected
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);

  // Recommendation (thumbs up / down)
  const [recommend, setRecommend] = useState<boolean>(true);

  // Comment
  const [comment, setComment] = useState("");

  const badgesList: QualityBadge[] = isGymReviewing
    ? PROFESSOR_QUALITY_BADGES
    : GYM_QUALITY_BADGES;

  const toggleBadge = (badgeLabel: string) => {
    setSelectedBadges((prev) =>
      prev.includes(badgeLabel)
        ? prev.filter((b) => b !== badgeLabel)
        : [...prev, badgeLabel]
    );
  };

  const updateInstructorPillar = (pillar: keyof typeof instructorCriteria, val: number) => {
    const nextCrit = { ...instructorCriteria, [pillar]: val };
    setInstructorCriteria(nextCrit);
    const avg = Number(((nextCrit.pontualidade + nextCrit.tecnica + nextCrit.postura) / 3).toFixed(1));
    setOverallRating(avg);
  };

  const updateGymPillar = (pillar: keyof typeof gymCriteria, val: number) => {
    const nextCrit = { ...gymCriteria, [pillar]: val };
    setGymCriteria(nextCrit);
    const avg = Number(((nextCrit.recepcao + nextCrit.estrutura + nextCrit.pagamento) / 3).toFixed(1));
    setOverallRating(avg);
  };

  const handleRatingChange = (score: number) => {
    setOverallRating(score);
    // Align criteria to match overall rating by default if unchanged
    if (isGymReviewing) {
      setInstructorCriteria({
        pontualidade: score,
        tecnica: score,
        postura: score
      });
    } else {
      setGymCriteria({
        recepcao: score,
        estrutura: score,
        pagamento: score
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRating = isGymReviewing
      ? Number(((instructorCriteria.pontualidade + instructorCriteria.tecnica + instructorCriteria.postura) / 3).toFixed(1))
      : Number(((gymCriteria.recepcao + gymCriteria.estrutura + gymCriteria.pagamento) / 3).toFixed(1));

    onSubmit({
      rating: finalRating,
      criteria: isGymReviewing ? instructorCriteria : gymCriteria,
      badges: selectedBadges,
      recommend,
      comment: comment.trim() || undefined
    });
    onClose();
  };

  const getRatingFeedback = (score: number) => {
    switch (score) {
      case 5:
        return "Excelente! Experiência de alto padrão";
      case 4:
        return "Muito bom! Cumpriu muito bem com as expectativas";
      case 3:
        return "Bom, mas com pequenos pontos a ajustar";
      case 2:
        return "Razoável, ocorreram contratempos no turno";
      case 1:
        return "Insatisfatório, não recomendo";
      default:
        return "";
    }
  };

  const displayScore = hoverRating ?? overallRating;

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      className="p-5 space-y-4 max-h-[90vh] overflow-y-auto"
      showHandle={true}
      align="bottom"
      ariaLabel="Avaliação bilateral pós-turno"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-navy-800">
        <div className="flex items-center gap-3">
          {targetAvatarOrLogo ? (
            <img
              src={targetAvatarOrLogo}
              alt={targetName}
              className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-navy-700 shadow-sm"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold text-base">
              {targetName.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-bold text-navy-900 dark:text-white text-base leading-tight">
              {isGymReviewing ? `Avaliar ${targetName}` : `Avaliar ${targetName}`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {shiftTitle} · {shiftDateFormatted}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          type="button"
          aria-label="Fechar"
          className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition"
        >
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Overall Star Rating */}
        <div className="text-center py-2 bg-slate-50 dark:bg-navy-900/50 rounded-2xl p-4 border border-slate-100 dark:border-navy-800/80">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-2">
            Nota Geral da Experiência
          </p>

          <div className="flex justify-center items-center gap-2 my-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= displayScore;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 text-amber-400 hover:scale-115 transition-transform focus:outline-none"
                  aria-label={`Nota ${star}`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      isFilled
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300 dark:text-navy-700"
                    }`}
                    strokeWidth={1.5}
                  />
                </button>
              );
            })}
          </div>

          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1 min-h-[16px]">
            {getRatingFeedback(displayScore)}
          </p>
        </div>

        {/* Step 2: 3 Objetive Pillars */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Critérios de Avaliação (3 Pilares)
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">Toque para pontuar</span>
          </div>

          {isGymReviewing ? (
            <div className="space-y-2.5">
              {/* Pontualidade & Presenca */}
              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-navy-900 border border-slate-100 dark:border-navy-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-navy-900 dark:text-white">
                      Pontualidade & Presença
                    </p>
                    <p className="text-[10px] text-slate-400">Chegada no horário e permanência integral</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateInstructorPillar("pontualidade", s)}
                      className="p-1 focus:outline-none"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          s <= instructorCriteria.pontualidade
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200 dark:text-navy-700"
                        }`}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Dominio Tecnico & Seguranca */}
              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-navy-900 border border-slate-100 dark:border-navy-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                    <Award className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-navy-900 dark:text-white">
                      Domínio Técnico & Segurança
                    </p>
                    <p className="text-[10px] text-slate-400">Correção postural e condução segura</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateInstructorPillar("tecnica", s)}
                      className="p-1 focus:outline-none"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          s <= instructorCriteria.tecnica
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200 dark:text-navy-700"
                        }`}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Postura & Atendimento */}
              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-navy-900 border border-slate-100 dark:border-navy-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                    <HeartHandshake className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-navy-900 dark:text-white">
                      Postura & Atendimento
                    </p>
                    <p className="text-[10px] text-slate-400">Simpatia, proatividade e uniforme</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateInstructorPillar("postura", s)}
                      className="p-1 focus:outline-none"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          s <= instructorCriteria.postura
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200 dark:text-navy-700"
                        }`}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Recepcao & Organizacao */}
              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-navy-900 border border-slate-100 dark:border-navy-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-navy-900 dark:text-white">
                      Recepção & Organização
                    </p>
                    <p className="text-[10px] text-slate-400">Acolhimento da equipe e orientação</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateGymPillar("recepcao", s)}
                      className="p-1 focus:outline-none"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          s <= gymCriteria.recepcao
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200 dark:text-navy-700"
                        }`}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Estrutura & Equipamentos */}
              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-navy-900 border border-slate-100 dark:border-navy-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                    <Dumbbell className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-navy-900 dark:text-white">
                      Estrutura & Aparelhos
                    </p>
                    <p className="text-[10px] text-slate-400">Conservação, som e climatização</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateGymPillar("estrutura", s)}
                      className="p-1 focus:outline-none"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          s <= gymCriteria.estrutura
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200 dark:text-navy-700"
                        }`}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Pontualidade do Pagamento */}
              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-navy-900 border border-slate-100 dark:border-navy-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                    <Zap className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-navy-900 dark:text-white">
                      Pontualidade do Pagamento
                    </p>
                    <p className="text-[10px] text-slate-400">Repasse ágil do valor via PIX</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateGymPillar("pagamento", s)}
                      className="p-1 focus:outline-none"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          s <= gymCriteria.pagamento
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200 dark:text-navy-700"
                        }`}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Badges de Qualidade (Estilo Uber) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Qualidades de Destaque
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">Toque para selecionar</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {badgesList.map((badge) => {
              const isSelected = selectedBadges.includes(badge.label);
              const IconComp = BADGE_ICONS[badge.iconName] || Award;

              return (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => toggleBadge(badge.label)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-500 shadow-sm dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 dark:bg-navy-900 dark:text-slate-300 dark:border-navy-700 dark:hover:border-navy-600"
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} strokeWidth={1.5} />
                  <span>{badge.label}</span>
                  {isSelected && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 ml-0.5" strokeWidth={2} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 4: Recomendaria / Contrataria novamente? */}
        <div className="bg-slate-50 dark:bg-navy-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-navy-800/80 space-y-2.5">
          <p className="text-xs font-semibold text-navy-900 dark:text-white">
            {isGymReviewing
              ? "Você contrataria este professor novamente?"
              : "Recomendaria esta academia para outros professores?"}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRecommend(true)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition ${
                recommend
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700"
              }`}
            >
              <ThumbsUp className="w-4 h-4" strokeWidth={1.5} />
              <span>Sim, com certeza</span>
            </button>

            <button
              type="button"
              onClick={() => setRecommend(false)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition ${
                !recommend
                  ? "bg-rose-600 text-white shadow-sm shadow-rose-600/30"
                  : "bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700"
              }`}
            >
              <ThumbsDown className="w-4 h-4" strokeWidth={1.5} />
              <span>Não recomendo</span>
            </button>
          </div>
        </div>

        {/* Step 5: Optional Feedback Comment */}
        <div className="space-y-1.5">
          <label htmlFor="review-comment" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Comentário adicional (opcional)
          </label>
          <textarea
            id="review-comment"
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Deixe um elogio ou observação construtiva sobre o turno..."
            className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            type="submit"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold rounded-xl text-sm shadow-sm shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" strokeWidth={1.5} />
            <span>Enviar Avaliação</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-center"
          >
            Avaliar mais tarde
          </button>
        </div>
      </form>
    </AnimatedModal>
  );
};
