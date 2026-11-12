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
  { id: "pontual", label: "Pontual", iconName: "Clock" },
  { id: "atencioso", label: "Atencioso(a)", iconName: "Heart" },
  { id: "tecnica", label: "Excelente Técnica", iconName: "Award" },
  { id: "postura", label: "Postura exemplar", iconName: "ShieldCheck" },
  { id: "energia", label: "Motivação e Energia", iconName: "Zap" },
  { id: "apresentacao", label: "Boa apresentação", iconName: "Sparkles" },
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
  rate?: number; // Compatibilidade com Prisma schema
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

export function maskPhone(value: string): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function maskCpf(value: string): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export function maskCnpj(value: string): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

export function blockNonNumericKeyDown(e: { key: string; preventDefault: () => void }) {
  if (["e", "E", "+", "-"].includes(e.key)) {
    e.preventDefault();
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function isTimeInPastForDate(dateStr: string, timeStr: string): boolean {
  if (!dateStr || !timeStr) return false;
  const todayStr = getTodayDateString();

  // Se a data selecionada for anterior a hoje
  if (dateStr < todayStr) return true;
  // Se for uma data futura após hoje, o horário é válido
  if (dateStr > todayStr) return false;

  // Se for o dia de hoje, valida se o horário já passou
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [h, m] = timeStr.split(":").map(Number);
  const targetMinutes = (h || 0) * 60 + (m || 0);

  return targetMinutes <= currentMinutes;
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
      "Pontual",
      "Atencioso(a)",
      "Boa apresentação"
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
      "Excelente Técnica",
      "Postura exemplar",
      "Motivação e Energia"
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
      "Pontual",
      "Atencioso(a)"
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

export const INITIAL_SHIFTS: Shift[] = [];

export const INITIAL_PROPOSALS: Proposal[] = [];
