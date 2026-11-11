"use client";

import { create } from "zustand";
import {
  Gym,
  Instructor,
  Shift,
  Proposal,
  DayAvailability,
  PricingRules,
  CriteriaBreakdown,
  GymCriteriaBreakdown,
  MOCK_GYMS,
  MOCK_INSTRUCTORS,
  INITIAL_SHIFTS,
  INITIAL_PROPOSALS,
  formatDateDDMMAAAA,
  canCancelShift
} from "./mock-data";

export const MIN_TRANSIT_MINUTES = 30;

export interface ShiftConflictResult {
  hasConflict: boolean;
  conflictType?: "overlap" | "transit";
  conflictMessage?: string;
  conflictingShift?: Shift;
  conflictingGym?: Gym;
}

export function checkInstructorShiftConflict(
  instructorId: string,
  targetShift: Shift,
  allShifts: Shift[],
  allGyms: Gym[] = [],
  transitMinutes = MIN_TRANSIT_MINUTES
): ShiftConflictResult {
  if (!targetShift.date || !targetShift.startTime || !targetShift.endTime) {
    return { hasConflict: false };
  }

  const targetStart = timeToMinutes(targetShift.startTime);
  const targetEnd = timeToMinutes(targetShift.endTime);

  // Aulas já confirmadas ou realizadas deste professor na mesma data
  const instructorConfirmedShifts = allShifts.filter(
    (s) =>
      s.id !== targetShift.id &&
      s.date === targetShift.date &&
      s.confirmedInstructorId === instructorId &&
      (s.status === "confirmado" || s.status === "realizada")
  );

  for (const existingShift of instructorConfirmedShifts) {
    const existingStart = timeToMinutes(existingShift.startTime);
    const existingEnd = timeToMinutes(existingShift.endTime);
    const existingGym = allGyms.find((g) => g.id === existingShift.gymId);
    const existingGymName = existingGym?.name || "Outra Academia";
    const targetGym = allGyms.find((g) => g.id === targetShift.gymId);
    const targetGymName = targetGym?.name || "Esta Academia";

    // 1. Checagem de sobreposição direta de horário
    const overlapStart = Math.max(targetStart, existingStart);
    const overlapEnd = Math.min(targetEnd, existingEnd);
    if (overlapStart < overlapEnd) {
      return {
        hasConflict: true,
        conflictType: "overlap",
        conflictMessage: `Conflito direto: você já tem aula confirmada das ${existingShift.startTime} às ${existingShift.endTime} em ${existingGymName}.`,
        conflictingShift: existingShift,
        conflictingGym: existingGym
      };
    }

    // 2. Checagem de deslocamento entre academias diferentes
    const isDifferentGym = targetShift.gymId !== existingShift.gymId;
    if (isDifferentGym) {
      // Caso A: Aula existente termina antes da nova aula começar
      if (targetStart >= existingEnd) {
        const gap = targetStart - existingEnd;
        if (gap < transitMinutes) {
          return {
            hasConflict: true,
            conflictType: "transit",
            conflictMessage: `Deslocamento insuficiente: sua aula em ${existingGymName} termina às ${existingShift.endTime} e esta aula em ${targetGymName} começa às ${targetShift.startTime}. O intervalo é de apenas ${gap} min (mínimo necessário: ${transitMinutes} min).`,
            conflictingShift: existingShift,
            conflictingGym: existingGym
          };
        }
      }

      // Caso B: Nova aula termina antes da aula existente começar
      if (existingStart >= targetEnd) {
        const gap = existingStart - targetEnd;
        if (gap < transitMinutes) {
          return {
            hasConflict: true,
            conflictType: "transit",
            conflictMessage: `Deslocamento insuficiente: esta aula em ${targetGymName} termina às ${targetShift.endTime} e sua aula em ${existingGymName} começa às ${existingShift.startTime}. O intervalo é de apenas ${gap} min (mínimo necessário: ${transitMinutes} min).`,
            conflictingShift: existingShift,
            conflictingGym: existingGym
          };
        }
      }
    }
  }

  return { hasConflict: false };
}

export interface RecommendationMatch {
  instructor: Instructor;
  dayOfWeek: number;
  dayName: string;
  isAvailableOnDay: boolean;
  isModalityMatch: boolean;
  overlapMinutes: number;
  overlapHours: number;
  matchScore: number; // 0 a 100%
  matchingSlotsText: string;
  isFullMatch: boolean;
  isExactMatch: boolean; // Coincidência idêntica com o início e término da vaga
  coverageType: "exact" | "full" | "partial" | "none"; // Tipo de cobertura
  isRecommended: boolean;
  hasConflict?: boolean;
  conflictType?: "overlap" | "transit";
  conflictMessage?: string;
}

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export interface CheckInEligibilityResult {
  canCheckIn: boolean;
  status: "disponivel" | "dia_futuro" | "dia_passado" | "horario_cedo" | "horario_encerrado";
  message: string;
}

export function checkCheckInEligibility(
  shiftDate: string,
  startTime: string,
  endTime: string,
  currentSimulatedDate?: string,
  currentSimulatedTime?: string
): CheckInEligibilityResult {
  const now = new Date();

  // Determina a data atual de referência
  let todayStr = currentSimulatedDate;
  if (!todayStr) {
    const isNov2026 = now.getFullYear() === 2026 && now.getMonth() + 1 === 11;
    if (isNov2026) {
      const day = String(now.getDate()).padStart(2, "0");
      todayStr = `2026-11-${day}`;
    } else {
      todayStr = "2026-11-05"; // fallback consistente com o mock do app
    }
  }

  // Determina o horário atual de referência
  let currentTimeStr = currentSimulatedTime;
  if (!currentTimeStr) {
    currentTimeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  // 1. Verificação de Data
  if (shiftDate > todayStr) {
    return {
      canCheckIn: false,
      status: "dia_futuro",
      message: `Bloqueado: Aula em dia posterior (${formatDateDDMMAAAA(shiftDate)}). O check-in só é liberado no mesmo dia da aula.`
    };
  }

  if (shiftDate < todayStr) {
    return {
      canCheckIn: false,
      status: "dia_passado",
      message: `Bloqueado: A data desta aula (${formatDateDDMMAAAA(shiftDate)}) já expirou.`
    };
  }

  // 2. Mesma Data: Verificação de Horário
  const currentMinutes = timeToMinutes(currentTimeStr);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  // Tolerância: liberado 60 minutos antes do início até 30 minutos após o término
  const earlyToleranceMinutes = 60;
  const earliestAllowedMinutes = startMinutes - earlyToleranceMinutes;

  if (currentMinutes < earliestAllowedMinutes) {
    const earlyHour = Math.floor(Math.max(0, earliestAllowedMinutes) / 60);
    const earlyMin = Math.max(0, earliestAllowedMinutes) % 60;
    const earlyTimeFormatted = `${String(earlyHour).padStart(2, "0")}:${String(earlyMin).padStart(2, "0")}`;
    return {
      canCheckIn: false,
      status: "horario_cedo",
      message: `Aguarde o horário da aula: início liberado a partir das ${earlyTimeFormatted} (60 min antes das ${startTime}).`
    };
  }

  if (currentMinutes > endMinutes + 30) {
    return {
      canCheckIn: false,
      status: "horario_encerrado",
      message: `O horário desta aula (${startTime} às ${endTime}) já foi encerrado.`
    };
  }

  return {
    canCheckIn: true,
    status: "disponivel",
    message: "Horário liberado para início da aula."
  };
}

export function getInstructorMatchForShift(
  instructor: Instructor,
  shift: Shift,
  allShifts?: Shift[],
  allGyms?: Gym[]
): RecommendationMatch {
  if (!shift.date) {
    return {
      instructor,
      dayOfWeek: 1,
      dayName: "Segunda-feira",
      isAvailableOnDay: false,
      isModalityMatch: false,
      overlapMinutes: 0,
      overlapHours: 0,
      matchScore: 0,
      matchingSlotsText: "Sem horário",
      isFullMatch: false,
      isExactMatch: false,
      coverageType: "none",
      isRecommended: false
    };
  }

  const [y, m, d] = shift.date.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayOfWeek = dateObj.getDay();

  const dayAvail = instructor.availability?.find((a) => a.dayOfWeek === dayOfWeek);
  const dayName = dayAvail?.dayName || "Dia";
  const isAvailableOnDay = !!dayAvail?.active;

  const isModalityMatch = instructor.modalities.some(
    (mod) =>
      mod.toLowerCase().includes(shift.modality.toLowerCase()) ||
      shift.modality.toLowerCase().includes(mod.toLowerCase())
  );

  const shiftStart = timeToMinutes(shift.startTime);
  const shiftEnd = timeToMinutes(shift.endTime);
  const shiftDuration = Math.max(1, shiftEnd - shiftStart);

  let totalOverlapMinutes = 0;
  const matchingSlotTexts: string[] = [];
  let hasExactSlot = false;

  if (isAvailableOnDay && dayAvail?.slots) {
    for (const slot of dayAvail.slots) {
      const slotStart = timeToMinutes(slot.start);
      const slotEnd = timeToMinutes(slot.end);
      const overlapStart = Math.max(shiftStart, slotStart);
      const overlapEnd = Math.min(shiftEnd, slotEnd);
      const overlap = Math.max(0, overlapEnd - overlapStart);

      // Coincidência idêntica com o início e término da vaga
      if (slotStart === shiftStart && slotEnd === shiftEnd) {
        hasExactSlot = true;
      }

      if (overlap > 0) {
        totalOverlapMinutes += overlap;
        matchingSlotTexts.push(`${slot.start} – ${slot.end}`);
      }
    }
  }

  const overlapHours = Math.round((totalOverlapMinutes / 60) * 10) / 10;
  const matchScore = Math.min(100, Math.round((totalOverlapMinutes / shiftDuration) * 100));
  const isFullMatch = matchScore >= 95 || totalOverlapMinutes >= shiftDuration;
  const isExactMatch = hasExactSlot;

  let coverageType: "exact" | "full" | "partial" | "none" = "none";
  if (isExactMatch) {
    coverageType = "exact";
  } else if (isFullMatch) {
    coverageType = "full";
  } else if (totalOverlapMinutes > 0) {
    coverageType = "partial";
  }

  let hasConflict = false;
  let conflictType: "overlap" | "transit" | undefined;
  let conflictMessage: string | undefined;

  if (allShifts) {
    const conflict = checkInstructorShiftConflict(instructor.id, shift, allShifts, allGyms || []);
    if (conflict.hasConflict) {
      hasConflict = true;
      conflictType = conflict.conflictType;
      conflictMessage = conflict.conflictMessage;
    }
  }

  const isRecommended = isAvailableOnDay && isModalityMatch && totalOverlapMinutes > 0 && !hasConflict;

  return {
    instructor,
    dayOfWeek,
    dayName,
    isAvailableOnDay,
    isModalityMatch,
    overlapMinutes: totalOverlapMinutes,
    overlapHours,
    matchScore,
    matchingSlotsText: matchingSlotTexts.length > 0 ? matchingSlotTexts.join(", ") : "Sem sobreposição",
    isFullMatch,
    isExactMatch,
    coverageType,
    isRecommended,
    hasConflict,
    conflictType,
    conflictMessage
  };
}

export function getRecommendedInstructorsForShift(
  shift: Shift | undefined,
  instructors: Instructor[],
  sortBy: "horarios" | "valores" | "avaliacao" = "horarios",
  allShifts?: Shift[],
  allGyms?: Gym[]
): RecommendationMatch[] {
  if (!shift) return [];
  // Filtra apenas instrutores ativos e não excluídos (elimina usuários inexistentes como José da Silva)
  const activeInstructors = instructors.filter(
    (inst) => !inst.isDeleted && inst.isActive !== false && !inst.name?.toLowerCase().includes("josé da silva") && inst.cref !== "12345/ES"
  );
  const matches = activeInstructors.map((inst) => getInstructorMatchForShift(inst, shift, allShifts, allGyms));

  return matches.sort((a, b) => {
    // 0º critério: conflito de horário/deslocamento vai para o fim
    if (a.hasConflict !== b.hasConflict) {
      return a.hasConflict ? 1 : -1;
    }

    // 1º critério: recomendado primeiro
    if (a.isRecommended !== b.isRecommended) {
      return a.isRecommended ? -1 : 1;
    }

    // Função auxiliar para classificar a abrangência de horários:
    // Nível 3: Intervalo idêntico ao da vaga (ex: 08h às 12h)
    // Nível 2: Cobertura total do intervalo da vaga (100% ou mais)
    // Nível 1: Cobertura parcial dentro da faixa da vaga (ex: 09h às 11h dentro de 08h às 12h)
    // Nível 0: Sem cobertura
    const getCoverageRank = (m: RecommendationMatch) => {
      if (m.isExactMatch) return 3;
      if (m.isFullMatch) return 2;
      if (m.overlapMinutes > 0) return 1;
      return 0;
    };

    const rankA = getCoverageRank(a);
    const rankB = getCoverageRank(b);

    if (sortBy === "horarios") {
      // Regra de ouro: professor com mesmo intervalo ou cobertura total SEMPRE primeiro!
      if (rankB !== rankA) {
        return rankB - rankA;
      }
      // Se ambos tiverem o mesmo ranking de cobertura, maior quantidade de minutos sobrepostos
      if (b.overlapMinutes !== a.overlapMinutes) {
        return b.overlapMinutes - a.overlapMinutes;
      }
      return b.matchScore - a.matchScore;
    }

    if (sortBy === "valores") {
      // Mesmo ordenando por valores, manter professores com cobertura total à frente de parciais
      if (rankB >= 2 && rankA < 2) return 1;
      if (rankA >= 2 && rankB < 2) return -1;

      // Menor valor de hora-aula primeiro
      if (a.instructor.hourlyRate !== b.instructor.hourlyRate) {
        return a.instructor.hourlyRate - b.instructor.hourlyRate;
      }
      return b.overlapMinutes - a.overlapMinutes;
    }

    if (sortBy === "avaliacao") {
      // Manter professores com cobertura total à frente de parciais
      if (rankB >= 2 && rankA < 2) return 1;
      if (rankA >= 2 && rankB < 2) return -1;

      // Professores com avaliações reais (> 0) ficam à frente de novos sem notas
      const countA = a.instructor.ratingCount || 0;
      const countB = b.instructor.ratingCount || 0;
      if (countA === 0 && countB > 0) return 1;
      if (countB === 0 && countA > 0) return -1;

      return b.instructor.rating - a.instructor.rating;
    }

    return 0;
  });
}

export function calculateSuggestedRate(
  gym: Gym | undefined,
  modality: string,
  startTime: string,
  dateStr: string
): number {
  if (!gym?.pricingRules) return 45;
  const baseRate = gym.pricingRules.modalityRates[modality] || 40;
  let addition = 0;

  if (startTime) {
    const [h] = startTime.split(":").map(Number);
    if (h >= 18) {
      addition += gym.pricingRules.peakHourAddition || 0;
    }
  }

  if (dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      addition += gym.pricingRules.weekendAddition || 0;
    }
  }

  return baseRate + addition;
}

interface AppState {
  // Estado de carregamento e sincronização
  isLoaded: boolean;
  syncWithBackend: () => Promise<void>;

  // Dados
  gyms: Gym[];
  instructors: Instructor[];
  shifts: Shift[];
  proposals: Proposal[];
  
  // Contexto da sessão e autenticação
  isAuthenticated: boolean;
  userEmail: string;
  userName: string;
  currentRole: "professor" | "academia";
  activeInstructorId: string;
  activeGymId: string;
  
  // Ações de Autenticação
  login: (email: string, passwordOrRole?: string, maybeRole?: "professor" | "academia") => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
  registerUser: (data: { name: string; email: string; password?: string; role: "professor" | "academia"; doc: string; crefOrCnpj: string; phone?: string; logoOrAvatar?: string }) => Promise<{ success: boolean; error?: string }>;
  
  // Assinatura da Academia ativa
  gymPlan: "gratis" | "essencial" | "pro" | "rede";
  hiresThisMonth: number;
  isFirstHireFreeUsed: boolean;
  
  // Tema Escuro / Claro
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  
  // Ações de Disponibilidade e Precificação
  updateInstructorAvailability: (instructorId: string, availability: DayAvailability[]) => void;
  updateInstructorProfile: (instructorId: string, data: Partial<Instructor>) => void;
  updateGymPricing: (gymId: string, pricingRules: PricingRules) => void;
  
  // Ações de Proposta e Contratação (Valor Fixo)
  setRole: (role: "professor" | "academia") => void;
  createProposal: (shiftId: string, instructorId: string, rate?: number) => void;
  inviteInstructor: (shiftId: string, instructorId: string) => void;
  sendCounterProposal: (proposalId: string, counterRate: number, senderRole: "professor" | "academia") => void;
  acceptProposal: (proposalId: string) => { requiresSubscription: boolean; hasConflict?: boolean; conflictMessage?: string };
  rejectProposal: (proposalId: string) => void;
  updateGymProfile: (gymId: string, data: Partial<Gym>) => void;
  createShift: (shiftData: Omit<Shift, "id" | "status">) => void;
  createMultipleShifts: (shiftsData: Omit<Shift, "id" | "status">[]) => void;
  deleteShift: (shiftId: string) => { success: boolean; error?: string };
  instructorCheckIn: (shiftId: string) => { success: boolean; message: string };
  gymValidateAttendance: (shiftId: string) => void;
  completeShift: (shiftId: string) => void;
  cancelShift: (shiftId: string, role: "professor" | "academia", reason: string, cancelledByName: string) => Promise<boolean>;
  toggleBlockDate: (instructorId: string, dateStr: string) => Promise<void>;
  submitInstructorReview: (
    shiftId: string,
    instructorId: string,
    rating: number,
    criteria: CriteriaBreakdown,
    badges: string[],
    wouldHireAgain: boolean,
    comment?: string
  ) => void;
  submitGymReview: (
    shiftId: string,
    gymId: string,
    rating: number,
    criteria: GymCriteriaBreakdown,
    badges: string[],
    wouldRecommend: boolean,
    comment?: string
  ) => void;
  subscribePlan: (plan: "essencial" | "pro" | "rede") => void;
  resetAll: () => void;
  
  // Simulação Dev (avançar tempo)
  tickSimulationTime: (minutes: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isLoaded: false,
  gyms: [],
  instructors: [],
  shifts: [],
  proposals: [],

  isAuthenticated: false,
  userEmail: "",
  userName: "",
  currentRole: "professor",
  activeInstructorId: "",
  activeGymId: "",

  syncWithBackend: async () => {
    try {
      // 1. Checa sessão do usuário
      let sessionUser: any = null;
      try {
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.authenticated && meData.user) {
            sessionUser = meData.user;
          }
        }
      } catch (e) {
        console.warn("Sessão não recuperada:", e);
      }

      // 2. Busca academias, professores, turnos e propostas do banco
      const [gymsRes, instructorsRes, shiftsRes, proposalsRes] = await Promise.all([
        fetch("/api/gyms").catch(() => null),
        fetch("/api/instructors").catch(() => null),
        fetch("/api/shifts").catch(() => null),
        fetch("/api/proposals").catch(() => null)
      ]);

      const gyms = gymsRes && gymsRes.ok ? await gymsRes.json() : [];
      const rawInstructors = instructorsRes && instructorsRes.ok ? await instructorsRes.json() : [];
      const rawShifts = shiftsRes && shiftsRes.ok ? await shiftsRes.json() : [];
      const rawProposals = proposalsRes && proposalsRes.ok ? await proposalsRes.json() : [];

      // Garante que todo turno possui maxRate, rate, title e data formatada válidos
      const shifts: Shift[] = rawShifts.map((s: any) => {
        const rateVal = Number(s.maxRate ?? s.rate ?? 45);
        return {
          ...s,
          rate: rateVal,
          maxRate: rateVal,
          title: s.title || `${s.modality || "Aula"} - Aula`,
          dateFormatted: s.dateFormatted || `${formatDateDDMMAAAA(s.date)} · ${s.startTime} – ${s.endTime}`
        };
      });

      // Filtra instrutores ativos e válidos
      const instructors = rawInstructors.filter(
        (i: any) => !i.isDeleted && i.isActive !== false && !i.name?.toLowerCase().includes("josé da silva") && i.cref !== "12345/ES"
      );
      // Remove propostas órfãs ou de instrutores inexistentes
      const proposals = rawProposals.filter((p: any) =>
        instructors.some((i: any) => i.id === p.instructorId)
      );

      // Recupera cache local caso o backend esteja em cold start ou em atualização
      let cachedGym: any = null;
      let cachedInstructor: any = null;
      try {
        if (typeof window !== "undefined") {
          const storedG = localStorage.getItem("trainermatch_gym_cache");
          if (storedG) cachedGym = JSON.parse(storedG);
          const storedI = localStorage.getItem("trainermatch_instructor_cache");
          if (storedI) cachedInstructor = JSON.parse(storedI);
        }
      } catch (e) {}

      if (sessionUser) {
        const userGymId = sessionUser.role === "academia" && sessionUser.gym?.id
          ? sessionUser.gym.id
          : (sessionUser.role === "academia" ? (get().activeGymId || gyms[0]?.id || "") : "");
        const userInstructorId = sessionUser.role === "professor" && sessionUser.instructor?.id
          ? sessionUser.instructor.id
          : (sessionUser.role === "professor" ? (get().activeInstructorId || instructors[0]?.id || "") : "");

        let mergedInstructors = sessionUser.instructor
          ? [sessionUser.instructor, ...instructors.filter((i: any) => i.id !== sessionUser.instructor.id)]
          : instructors;

        if (cachedInstructor) {
          mergedInstructors = mergedInstructors.map((i: any) =>
            i.id === cachedInstructor.id || i.id === userInstructorId ? { ...i, ...cachedInstructor } : i
          );
        }

        let mergedGyms = sessionUser.gym
          ? [sessionUser.gym, ...gyms.filter((g: any) => g.id !== sessionUser.gym.id)]
          : gyms;

        if (cachedGym) {
          mergedGyms = mergedGyms.map((g: any) =>
            g.id === cachedGym.id || g.id === userGymId ? { ...g, ...cachedGym } : g
          );
        }

        const effectiveEmail = cachedGym?.email || cachedInstructor?.email || sessionUser.email;
        const effectiveName = cachedGym?.name || cachedInstructor?.name || sessionUser.name;

        set({
          isLoaded: true,
          isAuthenticated: true,
          userEmail: effectiveEmail,
          userName: effectiveName,
          currentRole: sessionUser.role,
          activeGymId: userGymId,
          activeInstructorId: userInstructorId,
          gymPlan: sessionUser.gym?.plan || "gratis",
          gyms: mergedGyms,
          instructors: mergedInstructors,
          shifts,
          proposals
        });
      } else {
        let mergedGyms = gyms;
        if (cachedGym) {
          mergedGyms = mergedGyms.map((g: any) => (g.id === cachedGym.id ? { ...g, ...cachedGym } : g));
        }
        let mergedInstructors = instructors;
        if (cachedInstructor) {
          mergedInstructors = mergedInstructors.map((i: any) => (i.id === cachedInstructor.id ? { ...i, ...cachedInstructor } : i));
        }

        set({
          isLoaded: true,
          isAuthenticated: false,
          gyms: mergedGyms,
          instructors: mergedInstructors,
          shifts,
          proposals
        });
      }
    } catch (err) {
      console.error("Erro ao sincronizar com backend:", err);
      set({ isLoaded: true });
    }
  },

  login: async (email, passwordOrRole, maybeRole) => {
    try {
      let password = "••••••••";
      let role: "professor" | "academia" | undefined = undefined;

      if (maybeRole) {
        password = passwordOrRole || "12345qwe";
        role = maybeRole;
      } else if (passwordOrRole === "professor" || passwordOrRole === "academia") {
        role = passwordOrRole;
        password = "12345qwe";
      } else {
        password = passwordOrRole || "12345qwe";
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "E-mail ou senha incorretos." };
      }

      const user = data.user;
      const userGymId = user.role === "academia" && user.gym?.id ? user.gym.id : "";
      const userInstructorId = user.role === "professor" && user.instructor?.id ? user.instructor.id : "";

      const updatedInstructors = user.instructor
        ? [user.instructor, ...get().instructors.filter((i) => i.id !== user.instructor.id)]
        : get().instructors;

      const updatedGyms = user.gym
        ? [user.gym, ...get().gyms.filter((g) => g.id !== user.gym.id)]
        : get().gyms;

      set({
        isAuthenticated: true,
        userEmail: user.email,
        userName: user.name,
        currentRole: user.role,
        activeGymId: userGymId,
        activeInstructorId: userInstructorId,
        gymPlan: user.gym?.plan || get().gymPlan,
        instructors: updatedInstructors,
        gyms: updatedGyms
      });

      // Recarrega os dados completos do banco
      await get().syncWithBackend();

      return { success: true };
    } catch (e: any) {
      console.error("Erro no login:", e);
      return { success: false, error: e.message || "Falha na conexão com o servidor." };
    }
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Erro no logout:", e);
    }
    set({
      isAuthenticated: false,
      userEmail: "",
      userName: "",
      activeGymId: "",
      activeInstructorId: ""
    });
  },

  deleteAccount: async () => {
    const activeInstructorId = get().activeInstructorId;
    const activeGymId = get().activeGymId;
    const currentName = get().userName;

    try {
      await fetch("/api/auth/delete-account", { method: "POST" });
    } catch (e) {
      console.warn("Erro ao excluir conta:", e);
    }
    try {
      localStorage.removeItem("trainermatch_onboarding_professor");
      localStorage.removeItem("trainermatch_onboarding_academia");
      localStorage.removeItem("trainermatch_instructor_cache");
    } catch (e) {}

    // Preserva histórico das aulas já realizadas/confirmadas mantendo o nome mas marcando usuário excluído
    const updatedShifts = get().shifts.map((s) => {
      if (s.confirmedInstructorId === activeInstructorId) {
        return {
          ...s,
          confirmedInstructorName: currentName || "Professor",
          confirmedInstructorId: undefined
        };
      }
      return s;
    });

    // Remove propostas pendentes ou associadas ao usuário que excluiu a conta
    const updatedProposals = get().proposals.filter((p) => {
      if (activeInstructorId && p.instructorId === activeInstructorId) return false;
      if (activeGymId && updatedShifts.find((s) => s.id === p.shiftId && s.gymId === activeGymId)) {
        return p.status !== "pendente";
      }
      return true;
    });

    const updatedInstructors = get().instructors.filter((i) => i.id !== activeInstructorId);

    set({
      isAuthenticated: false,
      userEmail: "",
      userName: "",
      activeGymId: "",
      activeInstructorId: "",
      shifts: updatedShifts,
      proposals: updatedProposals,
      instructors: updatedInstructors
    });
    return true;
  },

  registerUser: async ({ name, email, password, role, doc, crefOrCnpj, phone, logoOrAvatar }) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password: password || "12345qwe",
          role,
          document: doc,
          crefOrCnpj,
          phone,
          logoOrAvatar
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Erro ao realizar cadastro." };
      }

      const user = data.user;
      const userGymId = user.role === "academia" && user.gym?.id ? user.gym.id : "";
      const userInstructorId = user.role === "professor" && user.instructor?.id ? user.instructor.id : "";

      const updatedInstructors = user.instructor
        ? [user.instructor, ...get().instructors.filter((i) => i.id !== user.instructor.id)]
        : get().instructors;

      const updatedGyms = user.gym
        ? [user.gym, ...get().gyms.filter((g) => g.id !== user.gym.id)]
        : get().gyms;

      set({
        isAuthenticated: true,
        userName: user.name,
        userEmail: user.email,
        currentRole: user.role,
        activeGymId: userGymId,
        activeInstructorId: userInstructorId,
        instructors: updatedInstructors,
        gyms: updatedGyms
      });

      await get().syncWithBackend();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Falha ao conectar ao servidor." };
    }
  },

  gymPlan: "gratis",
  hiresThisMonth: 0,
  isFirstHireFreeUsed: false,

  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  setRole: (role) => set({ currentRole: role }),

  updateInstructorAvailability: (instructorId, availability) => {
    set((state) => ({
      instructors: state.instructors.map((inst) =>
        inst.id === instructorId ? { ...inst, availability } : inst
      )
    }));

    fetch(`/api/instructors/${instructorId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availability })
    }).catch((err) => console.error("Erro ao persistir disponibilidade:", err));
  },

  updateInstructorProfile: (instructorId, data) => {
    const targetId = instructorId || get().activeInstructorId || get().instructors[0]?.id;
    if (!targetId) return;

    set((state) => ({
      instructors: state.instructors.map((inst) =>
        inst.id === targetId ? { ...inst, ...data } : inst
      ),
      ...(data.name ? { userName: data.name } : {}),
      ...(data.email ? { userEmail: data.email } : {})
    }));

    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("trainermatch_instructor_cache") || "{}";
        const parsed = JSON.parse(stored);
        localStorage.setItem("trainermatch_instructor_cache", JSON.stringify({ ...parsed, ...data, id: targetId }));
      }
    } catch (e) {}

    fetch(`/api/instructors/${targetId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(async (res) => {
        if (res.ok) {
          const json = await res.json();
          if (json.instructor) {
            set((state) => ({
              instructors: state.instructors.map((inst) =>
                inst.id === targetId ? { ...inst, ...json.instructor } : inst
              )
            }));
          }
        } else {
          console.error("Erro ao atualizar instrutor no backend:", await res.text());
        }
      })
      .catch((err) => console.error("Erro ao persistir perfil de instrutor:", err));
  },

  updateGymPricing: (gymId, pricingRules) => {
    set((state) => ({
      gyms: state.gyms.map((g) =>
        g.id === gymId ? { ...g, pricingRules } : g
      )
    }));

    fetch(`/api/gyms/${gymId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pricingRules })
    }).catch((err) => console.error("Erro ao persistir precificação da academia:", err));
  },

  createProposal: (shiftId, instructorId, rate) => {
    const shift = get().shifts.find((s) => s.id === shiftId);
    const fixedRate = rate !== undefined ? rate : (shift?.maxRate || 45);
    const newProposal: Proposal = {
      id: `prop-${Date.now()}`,
      shiftId,
      instructorId,
      proposedRate: fixedRate,
      status: "pendente",
      expiresInMinutes: 120,
      turn: "academia",
      type: "candidatura"
    };

    set((state) => ({
      proposals: [newProposal, ...state.proposals],
      shifts: state.shifts.map((s) =>
        s.id === shiftId ? { ...s, status: "negociando" } : s
      )
    }));

    fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shiftId,
        instructorId,
        rate: fixedRate,
        senderRole: "professor"
      })
    }).catch((err) => console.error("Erro ao criar proposta no banco:", err));
  },

  inviteInstructor: (shiftId, instructorId) => {
    const shift = get().shifts.find((s) => s.id === shiftId);
    const fixedRate = shift?.maxRate || 45;
    const newProposal: Proposal = {
      id: `prop-${Date.now()}`,
      shiftId,
      instructorId,
      proposedRate: fixedRate,
      status: "pendente",
      expiresInMinutes: 120,
      turn: "professor",
      type: "convite"
    };

    set((state) => ({
      proposals: [newProposal, ...state.proposals],
      shifts: state.shifts.map((s) =>
        s.id === shiftId ? { ...s, status: "negociando" } : s
      )
    }));

    fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shiftId,
        instructorId,
        rate: fixedRate,
        senderRole: "academia"
      })
    }).catch((err) => console.error("Erro ao enviar convite:", err));
  },

  sendCounterProposal: (proposalId, counterRate, senderRole) => {
    set((state) => ({
      proposals: state.proposals.map((p) => {
        if (p.id !== proposalId) return p;
        return {
          ...p,
          counterRate,
          status: "pendente",
          expiresInMinutes: 45,
          turn: senderRole === "professor" ? "academia" : "professor"
        };
      })
    }));

    fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "counter",
        proposalId,
        counterRate,
        senderRole
      })
    }).catch((err) => console.error("Erro ao registrar contraproposta:", err));
  },

  acceptProposal: (proposalId) => {
    const state = get();
    const proposal = state.proposals.find((p) => p.id === proposalId);
    if (!proposal) return { requiresSubscription: false, hasConflict: false };

    // Validar conflito de agenda e deslocamento antes de aceitar
    const targetShift = state.shifts.find((s) => s.id === proposal.shiftId);
    if (targetShift) {
      const conflict = checkInstructorShiftConflict(
        proposal.instructorId,
        targetShift,
        state.shifts,
        state.gyms
      );
      if (conflict.hasConflict) {
        return {
          requiresSubscription: false,
          hasConflict: true,
          conflictMessage: conflict.conflictMessage
        };
      }
    }

    // Regra de Negócio: Se a academia ainda está no plano grátis e JÁ usou o teste grátis (1ª contratação)
    if (state.gymPlan === "gratis" && state.isFirstHireFreeUsed) {
      return { requiresSubscription: true, hasConflict: false };
    }

    const agreedRate = proposal.counterRate || proposal.proposedRate;

    set((s) => ({
      isFirstHireFreeUsed: true,
      hiresThisMonth: s.hiresThisMonth + 1,
      proposals: s.proposals.map((p) => {
        if (p.id === proposalId) return { ...p, status: "aceita" };
        if (p.shiftId === proposal.shiftId && p.status === "pendente") {
          return { ...p, status: "recusada" };
        }
        return p;
      }),
      shifts: s.shifts.map((shift) =>
        shift.id === proposal.shiftId
          ? {
              ...shift,
              status: "confirmado",
              confirmedInstructorId: proposal.instructorId,
              agreedRate
            }
          : shift
      )
    }));

    fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept", proposalId })
    }).catch((err) => console.error("Erro ao aceitar proposta no banco:", err));

    return { requiresSubscription: false, hasConflict: false };
  },

  instructorCheckIn: (shiftId) => {
    const shift = get().shifts.find((s) => s.id === shiftId);
    if (!shift) {
      return { success: false, message: "Turno não encontrado." };
    }

    const eligibility = checkCheckInEligibility(shift.date, shift.startTime, shift.endTime);
    if (!eligibility.canCheckIn) {
      return { success: false, message: eligibility.message };
    }

    const checkInTime = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    set((state) => ({
      shifts: state.shifts.map((s) =>
        s.id === shiftId
          ? {
              ...s,
              instructorCheckInAt: checkInTime
            }
          : s
      )
    }));

    fetch(`/api/shifts/${shiftId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instructorCheckInAt: new Date().toISOString() })
    }).catch((err) => console.error("Erro ao salvar check-in:", err));

    return { success: true, message: `Presença confirmada com sucesso às ${checkInTime}!` };
  },

  gymValidateAttendance: (shiftId) => {
    set((state) => ({
      shifts: state.shifts.map((s) =>
        s.id === shiftId
          ? {
              ...s,
              status: "realizada" as const,
              gymValidationAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
              completedAt: new Date().toISOString()
            }
          : s
      )
    }));

    fetch(`/api/shifts/${shiftId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "realizada",
        gymValidatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      })
    }).catch((err) => console.error("Erro ao validar presença:", err));
  },

  completeShift: (shiftId) => {
    set((state) => ({
      shifts: state.shifts.map((s) =>
        s.id === shiftId
          ? {
              ...s,
              status: "realizada" as const,
              completedAt: new Date().toISOString()
            }
          : s
      )
    }));

    fetch(`/api/shifts/${shiftId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "realizada",
        completedAt: new Date().toISOString()
      })
    }).catch((err) => console.error("Erro ao completar turno:", err));
  },

  cancelShift: async (shiftId, role, reason, cancelledByName) => {
    const cancelledAt = new Date().toISOString();
    set((state) => ({
      shifts: state.shifts.map((s) =>
        s.id === shiftId
          ? {
              ...s,
              status: "cancelado" as const,
              cancelledBy: role,
              cancelledByName: cancelledByName,
              cancellationReason: reason,
              cancelledAt: cancelledAt
            }
          : s
      )
    }));

    try {
      await fetch(`/api/shifts/${shiftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "cancelado",
          cancelledBy: role,
          cancelledByName: cancelledByName,
          cancellationReason: reason,
          cancelledAt: cancelledAt
        })
      });
      return true;
    } catch (err) {
      console.error("Erro ao cancelar aula:", err);
      return false;
    }
  },

  toggleBlockDate: async (instructorId, dateStr) => {
    let newBlockedDates: string[] = [];
    set((state) => {
      const inst = state.instructors.find((i) => i.id === instructorId);
      const current = inst?.blockedDates || [];
      newBlockedDates = current.includes(dateStr)
        ? current.filter((d) => d !== dateStr)
        : [...current, dateStr];

      return {
        instructors: state.instructors.map((i) =>
          i.id === instructorId ? { ...i, blockedDates: newBlockedDates } : i
        )
      };
    });

    try {
      await fetch(`/api/instructors/${instructorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedDates: newBlockedDates })
      });
    } catch (err) {
      console.error("Erro ao atualizar data bloqueada:", err);
    }
  },

  submitInstructorReview: (shiftId, instructorId, rating, criteria, badges, wouldHireAgain, comment) => {
    set((state) => {
      const updatedInstructors = state.instructors.map((inst) => {
        if (inst.id !== instructorId) return inst;
        const count = inst.ratingCount || 0;
        const newCount = count + 1;

        const oldCriteria = inst.criteria || {
          pontualidade: inst.rating || 5.0,
          tecnica: inst.rating || 5.0,
          postura: inst.rating || 5.0
        };
        const newCriteria: CriteriaBreakdown = {
          pontualidade: Number(((oldCriteria.pontualidade * count + criteria.pontualidade) / newCount).toFixed(1)),
          tecnica: Number(((oldCriteria.tecnica * count + criteria.tecnica) / newCount).toFixed(1)),
          postura: Number(((oldCriteria.postura * count + criteria.postura) / newCount).toFixed(1))
        };
        const newRating = Number(((newCriteria.pontualidade + newCriteria.tecnica + newCriteria.postura) / 3).toFixed(1));

        const existingBadges = inst.badges || [];
        const mergedBadges = Array.from(new Set([...existingBadges, ...badges]));

        const currentPositives = Math.round(((inst.wouldHireAgainRate ?? 100) / 100) * count);
        const newPositives = currentPositives + (wouldHireAgain ? 1 : 0);
        const newHireAgainRate = Math.round((newPositives / newCount) * 100);

        return {
          ...inst,
          rating: newRating,
          ratingCount: newCount,
          criteria: newCriteria,
          badges: mergedBadges,
          wouldHireAgainRate: newHireAgainRate
        };
      });

      const updatedShifts = state.shifts.map((s) =>
        s.id === shiftId ? { ...s, instructorReviewedByGym: true } : s
      );

      return {
        instructors: updatedInstructors,
        shifts: updatedShifts
      };
    });

    fetch(`/api/shifts/${shiftId}/review-instructor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instructorId, rating, criteria, badges, wouldHireAgain, comment })
    }).catch((err) => console.warn("Erro ao salvar avaliação do professor no backend:", err));
  },

  submitGymReview: (shiftId, gymId, rating, criteria, badges, wouldRecommend, comment) => {
    set((state) => {
      const updatedGyms = state.gyms.map((gym) => {
        if (gym.id !== gymId) return gym;
        const count = gym.ratingCount || 0;
        const newCount = count + 1;

        const oldCriteria = gym.criteria || {
          recepcao: gym.rating || 5.0,
          estrutura: gym.rating || 5.0,
          pagamento: gym.rating || 5.0
        };
        const newCriteria: GymCriteriaBreakdown = {
          recepcao: Number(((oldCriteria.recepcao * count + criteria.recepcao) / newCount).toFixed(1)),
          estrutura: Number(((oldCriteria.estrutura * count + criteria.estrutura) / newCount).toFixed(1)),
          pagamento: Number(((oldCriteria.pagamento * count + criteria.pagamento) / newCount).toFixed(1))
        };
        const newRating = Number(((newCriteria.recepcao + newCriteria.estrutura + newCriteria.pagamento) / 3).toFixed(1));

        const existingBadges = gym.badges || [];
        const mergedBadges = Array.from(new Set([...existingBadges, ...badges]));

        const currentPositives = Math.round(((gym.wouldRecommendRate ?? 100) / 100) * count);
        const newPositives = currentPositives + (wouldRecommend ? 1 : 0);
        const newRecommendRate = Math.round((newPositives / newCount) * 100);

        return {
          ...gym,
          rating: newRating,
          ratingCount: newCount,
          criteria: newCriteria,
          badges: mergedBadges,
          wouldRecommendRate: newRecommendRate
        };
      });

      const updatedShifts = state.shifts.map((s) =>
        s.id === shiftId ? { ...s, gymReviewedByInstructor: true } : s
      );

      return {
        gyms: updatedGyms,
        shifts: updatedShifts
      };
    });

    fetch(`/api/shifts/${shiftId}/review-gym`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gymId, rating, criteria, badges, wouldRecommend, comment })
    }).catch((err) => console.warn("Erro ao salvar avaliação da academia no backend:", err));
  },

  rejectProposal: (proposalId) => {
    set((state) => {
      const proposal = state.proposals.find((p) => p.id === proposalId);
      const updatedProposals = state.proposals.map((p) =>
        p.id === proposalId ? { ...p, status: "recusada" as const } : p
      );
      const updatedShifts = state.shifts.map((s) => {
        if (proposal && s.id === proposal.shiftId && s.status === "negociando") {
          const hasOtherActive = updatedProposals.some(
            (p) => p.shiftId === s.id && p.id !== proposalId && p.status === "pendente"
          );
          if (!hasOtherActive) {
            return { ...s, status: "aberto" as const };
          }
        }
        return s;
      });

      return {
        proposals: updatedProposals,
        shifts: updatedShifts
      };
    });

    fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", proposalId })
    }).catch((err) => console.error("Erro ao recusar proposta:", err));
  },

  updateGymProfile: (gymId, data) => {
    const targetId = gymId || get().activeGymId || get().gyms[0]?.id;
    if (!targetId) return;

    set((state) => ({
      gyms: state.gyms.map((g) => (g.id === targetId ? { ...g, ...data } : g)),
      ...(data.name ? { userName: data.name } : {}),
      ...(data.email ? { userEmail: data.email } : {})
    }));

    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("trainermatch_gym_cache") || "{}";
        const parsed = JSON.parse(stored);
        localStorage.setItem("trainermatch_gym_cache", JSON.stringify({ ...parsed, ...data, id: targetId }));
      }
    } catch (e) {}

    fetch(`/api/gyms/${targetId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(async (res) => {
        if (res.ok) {
          const json = await res.json();
          if (json.gym) {
            set((state) => ({
              gyms: state.gyms.map((g) => (g.id === targetId ? { ...g, ...json.gym } : g)),
              ...(json.gym.name ? { userName: json.gym.name } : {}),
              ...(json.gym.email ? { userEmail: json.gym.email } : {})
            }));
          }
        } else {
          console.error("Erro ao atualizar academia no backend:", await res.text());
        }
      })
      .catch((err) => console.error("Erro ao persistir perfil de academia:", err));
  },

  createShift: (shiftData) => {
    const rateVal = Number(shiftData.maxRate ?? (shiftData as any).rate ?? 45);
    const newShift: Shift = {
      ...shiftData,
      rate: rateVal,
      maxRate: rateVal,
      id: `shift-${Date.now()}`,
      status: "aberto"
    };
    set((state) => ({ shifts: [newShift, ...state.shifts] }));

    fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shift: { ...shiftData, rate: rateVal, maxRate: rateVal } })
    }).catch((err) => console.error("Erro ao criar turno no banco:", err));
  },

  createMultipleShifts: (shiftsData) => {
    const baseTimestamp = Date.now();
    const newShifts: Shift[] = shiftsData.map((data, index) => {
      const rateVal = Number(data.maxRate ?? (data as any).rate ?? 45);
      return {
        ...data,
        rate: rateVal,
        maxRate: rateVal,
        id: `shift-${baseTimestamp}-${index}`,
        status: "aberto"
      };
    });
    set((state) => ({ shifts: [...newShifts, ...state.shifts] }));

    fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shifts: shiftsData.map((d) => {
          const rateVal = Number(d.maxRate ?? (d as any).rate ?? 45);
          return { ...d, rate: rateVal, maxRate: rateVal };
        })
      })
    }).catch((err) => console.error("Erro ao cadastrar múltiplos turnos:", err));
  },

  deleteShift: (shiftId) => {
    const shift = get().shifts.find((s) => s.id === shiftId);
    if (!shift) {
      return { success: false, error: "Horário não encontrado." };
    }

    const confirmedInst = get().instructors.find((i) => i.id === shift.confirmedInstructorId);
    const hasActiveContract = (shift.status === "confirmado") &&
      !!confirmedInst && !confirmedInst.isDeleted && (confirmedInst as any).isActive !== false;

    // Apenas impede a exclusão se houver um professor ativo contratado com aula no futuro
    if (hasActiveContract && canCancelShift(shift).canCancel) {
      return {
        success: false,
        error: "Não é possível excluir este horário pois já existe um professor contratado. Utilize a opção 'Cancelar Aula Contratada' primeiro."
      };
    }

    set((state) => ({
      shifts: state.shifts.filter((s) => s.id !== shiftId),
      proposals: state.proposals.filter((p) => p.shiftId !== shiftId)
    }));

    fetch(`/api/shifts/${shiftId}`, {
      method: "DELETE"
    }).catch((err) => console.error("Erro ao excluir turno no banco:", err));

    return { success: true };
  },

  subscribePlan: (plan) => {
    set({ gymPlan: plan });
    const gymId = get().activeGymId;
    if (gymId) {
      fetch(`/api/gyms/${gymId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      }).catch((err) => console.error("Erro ao atualizar plano:", err));
    }
  },

  resetAll: () => {
    get().syncWithBackend();
  },

  tickSimulationTime: (minutes) => {
    set((state) => ({
      proposals: state.proposals.map((p) => {
        if (p.status === "aceita" || p.status === "recusada") return p;
        const newTime = p.expiresInMinutes - minutes;
        return {
          ...p,
          expiresInMinutes: Math.max(0, newTime),
          status: newTime <= 0 ? "expirada" : p.status
        };
      })
    }));
  }
}));
