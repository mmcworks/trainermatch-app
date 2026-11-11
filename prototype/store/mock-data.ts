export interface PricingRules {
  modalityRates: Record<string, number>;
  peakHourAddition: number; // Ex: R$ 5/h após 18h
  weekendAddition: number;  // Ex: R$ 8/h em sábados e domingos
}

export interface Gym {
  id: string;
  name: string;
  neighborhood: string;
  city: string;
  address: string;
  logo: string;
  facadeUrl: string;
  rating: number;
  ratingCount: number;
  phone: string;
  email: string;
  cnpj?: string;
  managerName?: string;
  managerRole?: string;
  managerPhone?: string;
  managerEmail?: string;
  modalities?: string[];
  pricingRules?: PricingRules;
  criteria?: GymCriteriaBreakdown;
  badges?: string[];
  wouldRecommendRate?: number;
}

export interface GymCriteriaBreakdown {
  recepcao: number;  // 1 a 5: Recepção & Organização da Unidade
  estrutura: number; // 1 a 5: Estrutura & Equipamentos
  pagamento: number; // 1 a 5: Pontualidade do Pagamento via PIX
}

export interface CriteriaBreakdown {
  pontualidade: number; // 1 a 5: Pontualidade & Presença
  tecnica: number;      // 1 a 5: Domínio Técnico & Segurança
  postura: number;      // 1 a 5: Postura & Atendimento aos Alunos
}

export interface QualityBadge {
  id: string;
  label: string;
  iconName: string;
}

export const PROFESSOR_QUALITY_BADGES: QualityBadge[] = [
  { id: "pontual", label: "Pontual", iconName: "Clock" },
  { id: "atencioso", label: "Atencioso(a)", iconName: "Heart" },
  { id: "tecnica", label: "Excelente Técnica", iconName: "Award" },
  { id: "postura", label: "Postura exemplar", iconName: "ShieldCheck" },
  { id: "energia", label: "Motivação e Energia", iconName: "Zap" },
  { id: "apresentacao", label: "Boa apresentação", iconName: "Sparkles" },
];

export const GYM_QUALITY_BADGES: QualityBadge[] = [
  { id: "equipe", label: "Equipe Acolhedora", iconName: "Smile" },
  { id: "aparelhos", label: "Aparelhos Conservados", iconName: "Dumbbell" },
  { id: "pix_rapido", label: "Pagamento Imediato no PIX", iconName: "Zap" },
  { id: "organizacao", label: "Rotina Organizada", iconName: "ClipboardCheck" },
  { id: "limpeza", label: "Ambiente Limpo", iconName: "Sparkles" },
  { id: "clima", label: "Clima Excelente", iconName: "Sun" },
];

export interface TimeInterval {
  start: string; // Ex: '07:00'
  end: string;   // Ex: '12:00'
}

export interface DayAvailability {
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
  dayName: string;   // "Segunda-feira"
  shortDay: string;  // "Seg"
  active: boolean;
  slots: TimeInterval[];
}

export interface PixKeyItem {
  id: string;
  type: "cpf" | "email" | "phone" | "aleatoria";
  key: string;
  bank?: string;
  isDefault?: boolean;
}

export interface Instructor {
  id: string;
  name: string;
  isDeleted?: boolean;
  isActive?: boolean;
  cref: string;
  crefStatus: "ativo" | "provisorio";
  avatar: string;
  bio?: string;
  rating: number;
  ratingCount: number;
  hourlyRate: number;
  minHourlyRate?: number;
  occurrences: number; // Max 3
  criteria: CriteriaBreakdown;
  badges?: string[];
  wouldHireAgainRate?: number;
  phone: string;
  email: string;
  pixKey?: string;
  pixKeys?: PixKeyItem[];
  bankInfo?: {
    bank: string;
    agency: string;
    account: string;
  };
  displayName?: string;
  birthDate?: string;
  cpf?: string;
  cnpj?: string;
  notificationsEnabled?: {
    push: boolean;
    whatsapp: boolean;
    email: boolean;
  };
  modalities: string[];
  availability: DayAvailability[];
  blockedDates?: string[]; // Datas YYYY-MM-DD em que o professor definiu folga pontual
}

export interface Shift {
  id: string;
  gymId: string;
  title: string;
  modality: string;
  date: string; // YYYY-MM-DD
  dateFormatted: string; // Ex: 'Hoje · 18:00 – 21:00'
  startTime: string; // '18:00'
  endTime: string; // '21:00'
  maxRate: number; // Valor fixo da hora-aula (R$/h)
  status: "aberto" | "negociando" | "confirmado" | "concluido" | "realizada" | "cancelado";
  confirmedInstructorId?: string;
  confirmedInstructorName?: string;
  agreedRate?: number;
  completedAt?: string;
  instructorCheckInAt?: string; // Confirmação de presença feita pelo professor no início da aula
  gymValidationAt?: string;     // Validação posterior de presença feita pela academia
  instructorReviewedByGym?: boolean; // Se a academia já avaliou o professor deste turno
  gymReviewedByInstructor?: boolean; // Se o professor já avaliou a academia deste turno
  cancelledBy?: "professor" | "academia";
  cancelledByName?: string;
  cancellationReason?: string;
  cancelledAt?: string;
}

export function canCancelShift(shift: Shift): { canCancel: boolean; reason?: string } {
  if (shift.status !== "confirmado") {
    return { canCancel: false, reason: "Apenas aulas contratadas podem ser canceladas." };
  }
  if (shift.instructorCheckInAt) {
    return { canCancel: false, reason: "A aula já foi iniciada pelo professor e não pode mais ser cancelada." };
  }
  if (shift.completedAt) {
    return { canCancel: false, reason: "A aula já foi concluída e não pode ser cancelada." };
  }

  // Verifica se o horário de início já passou
  try {
    const [startH, startM] = (shift.startTime || "00:00").split(":").map(Number);
    const [year, month, day] = (shift.date || "").split("-").map(Number);
    if (year && month && day) {
      const shiftStart = new Date(year, month - 1, day, startH || 0, startM || 0, 0);
      const now = new Date();
      if (now >= shiftStart) {
        return { canCancel: false, reason: "O horário de início da aula já passou." };
      }
    }
  } catch {
    // fallback
  }

  return { canCancel: true };
}

export interface Proposal {
  id: string;
  shiftId: string;
  instructorId: string;
  proposedRate: number; // Valor fixo da aula
  counterRate?: number;
  status: "pendente" | "aceita" | "recusada" | "expirada";
  expiresInMinutes: number; // Temporizador
  turn: "professor" | "academia";
  type?: "candidatura" | "convite";
  month?: string; // YYYY-MM para agrupamento em histórico de concluídas
  createdAt?: string;
  reason?: string; // Motivo da recusa ou expiração
}

const MONTH_SHORT_PT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez"
];

export function formatDateDDMMAAAA(dateStr: string): string {
  if (!dateStr) return "";
  // Se contiver horário (ex: "2026-11-04 · 18:00 – 21:00" ou "2026-11-04T12:00:00")
  const mainDatePart = dateStr.split("T")[0].split("·")[0].trim();
  
  // YYYY-MM-DD
  const isoMatch = mainDatePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const mIdx = parseInt(m, 10) - 1;
    const mName = MONTH_SHORT_PT[mIdx] || m;
    return `${d} ${mName} ${y}`;
  }
  
  // DD/MM/YYYY ou DD/MM
  if (mainDatePart.includes("/")) {
    const parts = mainDatePart.split("/");
    if (parts.length === 3) {
      const d = parts[0].padStart(2, "0");
      const mIdx = parseInt(parts[1], 10) - 1;
      const mName = MONTH_SHORT_PT[mIdx] || parts[1];
      const y = parts[2];
      return `${d} ${mName} ${y}`;
    }
    if (parts.length === 2) {
      const d = parts[0].padStart(2, "0");
      const mIdx = parseInt(parts[1], 10) - 1;
      const mName = MONTH_SHORT_PT[mIdx] || parts[1];
      return `${d} ${mName} 2026`;
    }
  }

  // DD-MM-YYYY
  const brMatch = mainDatePart.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    const mIdx = parseInt(m, 10) - 1;
    const mName = MONTH_SHORT_PT[mIdx] || m;
    return `${d} ${mName} ${y}`;
  }

  return dateStr;
}

export function formatShiftDateTime(dateStr: string, startTime?: string, endTime?: string): string {
  const d = formatDateDDMMAAAA(dateStr);
  if (startTime && endTime) {
    return `${d} · ${startTime} – ${endTime}`;
  }
  return d;
}

export const DEFAULT_WEEK_DAYS = [
  { dayOfWeek: 1, dayName: "Segunda-feira", shortDay: "Seg" },
  { dayOfWeek: 2, dayName: "Terça-feira", shortDay: "Ter" },
  { dayOfWeek: 3, dayName: "Quarta-feira", shortDay: "Qua" },
  { dayOfWeek: 4, dayName: "Quinta-feira", shortDay: "Qui" },
  { dayOfWeek: 5, dayName: "Sexta-feira", shortDay: "Sex" },
  { dayOfWeek: 6, dayName: "Sábado", shortDay: "Sáb" },
  { dayOfWeek: 0, dayName: "Domingo", shortDay: "Dom" }
];

export const MOCK_GYMS: Gym[] = [
  {
    id: "gym-1",
    name: "Academia Mova",
    neighborhood: "Praia do Canto",
    city: "Vitória/ES",
    address: "R. Aleixo Netto, 1204 - Praia do Canto, Vitória - ES",
    logo: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&auto=format&fit=crop&q=80",
    facadeUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80",
    rating: 4.8,
    ratingCount: 38,
    wouldRecommendRate: 98,
    criteria: {
      recepcao: 4.8,
      estrutura: 4.7,
      pagamento: 5.0
    },
    badges: [
      "Pagamento Imediato no PIX",
      "Equipe Acolhedora",
      "Ambiente Limpo"
    ],
    phone: "(27) 99812-4455",
    email: "contato@movafit.com.br",
    cnpj: "14.285.912/0001-44",
    managerName: "Carlos Eduardo Silva",
    managerRole: "Coordenador Geral / Sócio",
    managerPhone: "(27) 99812-4455",
    managerEmail: "carlos.gerencia@movafit.com.br",
    modalities: ["Musculação", "Spinning", "Funcional", "Pilates"],
    pricingRules: {
      modalityRates: {
        "Musculação": 40,
        "Spinning": 50,
        "Funcional": 45,
        "Pilates": 55,
        "Alongamento / Yoga": 45,
        "Cross Training": 50
      },
      peakHourAddition: 5,
      weekendAddition: 8
    }
  },
  {
    id: "gym-2",
    name: "Ponto 1 Fitness",
    neighborhood: "Jardim da Penha",
    city: "Vitória/ES",
    address: "Av. Anísio Fernandes Coelho, 850 - Jardim da Penha, Vitória - ES",
    logo: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=100&auto=format&fit=crop&q=80",
    facadeUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80",
    rating: 4.9,
    ratingCount: 64,
    wouldRecommendRate: 99,
    criteria: {
      recepcao: 4.9,
      estrutura: 4.9,
      pagamento: 5.0
    },
    badges: [
      "Aparelhos Conservados",
      "Clima Excelente",
      "Pagamento Imediato no PIX"
    ],
    phone: "(27) 99771-3322",
    email: "gerencia@ponto1.com.br",
    pricingRules: {
      modalityRates: {
        "Musculação": 42,
        "Spinning": 50,
        "Funcional": 45,
        "Pilates": 55
      },
      peakHourAddition: 5,
      weekendAddition: 10
    }
  },
  {
    id: "gym-3",
    name: "Top Fitness Club",
    neighborhood: "Praia de Itapoã",
    city: "Vila Velha/ES",
    address: "Av. Hugo Musso, 1420 - Praia de Itapoã, Vila Velha - ES",
    logo: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=100&auto=format&fit=crop&q=80",
    facadeUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80",
    rating: 4.6,
    ratingCount: 29,
    wouldRecommendRate: 92,
    criteria: {
      recepcao: 4.5,
      estrutura: 4.6,
      pagamento: 4.8
    },
    badges: [
      "Rotina Organizada",
      "Equipe Acolhedora"
    ],
    phone: "(27) 99655-1100",
    email: "contato@topfitnessvv.com.br",
    pricingRules: {
      modalityRates: {
        "Musculação": 40,
        "Spinning": 48,
        "Funcional": 42
      },
      peakHourAddition: 4,
      weekendAddition: 6
    }
  }
];

export const MOCK_INSTRUCTORS: Instructor[] = [
  {
    id: "inst-1",
    name: "Lucas Ferreira",
    cref: "012845-G/ES",
    crefStatus: "ativo",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    rating: 4.9,
    ratingCount: 48,
    hourlyRate: 45,
    occurrences: 0,
    wouldHireAgainRate: 98,
    criteria: {
      pontualidade: 4.9,
      tecnica: 4.8,
      postura: 5.0
    },
    badges: [
      "Pontual",
      "Atencioso(a)",
      "Excelente Técnica"
    ],
    phone: "(27) 99933-8822",
    email: "lucas.ferreira.ef@gmail.com",
    pixKey: "lucas.ferreira.ef@gmail.com",
    pixKeys: [
      { id: "pix-1", type: "email", key: "lucas.ferreira.ef@gmail.com", bank: "Nubank (260)", isDefault: true },
      { id: "pix-2", type: "cpf", key: "128.492.387-50", bank: "Banco Inter (077)", isDefault: false }
    ],
    displayName: "Lucas Ferreira",
    birthDate: "1994-08-15",
    cpf: "128.492.387-50",
    cnpj: "38.912.401/0001-92",
    notificationsEnabled: {
      push: true,
      whatsapp: true,
      email: true
    },
    modalities: ["Musculação", "Spinning", "Funcional"],
    availability: [
      { dayOfWeek: 1, dayName: "Segunda-feira", shortDay: "Seg", active: false, slots: [] },
      { dayOfWeek: 2, dayName: "Terça-feira", shortDay: "Ter", active: false, slots: [] },
      { dayOfWeek: 3, dayName: "Quarta-feira", shortDay: "Qua", active: false, slots: [] },
      { dayOfWeek: 4, dayName: "Quinta-feira", shortDay: "Qui", active: false, slots: [] },
      { dayOfWeek: 5, dayName: "Sexta-feira", shortDay: "Sex", active: false, slots: [] },
      { dayOfWeek: 6, dayName: "Sábado", shortDay: "Sáb", active: false, slots: [] },
      { dayOfWeek: 0, dayName: "Domingo", shortDay: "Dom", active: false, slots: [] }
    ]
  },
  {
    id: "inst-2",
    name: "Mariana Costa",
    cref: "009341-G/ES",
    crefStatus: "ativo",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    rating: 4.9,
    ratingCount: 62,
    hourlyRate: 50,
    occurrences: 0,
    wouldHireAgainRate: 100,
    criteria: {
      pontualidade: 5.0,
      tecnica: 4.9,
      postura: 4.9
    },
    badges: [
      "Pontual",
      "Excelente Técnica",
      "Postura exemplar",
      "Boa apresentação"
    ],
    phone: "(27) 99881-2233",
    email: "mariana.costa.personal@gmail.com",
    pixKey: "(27) 99881-2233",
    modalities: ["Pilates", "Funcional", "Alongamento / Yoga"],
    availability: [
      {
        dayOfWeek: 1,
        dayName: "Segunda-feira",
        shortDay: "Seg",
        active: true,
        slots: [{ start: "07:00", end: "12:00" }, { start: "14:00", end: "19:00" }]
      },
      {
        dayOfWeek: 2,
        dayName: "Terça-feira",
        shortDay: "Ter",
        active: true,
        slots: [{ start: "07:00", end: "13:00" }]
      },
      {
        dayOfWeek: 3,
        dayName: "Quarta-feira",
        shortDay: "Qua",
        active: true,
        slots: [{ start: "07:00", end: "12:00" }, { start: "14:00", end: "19:00" }]
      },
      {
        dayOfWeek: 4,
        dayName: "Quinta-feira",
        shortDay: "Qui",
        active: true,
        slots: [{ start: "07:00", end: "13:00" }]
      },
      {
        dayOfWeek: 5,
        dayName: "Sexta-feira",
        shortDay: "Sex",
        active: true,
        slots: [{ start: "07:00", end: "12:00" }, { start: "14:00", end: "19:00" }]
      },
      {
        dayOfWeek: 6,
        dayName: "Sábado",
        shortDay: "Sáb",
        active: false,
        slots: []
      },
      {
        dayOfWeek: 0,
        dayName: "Domingo",
        shortDay: "Dom",
        active: false,
        slots: []
      }
    ]
  },
  {
    id: "inst-3",
    name: "Rodrigo Santos",
    cref: "015112-P/ES",
    crefStatus: "provisorio",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    rating: 4.7,
    ratingCount: 19,
    hourlyRate: 40,
    occurrences: 1,
    wouldHireAgainRate: 91,
    criteria: {
      pontualidade: 4.5,
      tecnica: 4.8,
      postura: 4.7
    },
    badges: [
      "Motivação e Energia",
      "Excelente Técnica"
    ],
    phone: "(27) 99772-5566",
    email: "rodrigo.santos.fit@outlook.com",
    pixKey: "015.112.338-99",
    modalities: ["Musculação", "Cross Training"],
    availability: [
      {
        dayOfWeek: 1,
        dayName: "Segunda-feira",
        shortDay: "Seg",
        active: true,
        slots: [{ start: "13:00", end: "22:00" }]
      },
      {
        dayOfWeek: 2,
        dayName: "Terça-feira",
        shortDay: "Ter",
        active: true,
        slots: [{ start: "13:00", end: "22:00" }]
      },
      {
        dayOfWeek: 3,
        dayName: "Quarta-feira",
        shortDay: "Qua",
        active: true,
        slots: [{ start: "13:00", end: "22:00" }]
      },
      {
        dayOfWeek: 4,
        dayName: "Quinta-feira",
        shortDay: "Qui",
        active: true,
        slots: [{ start: "13:00", end: "22:00" }]
      },
      {
        dayOfWeek: 5,
        dayName: "Sexta-feira",
        shortDay: "Sex",
        active: true,
        slots: [{ start: "13:00", end: "22:00" }]
      },
      {
        dayOfWeek: 6,
        dayName: "Sábado",
        shortDay: "Sáb",
        active: true,
        slots: [{ start: "08:00", end: "16:00" }]
      },
      {
        dayOfWeek: 0,
        dayName: "Domingo",
        shortDay: "Dom",
        active: true,
        slots: [{ start: "08:00", end: "12:00" }]
      }
    ]
  }
];

export const INITIAL_SHIFTS: Shift[] = [
  {
    id: "shift-1",
    gymId: "gym-1",
    title: "Sala de Musculação - Noturno",
    modality: "Musculação",
    date: "2026-11-04",
    dateFormatted: "04 nov 2026 · 18:00 – 21:00",
    startTime: "18:00",
    endTime: "21:00",
    maxRate: 45,
    status: "negociando"
  },
  {
    id: "shift-2",
    gymId: "gym-1",
    title: "Aula de Spinning - Manhã",
    modality: "Spinning",
    date: "2026-11-05",
    dateFormatted: "05 nov 2026 · 07:00 – 09:00",
    startTime: "07:00",
    endTime: "09:00",
    maxRate: 50,
    status: "aberto"
  },
  {
    id: "shift-today-1",
    gymId: "gym-1",
    title: "Musculação - Turno Tarde (Hoje)",
    modality: "Musculação",
    date: "2026-11-05",
    dateFormatted: "05 nov 2026 · 17:00 – 20:00",
    startTime: "17:00",
    endTime: "20:00",
    maxRate: 48,
    status: "confirmado",
    confirmedInstructorId: "inst-1",
    agreedRate: 48
  },
  {
    id: "shift-3",
    gymId: "gym-2",
    title: "Treinamento Funcional",
    modality: "Funcional",
    date: "2026-11-06",
    dateFormatted: "06 nov 2026 · 16:00 – 19:00",
    startTime: "16:00",
    endTime: "19:00",
    maxRate: 45,
    status: "confirmado",
    confirmedInstructorId: "inst-1",
    agreedRate: 45
  },
  {
    id: "shift-4",
    gymId: "gym-3",
    title: "Musculação - Tarde",
    modality: "Musculação",
    date: "2026-11-07",
    dateFormatted: "07 nov 2026 · 09:00 – 13:00",
    startTime: "09:00",
    endTime: "13:00",
    maxRate: 46,
    status: "aberto"
  },
  {
    id: "shift-cur-1",
    gymId: "gym-1",
    title: "Musculação - Turno Manhã",
    modality: "Musculação",
    date: "2026-11-09",
    dateFormatted: "09 nov 2026 · 07:00 – 11:00",
    startTime: "07:00",
    endTime: "11:00",
    maxRate: 45,
    status: "confirmado",
    confirmedInstructorId: "inst-1",
    agreedRate: 45
  },
  {
    id: "shift-cur-2",
    gymId: "gym-1",
    title: "Aula de Spinning - Noturno",
    modality: "Spinning",
    date: "2026-11-09",
    dateFormatted: "09 nov 2026 · 18:30 – 21:00",
    startTime: "18:30",
    endTime: "21:00",
    maxRate: 50,
    status: "negociando"
  },
  {
    id: "shift-cur-3",
    gymId: "gym-1",
    title: "Treinamento Funcional - Tarde",
    modality: "Funcional",
    date: "2026-11-10",
    dateFormatted: "10 nov 2026 · 15:00 – 18:00",
    startTime: "15:00",
    endTime: "18:00",
    maxRate: 48,
    status: "aberto"
  },
  {
    id: "shift-cur-4",
    gymId: "gym-1",
    title: "Musculação Geral - Manhã",
    modality: "Musculação",
    date: "2026-11-11",
    dateFormatted: "11 nov 2026 · 08:00 – 12:00",
    startTime: "08:00",
    endTime: "12:00",
    maxRate: 48,
    status: "confirmado",
    confirmedInstructorId: "inst-2",
    agreedRate: 48
  },
  {
    id: "shift-cur-5",
    gymId: "gym-1",
    title: "Aula de Pilates - Tarde",
    modality: "Pilates",
    date: "2026-11-12",
    dateFormatted: "12 nov 2026 · 16:00 – 19:00",
    startTime: "16:00",
    endTime: "19:00",
    maxRate: 55,
    status: "aberto"
  },
  {
    id: "shift-cur-6",
    gymId: "gym-1",
    title: "Musculação - Turno Noite",
    modality: "Musculação",
    date: "2026-11-12",
    dateFormatted: "12 nov 2026 · 18:00 – 21:00",
    startTime: "18:00",
    endTime: "21:00",
    maxRate: 45,
    status: "negociando"
  },
  {
    id: "shift-cur-7",
    gymId: "gym-1",
    title: "Cross Training - Sexta Tarde",
    modality: "Cross Training",
    date: "2026-11-13",
    dateFormatted: "13 nov 2026 · 17:00 – 20:00",
    startTime: "17:00",
    endTime: "20:00",
    maxRate: 50,
    status: "aberto"
  },
  {
    id: "shift-cur-8",
    gymId: "gym-1",
    title: "Musculação - Sábado Especial",
    modality: "Musculação",
    date: "2026-11-14",
    dateFormatted: "14 nov 2026 · 09:00 – 13:00",
    startTime: "09:00",
    endTime: "13:00",
    maxRate: 50,
    status: "confirmado",
    confirmedInstructorId: "inst-1",
    agreedRate: 50
  },
  {
    id: "shift-hist-1",
    gymId: "gym-1",
    title: "Sala de Musculação - Matutino",
    modality: "Musculação",
    date: "2026-10-24",
    dateFormatted: "24 out 2026 · 07:00 – 11:00",
    startTime: "07:00",
    endTime: "11:00",
    maxRate: 40,
    status: "realizada",
    confirmedInstructorId: "inst-1",
    agreedRate: 40,
    completedAt: "2026-10-24T11:05:00Z",
    instructorReviewedByGym: true,
    gymReviewedByInstructor: true
  },
  {
    id: "shift-hist-2",
    gymId: "gym-1",
    title: "Spinning Power - Noturno",
    modality: "Spinning",
    date: "2026-10-18",
    dateFormatted: "18 out 2026 · 18:30 – 20:30",
    startTime: "18:30",
    endTime: "20:30",
    maxRate: 50,
    status: "realizada",
    confirmedInstructorId: "inst-1",
    agreedRate: 50,
    completedAt: "2026-10-18T20:32:00Z",
    instructorReviewedByGym: true,
    gymReviewedByInstructor: false
  },
  {
    id: "shift-hist-3",
    gymId: "gym-1",
    title: "Pilates Solo & Postura",
    modality: "Pilates",
    date: "2026-10-10",
    dateFormatted: "10 out 2026 · 08:00 – 10:00",
    startTime: "08:00",
    endTime: "10:00",
    maxRate: 55,
    status: "realizada",
    confirmedInstructorId: "inst-2",
    agreedRate: 55,
    completedAt: "2026-10-10T10:02:00Z",
    instructorReviewedByGym: false,
    gymReviewedByInstructor: false
  },
  {
    id: "shift-hist-4",
    gymId: "gym-1",
    title: "Circuito Funcional Praia",
    modality: "Funcional",
    date: "2026-09-22",
    dateFormatted: "22 set 2026 · 07:00 – 10:00",
    startTime: "07:00",
    endTime: "10:00",
    maxRate: 45,
    status: "realizada",
    confirmedInstructorId: "inst-1",
    agreedRate: 45,
    completedAt: "2026-09-22T10:05:00Z"
  },
  {
    id: "shift-hist-5",
    gymId: "gym-1",
    title: "Musculação - Fechamento",
    modality: "Musculação",
    date: "2026-09-15",
    dateFormatted: "15 set 2026 · 18:00 – 22:00",
    startTime: "18:00",
    endTime: "22:00",
    maxRate: 40,
    status: "realizada",
    confirmedInstructorId: "inst-3",
    agreedRate: 40,
    completedAt: "2026-09-15T22:01:00Z"
  },
  {
    id: "shift-fut-1",
    gymId: "gym-1",
    title: "Musculação - Abertura Especial",
    modality: "Musculação",
    date: "2026-12-04",
    dateFormatted: "04 dez 2026 · 06:00 – 10:00",
    startTime: "06:00",
    endTime: "10:00",
    maxRate: 50,
    status: "aberto"
  },
  {
    id: "shift-fut-2",
    gymId: "gym-1",
    title: "Spinning de Fim de Ano",
    modality: "Spinning",
    date: "2026-12-15",
    dateFormatted: "15 dez 2026 · 18:00 – 21:00",
    startTime: "18:00",
    endTime: "21:00",
    maxRate: 55,
    status: "confirmado",
    confirmedInstructorId: "inst-1",
    agreedRate: 55
  }
];

export const INITIAL_PROPOSALS: Proposal[] = [
  {
    id: "prop-1",
    shiftId: "shift-cur-2",
    instructorId: "inst-1",
    proposedRate: 50,
    status: "pendente",
    expiresInMinutes: 48,
    turn: "professor",
    type: "convite",
    month: "2026-11",
    createdAt: "2026-11-05T14:30:00Z"
  },
  {
    id: "prop-2",
    shiftId: "shift-cur-6",
    instructorId: "inst-1",
    proposedRate: 45,
    status: "pendente",
    expiresInMinutes: 32,
    turn: "academia",
    type: "candidatura",
    month: "2026-11",
    createdAt: "2026-11-05T15:10:00Z"
  },
  {
    id: "prop-3",
    shiftId: "shift-fut-2",
    instructorId: "inst-1",
    proposedRate: 55,
    status: "aceita",
    expiresInMinutes: 0,
    turn: "professor",
    type: "convite",
    month: "2026-12",
    createdAt: "2026-11-04T10:00:00Z"
  },
  {
    id: "prop-4",
    shiftId: "shift-cur-5",
    instructorId: "inst-1",
    proposedRate: 50,
    status: "recusada",
    expiresInMinutes: 0,
    turn: "professor",
    type: "convite",
    month: "2026-11",
    createdAt: "2026-11-03T16:00:00Z",
    reason: "Professor recusou por intervalo insuficiente de deslocamento."
  },
  {
    id: "prop-5",
    shiftId: "shift-hist-1",
    instructorId: "inst-1",
    proposedRate: 45,
    status: "expirada",
    expiresInMinutes: 0,
    turn: "professor",
    type: "convite",
    month: "2026-10",
    createdAt: "2026-10-22T08:00:00Z",
    reason: "Prazo de 60 minutos expirado sem resposta."
  },
  {
    id: "prop-6",
    shiftId: "shift-hist-2",
    instructorId: "inst-1",
    proposedRate: 50,
    status: "aceita",
    expiresInMinutes: 0,
    turn: "professor",
    type: "convite",
    month: "2026-10",
    createdAt: "2026-10-17T14:00:00Z"
  },
  {
    id: "prop-7",
    shiftId: "shift-hist-4",
    instructorId: "inst-1",
    proposedRate: 45,
    status: "aceita",
    expiresInMinutes: 0,
    turn: "professor",
    type: "convite",
    month: "2026-09",
    createdAt: "2026-09-20T11:00:00Z"
  }
];
