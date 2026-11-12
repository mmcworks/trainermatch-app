"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useAppStore } from "@/store/use-app-store";
import { HorizontalBars } from "@/components/horizontal-bars";
import {
  MapPin,
  Calendar,
  Send,
  User,
  ShieldCheck,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  AlertCircle,
  Star,
  Dumbbell,
  Bike,
  Zap,
  Activity,
  Heart,
  Flame,
  Waves,
  Music,
  Shield,
  X,
  ChevronRight,
  ChevronLeft,
  Key,
  Lock,
  Check,
  Plus,
  CheckCheck,
  CreditCard,
  FileText,
  Bell,
  Sun,
  Moon,
  LogOut,
  Camera,
  QrCode,
  Sparkles,
  Eye,
  EyeOff,
  Trash2,
  Search,
  Filter,
  RotateCcw,
  Crop,
  ZoomIn,
  ZoomOut,
  Upload,
  Maximize2,
  Compass,
  Sliders,
  Building2,
  ThumbsUp,
  Smartphone,
  XCircle
} from "lucide-react";
import { Instructor, Shift, Gym, DayAvailability, DEFAULT_WEEK_DAYS, formatDateDDMMAAAA, PixKeyItem, canCancelShift, maskPhone, maskCpf, maskCnpj, blockNonNumericKeyDown, isTimeInPastForDate, getTodayDateString } from "@/store/mock-data";
import { timeToMinutes, checkInstructorShiftConflict, checkCheckInEligibility } from "@/store/use-app-store";
import { TimeStepperInput } from "@/components/time-stepper-input";
import { AnimatedModal } from "@/components/animated-modal";
import { OnboardingModal } from "@/components/onboarding-modal";
import { ReviewModal } from "@/components/review-modal";
import { CancelShiftModal } from "@/components/cancel-shift-modal";
import { cropAndCompressImage } from "@/lib/image-utils";


export const ProfessorView: React.FC = () => {
  const {
    shifts,
    gyms,
    instructors,
    proposals,
    activeInstructorId,
    userName,
    userEmail,
    createProposal,
    acceptProposal,
    rejectProposal,
    updateInstructorAvailability,
    updateInstructorProfile,
    completeShift,
    cancelShift,
    toggleBlockDate,
    instructorCheckIn,
    submitGymReview,
    isDarkMode,
    toggleDarkMode,
    logout,
    deleteAccount
  } = useAppStore();

  const [shiftToCancel, setShiftToCancel] = useState<Shift | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);

  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState<boolean>(false);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState<boolean>(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);

  // Estados de Nota/Avaliação e Mapa Interativo com Raio até 100km
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [isRatingExpanded, setIsRatingExpanded] = useState<boolean>(false);
  const [reviewGymShift, setReviewGymShift] = useState<{ shift: Shift; gym: Gym } | null>(null);
  const [selectedGymDetail, setSelectedGymDetail] = useState<Gym | null>(null);
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(10);
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<"inicio" | "propostas" | "agenda" | "perfil">("inicio");
  const [selectedModality, setSelectedModality] = useState<string>("Todos");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [detailShiftId, setDetailShiftId] = useState<string | null>(null);
  const [isUrgentAlertDismissed, setIsUrgentAlertDismissed] = useState<boolean>(false);
  const [showOtherDatesModal, setShowOtherDatesModal] = useState<boolean>(false);
  const [calendarMonthOffset, setCalendarMonthOffset] = useState<number>(0);

  // Sub-abas de Negociações (Propostas)
  const [proposalSubTab, setProposalSubTab] = useState<"abertas" | "concluidas">("abertas");
  const [proposalMonthFilter, setProposalMonthFilter] = useState<string>("todos");
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [notificationModalTab, setNotificationModalTab] = useState<"push" | "email">("push");
  const [pushToast, setPushToast] = useState<{ title: string; body: string; time: string; type: "proposta" | "confirmacao" } | null>(null);

  // Sub-aba de Agenda e Grade de Disponibilidade + Calendário Horizontal de Linha Única
  const [agendaSubTab, setAgendaSubTab] = useState<"aulas" | "grade">("aulas");
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(11); // 1 = Jan, 11 = Nov, 12 = Dez
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(new Date().getDate()); // foco no dia atual (visualização primária)
  const todayButtonRef = useRef<HTMLButtonElement | null>(null);
  const [showCalendarYearModal, setShowCalendarYearModal] = useState<boolean>(false);
  const [showMonthOverviewModal, setShowMonthOverviewModal] = useState<boolean>(false);
  const [navYear, setNavYear] = useState<number>(2026);
  const [saveAvailabilityMsg, setSaveAvailabilityMsg] = useState<string | null>(null);
  const [slotInputs, setSlotInputs] = useState<Record<number, { start: string; end: string }>>({
    1: { start: "07:00", end: "12:00" },
    2: { start: "07:00", end: "12:00" },
    3: { start: "07:00", end: "12:00" },
    4: { start: "07:00", end: "12:00" },
    5: { start: "07:00", end: "12:00" },
    6: { start: "08:00", end: "14:00" },
    0: { start: "08:00", end: "12:00" }
  });
  const [slotErrorMsg, setSlotErrorMsg] = useState<Record<number, string | null>>({});

  // Wizard: Quero Oferecer um Horário (Professor)
  const [showOfferSlotWizard, setShowOfferSlotWizard] = useState<boolean>(false);
  const [offerWizardStep, setOfferWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [offerHourlyRate, setOfferHourlyRate] = useState<number>(45);
  const [offerAllowNegotiation, setOfferAllowNegotiation] = useState<boolean>(true);
  const [offerMinHourlyRate, setOfferMinHourlyRate] = useState<number>(35);
  const [offerModalities, setOfferModalities] = useState<string[]>(["Musculação"]);
  const [offerCustomModality, setOfferCustomModality] = useState<string>("");
  const [offerDate, setOfferDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [offerStartTime, setOfferStartTime] = useState<string>("07:00");
  const [offerEndTime, setOfferEndTime] = useState<string>("12:00");
  const [offerSuccessMsg, setOfferSuccessMsg] = useState<string | null>(null);

  // Modal de alteração de senha
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [passwordFlowStep, setPasswordFlowStep] = useState<"alterar" | "esqueceu_envio" | "esqueceu_codigo" | "esqueceu_nova">("alterar");
  const [currentPasswordInput, setCurrentPasswordInput] = useState<string>("");
  const [newPasswordInput, setNewPasswordInput] = useState<string>("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>("");
  const [pwdCodeInput, setPwdCodeInput] = useState<string>("");
  const [pwdCodeError, setPwdCodeError] = useState<string>("");
  const [showCurrentPwd, setShowCurrentPwd] = useState<boolean>(false);
  const [showNewPwd, setShowNewPwd] = useState<boolean>(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState<boolean>(false);
  const [passwordFeedbackMsg, setPasswordFeedbackMsg] = useState<string | null>(null);

  // Modais de Perfil estilo iFood
  const [showAvatarModal, setShowAvatarModal] = useState<boolean>(false);
  // Modal de Crop Circular da Foto do Professor
  const [showProfessorCropModal, setShowProfessorCropModal] = useState<boolean>(false);
  const [profCropImageSrc, setProfCropImageSrc] = useState<string>("");
  const [profCropZoom, setProfCropZoom] = useState<number>(1);
  const [profCropOffsetX, setProfCropOffsetX] = useState<number>(0);
  const [profCropOffsetY, setProfCropOffsetY] = useState<number>(0);
  const [showPersonalDataModal, setShowPersonalDataModal] = useState<boolean>(false);
  const [showPixModal, setShowPixModal] = useState<boolean>(false);
  const [showSkillsModal, setShowSkillsModal] = useState<boolean>(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState<boolean>(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Estados locais para formulários de perfil
  const [editFullName, setEditFullName] = useState<string>("");
  const [editDisplayName, setEditDisplayName] = useState<string>("");
  const [editBirthDate, setEditBirthDate] = useState<string>("");
  const [editEmail, setEditEmail] = useState<string>("");
  const [editPhone, setEditPhone] = useState<string>("");

  const [pixList, setPixList] = useState<PixKeyItem[]>([]);
  const [editPixKey, setEditPixKey] = useState<string>("");
  const [editPixType, setEditPixType] = useState<"cpf" | "email" | "phone" | "aleatoria">("cpf");
  const [editBank, setEditBank] = useState<string>("");
  const [editPixIsDefault, setEditPixIsDefault] = useState<boolean>(false);

  const [editModalities, setEditModalities] = useState<string[]>([]);
  const [skillsSearch, setSkillsSearch] = useState<string>("");
  const [customSkillInput, setCustomSkillInput] = useState<string>("");
  const [editCpf, setEditCpf] = useState<string>("");

  const [notifications, setNotifications] = useState({
    push: true,
    whatsapp: true,
    email: true
  });

  // Modal de Onboarding (apenas no primeiro acesso ou via perfil)
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    try {
      const seen = typeof window !== "undefined" ? localStorage.getItem("trainermatch_onboarding_professor") : "true";
      if (!seen) {
        setShowOnboarding(true);
      }
    } catch (e) {}
  }, []);

  const fallbackInstructor: Instructor = {
    id: activeInstructorId || "inst-new",
    name: userName || "Professor",
    crefStatus: "ativo",
    occurrences: 0,
    email: userEmail || "",
    phone: "",
    cpf: "",
    cref: "CREF Regular",
    avatar: "",
    bio: "Profissional de Educação Física registrado no CREF.",
    rating: 5.0,
    ratingCount: 0,
    hourlyRate: 45,
    modalities: ["Musculação", "Funcional"],
    pixKeys: [],
    availability: [],
    criteria: {
      pontualidade: 5.0,
      tecnica: 5.0,
      postura: 5.0
    }
  };

  const rawInstructor: Instructor = (instructors.find((i) => i.id === activeInstructorId) || (activeInstructorId ? fallbackInstructor : instructors[0]) || fallbackInstructor) as Instructor;
  const currentInstructor = useMemo(() => ({
    ...rawInstructor,
    criteria: rawInstructor.criteria || {
      pontualidade: rawInstructor.rating || 5.0,
      tecnica: rawInstructor.rating || 5.0,
      postura: rawInstructor.rating || 5.0
    },
    rating: rawInstructor.criteria
      ? Number(((rawInstructor.criteria.pontualidade + rawInstructor.criteria.tecnica + rawInstructor.criteria.postura) / 3).toFixed(1))
      : (rawInstructor.rating || 5.0)
  }), [rawInstructor]);

  // Estado local da grade de horários para edição antes de salvar
  const [localAvailability, setLocalAvailability] = useState<DayAvailability[]>(
    currentInstructor.availability || []
  );

  // Sincroniza formulários e grade se trocar de instrutor
  React.useEffect(() => {
    if (rawInstructor) {
      if (rawInstructor.availability) {
        setLocalAvailability(rawInstructor.availability);
      }
      setEditFullName(rawInstructor.name || "");
      setEditDisplayName(rawInstructor.displayName || rawInstructor.name || "");
      setEditBirthDate(rawInstructor.birthDate || "1994-08-15");
      setEditEmail(rawInstructor.email || "");
      setEditPhone(rawInstructor.phone || "");
      if (rawInstructor.pixKeys && rawInstructor.pixKeys.length > 0) {
        setPixList(rawInstructor.pixKeys);
      } else if (rawInstructor.pixKey) {
        setPixList([
          {
            id: "pix-1",
            type: "email",
            key: rawInstructor.pixKey,
            bank: rawInstructor.bankInfo?.bank || "Nubank (260)",
            isDefault: true
          }
        ]);
      } else {
        setPixList([]);
      }
      setEditPixKey("");
      setEditBank("");
      setEditModalities(rawInstructor.modalities || []);
      setEditCpf(rawInstructor.cpf || "128.492.387-50");
      if (rawInstructor.notificationsEnabled) {
        setNotifications(rawInstructor.notificationsEnabled);
      }
    }
  }, [
    rawInstructor.id,
    rawInstructor.name,
    rawInstructor.email,
    rawInstructor.phone,
    rawInstructor.avatar,
    JSON.stringify(rawInstructor.modalities || []),
    JSON.stringify(rawInstructor.pixKeys || [])
  ]);

  const [professorDocuments, setProfessorDocuments] = useState<{
    diploma: { name: string; size: string; status: string } | null;
    certificates: Array<{ id: string; name: string; size: string; status: string }>;
  }>({
    diploma: { name: "Diploma_Bacharelado_Educacao_Fisica.pdf", size: "1.8 MB", status: "Auditado ✓" },
    certificates: [
      { id: "cert-1", name: "Certificado_Ciclismo_Indoor_Spinning.pdf", size: "1.2 MB", status: "Auditado ✓" },
      { id: "cert-2", name: "Certificado_Primeiros_Socorros_BLS.pdf", size: "850 KB", status: "Auditado ✓" }
    ]
  });

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "diploma" | "certificate") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_DOC_SIZE = 3 * 1024 * 1024; // 3MB
    if (file.size > MAX_DOC_SIZE) {
      alert("O arquivo selecionado excede o limite máximo permitido de 3 MB. Por favor, escolha um documento ou imagem menor.");
      e.target.value = "";
      return;
    }

    const fileSizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    if (type === "diploma") {
      setProfessorDocuments((prev) => ({
        ...prev,
        diploma: {
          name: file.name,
          size: fileSizeFormatted,
          status: "Em Análise pela Plataforma"
        }
      }));
      setProfileSuccessMsg("Diploma enviado com sucesso! Em análise pela equipe.");
    } else {
      setProfessorDocuments((prev) => ({
        ...prev,
        certificates: [
          ...prev.certificates,
          {
            id: `cert-${Date.now()}`,
            name: file.name,
            size: fileSizeFormatted,
            status: "Em Análise pela Plataforma"
          }
        ]
      }));
      setProfileSuccessMsg("Certificado adicionado com sucesso! Em análise.");
    }
    setTimeout(() => setProfileSuccessMsg(null), 3500);
    e.target.value = "";
  };

  const handleProfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
    if (file.size > MAX_FILE_SIZE) {
      alert("A imagem selecionada excede o limite máximo permitido de 3 MB. Por favor, escolha uma imagem menor.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfCropImageSrc(reader.result as string);
      setProfCropZoom(1);
      setProfCropOffsetX(0);
      setProfCropOffsetY(0);
      setShowAvatarModal(false);
      setShowProfessorCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const openProfCropWithCurrent = () => {
    setProfCropImageSrc(currentInstructor.avatar);
    setProfCropZoom(1);
    setProfCropOffsetX(0);
    setProfCropOffsetY(0);
    setShowAvatarModal(false);
    setShowProfessorCropModal(true);
  };

  const handleSaveCroppedProfAvatar = async () => {
    const instructorId = currentInstructor?.id || activeInstructorId;
    const compressed = await cropAndCompressImage(
      profCropImageSrc,
      320,
      320,
      profCropZoom,
      profCropOffsetX,
      profCropOffsetY,
      0.85
    );
    updateInstructorProfile(instructorId, { avatar: compressed });
    setShowProfessorCropModal(false);
    setProfileSuccessMsg("Foto de perfil circular atualizada com sucesso!");
    setTimeout(() => setProfileSuccessMsg(null), 3000);
  };


  // Helper para identificar o instrutor ativo
  const isMyInstructorId = (id?: string) =>
    id === activeInstructorId || id === currentInstructor?.id || (!activeInstructorId && id === "inst-1");

  // Proposta prioritária (convite da academia aguardando resposta do professor)
  const urgentProposal = proposals.find(
    (p) => isMyInstructorId(p.instructorId) && p.status === "pendente" && p.turn === "professor"
  ) || proposals.find(
    (p) => isMyInstructorId(p.instructorId) && p.status === "pendente"
  );

  // Turno selecionado para a modal de detalhes
  const detailShift = shifts.find((s) => s.id === detailShiftId);
  const detailGym = gyms.find((g) => g.id === detailShift?.gymId);

  // Helper para formatar data em destaque: DD mmm AAAA + Dia da semana + Horários
  const formatShiftDate = (shift?: Shift) => {
    const monthNamesPt = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    if (!shift) return { fullDate: "04 nov 2026", dayMonth: "04 nov 2026", weekday: "Quarta-feira", hours: "18:00 – 21:00" };
    const parts = shift.date.split("-");
    const day = (parts[2] || "04").padStart(2, "0");
    const month = (parts[1] || "11").padStart(2, "0");
    const year = parts[0] || "2026";
    const monthIdx = parseInt(month, 10) - 1;
    const monthShort = monthNamesPt[monthIdx] || month;
    const fullDate = `${day} ${monthShort} ${year}`;
    const dayMonth = fullDate;

    const weekdaysMap: Record<string, string> = {
      "2026-11-04": "Quarta-feira",
      "2026-11-05": "Quinta-feira",
      "2026-11-06": "Sexta-feira",
      "2026-11-07": "Sábado",
      "2026-11-08": "Domingo",
      "2026-11-09": "Segunda-feira",
      "2026-11-10": "Terça-feira",
      "2026-11-11": "Quarta-feira",
      "2026-11-12": "Quinta-feira",
      "2026-11-13": "Sexta-feira",
      "2026-11-14": "Sábado",
    };
    const weekday = weekdaysMap[shift.date] || "Quarta-feira";
    const hours = `${shift.startTime} – ${shift.endTime}`;
    return { fullDate, dayMonth, weekday, hours };
  };

  // Distância estimada da academia em relação à localização atual do professor (em km)
  const getGymDistanceKm = (gymId: string): number => {
    const fixedDistances: Record<string, number> = {
      "gym-1": 2.4, // Praia do Canto
      "gym-2": 4.8, // Jardim da Penha
      "gym-3": 7.2, // Enseada do Suá
      "gym-4": 14.5, // Vila Velha
      "gym-5": 28.0, // Serra
      "gym-6": 54.0, // Guarapari
      "gym-7": 82.0, // Domingos Martins
    };
    if (fixedDistances[gymId] !== undefined) return fixedDistances[gymId];
    // Se for a primeira academia cadastrada (ex: Academia Mova no banco), posiciona a 2.4 km
    const firstGym = gyms[0];
    if (firstGym && firstGym.id === gymId) return 2.4;
    let hash = 0;
    for (let i = 0; i < gymId.length; i++) hash = (hash << 5) - hash + gymId.charCodeAt(i);
    return 3.5 + (Math.abs(hash) % 35);
  };

  // Filtros combinados de modalidade, data e raio de busca (até 100km)
  const filteredShifts = shifts.filter((s) => {
    const matchModality = selectedModality === "Todos" || s.modality === selectedModality;
    const matchDate = selectedDateFilter ? s.date === selectedDateFilter : true;
    const dist = getGymDistanceKm(s.gymId);
    const matchRadius = dist <= searchRadiusKm;
    return matchModality && matchDate && matchRadius;
  });

  const MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const WEEKDAY_NAMES = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

  // Propostas do professor (Abertas vs Concluídas)
  const myProposals = proposals.filter((p) => isMyInstructorId(p.instructorId));
  const openProposals = myProposals.filter((p) => p.status === "pendente");
  const closedProposals = myProposals.filter((p) => p.status !== "pendente").filter((p) => {
    if (proposalMonthFilter === "todos") return true;
    return p.month === proposalMonthFilter;
  });

  // Mês selecionado no calendário horizontal (YYYY-MM)
  const selectedMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

  // Turnos do professor para o mês selecionado (confirmados, já realizados ou cancelados)
  const myConfirmedShifts = shifts.filter((s) => {
    const isMine = isMyInstructorId(s.confirmedInstructorId);
    if (!isMine) return false;
    const isValidStatus = s.status === "confirmado" || s.status === "realizada" || s.status === "cancelado";
    if (!isValidStatus) return false;
    if (selectedDayNumber !== null) {
      const targetDate = `${selectedMonthStr}-${String(selectedDayNumber).padStart(2, "0")}`;
      return s.date === targetDate;
    }
    return s.date.startsWith(selectedMonthStr);
  });

  // Todos os turnos confirmados ou realizados do mês atual para o resumo (não inclui cancelados)
  const monthAllConfirmedShifts = shifts.filter((s) => {
    const isMine = isMyInstructorId(s.confirmedInstructorId);
    if (!isMine) return false;
    const isValidStatus = s.status === "confirmado" || s.status === "realizada";
    if (!isValidStatus) return false;
    return s.date.startsWith(selectedMonthStr);
  });

  // Identificação do dia atual (Hoje) para foco visual
  const systemToday = new Date();
  const currentTodayDay = systemToday.getDate();
  const currentTodayMonth = systemToday.getMonth() + 1;
  const currentTodayYear = systemToday.getFullYear();
  // Se estiver no mês e ano atuais do sistema ou no mês padrão mockado (Novembro/2026)
  const isCurrentMonthView =
    (selectedYear === currentTodayYear && selectedMonth === currentTodayMonth) ||
    (selectedYear === 2026 && selectedMonth === 11);
  const targetTodayDay = isCurrentMonthView ? currentTodayDay : 1;

  // Scroll suave com foco no dia atual ao abrir ou trocar para a agenda
  useEffect(() => {
    if (activeTab === "agenda" && agendaSubTab === "aulas" && isCurrentMonthView && todayButtonRef.current) {
      const timer = setTimeout(() => {
        todayButtonRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab, agendaSubTab, selectedYear, selectedMonth, isCurrentMonthView]);

  // Lista dos dias do mês para a linha horizontal única do calendário com integração da grade semanal
  const daysInSelectedMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const calendarDays = Array.from({ length: daysInSelectedMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateObj = new Date(selectedYear, selectedMonth - 1, dayNum);
    const dayOfWeekIndex = dateObj.getDay();
    const dayOfWeek = WEEKDAY_NAMES[dayOfWeekIndex];
    const dateStr = `${selectedMonthStr}-${String(dayNum).padStart(2, "0")}`;

    const dayShifts = shifts.filter(
      (s) => isMyInstructorId(s.confirmedInstructorId) &&
             (s.status === "confirmado" || s.status === "realizada") &&
             s.date === dateStr
    );
    const dayCancelledShifts = shifts.filter(
      (s) => isMyInstructorId(s.confirmedInstructorId) &&
             s.status === "cancelado" &&
             s.date === dateStr
    );

    // Checagem de disponibilidade na grade semanal
    const matchingAvail = localAvailability.find((a) => a.dayOfWeek === dayOfWeekIndex);
    const isGradeActive = Boolean(matchingAvail?.active && matchingAvail.slots && matchingAvail.slots.length > 0);
    const isBlocked = Boolean(rawInstructor.blockedDates?.includes(dateStr));
    const isAvailable = isGradeActive && !isBlocked;

    const slotsSummary = matchingAvail?.slots && matchingAvail.slots.length > 0
      ? matchingAvail.slots.map((sl) => `${sl.start}–${sl.end}`).join(", ")
      : "";

    const isToday = isCurrentMonthView && dayNum === targetTodayDay;
    return {
      dayNum,
      dayOfWeek,
      dayOfWeekIndex,
      dateStr,
      isToday,
      hasShifts: dayShifts.length > 0,
      hasCompleted: dayShifts.some((s) => s.status === "realizada"),
      hasCancelled: dayCancelledShifts.length > 0 && dayShifts.length === 0,
      shiftsCount: dayShifts.length,
      isAvailable,
      isBlocked,
      slotsSummary
    };
  });

  // Estatísticas do mês integrado
  const monthAvailableDaysCount = calendarDays.filter((d) => d.isAvailable && !d.hasShifts).length;
  const monthConfirmedDaysCount = calendarDays.filter((d) => d.hasShifts).length;
  const monthOffDaysCount = calendarDays.filter((d) => !d.isAvailable && !d.hasShifts).length;

  const selectedDayInfo = selectedDayNumber !== null
    ? calendarDays.find((d) => d.dayNum === selectedDayNumber)
    : null;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background dark:bg-navy-900 text-navy-900 dark:text-slate-100 pb-24 shadow-2xl overflow-hidden relative font-sans transition-colors duration-200">
      
      {/* ===================== TAB: INÍCIO ===================== */}
      {activeTab === "inicio" && (
        <main className="p-5 space-y-4 animate-fade-in">
          {/* 1. Topo: Saudação, Avatar e Localização */}
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setActiveTab("perfil")}
              className="flex items-center gap-3 text-left group hover:opacity-85 active:scale-[0.98] transition-all cursor-pointer focus:outline-none"
              title="Ver meu perfil"
              aria-label="Ir para a tela de perfil"
            >
              <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-navy-800 shadow-xs border-2 border-white dark:border-navy-700 flex items-center justify-center group-hover:ring-2 group-hover:ring-primary/50 transition-all">
                {currentInstructor.avatar ? (
                  <img src={currentInstructor.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-slate-500 dark:text-slate-400" strokeWidth={1.75} />
                )}
              </div>
              <div>
                <span className="text-[11px] text-muted dark:text-slate-400 block leading-none">Olá, bem-vindo!</span>
                <h1 className="text-base font-black text-navy-900 dark:text-white mt-0.5 group-hover:text-primary transition-colors">
                  {currentInstructor.displayName || currentInstructor.name}
                </h1>
              </div>
            </button>

            {/* Seletor de Raio Interativo no Topo (10km a 100km) */}
            <div className="flex items-center gap-1 bg-card dark:bg-navy-800 p-1 rounded-full shadow-soft border border-slate-100 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  const nextRadius = searchRadiusKm === 10 ? 25 : searchRadiusKm === 25 ? 50 : searchRadiusKm === 50 ? 100 : 10;
                  setSearchRadiusKm(nextRadius);
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black hover:bg-primary/20 transition-colors"
                title="Clique para alternar o raio de busca"
              >
                <Compass size={13} className="text-primary" />
                <span>Raio: {searchRadiusKm} km</span>
              </button>
            </div>
          </div>

          {/* Barra de Controle de Raio com Botões de Aumento (até 100km) */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900 dark:text-white">
              <MapPin size={14} className="text-primary" />
              <span>Academias no seu raio:</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-navy-900 p-1 rounded-full border border-slate-200/60 dark:border-slate-800">
              {[10, 25, 50, 100].map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => setSearchRadiusKm(km)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-black transition-all ${
                    searchRadiusKm === km
                      ? "bg-primary text-white shadow-xs scale-105"
                      : "text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary"
                  }`}
                >
                  {km}km
                </button>
              ))}
            </div>
          </div>

          {/* 2. Mini Mapa Visual e Clicável com Cobertura Real */}
          <div
            onClick={() => setShowMapModal(true)}
            className="group relative bg-card dark:bg-navy-800 rounded-squircle p-3.5 shadow-soft border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary/50 transition-all hover:shadow-md"
            title="Clique para abrir o mapa interativo ampliado"
          >
            <div className="relative h-32 rounded-squircle-sm overflow-hidden bg-slate-200 dark:bg-navy-950 flex items-center justify-center border border-slate-200/80 dark:border-slate-700/80">
              {/* Imagem de Cartografia / Mapa com Tiles OSM reais */}
              <iframe
                title="Mini Mapa"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=-40.38,-20.35,-40.26,-20.27&layer=mapnik&marker=-20.3155,-40.3128`}
                className="absolute inset-0 w-full h-full border-0 pointer-events-none opacity-85 dark:opacity-60 contrast-125"
                loading="lazy"
              />

              {/* Círculo de Cobertura do Raio em SVG */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="rounded-full border-2 border-primary bg-primary/20 animate-pulse transition-all duration-500"
                  style={{
                    width: `${Math.min(240, 70 + (searchRadiusKm / 100) * 160)}px`,
                    height: `${Math.min(240, 70 + (searchRadiusKm / 100) * 160)}px`
                  }}
                />
              </div>

              {/* Marcador Central do Usuário */}
              <div className="relative z-10 flex flex-col items-center pointer-events-none">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg ring-4 ring-white/60 dark:ring-navy-900/60">
                  <MapPin size={16} />
                </div>
                <span className="text-[11px] font-black text-navy-900 dark:text-white mt-1 bg-white/95 dark:bg-navy-900/95 px-2.5 py-0.5 rounded-full shadow-xs border border-slate-200 dark:border-slate-700">
                  Você está aqui ({searchRadiusKm} km)
                </span>
              </div>

              {/* Botão Flutuante de Abrir Mapa */}
              <div className="absolute top-2.5 right-2.5 z-20 bg-white/95 dark:bg-navy-900/95 hover:bg-white text-navy-900 dark:text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-slate-200 dark:border-slate-700 backdrop-blur-xs group-hover:scale-105 transition-transform">
                <Maximize2 size={12} className="text-primary" />
                <span>Ver Mapa Completo</span>
              </div>

              {/* Banner inferior com contador de vagas */}
              <div className="absolute bottom-2 inset-x-2 z-20 bg-navy-950/85 backdrop-blur-md text-white text-[11px] font-bold py-1.5 px-3 rounded-xl flex items-center justify-between">
                <span>{filteredShifts.length} {filteredShifts.length === 1 ? "vaga no raio selecionado" : "vagas no raio selecionado"}</span>
                <span className="text-primary font-black text-[10px]">Toque para explorar →</span>
              </div>
            </div>
          </div>

          {/* 3. AVISO DE DESTAQUE DE NEGOCIAÇÃO (CARD ENTRE O MAPA E AS AULAS NA COR AZUL PADRÃO) */}
          {urgentProposal && !isUrgentAlertDismissed && (() => {
            const upShift = shifts.find((s) => s.id === urgentProposal.shiftId);
            const upGym = gyms.find((g) => g.id === upShift?.gymId);
            const isInvite = urgentProposal.type === "convite" || urgentProposal.turn === "professor";

            return (
              <div
                onClick={() => {
                  setIsUrgentAlertDismissed(true);
                  setActiveTab("propostas");
                }}
                className="bg-primary text-white rounded-squircle p-4 shadow-md space-y-3 cursor-pointer hover:bg-primary-hover hover:scale-[1.01] transition-all group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center flex-shrink-0 shadow-xs backdrop-blur-xs">
                      <AlertCircle size={20} strokeWidth={1.5} />
                    </div>
                    <div className="truncate">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 block">
                        {isInvite ? "Novo Convite de Aula Recebido" : "Proposta em Aberto"}
                      </span>
                      <p className="text-xs font-bold truncate text-white mt-0.5">
                        {upGym?.name || "Academia Parceira"}: R$ {urgentProposal.proposedRate}/h fixo
                      </p>
                      {upShift && (
                        <p className="text-[11px] text-white/90 font-medium truncate mt-0.5">
                          {upShift.modality} · {formatDateDDMMAAAA(upShift.date)} · {upShift.startTime} às {upShift.endTime}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {urgentProposal.expiresInMinutes > 0 && (
                      <div className="flex items-center gap-1 bg-black/20 px-2.5 py-1 rounded-full text-xs font-bold text-white backdrop-blur-xs">
                        <Clock size={12} strokeWidth={1.5} />
                        <span>{urgentProposal.expiresInMinutes}m</span>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsUrgentAlertDismissed(true);
                      }}
                      className="text-white/70 hover:text-white text-xs p-1 rounded-full hover:bg-white/20 transition-colors"
                      title="Dispensar aviso"
                    >
                      <X size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Ações da Proposta na Home: Aceitar ou Recusar */}
                <div className="flex items-center justify-between pt-2 border-t border-white/20 text-xs">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      rejectProposal(urgentProposal.id);
                    }}
                    className="text-white/80 hover:text-white text-xs font-semibold underline bg-transparent border-0 p-0 cursor-pointer transition-colors"
                  >
                    Recusar convite
                  </button>

                  <span className="text-[11px] text-white font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Ver detalhes e negociar →
                  </span>
                </div>
              </div>
            );
          })()}

          {/* 4. Filtros de Modalidade (Linha Completa com Rolagem Suave sem Scrollbar) */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
            {["Todos", "Musculação", "Spinning", "Funcional"].map((mod) => (
              <button
                key={mod}
                onClick={() => setSelectedModality(mod)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedModality === mod
                    ? "bg-primary text-white shadow-xs"
                    : "bg-card dark:bg-navy-800 text-slate-600 dark:text-slate-300 shadow-soft hover:bg-slate-50 dark:hover:bg-navy-700 border border-slate-100 dark:border-slate-800"
                }`}
              >
                {mod}
              </button>
            ))}
          </div>

          {/* 5. Feed de Aulas Disponíveis (Cards Maiores, Quadrados, com Logo e Candidatar-se Direto) */}
          <div className="space-y-3 pt-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                  Aulas Disponíveis
                </h2>
                {selectedDateFilter && (
                  <button
                    onClick={() => setSelectedDateFilter(null)}
                    className="text-[11px] text-primary font-bold hover:underline"
                  >
                    Limpar filtro
                  </button>
                )}
              </div>

              {/* Botão Outras Datas (alinhado à direita na mesma linha do título) */}
              <button
                onClick={() => setShowOtherDatesModal(true)}
                className="flex items-center gap-1.5 bg-card dark:bg-navy-800 px-3 py-1.5 rounded-full text-xs font-bold text-primary shadow-soft hover:bg-slate-50 dark:hover:bg-navy-700 flex-shrink-0 border border-slate-100 dark:border-slate-800 transition-colors"
              >
                <Calendar size={13} />
                <span>{selectedDateFilter ? "Filtrado" : "Outras datas"}</span>
              </button>
            </div>

            {filteredShifts.length === 0 ? (
              <div className="bg-card dark:bg-navy-800 rounded-squircle p-8 text-center shadow-soft border border-slate-100 dark:border-slate-800 space-y-2">
                <Calendar className="mx-auto text-slate-300 dark:text-slate-600" size={32} />
                <p className="text-sm font-bold text-navy-900 dark:text-white">Nenhuma aula para os filtros selecionados</p>
                <p className="text-xs text-muted dark:text-slate-400">Tente selecionar outra modalidade ou data.</p>
              </div>
            ) : (
              filteredShifts.map((shift) => {
                const gym = gyms.find((g) => g.id === shift.gymId) || gyms[0];
                const isApplied = myProposals.some((p) => p.shiftId === shift.id);
                const dateInfo = formatShiftDate(shift);

                return (
                  <div
                    key={shift.id}
                    className="bg-card dark:bg-navy-800 rounded-squircle p-5 shadow-soft border border-slate-100 dark:border-slate-800 space-y-3.5 transition-all hover:shadow-soft-hover"
                  >
                    {/* Linha Superior: Logotipo (sem foto de fachada), Nome, Nota e Bairro */}
                    <div
                      onClick={() => setDetailShiftId(shift.id)}
                      className="flex gap-3.5 items-center cursor-pointer"
                    >
                      {/* Logotipo da Academia ou Ícone Fallback com Fundo Redondo */}
                      <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-navy-900 border border-slate-100 dark:border-slate-700 p-0.5 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs">
                        {gym?.logo ? (
                          <img
                            src={gym.logo}
                            alt={gym.name || "Academia"}
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                              // Se der erro de imagem, oculta e exibe ícone
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <Dumbbell size={20} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="text-sm font-black text-navy-900 dark:text-white truncate">
                            {gym?.name || "Academia"}
                          </h3>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              if (gym) setSelectedGymDetail(gym);
                            }}
                            className="flex items-center gap-1 bg-slate-50 dark:bg-navy-900 px-2 py-0.5 rounded-full text-xs font-bold text-navy-900 dark:text-slate-200 border border-slate-100 dark:border-slate-700 cursor-pointer hover:border-amber-400 transition-colors"
                            title="Ver avaliações e pilares da academia"
                          >
                            <Star size={11} className="text-amber-400 fill-amber-400" strokeWidth={1.5} />
                            <span>{gym?.rating ? gym.rating.toFixed(1) : "5.0"}</span>
                          </div>
                        </div>

                        <p className="text-xs text-muted dark:text-slate-400 mt-0.5">
                          {gym?.neighborhood || gym?.city || "Unidade"} · <span className="text-navy-900 dark:text-slate-200 font-medium">{shift.modality}</span>
                        </p>

                        {/* Destaque do Horário */}
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-primary font-bold">
                          <Clock size={12} />
                          <span>{dateInfo.dayMonth} ({dateInfo.weekday}) · {dateInfo.hours}</span>
                        </div>

                        {/* Alerta de Conflito de Horário ou Deslocamento */}
                        {(() => {
                          const conflict = checkInstructorShiftConflict(activeInstructorId, shift, shifts, gyms);
                          if (!conflict.hasConflict) return null;
                          return (
                            <div className={`mt-2 p-2 rounded-xl text-[11px] font-semibold flex items-start gap-1.5 border ${
                              conflict.conflictType === "overlap"
                                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50"
                                : "bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900/50"
                            }`}>
                              <AlertCircle size={13} className="shrink-0 mt-0.5" />
                              <span>{conflict.conflictMessage}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Rodapé do Card: Valor Fixo e Botão Candidatar-se */}
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-700/60">
                      <div>
                        <span className="text-[10px] text-muted dark:text-slate-400 block leading-none">Valor da Hora-Aula</span>
                        <span className="text-base font-black text-navy-900 dark:text-white">
                          R$ {shift.maxRate ?? (shift as any).rate ?? 45}
                          <span className="text-xs font-normal text-muted dark:text-slate-400">/h fixo</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDetailShiftId(shift.id)}
                          className="text-xs font-bold text-slate-500 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white px-2 py-1 transition-colors"
                        >
                          Detalhes
                        </button>

                        {(() => {
                          const conflict = checkInstructorShiftConflict(activeInstructorId, shift, shifts, gyms);
                          if (isApplied) {
                            return (
                              <span className="text-xs font-bold text-primary bg-primary-subtle dark:bg-primary/20 px-3 py-2 rounded-full">
                                Candidatura enviada
                              </span>
                            );
                          }
                          if (conflict.hasConflict) {
                            return (
                              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-navy-900 px-3 py-2 rounded-full cursor-not-allowed border border-slate-200 dark:border-slate-700">
                                {conflict.conflictType === "overlap" ? "Conflito de Horário" : "Deslocamento Curto"}
                              </span>
                            );
                          }
                          return (
                            <button
                              onClick={() => setSelectedShiftId(shift.id)}
                              className="bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-4 py-2 rounded-full shadow-xs active:scale-95 transition-all"
                            >
                              Candidatar-se
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      )}

      {/* ===================== MODAL BOTTOM-SHEET: DETALHES DA ACADEMIA (iFood-Style) ===================== */}
      <AnimatedModal
        isOpen={Boolean(detailShift && detailGym)}
        onClose={() => setDetailShiftId(null)}
        maxWidth="max-w-md"
        className="overflow-hidden flex flex-col p-0 border-t border-slate-200 dark:border-slate-700"
        showHandle={false}
      >
        {detailShift && detailGym && (
          <>
            {/* Foto Superior da Fachada com Botão Fechar */}
            <div className="relative h-44 w-full bg-slate-100 dark:bg-navy-900 flex-shrink-0">
              <img
                src={detailGym.facadeUrl}
                alt={detailGym.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setDetailShiftId(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-xs text-sm font-bold hover:bg-black/70 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Logo + Título + Nota */}
              <div className="flex gap-3.5 items-center">
                <div className="w-14 h-14 rounded-full bg-white dark:bg-navy-900 p-0.5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {detailGym?.logo ? (
                    <img
                      src={detailGym.logo}
                      alt={detailGym.name || "Academia"}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <Building2 className="w-7 h-7 text-primary" strokeWidth={1.5} />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-black text-navy-900 dark:text-white leading-tight">
                    {detailGym.name}
                  </h2>
                  <p className="text-xs text-muted dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-primary" />
                    {detailGym.neighborhood} · {detailGym.city}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-navy-900 px-2.5 py-1 rounded-full text-xs font-bold text-navy-900 dark:text-slate-200 border border-slate-100 dark:border-slate-700">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span>{detailGym.rating.toFixed(1)}</span>
                  <span className="text-muted dark:text-slate-400 text-[10px]">({detailGym.ratingCount})</span>
                </div>
              </div>

              {/* Horário & Valor deste Turno */}
              <div className="bg-slate-50 dark:bg-navy-900/70 p-4 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-700/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-slate-400 block">
                  Necessidade da Vaga
                </span>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900 dark:text-white">
                    <Clock size={13} className="text-primary" />
                    <span>{formatShiftDate(detailShift).dayMonth} ({formatShiftDate(detailShift).weekday}) · {formatShiftDate(detailShift).hours}</span>
                  </div>
                  <span className="text-base font-black text-primary">
                    R$ {detailShift.maxRate ?? (detailShift as any).rate ?? 45}/h fixo
                  </span>
                </div>
              </div>

              {/* Modalidades & Estrutura */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                  Modalidades & Estrutura
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {["Musculação", "Spinning", "Funcional", "Vestiários", "Climatizado"].map((item) => (
                    <span
                      key={item}
                      className="text-[11px] font-semibold bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-200 px-3 py-1 rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Endereço Completo */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                  Endereço
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-navy-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  {detailGym.address}
                </p>
              </div>

              {/* Alerta de Conflito no Modal de Detalhes */}
              {(() => {
                const detailConflict = checkInstructorShiftConflict(activeInstructorId, detailShift, shifts, gyms);
                if (!detailConflict.hasConflict) return null;
                return (
                  <div className={`p-3 rounded-2xl text-xs font-semibold flex items-start gap-2 border ${
                    detailConflict.conflictType === "overlap"
                      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50"
                      : "bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900/50"
                  }`}>
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{detailConflict.conflictMessage}</span>
                  </div>
                );
              })()}

              {/* Botão de Candidatura */}
              <div className="pt-2">
                {(() => {
                  const detailConflict = checkInstructorShiftConflict(activeInstructorId, detailShift, shifts, gyms);
                  if (detailConflict.hasConflict) {
                    return (
                      <button
                        disabled
                        className="w-full bg-slate-200 dark:bg-navy-700 text-slate-400 dark:text-slate-500 font-extrabold py-3.5 rounded-full text-sm cursor-not-allowed"
                      >
                        Indisponível ({detailConflict.conflictType === "overlap" ? "Conflito de Horário" : "Deslocamento Insuficiente"})
                      </button>
                    );
                  }
                  return (
                    <button
                      onClick={() => {
                        setSelectedShiftId(detailShift.id);
                        setDetailShiftId(null);
                      }}
                      className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold py-3.5 rounded-full text-sm shadow-sm transition-all active:scale-[0.99]"
                    >
                      Candidatar-se pelo Valor Fixo (R$ {detailShift.maxRate ?? (detailShift as any).rate ?? 45}/h)
                    </button>
                  );
                })()}
              </div>
            </div>
          </>
        )}
      </AnimatedModal>

      {/* ===================== MODAL DE OUTRAS DATAS (CALENDÁRIO COM NAVEGAÇÃO DE MESES) ===================== */}
      <AnimatedModal
        isOpen={showOtherDatesModal}
        onClose={() => setShowOtherDatesModal(false)}
        className="p-5 space-y-4"
      >
        {(() => {
          // Mês base: Novembro 2026 (mês 10 no JS Date 0-indexado)
          const currentCalDate = new Date(2026, 10 + calendarMonthOffset, 1);
          const monthNames = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
          ];
          const displayMonthName = monthNames[currentCalDate.getMonth()];
          const displayYear = currentCalDate.getFullYear();
          const daysInMonth = new Date(displayYear, currentCalDate.getMonth() + 1, 0).getDate();
          // Dia da semana do 1º dia (0: Domingo, 1: Segunda... 6: Sábado)
          const rawDay = currentCalDate.getDay();
          const firstDayOfWeek = (rawDay + 6) % 7; // Segunda = 0

          return (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                    <Calendar size={14} className="text-primary" />
                    Navegar por Datas
                  </h3>
                  <p className="text-[11px] text-muted dark:text-slate-400">
                    Selecione um dia específico para ver vagas
                  </p>
                </div>
                <button
                  onClick={() => setShowOtherDatesModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-navy-700 flex items-center justify-center text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Controles de Navegação de Mês */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-navy-900/60 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <button
                  disabled={calendarMonthOffset === 0}
                  onClick={() => setCalendarMonthOffset(calendarMonthOffset - 1)}
                  className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${
                    calendarMonthOffset === 0
                      ? "opacity-30 cursor-not-allowed text-slate-400"
                      : "hover:bg-white dark:hover:bg-navy-700 text-navy-900 dark:text-white shadow-xs"
                  }`}
                  title="Mês anterior (bloqueado antes do mês atual)"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="text-center">
                  <span className="text-xs font-black text-navy-900 dark:text-white block">
                    {displayMonthName} {displayYear}
                  </span>
                  {calendarMonthOffset === 0 ? (
                    <span className="text-[10px] text-primary font-bold">Mês Atual</span>
                  ) : (
                    <span className="text-[10px] text-muted dark:text-slate-400">+{calendarMonthOffset} {calendarMonthOffset === 1 ? "mês adiante" : "meses adiante"}</span>
                  )}
                </div>
                <button
                  onClick={() => setCalendarMonthOffset(calendarMonthOffset + 1)}
                  className="p-1.5 rounded-full hover:bg-white dark:hover:bg-navy-700 text-navy-900 dark:text-white transition-colors flex items-center justify-center shadow-xs"
                  title="Próximo mês"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Grade do Mês */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted dark:text-slate-400 font-bold">
                  <span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span><span>SÁB</span><span>DOM</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold">
                  {/* Padding antes do dia 1 */}
                  {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                    <span key={`pad-${idx}`} className="py-2 text-slate-300 dark:text-slate-700 text-xs">
                      ·
                    </span>
                  ))}

                  {/* Dias do mês */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const formattedDay = dayNum.toString().padStart(2, "0");
                    const formattedMonth = (currentCalDate.getMonth() + 1).toString().padStart(2, "0");
                    const dateString = `${displayYear}-${formattedMonth}-${formattedDay}`;
                    const isSelected = selectedDateFilter === dateString;
                    const hasShifts = shifts.some((s) => s.date === dateString);

                    return (
                      <button
                        key={dateString}
                        onClick={() => {
                          setSelectedDateFilter(dateString);
                          setShowOtherDatesModal(false);
                        }}
                        className={`py-2 rounded-xl text-xs font-bold transition-all relative flex flex-col items-center justify-center ${
                          isSelected
                            ? "bg-primary text-white shadow-xs"
                            : hasShifts
                            ? "bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-blue-300"
                            : "bg-slate-50 dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-700 text-navy-900 dark:text-slate-200"
                        }`}
                      >
                        <span>{formattedDay}</span>
                        {hasShifts && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                              isSelected ? "bg-white" : "bg-primary"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedDateFilter(null);
                    setShowOtherDatesModal(false);
                  }}
                  className="w-full py-2.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors"
                >
                  Ver Todas as Datas
                </button>
              </div>
            </>
          );
        })()}
      </AnimatedModal>

      {/* ===================== TAB: PROPOSTAS (NEGOCIAÇÕES ABERTAS E CONCLUÍDAS) ===================== */}
      {activeTab === "propostas" && (
        <main className="p-5 space-y-4 animate-fade-in">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-extrabold text-navy-900 dark:text-white">Negociações</h1>
              <p className="text-xs text-muted dark:text-slate-400">Acompanhe e responda propostas dentro do prazo</p>
            </div>
            <button
              type="button"
              onClick={() => setShowNotificationModal(true)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 px-3 py-1.5 rounded-full transition-colors"
              title="Como funcionam notificações push e e-mails"
            >
              <Bell size={13} />
              <span>Push & E-mails</span>
            </button>
          </div>

          {/* Sub-Abas: Abertas vs Concluídas */}
          <div className="flex bg-slate-100 dark:bg-navy-800 p-1 rounded-full text-xs font-bold border border-slate-200/60 dark:border-slate-700">
            <button
              onClick={() => setProposalSubTab("abertas")}
              className={`flex-1 py-2 rounded-full transition-all flex items-center justify-center gap-1.5 ${
                proposalSubTab === "abertas"
                  ? "bg-primary text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white"
              }`}
            >
              <Clock size={13} />
              <span>Abertas ({openProposals.length})</span>
            </button>
            <button
              onClick={() => setProposalSubTab("concluidas")}
              className={`flex-1 py-2 rounded-full transition-all flex items-center justify-center gap-1.5 ${
                proposalSubTab === "concluidas"
                  ? "bg-primary text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white"
              }`}
            >
              <CheckCheck size={13} />
              <span>Concluídas ({closedProposals.length})</span>
            </button>
          </div>

          {/* Filtro por Mês nas Concluídas */}
          {proposalSubTab === "concluidas" && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <span className="text-[11px] font-bold text-muted dark:text-slate-400 flex items-center gap-1 pr-1">
                <Filter size={11} /> Mês:
              </span>
              {[
                { id: "todos", label: "Todos os Meses" },
                { id: "2026-11", label: "Nov/2026" },
                { id: "2026-10", label: "Out/2026" },
                { id: "2026-09", label: "Set/2026" }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setProposalMonthFilter(m.id)}
                  className={`text-xs font-extrabold px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                    proposalMonthFilter === m.id
                      ? "bg-navy-900 dark:bg-white text-white dark:text-navy-900"
                      : "bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {/* Lista de Propostas */}
          {(() => {
            const list = proposalSubTab === "abertas" ? openProposals : closedProposals;

            if (list.length === 0) {
              return (
                <div className="bg-card dark:bg-navy-800 rounded-squircle p-8 text-center shadow-soft border border-slate-100 dark:border-slate-800 space-y-2">
                  <Clock className="mx-auto text-slate-300 dark:text-slate-600" size={32} />
                  <p className="text-sm font-bold text-navy-900 dark:text-white">
                    {proposalSubTab === "abertas"
                      ? "Nenhuma proposta aberta no momento"
                      : "Nenhuma proposta concluída neste filtro"}
                  </p>
                  <p className="text-xs text-muted dark:text-slate-400">
                    {proposalSubTab === "abertas"
                      ? "Candidate-se aos turnos na aba Início para receber novas propostas."
                      : "Propostas aceitas, recusadas ou expiradas aparecerão no histórico."}
                  </p>
                </div>
              );
            }

            return list.map((prop) => {
              const shift = shifts.find((s) => s.id === prop.shiftId);
              const gym = gyms.find((g) => g.id === shift?.gymId);
              const dateInfo = formatShiftDate(shift);

              const isExpired = prop.status === "expirada";
              const isRejected = prop.status === "recusada";
              const isAccepted = prop.status === "aceita";
              const isPending = prop.status === "pendente";

              return (
                <div
                  key={prop.id}
                  className={`bg-card dark:bg-navy-800 rounded-squircle overflow-hidden shadow-soft border space-y-4 transition-all ${
                    isExpired
                      ? "border-amber-300 dark:border-amber-900/60"
                      : isRejected
                      ? "border-red-200 dark:border-red-900/50"
                      : isAccepted
                      ? "border-emerald-300 dark:border-emerald-800/60"
                      : "border-slate-100 dark:border-slate-800"
                  }`}
                >
                  {/* Status Banner Destacado no Topo do Card */}
                  {isExpired && (
                    <div className="bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-300/40 dark:border-amber-900/40 px-4 py-2 flex items-center justify-between text-amber-800 dark:text-amber-300">
                      <span className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider">
                        <Clock size={13} /> Proposta Expirada
                      </span>
                      <span className="text-[10px] font-bold opacity-80">Prazo de 60m esgotado</span>
                    </div>
                  )}

                  {isRejected && (
                    <div className="bg-red-500/10 dark:bg-red-950/40 border-b border-red-300/40 dark:border-red-900/40 px-4 py-2 flex items-center justify-between text-red-700 dark:text-red-300">
                      <span className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider">
                        <X size={13} /> Proposta Recusada
                      </span>
                      <span className="text-[10px] font-bold opacity-80">Não houve acordo</span>
                    </div>
                  )}

                  {isAccepted && (
                    <div className="bg-emerald-500/10 dark:bg-emerald-950/40 border-b border-emerald-300/40 dark:border-emerald-900/40 px-4 py-2 flex items-center justify-between text-emerald-800 dark:text-emerald-300">
                      <span className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider">
                        <CheckCircle size={13} /> Contratação Confirmada
                      </span>
                      <span className="text-[10px] font-bold opacity-80">Aula na Agenda</span>
                    </div>
                  )}

                  <div className="p-4 pt-1 space-y-3">
                    {/* Cabeçalho do Turno: Logo, Nome da Academia e Destaque ao Dia */}
                    <div className="flex gap-3 items-center pb-3 border-b border-slate-100 dark:border-slate-700/60">
                      <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-navy-900 p-0.5 border border-slate-100 dark:border-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs">
                        {gym?.logo ? (
                          <img src={gym.logo} alt={gym.name || "Academia"} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <Building2 className="w-6 h-6 text-primary" strokeWidth={1.5} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-navy-900 dark:text-white truncate">{gym?.name || "Academia"}</h3>
                        <p className="text-xs text-muted dark:text-slate-400">{shift?.modality || "Aula"} · {gym?.neighborhood || gym?.city || "Unidade"}</p>
                      </div>
                    </div>

                    {/* DESTAQUE AO DIA/MÊS + DIA DA SEMANA + HORÁRIO */}
                    <div className="flex items-center gap-3 bg-primary-subtle dark:bg-primary/20 p-3 rounded-2xl border border-primary/20">
                      <div className="bg-primary text-white font-black text-xs px-2.5 py-1.5 rounded-xl shadow-2xs">
                        {dateInfo.dayMonth}
                      </div>
                      <div className="text-xs font-bold text-navy-900 dark:text-white">
                        <span>{dateInfo.weekday}</span>
                        <span className="text-muted dark:text-slate-300 font-normal"> · {dateInfo.hours}</span>
                      </div>
                    </div>

                    {/* Detalhes do Valor Fixo e Tipo */}
                    <div className="bg-slate-50 dark:bg-navy-900/60 p-3.5 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-700/60">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted dark:text-slate-400">Tipo de Negociação:</span>
                        <span className="font-bold text-navy-900 dark:text-white">
                          {prop.turn === "professor" ? "Convite recebido da academia" : "Candidatura enviada por você"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-200/60 dark:border-slate-700">
                        <span className="text-primary font-bold">Valor fixo da hora-aula:</span>
                        <span className="font-black text-primary text-base">
                          R$ {prop.proposedRate}/h
                        </span>
                      </div>

                      {/* Timer de Prazo Dinâmico */}
                      {isPending && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-full mt-2 w-fit border border-amber-200/50 dark:border-amber-900/50">
                          <Clock size={12} />
                          <span>Prazo de resposta: {prop.expiresInMinutes} min restantes</span>
                        </div>
                      )}
                    </div>

                    {/* Mensagens Explicativas de Status Concluídos */}
                    {isExpired && (
                      <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl text-xs text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/50 space-y-1">
                        <div className="font-bold">Tempo limite de resposta esgotado</div>
                        <p className="text-[11px] opacity-80">
                          Esta oportunidade expirou automaticamente pois não foi aceita dentro do prazo de 60 minutos. O horário voltou a ficar disponível para outros professores.
                        </p>
                      </div>
                    )}

                    {isRejected && (
                      <div className="p-3 bg-red-50/70 dark:bg-red-950/30 rounded-2xl text-xs text-red-700 dark:text-red-300 border border-red-200/60 dark:border-red-900/50 space-y-1">
                        <div className="font-bold">Proposta recusada ou cancelada</div>
                        <p className="text-[11px] opacity-80">
                          {prop.reason || "Não foi possível conciliar a proposta de horário ou disponibilidade com a academia."}
                        </p>
                      </div>
                    )}

                    {isAccepted && (
                      <div className="space-y-2">
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 p-3 rounded-2xl text-xs font-semibold border border-emerald-200/50 dark:border-emerald-900/50 flex items-center justify-between">
                          <span>Contatos liberados da academia na aba Agenda</span>
                          <button
                            type="button"
                            onClick={() => setActiveTab("agenda")}
                            className="text-xs font-black text-emerald-700 dark:text-emerald-300 hover:underline"
                          >
                            Ver na Agenda →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Ações da Negociação Aberta: Aceitar ou Recusar */}
                    {prop.turn === "professor" && isPending && (() => {
                      const propConflict = shift ? checkInstructorShiftConflict(activeInstructorId, shift, shifts, gyms) : { hasConflict: false };
                      return (
                        <div className="space-y-2 pt-1">
                          {propConflict.hasConflict && (
                            <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-start gap-1.5 border ${
                              propConflict.conflictType === "overlap"
                                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50"
                                : "bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900/50"
                            }`}>
                              <AlertCircle size={14} className="shrink-0 mt-0.5" />
                              <span>{propConflict.conflictMessage}</span>
                            </div>
                          )}

                          <button
                            onClick={() => {
                              const res = acceptProposal(prop.id);
                              if (res.hasConflict) {
                                alert(`⚠️ Atenção: ${res.conflictMessage}`);
                              }
                            }}
                            disabled={propConflict.hasConflict}
                            className={`w-full font-extrabold py-3 rounded-full text-sm shadow-sm transition-all ${
                              propConflict.hasConflict
                                ? "bg-slate-200 dark:bg-navy-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                                : "bg-primary hover:bg-primary-hover text-white active:scale-[0.99]"
                            }`}
                          >
                            {propConflict.hasConflict
                              ? `Indisponível (${propConflict.conflictType === "overlap" ? "Conflito" : "Deslocamento Curto"})`
                              : `Aceitar Horário (R$ ${prop.proposedRate}/h)`}
                          </button>
                          <button
                            onClick={() => rejectProposal(prop.id)}
                            className="w-full text-xs font-semibold text-muted dark:text-slate-400 hover:text-red-500 py-1 text-center"
                          >
                            Recusar Convite
                          </button>
                        </div>
                      );
                    })()}

                    {prop.turn === "academia" && isPending && (
                      <div className="flex justify-between items-center p-3 bg-blue-50/50 dark:bg-navy-900/80 rounded-2xl border border-blue-100 dark:border-slate-700 text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Aguardando confirmação da academia</span>
                        <button
                          onClick={() => rejectProposal(prop.id)}
                          className="text-xs font-bold text-red-500 hover:underline"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            });
          })()}
        </main>
      )}

      {/* ===================== TAB: AGENDA (CONFIRMADOS & CALENDÁRIO) ===================== */}
      {activeTab === "agenda" && (
        <main className="p-5 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-extrabold text-navy-900 dark:text-white">Minha Agenda</h1>
              <p className="text-xs text-muted dark:text-slate-400">Acompanhe aulas e gerencie sua disponibilidade</p>
            </div>
          </div>

          {/* Feedback de sucesso do wizard */}
          {offerSuccessMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fade-in shadow-xs">
              <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{offerSuccessMsg}</span>
            </div>
          )}

          {/* Botão de Destaque: Quero oferecer um horário (Posicionado logo acima das abas) */}
          <button
            type="button"
            onClick={() => {
              setOfferHourlyRate(currentInstructor.hourlyRate || 45);
              setOfferMinHourlyRate((currentInstructor as any).minHourlyRate || Math.max(30, (currentInstructor.hourlyRate || 45) - 10));
              setOfferModalities(currentInstructor.modalities?.length ? currentInstructor.modalities : ["Musculação"]);
              setShowOfferSlotWizard(true);
              setOfferWizardStep(1);
            }}
            className="w-full flex items-center justify-center bg-gradient-to-r from-primary to-blue-600 hover:from-primary-hover hover:to-blue-700 text-white text-xs font-black py-3.5 px-4 rounded-2xl shadow-md active:scale-[0.98] transition-all"
          >
            Quero oferecer um horário
          </button>

          {/* Sub-Aba: Alternar entre Aulas Confirmadas e Meus horários semanais */}
          <div className="flex bg-slate-100 dark:bg-navy-800 p-1 rounded-full text-xs font-bold border border-slate-200/60 dark:border-slate-700">
            <button
              onClick={() => setAgendaSubTab("aulas")}
              className={`flex-1 py-2 rounded-full transition-all flex items-center justify-center gap-1.5 ${
                agendaSubTab === "aulas"
                  ? "bg-primary text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white"
              }`}
            >
              <Calendar size={13} />
              <span>Aulas Confirmadas ({myConfirmedShifts.length})</span>
            </button>
            <button
              onClick={() => setAgendaSubTab("grade")}
              className={`flex-1 py-2 rounded-full transition-all flex items-center justify-center gap-1.5 ${
                agendaSubTab === "grade"
                  ? "bg-primary text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white"
              }`}
            >
              <Clock size={13} />
              <span>Meus horários semanais</span>
            </button>
          </div>

          {/* SUB-ABA 1: AULAS CONFIRMADAS & HISTÓRICO COM CALENDÁRIO HORIZONTAL */}
          {agendaSubTab === "aulas" && (
            <div className="space-y-4">
              {/* Header do Mês e Botão de Visão Geral do Mês alinhado à direita */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      let nextMonth: number;
                      let nextYear: number;
                      if (selectedMonth === 1) {
                        nextMonth = 12;
                        nextYear = selectedYear - 1;
                      } else {
                        nextMonth = selectedMonth - 1;
                        nextYear = selectedYear;
                      }
                      setSelectedMonth(nextMonth);
                      setSelectedYear(nextYear);
                      const isNowCurrent = (nextYear === currentTodayYear && nextMonth === currentTodayMonth) || (nextYear === 2026 && nextMonth === 11);
                      setSelectedDayNumber(isNowCurrent ? currentTodayDay : null);
                    }}
                    className="p-1 rounded-xl text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                    title="Mês Anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {/* Toque no mês abre a modal com o calendário */}
                  <button
                    type="button"
                    onClick={() => {
                      setNavYear(selectedYear);
                      setShowCalendarYearModal(true);
                    }}
                    className="text-left group cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-800/80 px-2 py-1 rounded-xl transition-all"
                    title="Toque no mês para abrir o calendário"
                  >
                    <h2 className="text-sm font-black text-navy-900 dark:text-white flex items-center gap-1.5 leading-none group-hover:text-primary transition-colors">
                      <span>{MONTH_NAMES[selectedMonth - 1]}</span>
                      <span className="text-primary">{selectedYear}</span>
                      <Calendar size={13} strokeWidth={1.5} className="text-slate-400 group-hover:text-primary transition-colors" />
                    </h2>
                    <span className="text-[10px] text-muted dark:text-slate-400 font-semibold block mt-0.5">
                      {selectedYear < 2026 || (selectedYear === 2026 && selectedMonth < 11)
                        ? "Histórico Realizado"
                        : selectedYear === 2026 && selectedMonth === 11
                        ? "Mês atual"
                        : "Programação Futura"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      let nextMonth: number;
                      let nextYear: number;
                      if (selectedMonth === 12) {
                        nextMonth = 1;
                        nextYear = selectedYear + 1;
                      } else {
                        nextMonth = selectedMonth + 1;
                        nextYear = selectedYear;
                      }
                      setSelectedMonth(nextMonth);
                      setSelectedYear(nextYear);
                      const isNowCurrent = (nextYear === currentTodayYear && nextMonth === currentTodayMonth) || (nextYear === 2026 && nextMonth === 11);
                      setSelectedDayNumber(isNowCurrent ? currentTodayDay : null);
                    }}
                    className="p-1 rounded-xl text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                    title="Próximo Mês"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* Botão Visão Geral do Mês (no lugar de Outras Datas) */}
                <button
                  type="button"
                  onClick={() => setShowMonthOverviewModal(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 px-3 py-1.5 rounded-full transition-colors"
                  title="Ver Visão Geral do Mês"
                >
                  <Eye size={13} strokeWidth={1.5} />
                  <span>Visão Geral do Mês</span>
                </button>
              </div>

              {/* CALENDÁRIO EM UMA ÚNICA LINHA COM SLIDE HORIZONTAL */}
              <div className="bg-card dark:bg-navy-800 p-3 rounded-squircle shadow-soft border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    {selectedDayNumber !== null ? (
                      <button
                        type="button"
                        onClick={() => setSelectedDayNumber(null)}
                        className="text-xs font-black text-primary hover:underline flex items-center gap-1.5 py-0.5"
                      >
                        <RotateCcw size={12} strokeWidth={2} /> Ver mês inteiro
                      </button>
                    ) : (
                      <span className="text-[11px] font-extrabold text-primary bg-primary/10 dark:bg-primary/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <Calendar size={12} strokeWidth={2} /> Mês inteiro (Padrão)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1.5 scroll-smooth">
                  {/* Botão de Todo o Mês */}
                  <button
                    type="button"
                    onClick={() => setSelectedDayNumber(null)}
                    className={`flex-shrink-0 px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                      selectedDayNumber === null
                        ? "bg-primary text-white shadow-xs ring-2 ring-primary/40 ring-offset-1 ring-offset-background"
                        : "bg-slate-100 dark:bg-navy-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700"
                    }`}
                  >
                    Todos
                  </button>

                  {/* Dias do Mês Selecionado */}
                  {calendarDays.map((d) => {
                    const isSelected = selectedDayNumber === d.dayNum;
                    const isToday = d.isToday;

                    return (
                      <button
                        key={d.dayNum}
                        ref={isToday ? todayButtonRef : undefined}
                        type="button"
                        onClick={() => setSelectedDayNumber(isSelected ? null : d.dayNum)}
                        className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-14 rounded-2xl transition-all relative ${
                          isSelected
                            ? "bg-primary text-white shadow-md scale-105 border-2 border-white dark:border-navy-900 ring-2 ring-primary/50"
                            : isToday
                            ? "bg-primary/10 dark:bg-primary/20 text-primary border-2 border-primary font-black shadow-xs ring-2 ring-primary/30"
                            : "bg-slate-100 dark:bg-navy-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 border border-transparent"
                        }`}
                        title={
                          d.hasShifts
                            ? "Aula Contratada"
                            : d.isAvailable
                            ? `Disponível (${d.slotsSummary || "Grade Ativa"})`
                            : d.isBlocked
                            ? "Folga pontual bloqueada"
                            : "Indisponível / Folga"
                        }
                      >
                        {isToday && (
                          <span className="absolute -top-1.5 px-1.5 py-0.2 rounded-full bg-primary text-white text-[7px] font-black uppercase tracking-tight shadow-2xs">
                            Hoje
                          </span>
                        )}
                        <span className={`text-[10px] font-bold ${
                          isSelected ? "text-white/80" : isToday ? "text-primary dark:text-blue-400 font-extrabold" : "text-muted dark:text-slate-400"
                        }`}>
                          {d.dayOfWeek}
                        </span>
                        <span className={`text-sm font-black leading-tight ${
                          isToday && !isSelected ? "text-primary dark:text-blue-400 font-black" : ""
                        }`}>
                          {String(d.dayNum).padStart(2, "0")}
                        </span>

                        {/* Indicador de Estado: 🔵 Aula Contratada | 🟢 Disponível | 🔴 Cancelada */}
                        {d.hasShifts ? (
                          <span
                            className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                              isSelected
                                ? "bg-white"
                                : d.hasCompleted
                                ? "bg-emerald-500"
                                : "bg-blue-500 ring-1 ring-white dark:ring-navy-800"
                            }`}
                          />
                        ) : d.isAvailable ? (
                          <span
                            className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                              isSelected
                                ? "bg-white"
                                : "bg-emerald-500 ring-1 ring-white dark:ring-navy-800"
                            }`}
                          />
                        ) : d.hasCancelled ? (
                          <span
                            className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                              isSelected
                                ? "bg-white"
                                : "bg-rose-500 ring-1 ring-white dark:ring-navy-800"
                            }`}
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Se for mês anterior ou encerrado, exibir resumo financeiro */}
              {monthAllConfirmedShifts.length > 0 && (selectedYear < 2026 || (selectedYear === 2026 && selectedMonth < 11)) && (
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-300/40 dark:border-emerald-700/40 p-4 rounded-squircle space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCheck size={14} /> Histórico de Aulas Cumpridas
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      Mês Encerrado
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                    <div className="bg-white/70 dark:bg-navy-800/80 p-2 rounded-xl">
                      <span className="text-[10px] text-muted dark:text-slate-400 block font-bold">Aulas Realizadas</span>
                      <span className="text-base font-black text-navy-900 dark:text-white">
                        {monthAllConfirmedShifts.filter((s) => s.status === "realizada").length}
                      </span>
                    </div>
                    <div className="bg-white/70 dark:bg-navy-800/80 p-2 rounded-xl">
                      <span className="text-[10px] text-muted dark:text-slate-400 block font-bold">Total Recebido</span>
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        R$ {monthAllConfirmedShifts.reduce((acc, s) => acc + (s.agreedRate || s.maxRate || (s as any).rate || 45) * 3, 0)},00
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de Aulas do Mês/Dia Selecionado */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                      {selectedDayNumber !== null
                        ? `Aulas de ${String(selectedDayNumber).padStart(2, "0")}/${String(selectedMonth).padStart(2, "0")}/${selectedYear}`
                        : `Aulas em ${MONTH_NAMES[selectedMonth - 1]}/${selectedYear} (Mês Inteiro)`}
                    </h2>
                    {selectedDayNumber === null && (
                      <p className="text-[11px] text-muted dark:text-slate-400">
                        Visualização primária exibindo todas as aulas do mês
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedDayNumber !== null && (
                      <button
                        type="button"
                        onClick={() => setSelectedDayNumber(null)}
                        className="text-[10px] font-black text-primary hover:underline flex items-center gap-1"
                      >
                        <RotateCcw size={10} /> Mês Todo
                      </button>
                    )}
                    <span className="text-[11px] font-bold text-muted dark:text-slate-400 bg-slate-100 dark:bg-navy-900 px-2 py-0.5 rounded-full">
                      {myConfirmedShifts.length} {myConfirmedShifts.length === 1 ? "aula" : "aulas"}
                    </span>
                  </div>
                </div>

                {myConfirmedShifts.length === 0 ? (
                  selectedDayInfo && selectedDayInfo.isAvailable ? (
                    <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 rounded-squircle p-5 text-xs space-y-3 animate-fade-in shadow-soft">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <Clock size={15} strokeWidth={1.5} className="text-emerald-600" />
                          Dia Disponível para Novas Aulas
                        </span>
                        <span className="text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          Grade Ativa
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        Nenhuma aula contratada ainda para esta data. Seus horários programados na Grade Semanal estão ativos: <strong className="font-extrabold text-navy-900 dark:text-white">{selectedDayInfo.slotsSummary || "Horário livre"}</strong>. Quando uma academia buscar por este horário, você será recomendado no topo!
                      </p>
                      <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Quer descansar neste dia?</span>
                        <button
                          type="button"
                          onClick={() => toggleBlockDate(activeInstructorId, selectedDayInfo.dateStr)}
                          className="text-[11px] font-black text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 transition-colors"
                        >
                          Definir folga apenas neste dia
                        </button>
                      </div>
                    </div>
                  ) : selectedDayInfo && selectedDayInfo.isBlocked ? (
                    <div className="bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-squircle p-5 text-xs space-y-3 animate-fade-in shadow-soft">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          Folga Pontual Programada
                        </span>
                        <span className="text-[10px] font-extrabold uppercase bg-slate-200 dark:bg-navy-700 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full">
                          Bloqueado
                        </span>
                      </div>
                      <p className="text-[11px] text-muted dark:text-slate-400 leading-relaxed">
                        Você bloqueou esta data para descanso ou compromissos pessoais. As demais semanas continuam ativas normalmente.
                      </p>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                        <button
                          type="button"
                          onClick={() => toggleBlockDate(activeInstructorId, selectedDayInfo.dateStr)}
                          className="text-[11px] font-black text-primary hover:underline flex items-center gap-1"
                        >
                          Restaurar disponibilidade deste dia
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-card dark:bg-navy-800 rounded-squircle p-8 text-center shadow-soft border border-slate-100 dark:border-slate-800 space-y-2">
                      <Calendar className="mx-auto text-slate-300 dark:text-slate-600" size={32} />
                      <p className="text-sm font-bold text-navy-900 dark:text-white">
                        {selectedDayNumber !== null
                          ? `Nenhuma aula agendada para o dia ${String(selectedDayNumber).padStart(2, "0")}`
                          : "Nenhuma aula confirmada neste mês"}
                      </p>
                      <p className="text-xs text-muted dark:text-slate-400">
                        {selectedDayNumber !== null
                          ? "Este dia está definido como folga na sua Grade Semanal."
                          : "Após aceitar propostas com as academias, suas aulas aparecerão aqui."}
                      </p>
                      {selectedDayNumber !== null && (
                        <button
                          type="button"
                          onClick={() => setSelectedDayNumber(null)}
                          className="mt-2 text-xs font-bold text-primary hover:underline"
                        >
                          Ver todas as aulas de {MONTH_NAMES[selectedMonth - 1]}
                        </button>
                      )}
                    </div>
                  )
                ) : (
                  myConfirmedShifts.map((shift) => {
                    const gym = gyms.find((g) => g.id === shift.gymId);
                    const isRealizada = shift.status === "realizada";
                    const isCancelada = shift.status === "cancelado";
                    const isCheckInFeito = Boolean(shift.instructorCheckInAt);
                    const isValidadaAcademia = Boolean(shift.gymValidationAt || isRealizada);
                    const checkInEligibility = checkCheckInEligibility(shift.date, shift.startTime, shift.endTime);
                    const cancelEligibility = canCancelShift(shift);

                    return (
                      <div key={shift.id} className="bg-card dark:bg-navy-800 rounded-squircle p-4 shadow-soft border border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex gap-3 items-center">
                          {/* Selo Vertical de Data */}
                          <div className={`flex flex-col items-center justify-center w-12 h-14 rounded-2xl border flex-shrink-0 ${
                            isCancelada
                              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-200 dark:border-rose-900/60"
                              : isRealizada
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200 dark:border-emerald-800"
                              : "bg-primary-subtle dark:bg-primary/20 text-primary border-blue-100 dark:border-primary/30"
                          }`}>
                            <span className="text-[10px] font-extrabold uppercase leading-none">
                              {MONTH_NAMES[Number(shift.date.split("-")[1]) - 1]?.slice(0, 3).toUpperCase() || "MÊS"}
                            </span>
                            <span className="text-lg font-black leading-tight">
                              {shift.date.split("-")[2] || "01"}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h3 className="text-sm font-bold text-navy-900 dark:text-white truncate">{gym?.name}</h3>
                              <span className="text-xs font-extrabold text-navy-900 dark:text-white">R$ {shift.agreedRate || shift.maxRate || (shift as any).rate || 45}/h</span>
                            </div>
                            <p className="text-xs text-muted dark:text-slate-400 mt-0.5 flex items-center gap-1">
                              <Clock size={11} className="text-primary" />
                              <span>{shift.startTime} – {shift.endTime} · {shift.modality}</span>
                            </p>
                          </div>
                        </div>

                        {/* BLOCO DE CANCELAMENTO OU FLUXO NORMAL */}
                        {isCancelada ? (
                          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 font-black text-rose-700 dark:text-rose-300">
                                <XCircle size={15} strokeWidth={1.5} className="text-rose-600 dark:text-rose-400" />
                                Aula Cancelada
                              </span>
                              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
                                {shift.cancelledBy === "professor" ? "Cancelado por Você" : "Cancelado pela Academia"}
                              </span>
                            </div>
                            <div className="pl-5 space-y-1">
                              <p className="text-[11px] text-slate-700 dark:text-slate-300">
                                <strong className="font-extrabold text-navy-900 dark:text-white">Motivo:</strong> {shift.cancellationReason || "Motivo não informado"}
                              </p>
                              {shift.cancelledAt && (
                                <p className="text-[10px] text-muted dark:text-slate-400">
                                  Cancelado em {formatDateDDMMAAAA(shift.cancelledAt)} · Autor: {shift.cancelledByName || (shift.cancelledBy === "professor" ? "Professor" : "Academia")}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* FLUXO DE CONFIRMAÇÃO DE PRESENÇA (SEM EXIGÊNCIA DE GPS + VALIDAÇÃO DUPLA) */
                          <div className="space-y-2">
                            {/* 1. Professor ainda não fez check-in */}
                            {shift.status === "confirmado" && !isCheckInFeito && (
                              <>
                                {checkInEligibility.canCheckIn ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const res = instructorCheckIn(shift.id);
                                      if (!res.success) {
                                        alert(`⚠️ ${res.message}`);
                                      }
                                    }}
                                    className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold py-2.5 rounded-full text-xs shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                                  >
                                    <Check size={14} />
                                    <span>Iniciar Aula / Confirmar Presença</span>
                                  </button>
                                ) : (
                                  <div className="space-y-1.5">
                                    <button
                                      type="button"
                                      disabled
                                      className="w-full bg-slate-100 dark:bg-navy-900/80 text-slate-400 dark:text-slate-500 font-bold py-2.5 rounded-full text-xs border border-slate-200 dark:border-slate-700/60 flex items-center justify-center gap-1.5 cursor-not-allowed opacity-90"
                                      title={checkInEligibility.message}
                                    >
                                      <Lock size={13} className="text-slate-400 dark:text-slate-500" />
                                      <span>Iniciar Aula / Confirmar Presença</span>
                                    </button>
                                    <div className="flex items-start gap-1.5 text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/40 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-900/50">
                                      <AlertCircle size={13} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                                      <span className="leading-tight">{checkInEligibility.message}</span>
                                    </div>
                                  </div>
                                )}

                                {/* BOTÃO DE CANCELAMENTO DE AULA CONTRATADA ANTES DO INÍCIO */}
                                {cancelEligibility.canCancel && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShiftToCancel(shift);
                                      setShowCancelModal(true);
                                    }}
                                    className="w-full py-2 px-3 rounded-full border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-extrabold text-[11px] flex items-center justify-center gap-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                                  >
                                    <XCircle size={13} strokeWidth={1.5} />
                                    <span>Cancelar Aula Contratada</span>
                                  </button>
                                )}
                              </>
                            )}

                            {/* 2. Professor fez check-in, aguardando validação posterior da academia */}
                            {shift.status === "confirmado" && isCheckInFeito && !isValidadaAcademia && (
                              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs font-bold text-amber-800 dark:text-amber-300 space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <CheckCircle size={14} className="text-primary flex-shrink-0" />
                                  <span>Presença confirmada pelo professor às {shift.instructorCheckInAt}</span>
                                </div>
                                <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 pl-5 font-normal">
                                  Aguardando validação posterior da academia ({gym?.name}) para finalizar o fechamento da aula.
                                </p>
                              </div>
                            )}

                            {/* 3. Aula validada pela academia (Concluída) */}
                            {isValidadaAcademia && (
                              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5">
                                    <CheckCheck size={15} className="text-emerald-600" />
                                    Aula Realizada com Sucesso
                                  </span>
                                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-extrabold bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                                    Presença Validada
                                  </span>
                                </div>
                                <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400 font-normal pl-5 flex items-center justify-between">
                                  <span>Check-in: {shift.instructorCheckInAt || "07:58"}</span>
                                  <span>Validação da Academia: {shift.gymValidationAt || "10:15"}</span>
                                </div>

                                {shift.gymReviewedByInstructor ? (
                                  <div className="pt-1.5 flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 border-t border-emerald-200/60 dark:border-emerald-800/40">
                                    <Star size={12} className="text-amber-500 fill-amber-500" strokeWidth={1.5} />
                                    <span>Academia Avaliada por você</span>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (gym) setReviewGymShift({ shift, gym });
                                    }}
                                    className="w-full mt-2 py-2 px-3 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-all"
                                  >
                                    <Star size={12} strokeWidth={1.5} />
                                    <span>Avaliar Academia ({gym?.name})</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Contatos Liberados */}
                        <div className="bg-slate-50 dark:bg-navy-900/60 p-3 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-700/60 text-xs">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-emerald-200/50 dark:border-emerald-900/50">
                            <ShieldCheck size={11} /> Contatos Liberados da Academia
                          </span>
                          <div className="flex items-center gap-2 text-navy-900 dark:text-white font-semibold pt-1">
                            <Phone size={12} className="text-primary" />
                            <span>{gym?.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <MapPin size={12} className="text-primary" />
                            <span className="truncate">{gym?.address}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* SUB-ABA 2: GRADE DE DISPONIBILIDADE DO PROFESSOR */}
          {agendaSubTab === "grade" && (
            <div className="space-y-4">
              {/* Card Informativo com Destaque de Compatibilidade e Preservação */}
              <div className="bg-primary/10 dark:bg-primary/20 border border-primary/20 p-4 rounded-squircle space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="text-primary flex-shrink-0" size={16} strokeWidth={1.5} />
                  <h3 className="text-xs font-black text-navy-900 dark:text-white uppercase tracking-wider">
                    Grade Semanal & Compatibilidade com Calendário
                  </h3>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Defina os horários em que você está livre para dar aulas recorrentes.
                  <strong className="font-extrabold text-navy-900 dark:text-white block mt-1">
                    💡 Suas aulas já contratadas permanecem sempre confirmadas no calendário, mesmo se você desativar o dia da semana na grade.
                  </strong>
                </p>
              </div>

              {saveAvailabilityMsg && (
                <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-3 rounded-2xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
                  <CheckCircle size={15} />
                  <span>{saveAvailabilityMsg}</span>
                </div>
              )}

              {/* Lista dos 7 Dias da Semana */}
              <div className="space-y-3">
                {DEFAULT_WEEK_DAYS.map((weekDay) => {
                  const dayAvail = localAvailability.find((d) => d.dayOfWeek === weekDay.dayOfWeek) || {
                    dayOfWeek: weekDay.dayOfWeek,
                    dayName: weekDay.dayName,
                    shortDay: weekDay.shortDay,
                    active: false,
                    slots: []
                  };

                  const toggleDay = () => {
                    setLocalAvailability((prev) => {
                      const exists = prev.some((d) => d.dayOfWeek === weekDay.dayOfWeek);
                      let updated: DayAvailability[];
                      if (exists) {
                        updated = prev.map((d) => {
                          if (d.dayOfWeek !== weekDay.dayOfWeek) return d;
                          const newActive = !d.active;
                          return {
                            ...d,
                            active: newActive,
                            slots: d.slots || []
                          };
                        });
                      } else {
                        updated = [
                          ...prev,
                          {
                            dayOfWeek: weekDay.dayOfWeek,
                            dayName: weekDay.dayName,
                            shortDay: weekDay.shortDay,
                            active: true,
                            slots: []
                          }
                        ];
                      }
                      updateInstructorAvailability(activeInstructorId, updated);
                      return updated;
                    });
                  };

                  const removeSlot = (slotIdx: number) => {
                    setSlotErrorMsg((prev) => ({ ...prev, [weekDay.dayOfWeek]: null }));

                    const targetSlot = dayAvail.slots?.[slotIdx];
                    if (targetSlot) {
                      const slotStartMin = timeToMinutes(targetSlot.start);
                      const slotEndMin = timeToMinutes(targetSlot.end);
                      const myInstId = currentInstructor.id || activeInstructorId;

                      // Checa se existe aula confirmada nesse dia da semana e horário
                      const conflictingShift = shifts.find((s) => {
                        const isMyShift = s.confirmedInstructorId === myInstId || s.confirmedInstructorId === "inst-1";
                        if (!isMyShift || s.status !== "confirmado") return false;
                        const [y, m, d] = (s.date || "").split("-").map(Number);
                        const sDate = new Date(y, m - 1, d);
                        if (sDate.getDay() !== weekDay.dayOfWeek) return false;
                        const sStart = timeToMinutes(s.startTime);
                        const sEnd = timeToMinutes(s.endTime);
                        return Math.max(slotStartMin, sStart) < Math.min(slotEndMin, sEnd);
                      });

                      if (conflictingShift) {
                        setSlotErrorMsg((prev) => ({
                          ...prev,
                          [weekDay.dayOfWeek]: `Não é possível excluir: você possui aula contratada (${conflictingShift.title} · ${formatDateDDMMAAAA(conflictingShift.date)} das ${conflictingShift.startTime} às ${conflictingShift.endTime}). Cancele a aula antes de remover o horário.`
                        }));
                        return;
                      }

                      // Checa se existe proposta ativa/pendente para esse horário
                      const conflictingProposal = proposals.find((p) => {
                        const isMyProp = p.instructorId === myInstId || p.instructorId === "inst-1";
                        if (!isMyProp || (p.status !== "pendente" && p.status !== "aceita")) return false;
                        const targetShift = shifts.find((s) => s.id === p.shiftId);
                        if (!targetShift) return false;
                        const [y, m, d] = (targetShift.date || "").split("-").map(Number);
                        const pDate = new Date(y, m - 1, d);
                        if (pDate.getDay() !== weekDay.dayOfWeek) return false;
                        const sStart = timeToMinutes(targetShift.startTime);
                        const sEnd = timeToMinutes(targetShift.endTime);
                        return Math.max(slotStartMin, sStart) < Math.min(slotEndMin, sEnd);
                      });

                      if (conflictingProposal) {
                        setSlotErrorMsg((prev) => ({
                          ...prev,
                          [weekDay.dayOfWeek]: `Não é possível excluir este horário: há uma proposta em andamento para este período. Recuse ou finalize a negociação antes de remover.`
                        }));
                        return;
                      }
                    }

                    setLocalAvailability((prev) => {
                      const updated = prev.map((d) => {
                        if (d.dayOfWeek !== weekDay.dayOfWeek) return d;
                        const filtered = d.slots.filter((_, idx) => idx !== slotIdx);
                        return {
                          ...d,
                          slots: filtered
                        };
                      });
                      updateInstructorAvailability(activeInstructorId, updated);
                      return updated;
                    });
                  };

                  const addSlot = (start: string, end: string) => {
                    if (!start || !end) return;

                    const startMin = timeToMinutes(start);
                    const endMin = timeToMinutes(end);

                    if (startMin >= endMin) {
                      setSlotErrorMsg((prev) => ({
                        ...prev,
                        [weekDay.dayOfWeek]: "O horário de término deve ser posterior ao horário de início."
                      }));
                      return;
                    }

                    // Checa se o horário de início já passou para o dia de hoje
                    const now = new Date();
                    const currentMinutes = now.getHours() * 60 + now.getMinutes();
                    if (weekDay.dayOfWeek === now.getDay() && startMin <= currentMinutes) {
                      setSlotErrorMsg((prev) => ({
                        ...prev,
                        [weekDay.dayOfWeek]: "O horário de início já passou para o dia de hoje. Escolha um horário futuro."
                      }));
                      return;
                    }

                    // Checa conflito com qualquer horário já cadastrado neste dia
                    const currentSlots = dayAvail.slots || [];
                    for (const existing of currentSlots) {
                      const eStartMin = timeToMinutes(existing.start);
                      const eEndMin = timeToMinutes(existing.end);

                      // 1. Mesmo horário de início
                      if (start === existing.start) {
                        setSlotErrorMsg((prev) => ({
                          ...prev,
                          [weekDay.dayOfWeek]: `Conflito de horário: já existe um horário iniciando às ${start} (${existing.start} às ${existing.end}).`
                        }));
                        return;
                      }

                      // 2. Mesmo horário de término
                      if (end === existing.end) {
                        setSlotErrorMsg((prev) => ({
                          ...prev,
                          [weekDay.dayOfWeek]: `Conflito de horário: já existe um horário terminando às ${end} (${existing.start} às ${existing.end}).`
                        }));
                        return;
                      }

                      // 3. Sobreposição de intervalo (parcial ou total)
                      const overlapStart = Math.max(startMin, eStartMin);
                      const overlapEnd = Math.min(endMin, eEndMin);
                      if (overlapStart < overlapEnd) {
                        setSlotErrorMsg((prev) => ({
                          ...prev,
                          [weekDay.dayOfWeek]: `Conflito de sobreposição: o horário ${start} às ${end} colide com o horário já cadastrado das ${existing.start} às ${existing.end}.`
                        }));
                        return;
                      }
                    }

                    // Sem conflito: limpa mensagem de erro e adiciona ordenado
                    setSlotErrorMsg((prev) => ({ ...prev, [weekDay.dayOfWeek]: null }));

                    const newSlots = [...currentSlots, { start, end }].sort(
                      (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)
                    );

                    setLocalAvailability((prev) => {
                      const exists = prev.some((d) => d.dayOfWeek === weekDay.dayOfWeek);
                      let updated: DayAvailability[];
                      if (exists) {
                        updated = prev.map((d) => {
                          if (d.dayOfWeek !== weekDay.dayOfWeek) return d;
                          return {
                            ...d,
                            active: true,
                            slots: newSlots
                          };
                        });
                      } else {
                        updated = [
                          ...prev,
                          {
                            dayOfWeek: weekDay.dayOfWeek,
                            dayName: weekDay.dayName,
                            shortDay: weekDay.shortDay,
                            active: true,
                            slots: newSlots
                          }
                        ];
                      }
                      updateInstructorAvailability(activeInstructorId, updated);
                      return updated;
                    });
                  };

                  const currentInputs = slotInputs[weekDay.dayOfWeek] || { start: "07:00", end: "12:00" };

                  const confirmedClassesOnWeekday = shifts.filter((s) => {
                    if (s.confirmedInstructorId !== activeInstructorId) return false;
                    if (s.status !== "confirmado" && s.status !== "realizada") return false;
                    const [y, m, d] = (s.date || "").split("-").map(Number);
                    if (!y || !m || !d) return false;
                    const dt = new Date(y, m - 1, d);
                    return dt.getDay() === weekDay.dayOfWeek;
                  });

                  return (
                    <div
                      key={weekDay.dayOfWeek}
                      className={`bg-card dark:bg-navy-800 rounded-squircle p-4 shadow-soft border transition-all ${
                        dayAvail.active
                          ? "border-primary/30 dark:border-primary/30"
                          : "border-slate-100 dark:border-slate-800 opacity-90"
                      }`}
                    >
                      {/* Topo do Dia: Nome, Badge e Switch */}
                      <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-navy-900 dark:text-white">
                            {weekDay.dayName}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              dayAvail.active
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                                : "bg-slate-100 dark:bg-navy-700 text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {dayAvail.active ? "Disponível" : "Indisponível / Folga"}
                          </span>

                          {confirmedClassesOnWeekday.length > 0 && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                              {confirmedClassesOnWeekday.length} contratada(s) mantida(s)
                            </span>
                          )}
                        </div>

                        {/* Switch On/Off */}
                        <button
                          type="button"
                          onClick={toggleDay}
                          className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                            dayAvail.active ? "bg-primary justify-end" : "bg-slate-300 dark:bg-navy-600 justify-start"
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                        </button>
                      </div>

                      {!dayAvail.active && confirmedClassesOnWeekday.length > 0 && (
                        <div className="mt-2.5 p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-[10px] text-blue-800 dark:text-blue-300 font-bold flex items-center gap-1.5">
                          <CheckCircle size={12} className="text-blue-600 shrink-0" />
                          <span>Suas {confirmedClassesOnWeekday.length} aula(s) já contratadas para este dia continuam ativas no calendário.</span>
                        </div>
                      )}

                      {/* Se Ativo: Lista de Faixas e Adicionadores */}
                      {dayAvail.active ? (
                        <div className="pt-3 space-y-3">
                          {/* Faixas Horárias Existentes ou Aviso de Ausência de Horários */}
                          {dayAvail.slots.length === 0 ? (
                            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2 shadow-2xs animate-fade-in">
                              <AlertCircle size={15} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                              <p className="leading-relaxed font-semibold">
                                Cadastre seus horários de início e fim para disponibilizar. Você pode ter mais de um horário no mesmo dia
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-1.5 animate-fade-in">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-slate-400 block">
                                Horários Livres Cadastrados:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {dayAvail.slots.map((slot, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="flex items-center gap-1.5 bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold"
                                  >
                                    <Clock size={11} />
                                    <span>
                                      {slot.start} às {slot.end}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => removeSlot(sIdx)}
                                      className="hover:text-red-500 ml-1 p-0.5 rounded-full hover:bg-white/40 transition-colors"
                                      title="Remover horário"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Formulário Personalizado de Horário com Stepper e Digitação Numérica */}
                          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                            <span className="text-[11px] font-bold text-navy-900 dark:text-white block">
                              Cadastrar Novo Horário:
                            </span>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <TimeStepperInput
                                  value={currentInputs.start}
                                  onChange={(val) => {
                                    setSlotErrorMsg((prev) => ({ ...prev, [weekDay.dayOfWeek]: null }));
                                    setSlotInputs((prev) => ({
                                      ...prev,
                                      [weekDay.dayOfWeek]: { ...currentInputs, start: val }
                                    }));
                                  }}
                                  ariaLabel="Horário de início"
                                />
                                <span className="text-xs font-bold text-muted dark:text-slate-400">até</span>
                                <TimeStepperInput
                                  value={currentInputs.end}
                                  onChange={(val) => {
                                    setSlotErrorMsg((prev) => ({ ...prev, [weekDay.dayOfWeek]: null }));
                                    setSlotInputs((prev) => ({
                                      ...prev,
                                      [weekDay.dayOfWeek]: { ...currentInputs, end: val }
                                    }));
                                  }}
                                  ariaLabel="Horário de término"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => addSlot(currentInputs.start, currentInputs.end)}
                                className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-navy-900 dark:bg-primary text-white hover:bg-navy-800 dark:hover:bg-primary-hover shadow-xs transition-colors whitespace-nowrap flex items-center gap-1 active:scale-95"
                              >
                                <Plus size={13} />
                                <span>Adicionar</span>
                              </button>
                            </div>

                            {/* Mensagem de Erro de Conflito de Horário */}
                            {slotErrorMsg[weekDay.dayOfWeek] && (
                              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs font-semibold flex items-start gap-1.5">
                                <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-500" />
                                <span>{slotErrorMsg[weekDay.dayOfWeek]}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted dark:text-slate-400 pt-2">
                          Ative este dia para liberar horários de atendimento.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Espaçador para o conteúdo rolável não ficar coberto pelo botão flutuante */}
              <div className="h-24" />

              {/* Botão Flutuante Único: Salvar Minha Grade Semanal (Fixo logo acima da Tab Bar) */}
              <div className="fixed bottom-[74px] left-0 right-0 max-w-md mx-auto px-4 z-30 pointer-events-none">
                <button
                  type="button"
                  onClick={() => {
                    updateInstructorAvailability(activeInstructorId, localAvailability);
                    setSaveAvailabilityMsg("Sua grade de horários foi salva e sincronizada com sucesso!");
                    setTimeout(() => setSaveAvailabilityMsg(null), 4000);
                  }}
                  className="pointer-events-auto w-full bg-primary hover:bg-primary-hover text-white text-xs font-extrabold py-3.5 rounded-full shadow-lg shadow-primary/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 border border-white/20"
                >
                  <Check size={16} strokeWidth={2.5} />
                  <span>Salvar Minha Grade Semanal</span>
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ===================== TAB: PERFIL (ESTILO IFOOD COM ÍCONES OUTLINE LIGHT NA COR DA FONTE) ===================== */}
      {activeTab === "perfil" && (
        <main className="p-5 space-y-4 animate-fade-in">
          {/* Mensagem de Sucesso Flutuante */}
          {profileSuccessMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border border-emerald-200/50 dark:border-emerald-900/50 shadow-xs animate-scale-up">
              <CheckCircle size={16} className="text-emerald-500 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {/* 1. Card Superior: Foto Clicável, Nome, CREF e Nota Geral com Estrela */}
          <div className="bg-card dark:bg-navy-800 rounded-squircle p-6 shadow-soft border border-slate-100 dark:border-slate-800 text-center space-y-3">
            {/* Avatar Clicável com Toque para Trocar Foto */}
            <div
              onClick={() => setShowAvatarModal(true)}
              className="relative w-24 h-24 mx-auto rounded-full overflow-hidden shadow-md border-3 border-white dark:border-navy-700 cursor-pointer group bg-slate-100 dark:bg-navy-900 flex items-center justify-center"
              title="Toque na imagem para trocar a foto de perfil"
            >
              {currentInstructor.avatar ? (
                <img
                  src={currentInstructor.avatar}
                  alt={currentInstructor.displayName || currentInstructor.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <User size={46} className="text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-bold">
                <Camera size={18} strokeWidth={1.5} />
                <span className="mt-0.5">{currentInstructor.avatar ? "Trocar foto" : "Adicionar foto"}</span>
              </div>
              <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md border-2 border-white dark:border-navy-800">
                <Camera size={11} strokeWidth={2} />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1 bg-blue-50 dark:bg-primary/20 text-primary text-xs font-bold px-2.5 py-1 rounded-full border border-primary/20">
                <ShieldCheck size={13} strokeWidth={1.5} />
                <span>CREF {currentInstructor.cref} (Ativo)</span>
              </div>
              <h1 className="text-xl font-extrabold text-navy-900 dark:text-white mt-2">
                {currentInstructor.displayName || currentInstructor.name}
              </h1>
              <p className="text-xs text-muted dark:text-slate-400">Profissional de Educação Física</p>
            </div>

            {/* Nota Geral Clicável ou Badge de Novo Usuário */}
            <div className="pt-1 flex flex-col items-center justify-center">
              {currentInstructor.ratingCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowRatingModal(true)}
                  className="group cursor-pointer flex flex-col items-center transition-transform active:scale-95"
                >
                  <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-1.5 rounded-full border border-amber-200/60 dark:border-amber-900/60 group-hover:border-amber-400 transition-colors">
                    <Star size={18} strokeWidth={1.5} className="text-amber-500 fill-amber-500" />
                    <span className="text-2xl font-black text-navy-900 dark:text-white tracking-tight">
                      {currentInstructor.rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-xs text-muted dark:text-slate-400 mt-1 flex items-center gap-1 group-hover:text-primary transition-colors">
                    {currentInstructor.ratingCount} avaliações · Ver detalhes <ChevronRight size={12} />
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowRatingModal(true)}
                  className="group cursor-pointer flex flex-col items-center transition-transform active:scale-95"
                >
                  <div className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-primary/10 px-3.5 py-1.5 rounded-full border border-blue-200 dark:border-primary/30 group-hover:border-primary transition-colors text-primary">
                    <Sparkles size={15} strokeWidth={2} />
                    <span className="text-xs font-bold">
                      Novo Usuário · Sem avaliações
                    </span>
                  </div>
                  <span className="text-[11px] text-muted dark:text-slate-400 mt-1 flex items-center gap-1 group-hover:text-primary transition-colors">
                    Como funciona a nota <ChevronRight size={12} />
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* 2. Ocorrências com Alerta Antecipado */}
          <div className="bg-card dark:bg-navy-800 rounded-squircle p-5 shadow-soft border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-navy-900 dark:text-white">Ocorrências / Faltas:</span>
              <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-900/50">
                {currentInstructor.occurrences}/3 (Regular)
              </span>
            </div>
            <p className="text-xs text-muted dark:text-slate-400 leading-relaxed">
              Faltas sem aviso geram 1 ocorrência. Ao atingir 3 ocorrências nos últimos 90 dias, o perfil é suspenso por 15 dias.
            </p>
          </div>

          {/* 3. LISTA DE OPÇÕES ESTILO IFOOD (ÍCONES OUTLINE, LIGHT NA COR DA FONTE) */}
          <div className="bg-card dark:bg-navy-800 rounded-squircle shadow-soft border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
            {/* Opção 1: Meus Dados */}
            <button
              type="button"
              onClick={() => setShowPersonalDataModal(true)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-navy-700/50 transition-colors group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <User size={20} strokeWidth={1.5} className="text-slate-800 dark:text-slate-200 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Meus Dados</span>
                  <span className="text-[11px] text-muted dark:text-slate-400 block truncate">
                    Nome completo, nome no app, nascimento, contato
                  </span>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={1.5} className="text-slate-400 dark:text-slate-500 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Opção 2: Minha Nota & Avaliações */}
            <button
              type="button"
              onClick={() => setShowRatingModal(true)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-navy-700/50 transition-colors group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <Star size={20} strokeWidth={1.5} className="text-amber-500 fill-amber-500/20 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Minha Nota</span>
                  <span className="text-[11px] text-muted dark:text-slate-400 block truncate">
                    {currentInstructor.ratingCount > 0
                      ? `Nota ${currentInstructor.rating.toFixed(1)} · ${currentInstructor.ratingCount} avaliações recebidas`
                      : "Novo Usuário · Saiba como funciona a avaliação"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {currentInstructor.ratingCount > 0 ? (
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200/50 dark:border-amber-900/50">
                    ★ {currentInstructor.rating.toFixed(1)}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Novo
                  </span>
                )}
                <ChevronRight size={16} strokeWidth={1.5} className="text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Opção 2: Meios de Recebimento (Chave Pix) */}
            <button
              type="button"
              onClick={() => {
                setEditPixKey("");
                setEditBank("");
                setEditPixIsDefault(false);
                setShowPixModal(true);
              }}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-navy-700/50 transition-colors group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <CreditCard size={20} strokeWidth={1.5} className="text-slate-800 dark:text-slate-200 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Meios de Recebimento</span>
                  <span className="text-[11px] text-muted dark:text-slate-400 block truncate">
                    {pixList.length > 0
                      ? `${pixList.length} chave(s) Pix · Principal: ${pixList.find((p) => p.isDefault)?.key || pixList[0]?.key}`
                      : currentInstructor.pixKey
                      ? `Pix cadastrado: ${currentInstructor.pixKey}`
                      : "Cadastrar chave Pix para recebimento"}
                  </span>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={1.5} className="text-slate-400 dark:text-slate-500 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Opção 3: Minhas Habilidades */}
            <button
              type="button"
              onClick={() => {
                setSkillsSearch("");
                setShowSkillsModal(true);
              }}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-navy-700/50 transition-colors group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <Dumbbell size={20} strokeWidth={1.5} className="text-slate-800 dark:text-slate-200 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Minhas Habilidades</span>
                  <span className="text-[11px] text-muted dark:text-slate-400 block truncate">
                    {editModalities.length > 0 ? editModalities.join(", ") : currentInstructor.modalities.join(", ")}
                  </span>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={1.5} className="text-slate-400 dark:text-slate-500 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Opção 4: Documentos */}
            <button
              type="button"
              onClick={() => setShowDocumentsModal(true)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-navy-700/50 transition-colors group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <FileText size={20} strokeWidth={1.5} className="text-slate-800 dark:text-slate-200 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Documentos</span>
                  <span className="text-[11px] text-muted dark:text-slate-400 block truncate">
                    Certificado validado, CREF {currentInstructor.cref}, CPF
                  </span>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={1.5} className="text-slate-400 dark:text-slate-500 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Opção 5: Senha */}
            <button
              type="button"
              onClick={() => {
                setPasswordFlowStep("alterar");
                setCurrentPasswordInput("");
                setNewPasswordInput("");
                setConfirmPasswordInput("");
                setPwdCodeInput("");
                setPwdCodeError("");
                setShowCurrentPwd(false);
                setShowNewPwd(false);
                setShowConfirmPwd(false);
                setPasswordFeedbackMsg(null);
                setShowPasswordModal(true);
              }}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-navy-700/50 transition-colors group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <Lock size={20} strokeWidth={1.5} className="text-slate-800 dark:text-slate-200 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Senha</span>
                  <span className="text-[11px] text-muted dark:text-slate-400 block truncate">
                    Alterar sua senha de acesso
                  </span>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={1.5} className="text-slate-400 dark:text-slate-500 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Opção 6: Notificações Gerais */}
            <button
              type="button"
              onClick={() => setShowNotificationsModal(true)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-navy-700/50 transition-colors group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <Bell size={20} strokeWidth={1.5} className="text-slate-800 dark:text-slate-200 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Notificações Gerais</span>
                  <span className="text-[11px] text-muted dark:text-slate-400 block truncate">
                    Avisos de novas vagas, convites e lembretes
                  </span>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={1.5} className="text-slate-400 dark:text-slate-500 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Opção: Guia Rápido do App (Onboarding) */}
            <button
              type="button"
              onClick={() => setShowOnboarding(true)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-navy-700/50 transition-colors group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <Sparkles size={20} strokeWidth={1.5} className="text-primary shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Como Funciona o App</span>
                  <span className="text-[11px] text-muted dark:text-slate-400 block truncate">
                    Rever os 3 passos e destaques da plataforma
                  </span>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={1.5} className="text-slate-400 dark:text-slate-500 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Opção: Como Adicionar Atalho no Celular */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-install-shortcut-modal"))}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-navy-700/50 transition-colors group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <Smartphone size={20} strokeWidth={1.5} className="text-primary shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                    Instalar App no Celular
                  </span>
                  <span className="text-[11px] text-muted dark:text-slate-400 block truncate">
                    Veja como adicionar o atalho à tela de início
                  </span>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={1.5} className="text-slate-400 dark:text-slate-500 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Opção 7: Botão de Tema (Claro / Escuro via Modal) */}
            <button
              type="button"
              onClick={() => setShowThemeModal(true)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-navy-700/50 transition-colors group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {isDarkMode ? (
                  <Moon size={20} strokeWidth={1.5} className="text-slate-800 dark:text-slate-200 shrink-0" />
                ) : (
                  <Sun size={20} strokeWidth={1.5} className="text-slate-800 dark:text-slate-200 shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Tema do Aplicativo</span>
                  <span className="text-[11px] text-muted dark:text-slate-400 block truncate">
                    {isDarkMode ? "Modo escuro ativado (toque para mudar)" : "Modo claro ativado (toque para mudar)"}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-primary px-2.5 py-1 rounded-full bg-primary/10 shrink-0 ml-2">
                {isDarkMode ? "Escuro" : "Claro"}
              </span>
            </button>

            {/* Opção 8: Botão de Sair do App */}
            <button
              type="button"
              onClick={logout}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <LogOut size={20} strokeWidth={1.5} className="text-slate-800 dark:text-slate-200 shrink-0 group-hover:text-red-600 transition-colors" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block group-hover:text-red-600 transition-colors">
                    Sair do App
                  </span>
                  <span className="text-[11px] text-muted dark:text-slate-400 block truncate">
                    Desconectar sua sessão com segurança
                  </span>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={1.5} className="text-slate-400 dark:text-slate-500 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </main>
      )}

      {/* ===================== MODAL DE CANDIDATURA COM VALOR FIXO ===================== */}
      <AnimatedModal
        isOpen={Boolean(selectedShiftId)}
        onClose={() => setSelectedShiftId(null)}
        className="p-6 space-y-4"
      >
        {selectedShiftId && (() => {
          const shift = shifts.find((s) => s.id === selectedShiftId);
          const gym = gyms.find((g) => g.id === shift?.gymId);
          const dateInfo = formatShiftDate(shift);
          const sM = timeToMinutes(shift?.startTime || "18:00");
          const eM = timeToMinutes(shift?.endTime || "21:00");
          const durationHours = Math.max(1, Math.round(((eM - sM) / 60) * 10) / 10);
          const fixedRate = shift?.maxRate || (shift as any)?.rate || 45;
          const totalEstimated = durationHours * fixedRate;

          return (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold text-navy-900 dark:text-white">Confirmar Candidatura</h3>
                <button
                  onClick={() => setSelectedShiftId(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-navy-700 text-slate-500 hover:text-navy-900 dark:hover:text-white flex items-center justify-center transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-navy-900/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-1.5 text-xs">
                <div className="flex justify-between items-start">
                  <span className="font-extrabold text-navy-900 dark:text-white text-sm">{gym?.name}</span>
                  <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full text-[10px]">
                    {shift?.modality}
                  </span>
                </div>
                <p className="text-muted dark:text-slate-400">{gym?.neighborhood} · {gym?.city}</p>
                <div className="flex items-center gap-1.5 pt-1 text-primary font-bold">
                  <Clock size={12} />
                  <span>{dateInfo.dayMonth} ({dateInfo.weekday}) · {dateInfo.hours}</span>
                </div>
              </div>

              {/* Destaque do Valor Fixo */}
              <div className="text-center p-4 rounded-2xl bg-primary-subtle/50 dark:bg-primary/20 border border-primary/20 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary block">
                  Valor Fixo da Hora-Aula (Sem Negociação)
                </span>
                <span className="text-3xl font-black text-navy-900 dark:text-white">R$ {fixedRate}</span>
                <span className="text-xs text-muted dark:text-slate-400">/hora aula</span>
                <div className="pt-2 border-t border-primary/10 dark:border-primary/20 mt-2">
                  <span className="text-xs font-bold text-navy-900 dark:text-white block">
                    Ganhos estimados: R$ {totalEstimated} ({durationHours}h de aula)
                  </span>
                  <span className="text-[10px] text-muted dark:text-slate-400 block mt-0.5">
                    Pagamento realizado diretamente pela academia após a conclusão
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setSelectedShiftId(null)}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    createProposal(selectedShiftId, activeInstructorId, fixedRate);
                    setSelectedShiftId(null);
                    setActiveTab("propostas");
                  }}
                  className="flex-1 py-2.5 rounded-full text-xs font-extrabold bg-primary text-white hover:bg-primary-hover shadow-sm transition-all"
                >
                  Confirmar Candidatura
                </button>
              </div>
            </>
          );
        })()}
      </AnimatedModal>

      {/* ===================== MODAL DE REDEFINIÇÃO DE SENHA (COM ESQUECEU A SENHA E CÓDIGO POR EMAIL) ===================== */}
      <AnimatedModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        className="p-5 space-y-4"
      >
        {(() => {
          const hasMinLength = newPasswordInput.length >= 8;
          const hasUppercase = /[A-Z]/.test(newPasswordInput);
          const hasNumber = /[0-9]/.test(newPasswordInput);
          const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPasswordInput);
          const passwordsMatch = newPasswordInput.length > 0 && newPasswordInput === confirmPasswordInput;
          const isFormValid = hasMinLength && hasUppercase && hasNumber && hasSpecial && passwordsMatch;

          const score = [hasMinLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;
          const strengthLabel = score <= 1 ? "Fraca" : score <= 3 ? "Média" : "Forte";
          const strengthColor = score <= 1 ? "bg-red-500" : score <= 3 ? "bg-amber-500" : "bg-emerald-500";

          const handleSavePassword = (e: React.FormEvent) => {
            e.preventDefault();
            if (!isFormValid) return;
            setPasswordFeedbackMsg("Senha atualizada com sucesso!");
            setTimeout(() => {
              setShowPasswordModal(false);
              setPasswordFeedbackMsg(null);
              setPasswordFlowStep("alterar");
            }, 1500);
          };

          const handleSendResetEmail = (e: React.FormEvent) => {
            e.preventDefault();
            setPwdCodeError("");
            setPwdCodeInput("");
            setPasswordFlowStep("esqueceu_codigo");
          };

          const handleVerifyCode = (e: React.FormEvent) => {
            e.preventDefault();
            if (pwdCodeInput.trim() === "849201" || pwdCodeInput.trim().length >= 4) {
              setPwdCodeError("");
              setNewPasswordInput("");
              setConfirmPasswordInput("");
              setPasswordFlowStep("esqueceu_nova");
            } else {
              setPwdCodeError("Código inválido. Digite o código de 6 dígitos enviado por e-mail.");
            }
          };

          return (
            <>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Lock size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                      {passwordFlowStep === "alterar"
                        ? "Alterar Senha"
                        : passwordFlowStep === "esqueceu_envio"
                        ? "Recuperar Acesso"
                        : passwordFlowStep === "esqueceu_codigo"
                        ? "Validar Código"
                        : "Criar Nova Senha"}
                    </h3>
                    <p className="text-[11px] text-muted dark:text-slate-400">
                      {passwordFlowStep === "alterar"
                        ? "Atualize sua senha de acesso"
                        : passwordFlowStep === "esqueceu_envio"
                        ? "Envio de código por e-mail"
                        : passwordFlowStep === "esqueceu_codigo"
                        ? "Confirmação de segurança"
                        : "Defina sua nova credencial"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordFlowStep("alterar");
                  }}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-navy-700 flex items-center justify-center text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {passwordFeedbackMsg ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2 animate-scale-up">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
                    <Check size={18} />
                  </div>
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{passwordFeedbackMsg}</p>
                </div>
              ) : (
                <>
                  {/* PASSO 1: ALTERAR SENHA PADRÃO */}
                  {passwordFlowStep === "alterar" && (
                    <form onSubmit={handleSavePassword} className="space-y-3.5">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-navy-900 dark:text-white">Senha Atual</label>
                          <button
                            type="button"
                            onClick={() => {
                              setPasswordFlowStep("esqueceu_envio");
                            }}
                            className="text-[11px] font-semibold text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer"
                          >
                            Esqueceu a senha?
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showCurrentPwd ? "text" : "password"}
                            value={currentPasswordInput}
                            onChange={(e) => setCurrentPasswordInput(e.target.value)}
                            placeholder="Digite sua senha atual"
                            className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 pr-10 py-2.5 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                          >
                            {showCurrentPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-navy-900 dark:text-white">Nova Senha</label>
                        <div className="relative">
                          <input
                            type={showNewPwd ? "text" : "password"}
                            value={newPasswordInput}
                            onChange={(e) => setNewPasswordInput(e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 pr-10 py-2.5 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPwd(!showNewPwd)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                          >
                            {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      {/* Checklist de requisitos de senha forte */}
                      <div className="bg-slate-50 dark:bg-navy-900/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-[11px]">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-muted dark:text-slate-400">Força da senha:</span>
                          <span className={score <= 1 ? "text-red-500" : score <= 3 ? "text-amber-500" : "text-emerald-500"}>
                            {strengthLabel}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-navy-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${strengthColor}`}
                            style={{ width: `${(score / 4) * 100}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <div className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400"}`}>
                            <Check size={11} className={hasMinLength ? "opacity-100" : "opacity-30"} />
                            <span>Mínimo 8 chars</span>
                          </div>
                          <div className={`flex items-center gap-1 ${hasUppercase ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400"}`}>
                            <Check size={11} className={hasUppercase ? "opacity-100" : "opacity-30"} />
                            <span>1 Maiúscula</span>
                          </div>
                          <div className={`flex items-center gap-1 ${hasNumber ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400"}`}>
                            <Check size={11} className={hasNumber ? "opacity-100" : "opacity-30"} />
                            <span>1 Número</span>
                          </div>
                          <div className={`flex items-center gap-1 ${hasSpecial ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400"}`}>
                            <Check size={11} className={hasSpecial ? "opacity-100" : "opacity-30"} />
                            <span>1 Especial (@$!%)</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-navy-900 dark:text-white">Confirmar Nova Senha</label>
                        <div className="relative">
                          <input
                            type={showConfirmPwd ? "text" : "password"}
                            value={confirmPasswordInput}
                            onChange={(e) => setConfirmPasswordInput(e.target.value)}
                            placeholder="Repita a nova senha"
                            className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 pr-10 py-2.5 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                          >
                            {showConfirmPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        {confirmPasswordInput.length > 0 && (
                          <span className={`text-[10px] font-bold block mt-1 ${passwordsMatch ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                            {passwordsMatch ? "✓ As senhas conferem" : "✗ As senhas não conferem"}
                          </span>
                        )}
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPasswordModal(false)}
                          className="flex-1 py-2.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={!isFormValid}
                          className="flex-1 py-2.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Salvar Senha
                        </button>
                      </div>
                    </form>
                  )}

                  {/* PASSO 2: ESQUECEU A SENHA - CONFIRMAR E-MAIL CADASTRADO */}
                  {passwordFlowStep === "esqueceu_envio" && (
                    <form onSubmit={handleSendResetEmail} className="space-y-4">
                      <div className="p-3.5 bg-blue-50 dark:bg-primary/10 rounded-2xl border border-primary/20 space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-primary text-xs">
                          <Mail size={14} />
                          <span>E-mail Cadastrado na Conta</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                          Para sua segurança, enviaremos um código de verificação de 6 dígitos para o endereço de e-mail vinculado ao seu perfil:
                        </p>
                        <div className="p-2.5 bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-navy-900 dark:text-white flex items-center justify-between">
                          <span>{currentInstructor.email || "lucas.ferreira.ef@gmail.com"}</span>
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                            Validado ✓
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPasswordFlowStep("alterar")}
                          className="flex-1 py-2.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors"
                        >
                          Voltar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-sm transition-all flex items-center justify-center gap-1.5"
                        >
                          <Send size={13} />
                          <span>Enviar Código</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* PASSO 3: VALIDAR CÓDIGO DE 6 DÍGITOS */}
                  {passwordFlowStep === "esqueceu_codigo" && (
                    <form onSubmit={handleVerifyCode} className="space-y-4">
                      <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200/50 space-y-1 text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-amber-800 dark:text-amber-300 block text-xs">
                          Código de Segurança Enviado!
                        </span>
                        <p className="text-[11px] leading-relaxed">
                          Verifique sua caixa de entrada no e-mail <strong>{currentInstructor.email}</strong>.
                        </p>
                        <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold pt-1">
                          💡 Dica de demonstração: digite <strong>849201</strong>
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-navy-900 dark:text-white block">Código de 6 Dígitos</label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={6}
                          value={pwdCodeInput}
                          onChange={(e) => {
                            setPwdCodeInput(e.target.value.replace(/\D/g, ""));
                            setPwdCodeError("");
                          }}
                          placeholder="849201"
                          autoFocus
                          className="w-full text-center text-xl font-mono tracking-widest p-3 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 font-bold focus:outline-primary dark:text-white"
                        />
                        {pwdCodeError && (
                          <span className="text-[11px] text-red-500 font-bold block pt-1">{pwdCodeError}</span>
                        )}
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPasswordFlowStep("esqueceu_envio")}
                          className="flex-1 py-2.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors"
                        >
                          Voltar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-sm transition-all"
                        >
                          Validar Código
                        </button>
                      </div>
                    </form>
                  )}

                  {/* PASSO 4: DEFINIR NOVA SENHA APÓS VALIDAÇÃO */}
                  {passwordFlowStep === "esqueceu_nova" && (
                    <form onSubmit={handleSavePassword} className="space-y-3.5">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                        ✓ Identidade validada por e-mail! Agora crie sua nova senha de acesso.
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-navy-900 dark:text-white">Nova Senha</label>
                        <div className="relative">
                          <input
                            type={showNewPwd ? "text" : "password"}
                            value={newPasswordInput}
                            onChange={(e) => setNewPasswordInput(e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 pr-10 py-2.5 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPwd(!showNewPwd)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                          >
                            {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      {/* Checklist de requisitos de senha forte */}
                      <div className="bg-slate-50 dark:bg-navy-900/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-[11px]">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-muted dark:text-slate-400">Força da senha:</span>
                          <span className={score <= 1 ? "text-red-500" : score <= 3 ? "text-amber-500" : "text-emerald-500"}>
                            {strengthLabel}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-navy-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${strengthColor}`}
                            style={{ width: `${(score / 4) * 100}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <div className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400"}`}>
                            <Check size={11} className={hasMinLength ? "opacity-100" : "opacity-30"} />
                            <span>Mínimo 8 chars</span>
                          </div>
                          <div className={`flex items-center gap-1 ${hasUppercase ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400"}`}>
                            <Check size={11} className={hasUppercase ? "opacity-100" : "opacity-30"} />
                            <span>1 Maiúscula</span>
                          </div>
                          <div className={`flex items-center gap-1 ${hasNumber ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400"}`}>
                            <Check size={11} className={hasNumber ? "opacity-100" : "opacity-30"} />
                            <span>1 Número</span>
                          </div>
                          <div className={`flex items-center gap-1 ${hasSpecial ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400"}`}>
                            <Check size={11} className={hasSpecial ? "opacity-100" : "opacity-30"} />
                            <span>1 Especial (@$!%)</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-navy-900 dark:text-white">Confirmar Nova Senha</label>
                        <div className="relative">
                          <input
                            type={showConfirmPwd ? "text" : "password"}
                            value={confirmPasswordInput}
                            onChange={(e) => setConfirmPasswordInput(e.target.value)}
                            placeholder="Repita a nova senha"
                            className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 pr-10 py-2.5 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                          >
                            {showConfirmPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        {confirmPasswordInput.length > 0 && (
                          <span className={`text-[10px] font-bold block mt-1 ${passwordsMatch ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                            {passwordsMatch ? "✓ As senhas conferem" : "✗ As senhas não conferem"}
                          </span>
                        )}
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPasswordModal(false)}
                          className="flex-1 py-2.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={!isFormValid}
                          className="flex-1 py-2.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Salvar Nova Senha
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </>
          );
        })()}
      </AnimatedModal>

      {/* ===================== MODAL DE TROCAR FOTO (AVATAR) ===================== */}
      <AnimatedModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        className="p-5 space-y-4"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Camera size={16} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy-900 dark:text-white">Foto de Perfil</h3>
              <p className="text-[11px] text-muted dark:text-slate-400">Upload de foto real com recorte circular</p>
            </div>
          </div>
          <button
            onClick={() => setShowAvatarModal(false)}
            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-navy-700 flex items-center justify-center text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Pré-visualização da foto atual */}
        <div className="flex flex-col items-center justify-center py-2 space-y-2">
          <div className="w-24 h-24 rounded-full ring-4 ring-primary/20 bg-slate-100 dark:bg-navy-800 overflow-hidden flex items-center justify-center shadow-md">
            {currentInstructor.avatar ? (
              <img
                src={currentInstructor.avatar}
                alt={currentInstructor.name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <User size={40} className="text-slate-400" />
            )}
          </div>
          <span className="text-[11px] text-muted dark:text-slate-400">
            {currentInstructor.avatar ? "Foto circular ativa" : "Nenhuma foto cadastrada (ícone padrão)"}
          </span>
        </div>

        {/* Ações de Upload e Recorte Circular */}
        <div className="space-y-2">
          <input
            type="file"
            id="prof-avatar-file-input"
            accept="image/*"
            className="hidden"
            onChange={handleProfFileSelect}
          />
          <label
            htmlFor="prof-avatar-file-input"
            className="w-full cursor-pointer flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary-hover shadow-sm transition-all active:scale-95"
          >
            <Upload size={14} />
            <span>Selecionar Nova Foto (Arquivo)</span>
          </label>

          {currentInstructor.avatar && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openProfCropWithCurrent}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-full hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors"
              >
                <Crop size={13} />
                <span>Ajustar Recorte</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  updateInstructorProfile(activeInstructorId, { avatar: "" });
                  setShowAvatarModal(false);
                  setProfileSuccessMsg("Foto removida. Avatar padrão com ícone aplicado.");
                  setTimeout(() => setProfileSuccessMsg(null), 3000);
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold rounded-full transition-colors border border-red-200 dark:border-red-900/40"
              >
                <Trash2 size={13} />
                <span>Remover Foto</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <label className="text-xs font-bold text-navy-900 dark:text-white">Ou informe a URL de uma imagem sua</label>
          <input
            type="text"
            placeholder="https://meusite.com/minha-foto.jpg"
            defaultValue={currentInstructor.avatar}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = (e.target as HTMLInputElement).value.trim();
                if (val) {
                  updateInstructorProfile(activeInstructorId, { avatar: val });
                  setShowAvatarModal(false);
                  setProfileSuccessMsg("Foto personalizada salva com sucesso!");
                  setTimeout(() => setProfileSuccessMsg(null), 3000);
                }
              }
            }}
            className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-primary"
          />
          <span className="text-[10px] text-muted dark:text-slate-400 block">Pressione Enter para salvar o link</span>
        </div>
      </AnimatedModal>

      {/* ===================== MODAL DE CROP CIRCULAR DA FOTO DO PROFESSOR ===================== */}
      <AnimatedModal
        isOpen={showProfessorCropModal}
        onClose={() => setShowProfessorCropModal(false)}
        maxWidth="max-w-md"
        className="p-6 space-y-4"
      >
        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Crop size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-navy-900 dark:text-white">
                Recortar Foto de Perfil (Circular)
              </h3>
              <p className="text-[11px] text-muted dark:text-slate-400">
                Ajuste o zoom e posição para sua foto circular no app e na web
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowProfessorCropModal(false)}
            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-navy-700 flex items-center justify-center text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Viewport de Crop Circular */}
        <div className="bg-slate-950 p-6 rounded-2xl flex items-center justify-center overflow-hidden min-h-[280px] relative">
          <div className="relative overflow-hidden w-56 h-56 rounded-full border-4 border-primary ring-8 ring-black/60 shadow-2xl flex items-center justify-center bg-black/90">
            <img
              src={profCropImageSrc}
              alt="Crop preview"
              className="max-w-none transition-transform duration-75 select-none pointer-events-none"
              style={{
                transform: `scale(${profCropZoom}) translate(${profCropOffsetX}px, ${profCropOffsetY}px)`,
                maxHeight: "100%"
              }}
            />
            {/* Guia Circular */}
            <div className="absolute inset-2 rounded-full border border-white/40 border-dashed pointer-events-none flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/80" />
            </div>
          </div>
        </div>

        {/* Controles de Zoom e Deslocamento */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-3">
            <ZoomOut size={16} className="text-slate-400" />
            <input
              type="range"
              min="1"
              max="2.5"
              step="0.05"
              value={profCropZoom}
              onChange={(e) => setProfCropZoom(Number(e.target.value))}
              className="flex-1 accent-primary cursor-pointer"
            />
            <ZoomIn size={16} className="text-slate-400" />
            <span className="text-xs font-bold text-navy-900 dark:text-white w-10 text-right">
              {Math.round(profCropZoom * 100)}%
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-muted dark:text-slate-400 pt-1">
            <span className="text-[11px]">Ajuste fino de enquadramento:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setProfCropOffsetY(profCropOffsetY - 8)}
                className="px-2 py-1 bg-slate-100 dark:bg-navy-700 rounded-lg font-bold hover:bg-slate-200"
                title="Mover para cima"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => setProfCropOffsetY(profCropOffsetY + 8)}
                className="px-2 py-1 bg-slate-100 dark:bg-navy-700 rounded-lg font-bold hover:bg-slate-200"
                title="Mover para baixo"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => setProfCropOffsetX(profCropOffsetX - 8)}
                className="px-2 py-1 bg-slate-100 dark:bg-navy-700 rounded-lg font-bold hover:bg-slate-200"
                title="Mover para a esquerda"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => setProfCropOffsetX(profCropOffsetX + 8)}
                className="px-2 py-1 bg-slate-100 dark:bg-navy-700 rounded-lg font-bold hover:bg-slate-200"
                title="Mover para a direita"
              >
                →
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfCropZoom(1);
                  setProfCropOffsetX(0);
                  setProfCropOffsetY(0);
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-navy-700 rounded-lg font-bold hover:bg-slate-200"
                title="Centralizar"
              >
                <RotateCcw size={11} /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setShowProfessorCropModal(false)}
            className="flex-1 py-2.5 rounded-full text-xs font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveCroppedProfAvatar}
            className="flex-1 py-2.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-sm transition-all"
          >
            Confirmar Recorte & Salvar
          </button>
        </div>
      </AnimatedModal>

      {/* ===================== MODAL DE MEUS DADOS ===================== */}
      <AnimatedModal
        isOpen={showPersonalDataModal}
        onClose={() => setShowPersonalDataModal(false)}
        className="p-5 space-y-4"
      >

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <User size={16} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">Meus Dados</h3>
                  <p className="text-[11px] text-muted dark:text-slate-400">Informações de identificação e contato</p>
                </div>
              </div>
              <button
                onClick={() => setShowPersonalDataModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-navy-700 flex items-center justify-center text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateInstructorProfile(activeInstructorId, {
                  name: editFullName,
                  displayName: editDisplayName,
                  birthDate: editBirthDate,
                  email: editEmail,
                  phone: editPhone
                });
                setShowPersonalDataModal(false);
                setProfileSuccessMsg("Dados cadastrais atualizados com sucesso!");
                setTimeout(() => setProfileSuccessMsg(null), 3000);
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-navy-900 dark:text-white">Nome Completo</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-navy-900 dark:text-white">Nome no App (Como as academias veem)</label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-navy-900 dark:text-white">Data de Nascimento</label>
                <input
                  type="date"
                  value={editBirthDate}
                  onChange={(e) => setEditBirthDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-navy-900 dark:text-white">E-mail</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-navy-900 dark:text-white">Celular / WhatsApp</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={editPhone}
                  onChange={(e) => setEditPhone(maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  required
                  className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPersonalDataModal(false)}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-sm transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>

            {/* Zona de Exclusão de Conta: Separada dos dados pessoais na parte inferior */}
            <div className="pt-4 mt-3 border-t border-slate-200 dark:border-navy-700">
              <div className="p-3.5 rounded-2xl bg-red-50/70 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 flex items-center justify-center shrink-0">
                    <Trash2 size={14} strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-red-600 block">
                      Excluir Minha Conta
                    </span>
                    <span className="text-[10px] text-red-500/80 dark:text-red-400/80 block leading-tight">
                      Exclusão permanente de dados cadastrais e histórico
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPersonalDataModal(false);
                    setDeleteConfirmChecked(false);
                    setShowDeleteAccountModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-300 dark:border-red-800 transition-colors shrink-0"
                >
                  Excluir
                </button>
              </div>
            </div>
      </AnimatedModal>

      {/* ===================== MODAL DE MEIOS DE RECEBIMENTO (PIX COM LISTAGEM E LIMPEZA DE CAMPOS) ===================== */}
      <AnimatedModal
        isOpen={showPixModal}
        onClose={() => setShowPixModal(false)}
        className="p-5 space-y-4"
      >

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <CreditCard size={16} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">Meios de Recebimento</h3>
                  <p className="text-[11px] text-muted dark:text-slate-400">Cadastre suas chaves Pix para repasses</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPixModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-navy-700 flex items-center justify-center text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Formulário para Adicionar Chave Pix */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-900/70 border border-slate-200/80 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold text-navy-900 dark:text-white block">Adicionar Nova Chave</span>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  1. Selecione o Tipo de Chave
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {(["cpf", "email", "phone", "aleatoria"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setEditPixType(type);
                        setEditPixKey("");
                        setEditBank("");
                      }}
                      className={`py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${
                        editPixType === type
                          ? "bg-primary text-white shadow-xs"
                          : "bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {type === "phone" ? "Celular" : type === "aleatoria" ? "Aleatória" : type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                  2. Digite a Chave ({editPixType.toUpperCase()})
                </label>
                <input
                  type={editPixType === "cpf" || editPixType === "phone" ? "tel" : editPixType === "email" ? "email" : "text"}
                  inputMode={editPixType === "cpf" || editPixType === "phone" ? "numeric" : undefined}
                  maxLength={editPixType === "cpf" ? 14 : editPixType === "phone" ? 15 : undefined}
                  value={editPixKey}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (editPixType === "cpf") {
                      setEditPixKey(maskCpf(raw));
                    } else if (editPixType === "phone") {
                      setEditPixKey(maskPhone(raw));
                    } else {
                      setEditPixKey(raw);
                    }
                  }}
                  placeholder={
                    editPixType === "cpf"
                      ? "000.000.000-00"
                      : editPixType === "email"
                      ? "seu.email@exemplo.com"
                      : editPixType === "phone"
                      ? "(27) 99999-0000"
                      : "f81d4fae-7dec-11d0-a765-00a0c91e6bf6"
                  }
                  className="w-full bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                  3. Instituição Financeira / Banco (opcional)
                </label>
                <input
                  type="text"
                  value={editBank}
                  onChange={(e) => setEditBank(e.target.value)}
                  placeholder="Ex: Nubank, Inter, Itaú, Banco do Brasil..."
                  className="w-full bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="chkDefaultPix"
                  checked={editPixIsDefault || pixList.length === 0}
                  onChange={(e) => setEditPixIsDefault(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <label htmlFor="chkDefaultPix" className="text-[11px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Definir como chave principal de repasse
                </label>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!editPixKey.trim()) return;
                  const isFirst = pixList.length === 0;
                  const willBeDefault = editPixIsDefault || isFirst;

                  const newKeyItem: PixKeyItem = {
                    id: "pix-" + Date.now(),
                    type: editPixType,
                    key: editPixKey.trim(),
                    bank: editBank.trim() || undefined,
                    isDefault: willBeDefault
                  };

                  let updated = pixList;
                  if (willBeDefault) {
                    updated = updated.map((k) => ({ ...k, isDefault: false }));
                  }
                  const finalList = [...updated, newKeyItem];
                  setPixList(finalList);

                  updateInstructorProfile(activeInstructorId, {
                    pixKeys: finalList,
                    pixKey: willBeDefault ? newKeyItem.key : currentInstructor.pixKey || newKeyItem.key,
                    bankInfo: {
                      bank: newKeyItem.bank || "Nubank",
                      agency: "0001",
                      account: "12345-6"
                    }
                  });

                  setEditPixKey("");
                  setEditBank("");
                  setEditPixIsDefault(false);
                  setProfileSuccessMsg("Nova chave Pix adicionada com sucesso!");
                  setTimeout(() => setProfileSuccessMsg(null), 3000);
                }}
                disabled={!editPixKey.trim()}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>Adicionar Chave à Lista</span>
              </button>
            </div>

            {/* Listagem de Chaves Pix Cadastradas */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-navy-900 dark:text-white">
                  Chaves Pix Cadastradas ({pixList.length})
                </span>
                <span className="text-[10px] text-muted dark:text-slate-400">
                  {pixList.length > 0 ? "Repasses na chave principal" : "Nenhuma chave"}
                </span>
              </div>

              {pixList.length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-muted dark:text-slate-400">
                  Cadastre sua primeira chave Pix acima para receber seus pagamentos.
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
                  {pixList.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        item.isDefault
                          ? "bg-primary-subtle/30 dark:bg-primary/10 border-primary/40 shadow-xs"
                          : "bg-slate-50 dark:bg-navy-900/40 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-navy-700 text-slate-700 dark:text-slate-300">
                              {item.type}
                            </span>
                            {item.isDefault && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                ★ Principal
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-black text-navy-900 dark:text-white mt-1 break-all">
                            {item.key}
                          </p>
                          {item.bank && (
                            <p className="text-[11px] text-muted dark:text-slate-400 mt-0.5 truncate">
                              {item.bank}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                          {!item.isDefault && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = pixList.map((k) => ({
                                  ...k,
                                  isDefault: k.id === item.id
                                }));
                                setPixList(updated);
                                updateInstructorProfile(activeInstructorId, {
                                  pixKeys: updated,
                                  pixKey: item.key
                                });
                                setProfileSuccessMsg(`Chave ${item.key} definida como principal!`);
                                setTimeout(() => setProfileSuccessMsg(null), 3000);
                              }}
                              className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-200 hover:bg-primary hover:text-white transition-colors"
                            >
                              Tornar Principal
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const updated = pixList.filter((k) => k.id !== item.id);
                              if (item.isDefault && updated.length > 0) {
                                updated[0].isDefault = true;
                              }
                              setPixList(updated);
                              updateInstructorProfile(activeInstructorId, {
                                pixKeys: updated,
                                pixKey: updated.find((k) => k.isDefault)?.key || updated[0]?.key || ""
                              });
                            }}
                            title="Remover chave"
                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowPixModal(false)}
                className="w-full py-2.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-sm transition-all"
              >
                Concluir
              </button>
            </div>
      </AnimatedModal>

      {/* ===================== MODAL DE MINHAS HABILIDADES (EXPANDIDO COM CATEGORIAS E BUSCA) ===================== */}
      <AnimatedModal
        isOpen={showSkillsModal}
        onClose={() => setShowSkillsModal(false)}
        className="p-5 space-y-4"
      >
        {(() => {
        const SKILL_CATEGORIES = [
          {
            category: "Musculação & Força",
            items: [
              "Musculação Tradicional",
              "Hipertrofia & Força",
              "Levantamento de Peso Olímpico (LPO)",
              "Calistenia & Treino Corporal"
            ]
          },
          {
            category: "Cardio, Ritmos & Aeróbica",
            items: [
              "Spinning / Ciclismo Indoor",
              "Corrida de Rua & Esteira",
              "Dança / Zumba",
              "Step & Aeróbica"
            ]
          },
          {
            category: "Condicionamento & Funcional",
            items: [
              "Treinamento Funcional",
              "Cross Training",
              "Treino Suspenso (TRX)",
              "Treinamento para Terceira Idade",
              "Treino Kids & Juvenil"
            ]
          },
          {
            category: "Mente, Postura & Flexibilidade",
            items: [
              "Pilates Solo (Mat)",
              "Pilates em Aparelhos",
              "Yoga & Consciência Corporal",
              "Alongamento & Mobilidade",
              "Reabilitação Postural"
            ]
          },
          {
            category: "Lutas & Artes Marciais",
            items: [
              "Boxe",
              "Muay Thai",
              "Jiu-Jitsu",
              "Judô"
            ]
          },
          {
            category: "Esportes & Aquáticas",
            items: [
              "Natação",
              "Hidroginástica",
              "Beach Tennis",
              "Futevôlei"
            ]
          }
        ];

        const query = skillsSearch.toLowerCase().trim();
        const filteredCategories = SKILL_CATEGORIES.map((cat) => ({
          ...cat,
          items: cat.items.filter((item) =>
            query ? item.toLowerCase().includes(query) : true
          )
        })).filter((cat) => cat.items.length > 0);

        const handleAddCustomSkill = (e: React.FormEvent) => {
          e.preventDefault();
          const trimmed = customSkillInput.trim();
          if (trimmed && !editModalities.includes(trimmed)) {
            setEditModalities([...editModalities, trimmed]);
            setCustomSkillInput("");
          }
        };

        const toggleSkill = (mod: string) => {
          setEditModalities((prev) =>
            prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
          );
        };

        return (
          <>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Dumbbell size={16} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-navy-900 dark:text-white">Minhas Habilidades</h3>
                    <p className="text-[11px] text-muted dark:text-slate-400">
                      {editModalities.length} modalidade(s) selecionada(s)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSkillsModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-navy-700 flex items-center justify-center text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Campo de Busca Rápida */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={skillsSearch}
                  onChange={(e) => setSkillsSearch(e.target.value)}
                  placeholder="Buscar modalidades (ex: Pilates, Spinning, Boxe...)"
                  className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              {/* Seção de Modalidades Selecionadas no Momento (Chips / Toasts Rápidos) */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-primary-subtle/30 dark:bg-primary/10 border border-primary/20">
                <span className="text-[11px] font-bold text-primary block">
                  Habilidades Selecionadas ({editModalities.length})
                </span>
                {editModalities.length === 0 ? (
                  <span className="text-[11px] text-muted dark:text-slate-400 block">
                    Nenhuma modalidade marcada. Selecione na lista abaixo:
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {editModalities.map((mod) => (
                      <span
                        key={mod}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary text-white shadow-xs"
                      >
                        <span>{mod}</span>
                        <button
                          type="button"
                          onClick={() => toggleSkill(mod)}
                          className="hover:bg-black/20 rounded-full p-0.5"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Lista Completa Categorizada com Checkboxes Visuais */}
              <div className="space-y-3.5 max-h-64 overflow-y-auto pr-0.5">
                {filteredCategories.map((cat) => (
                  <div key={cat.category} className="space-y-1.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted dark:text-slate-400 block px-1">
                      {cat.category}
                    </span>
                    <div className="space-y-1">
                      {cat.items.map((item) => {
                        const isSelected = editModalities.includes(item);
                        return (
                          <div
                            key={item}
                            onClick={() => toggleSkill(item)}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? "bg-white dark:bg-navy-700 border-primary shadow-xs font-bold text-navy-900 dark:text-white"
                                : "bg-slate-50/70 dark:bg-navy-900/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                            }`}
                          >
                            <span className="text-xs">{item}</span>
                            <div
                              className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? "bg-primary border-primary text-white"
                                  : "border-slate-300 dark:border-slate-600 bg-white dark:bg-navy-800"
                              }`}
                            >
                              {isSelected && <Check size={11} strokeWidth={3} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Adicionar Habilidade Personalizada */}
              <form onSubmit={handleAddCustomSkill} className="flex gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  placeholder="Outra modalidade personalizada..."
                  className="flex-1 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={!customSkillInput.trim()}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-navy-700 text-navy-900 dark:text-white hover:bg-primary hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  + Adicionar
                </button>
              </form>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSkillsModal(false)}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateInstructorProfile(activeInstructorId, { modalities: editModalities });
                    setShowSkillsModal(false);
                    setProfileSuccessMsg("Modalidades e habilidades atualizadas com sucesso!");
                    setTimeout(() => setProfileSuccessMsg(null), 3000);
                  }}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-sm transition-all"
                >
                  Salvar Habilidades
                </button>
              </div>
            </>
          );
        })()}
      </AnimatedModal>

      {/* ===================== MODAL DE DOCUMENTOS ===================== */}
      <AnimatedModal
        isOpen={showDocumentsModal}
        onClose={() => setShowDocumentsModal(false)}
        className="p-5 space-y-4"
      >

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <FileText size={16} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">Documentos Cadastrados</h3>
                  <p className="text-[11px] text-muted dark:text-slate-400">Certificados e identificação profissional</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDocumentsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-navy-700 flex items-center justify-center text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
              {/* Card de CREF Validado */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Registro Profissional CREF
                  </span>
                  <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full">
                    Ativo & Validado ✓
                  </span>
                </div>
                <p className="text-xs font-black text-navy-900 dark:text-white">{currentInstructor.cref}</p>
                <p className="text-[10px] text-muted dark:text-slate-400">Conselho Regional de Educação Física verificado</p>
              </div>

              {/* Card de Diploma de Graduação com Upload */}
              <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-primary/15 border border-blue-200/70 dark:border-primary/30 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Diploma de Graduação (Bacharelado)
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    professorDocuments.diploma?.status.includes("Auditado")
                      ? "bg-primary text-white"
                      : "bg-amber-500 text-white"
                  }`}>
                    {professorDocuments.diploma?.status || "Pendente"}
                  </span>
                </div>
                
                {professorDocuments.diploma ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-navy-900 border border-blue-100 dark:border-navy-800 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="text-primary shrink-0" strokeWidth={1.5} />
                      <div className="min-w-0">
                        <p className="font-bold text-navy-900 dark:text-white truncate text-[11px]">
                          {professorDocuments.diploma.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {professorDocuments.diploma.size} · PDF ou Imagem
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-medium text-slate-500">Nenhum diploma enviado ainda.</p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-muted dark:text-slate-400">
                    Limite máx: <strong>3 MB</strong> (PDF, JPG, PNG)
                  </span>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-white dark:bg-navy-800 text-primary border border-primary/40 hover:bg-primary hover:text-white transition-all shadow-2xs">
                    <Upload size={12} strokeWidth={1.5} />
                    <span>{professorDocuments.diploma ? "Atualizar Diploma" : "Enviar Diploma"}</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => handleDocumentUpload(e, "diploma")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Card de Certificados e Especializações com Upload */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Certificados & Cursos Adicionais
                  </span>
                  <span className="text-[10px] bg-slate-200 dark:bg-navy-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded-full">
                    {professorDocuments.certificates.length} anexados
                  </span>
                </div>

                <div className="space-y-1.5">
                  {professorDocuments.certificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={15} className="text-emerald-600 shrink-0" strokeWidth={1.5} />
                        <div className="min-w-0">
                          <p className="font-bold text-navy-900 dark:text-white truncate text-[11px]">
                            {cert.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {cert.size} · {cert.status}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setProfessorDocuments((prev) => ({
                            ...prev,
                            certificates: prev.certificates.filter((c) => c.id !== cert.id)
                          }));
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors ml-2"
                        title="Remover Certificado"
                      >
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-muted dark:text-slate-400">
                    Limite máx: <strong>3 MB</strong> por arquivo
                  </span>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-navy-700 hover:border-primary hover:text-primary transition-all shadow-2xs">
                    <Plus size={12} strokeWidth={1.5} />
                    <span>Novo Certificado</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => handleDocumentUpload(e, "certificate")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* CPF Editável */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-navy-900 dark:text-white">Número do CPF</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={14}
                  value={editCpf}
                  onChange={(e) => setEditCpf(maskCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-navy-900 dark:text-white focus:outline-none focus:border-primary"
                />
                <p className="text-[10px] text-muted">Contratação direta como profissional autônomo (Pessoa Física).</p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDocumentsModal(false)}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateInstructorProfile(activeInstructorId, { cpf: editCpf });
                    setShowDocumentsModal(false);
                    setProfileSuccessMsg("Documentos e dados salvos com sucesso!");
                    setTimeout(() => setProfileSuccessMsg(null), 3000);
                  }}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-sm transition-all"
                >
                  Salvar
                </button>
              </div>
            </div>
      </AnimatedModal>

      {/* ===================== MODAL DE NOTIFICAÇÕES GERAIS ===================== */}
      <AnimatedModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        className="p-5 space-y-4"
      >

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Bell size={16} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">Notificações Gerais</h3>
                  <p className="text-[11px] text-muted dark:text-slate-400">Configure seus alertas e canais</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNotificationsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-navy-700 flex items-center justify-center text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Toggle Push */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-navy-900 dark:text-white block">Notificações Push</span>
                  <span className="text-[11px] text-muted dark:text-slate-400">Alertas de novas vagas no celular</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.push}
                  onChange={(e) => setNotifications((prev) => ({ ...prev, push: e.target.checked }))}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </div>

              {/* Toggle WhatsApp */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-navy-900 dark:text-white block">Avisos via WhatsApp</span>
                  <span className="text-[11px] text-muted dark:text-slate-400">Convites urgentes e confirmações</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.whatsapp}
                  onChange={(e) => setNotifications((prev) => ({ ...prev, whatsapp: e.target.checked }))}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </div>

              {/* Toggle Email */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-navy-900 dark:text-white block">E-mails Informativos</span>
                  <span className="text-[11px] text-muted dark:text-slate-400">Resumo semanal e comprovantes</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) => setNotifications((prev) => ({ ...prev, email: e.target.checked }))}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNotificationsModal(false)}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateInstructorProfile(activeInstructorId, { notificationsEnabled: notifications });
                    setShowNotificationsModal(false);
                    setProfileSuccessMsg("Preferências de notificação atualizadas!");
                    setTimeout(() => setProfileSuccessMsg(null), 3000);
                  }}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-sm transition-all"
                >
                  Salvar Preferências
                </button>
              </div>
            </div>
      </AnimatedModal>

      {/* ===================== MODAL DE SELEÇÃO DE TEMA DO APLICATIVO ===================== */}
      <AnimatedModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        className="p-5 space-y-4"
      >

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  {isDarkMode ? <Moon size={16} strokeWidth={1.5} /> : <Sun size={16} strokeWidth={1.5} />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">Tema do Aplicativo</h3>
                  <p className="text-[11px] text-muted dark:text-slate-400">Escolha a aparência visual do app</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowThemeModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-navy-700 flex items-center justify-center text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {/* Opção Modo Claro */}
              <div
                onClick={() => {
                  if (isDarkMode) toggleDarkMode();
                }}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  !isDarkMode
                    ? "border-primary bg-primary-subtle/30 dark:bg-primary/10 shadow-xs"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-navy-900/60 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                    <Sun size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-navy-900 dark:text-white block">Modo Claro</span>
                    <span className="text-[11px] text-muted dark:text-slate-400 block">
                      Fundo claro, ideal para o dia a dia
                    </span>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    !isDarkMode ? "border-primary bg-primary text-white" : "border-slate-300 dark:border-slate-600"
                  }`}
                >
                  {!isDarkMode && <Check size={12} strokeWidth={3} />}
                </div>
              </div>

              {/* Opção Modo Escuro */}
              <div
                onClick={() => {
                  if (!isDarkMode) toggleDarkMode();
                }}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  isDarkMode
                    ? "border-primary bg-primary-subtle/30 dark:bg-primary/10 shadow-xs"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-navy-900/60 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-900/80 text-indigo-300 flex items-center justify-center shadow-xs">
                    <Moon size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-navy-900 dark:text-white block">Modo Escuro</span>
                    <span className="text-[11px] text-muted dark:text-slate-400 block">
                      Fundo escuro, conforto visual e economia de bateria
                    </span>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isDarkMode ? "border-primary bg-primary text-white" : "border-slate-300 dark:border-slate-600"
                  }`}
                >
                  {isDarkMode && <Check size={12} strokeWidth={3} />}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowThemeModal(false)}
                className="w-full py-2.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-sm transition-all"
              >
                Pronto
              </button>
            </div>
      </AnimatedModal>

      {/* ===================== SIMULADOR DE PUSH NOTIFICATION FLUTUANTE ===================== */}
      {pushToast && (
        <div className="fixed top-3 left-4 right-4 max-w-md mx-auto z-50 animate-bounce">
          <div className="bg-navy-950/95 dark:bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-floating border border-white/20 backdrop-blur-md flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white font-black text-xs shadow-xs">
              <Bell size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-primary-light tracking-wider">
                  {pushToast.type === "proposta" ? "Nova Proposta Recebida" : "Aula Confirmada"}
                </span>
                <span className="text-[10px] text-slate-400">{pushToast.time}</span>
              </div>
              <h4 className="text-xs font-black text-white mt-0.5 truncate">{pushToast.title}</h4>
              <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-tight">{pushToast.body}</p>
            </div>
            <button
              type="button"
              onClick={() => setPushToast(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ===================== MODAL DE VISÃO GERAL DO MÊS ===================== */}
      <AnimatedModal
        isOpen={showMonthOverviewModal}
        onClose={() => setShowMonthOverviewModal(false)}
        className="p-5 space-y-4"
      >
        <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Calendar size={16} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy-900 dark:text-white">Visão Geral do Mês</h3>
              <p className="text-[11px] text-muted dark:text-slate-400">
                {MONTH_NAMES[selectedMonth - 1]} de {selectedYear}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowMonthOverviewModal(false)}
            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-navy-700 flex items-center justify-center text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* 3 Métricas em destaque */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 p-3 rounded-2xl">
            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 block uppercase tracking-tight flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Livres
            </span>
            <span className="text-lg font-black text-emerald-800 dark:text-emerald-300 mt-0.5 block">
              {monthAvailableDaysCount}
            </span>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400/80 font-semibold">dias livres</span>
          </div>

          <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 p-3 rounded-2xl">
            <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-400 block uppercase tracking-tight flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Contratadas
            </span>
            <span className="text-lg font-black text-blue-800 dark:text-blue-300 mt-0.5 block">
              {monthConfirmedDaysCount}
            </span>
            <span className="text-[9px] text-blue-600 dark:text-blue-400/80 font-semibold">
              {monthConfirmedDaysCount === 1 ? "aula" : "aulas"}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-navy-900/60 border border-slate-200/60 dark:border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 block uppercase tracking-tight flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> Folgas
            </span>
            <span className="text-lg font-black text-slate-700 dark:text-slate-300 mt-0.5 block">
              {monthOffDaysCount}
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold">dias folga</span>
          </div>
        </div>

        {/* Legenda dos Marcadores no Calendário */}
        <div className="bg-slate-50 dark:bg-navy-900/40 rounded-2xl p-3 border border-slate-100 dark:border-slate-800 space-y-2">
          <span className="text-[11px] font-extrabold text-navy-900 dark:text-white block">
            Marcadores no Calendário
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span>Aula Contratada</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>Disponível</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>Aula Cancelada</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
              <span>Folga / Indisponível</span>
            </div>
          </div>
        </div>

        {/* Botão de Ajustar Grade Semanal */}
        <div className="pt-1 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setShowMonthOverviewModal(false);
              setAgendaSubTab("grade");
            }}
            className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-bold py-3 rounded-full shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Clock size={14} strokeWidth={1.5} />
            <span>Ajustar Grade Semanal</span>
          </button>
        </div>
      </AnimatedModal>

      {/* ===================== MODAL DE CALENDÁRIO (ANOS & 12 MESES) ===================== */}
      <AnimatedModal
        isOpen={showCalendarYearModal}
        onClose={() => setShowCalendarYearModal(false)}
        className="p-5 space-y-4"
      >

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Calendar size={16} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">Calendário</h3>
                  <p className="text-[11px] text-muted dark:text-slate-400">Selecione o mês para navegar pela agenda</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCalendarYearModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-navy-700 flex items-center justify-center text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Seletor de Ano com Avanço e Retorno: < 2026 > */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setNavYear(navYear - 1)}
                className="p-1.5 rounded-xl bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
                title="Ano Anterior"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="text-center">
                <span className="text-[10px] text-muted dark:text-slate-400 uppercase tracking-wider font-extrabold block">
                  Ano Selecionado
                </span>
                <span className="text-lg font-black text-navy-900 dark:text-white">
                  {navYear}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setNavYear(navYear + 1)}
                className="p-1.5 rounded-xl bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
                title="Próximo Ano"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Grid dos 12 Meses do Ano */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-muted dark:text-slate-400 block px-1">
                Escolha o mês:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {MONTH_NAMES.map((mName, mIdx) => {
                  const mNum = mIdx + 1;
                  const isCurrentSelection = selectedYear === navYear && selectedMonth === mNum;
                  const isPast = navYear < 2026 || (navYear === 2026 && mNum < 11);
                  const isFuture = navYear > 2026 || (navYear === 2026 && mNum > 11);

                  return (
                    <button
                      key={mName}
                      type="button"
                      onClick={() => {
                        setSelectedYear(navYear);
                        setSelectedMonth(mNum);
                        const isNowCurrent = (navYear === currentTodayYear && mNum === currentTodayMonth) || (navYear === 2026 && mNum === 11);
                        setSelectedDayNumber(isNowCurrent ? currentTodayDay : null);
                        setShowCalendarYearModal(false);
                      }}
                      className={`p-3 rounded-2xl flex flex-col items-center justify-center text-xs font-black transition-all ${
                        isCurrentSelection
                          ? "bg-primary text-white shadow-md scale-102"
                          : "bg-slate-50 dark:bg-navy-900/60 text-navy-900 dark:text-white hover:bg-slate-100 dark:hover:bg-navy-700 border border-slate-200/60 dark:border-slate-700/60"
                      }`}
                    >
                      <span>{mName.slice(0, 3)}</span>
                      <span className={`text-[9px] font-semibold mt-0.5 ${
                        isCurrentSelection
                          ? "text-white/80"
                          : isPast
                          ? "text-slate-400 dark:text-slate-500"
                          : isFuture
                          ? "text-primary dark:text-primary-light"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {isCurrentSelection ? "Selecionado" : isPast ? "Histórico" : isFuture ? "Futuro" : "Atual"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedYear(2026);
                  setSelectedMonth(11);
                  setSelectedDayNumber(currentTodayDay);
                  setShowCalendarYearModal(false);
                }}
                className="w-full py-2.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors"
              >
                Voltar para o Mês Atual (Nov/2026)
              </button>
            </div>
      </AnimatedModal>

      {/* ===================== MODAL DE ARQUITETURA DE NOTIFICAÇÕES (PUSH & EMAIL) ===================== */}
      <AnimatedModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        className="p-5 space-y-4"
      >

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Bell size={16} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">Push & E-mails Automáticos</h3>
                  <p className="text-[11px] text-muted dark:text-slate-400">Como funciona o envio de alertas no app</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNotificationModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-navy-700 flex items-center justify-center text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Abas da Modal: Push vs Email */}
            <div className="flex bg-slate-100 dark:bg-navy-900 p-1 rounded-2xl text-xs font-bold border border-slate-200/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setNotificationModalTab("push")}
                className={`flex-1 py-1.5 rounded-xl transition-all ${
                  notificationModalTab === "push"
                    ? "bg-white dark:bg-navy-800 text-primary shadow-xs font-black"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                📱 Push no Celular
              </button>
              <button
                type="button"
                onClick={() => setNotificationModalTab("email")}
                className={`flex-1 py-1.5 rounded-xl transition-all ${
                  notificationModalTab === "email"
                    ? "bg-white dark:bg-navy-800 text-primary shadow-xs font-black"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                ✉️ E-mails Transacionais
              </button>
            </div>

            {/* CONTEÚDO 1: PUSH NOTIFICATION NO CELULAR */}
            {notificationModalTab === "push" && (
              <div className="space-y-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 space-y-2">
                  <h4 className="font-black text-navy-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Sparkles size={14} className="text-primary" /> Como funciona o Push no Celular?
                  </h4>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                    Tanto no aplicativo nativo (iOS/Android) quanto em Progressive Web App (PWA), o celular registra um <strong>Token de Dispositivo</strong> exclusivo.
                  </p>
                  <ol className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-decimal list-inside">
                    <li><strong>Service Worker / FCM:</strong> Escuta eventos em background mesmo com a tela bloqueada.</li>
                    <li><strong>Gatilho de Proposta:</strong> Quando a academia envia uma oferta, o backend aciona a API do Firebase (FCM v1) ou Apple (APNs).</li>
                    <li><strong>Notificação Imediata:</strong> Um banner aparece na barra de notificações com som, vibração e atalho para abrir direto a proposta.</li>
                  </ol>
                </div>

                {/* Botões de Simulação em Tempo Real */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-navy-900 dark:text-white block uppercase tracking-wider">
                    Testar Simulação no Protótipo:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotificationModal(false);
                      setPushToast({
                        title: "Academia Mova enviou uma proposta!",
                        body: "Musculação · 06/11 das 07:00 às 10:00 · R$ 50/h. Toque para responder dentro de 60 min.",
                        time: "Agora",
                        type: "proposta"
                      });
                      setTimeout(() => setPushToast(null), 5000);
                    }}
                    className="w-full py-2.5 px-3 rounded-2xl bg-navy-900 hover:bg-navy-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                  >
                    <Bell size={13} className="text-primary-light" />
                    <span>Simular Push: "Nova Proposta de Aula"</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowNotificationModal(false);
                      setPushToast({
                        title: "Aula Confirmada na sua Agenda! 🎉",
                        body: "Smart Fit confirmou sua aula de Spinning para amanhã às 18h. Contatos liberados.",
                        time: "Agora",
                        type: "confirmacao"
                      });
                      setTimeout(() => setPushToast(null), 5000);
                    }}
                    className="w-full py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                  >
                    <CheckCheck size={13} />
                    <span>Simular Push: "Aula Confirmada"</span>
                  </button>
                </div>
              </div>
            )}

            {/* CONTEÚDO 2: ENVIO DE E-MAILS TRANSACIONAIS */}
            {notificationModalTab === "email" && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <h4 className="font-black text-navy-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Mail size={14} className="text-primary" /> Arquitetura de E-mails Transacionais
                  </h4>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                    Utilizamos provedores de alta entregabilidade (<strong>Resend, SendGrid ou Amazon SES</strong>) com templates HTML modernos desenvolvidos em <strong>React Email</strong>.
                  </p>
                  <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                    <li><strong>Proposta Recebida:</strong> E-mail com resumo financeiro, dia/hora e botão Magic Link com 1 toque.</li>
                    <li><strong>Confirmação de Aceite:</strong> Comprovante contendo telefone do gestor e dados completos do turno.</li>
                    <li><strong>Aviso de Expiração:</strong> Alerta preventivo 15 minutos antes de a proposta expirar.</li>
                  </ul>
                </div>

                {/* Preview de Template de E-mail */}
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-900 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black">
                        T
                      </div>
                      <span className="font-extrabold text-[11px] text-navy-900 dark:text-white">Trainer App</span>
                    </div>
                    <span className="text-[10px] text-muted dark:text-slate-400">contato@trainerapp.com.br</span>
                  </div>
                  <div className="space-y-1 pt-1">
                    <span className="font-black text-xs text-navy-900 dark:text-white block">
                      Nova proposta de contratação de R$ 50/h
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Olá Lucas Ferreira, a <strong>Academia Mova</strong> selecionou seu perfil para uma aula de <strong>Musculação</strong> na próxima sexta-feira.
                    </p>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-navy-800 text-[10px] space-y-0.5 border border-slate-100 dark:border-slate-700">
                      <div><strong>Data:</strong> 06 de Novembro de 2026</div>
                      <div><strong>Horário:</strong> 07:00 às 10:00 (3h)</div>
                      <div><strong>Remuneração:</strong> R$ 150,00 total</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowNotificationModal(false)}
                className="w-full py-2.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors"
              >
                Fechar
              </button>
            </div>
      </AnimatedModal>

      {/* ===================== BARRA DE NAVEGAÇÃO INFERIOR ===================== */}
      <nav aria-label="Navegação do Professor" className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card/95 dark:bg-navy-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 px-6 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex justify-between items-center z-40 transition-colors duration-200">
        <button
          onClick={() => setActiveTab("inicio")}
          className={`flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
            activeTab === "inicio" ? "text-primary font-bold" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          <MapPin size={18} />
          Início
        </button>

        <button
          onClick={() => setActiveTab("propostas")}
          className={`flex flex-col items-center gap-1 text-xs font-semibold relative transition-colors ${
            activeTab === "propostas" ? "text-primary font-bold" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          <div className="relative">
            <Send size={18} strokeWidth={1.5} />
            {openProposals.length > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-navy-900 animate-pulse">
                {openProposals.length}
              </span>
            )}
          </div>
          <span>Propostas</span>
        </button>

        <button
          onClick={() => setActiveTab("agenda")}
          className={`flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
            activeTab === "agenda" ? "text-primary font-bold" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          <Calendar size={18} />
          Agenda
        </button>

        <button
          onClick={() => setActiveTab("perfil")}
          className={`flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
            activeTab === "perfil" ? "text-primary font-bold" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          <User size={18} />
          Perfil
        </button>
      </nav>

      {/* Modal de Onboarding em Tela Cheia (3 Passos) */}
      <OnboardingModal
        role="professor"
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      {/* ===================== MODAL DE EXCLUIR CONTA DEFINITIVAMENTE ===================== */}
      <AnimatedModal
        isOpen={showDeleteAccountModal}
        onClose={() => {
          if (!isDeletingAccount) setShowDeleteAccountModal(false);
        }}
        maxWidth="max-w-md"
        className="p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center shrink-0">
            <Trash2 size={20} strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-navy-900 dark:text-white">
              Excluir Conta Definitivamente
            </h3>
            <p className="text-xs text-muted dark:text-slate-400 mt-0.5">
              Esta ação removerá permanentemente seu cadastro
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300 space-y-2 leading-relaxed">
          <p className="font-bold flex items-center gap-1.5">
            <AlertCircle size={15} className="shrink-0 text-red-600" />
            Aviso Importante: A exclusão é permanente e irreversível!
          </p>
          <p>
            Todos os seus dados cadastrais, CREF, chaves Pix, disponibilidade de horários e histórico de aulas serão apagados do sistema de forma irrecuperável.
          </p>
          <p className="font-medium">
            Se você decidir voltar a utilizar o aplicativo no futuro, <strong>deverá realizar um novo cadastro do zero</strong>.
          </p>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 select-none pt-1">
          <input
            type="checkbox"
            checked={deleteConfirmChecked}
            onChange={(e) => setDeleteConfirmChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
          />
          <span>
            Estou ciente de que a exclusão é permanente e desejo apagar minha conta agora.
          </span>
        </label>

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            disabled={isDeletingAccount}
            onClick={() => setShowDeleteAccountModal(false)}
            className="flex-1 py-2.5 px-4 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-navy-700 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!deleteConfirmChecked || isDeletingAccount}
            onClick={async () => {
              setIsDeletingAccount(true);
              await deleteAccount();
              setIsDeletingAccount(false);
              setShowDeleteAccountModal(false);
            }}
            className="flex-1 py-2.5 px-4 rounded-full text-xs font-black bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            {isDeletingAccount ? (
              <span>Excluindo...</span>
            ) : (
              <>
                <Trash2 size={13} />
                <span>Sim, Excluir Conta</span>
              </>
            )}
          </button>
        </div>
      </AnimatedModal>

      {/* ===================== MODAL: MINHA NOTA & AVALIAÇÕES ===================== */}
      <AnimatedModal
        isOpen={showRatingModal}
        onClose={() => {
          setIsRatingExpanded(false);
          setShowRatingModal(false);
        }}
        maxWidth="max-w-md"
        isExpanded={isRatingExpanded}
        onToggleExpand={setIsRatingExpanded}
        className={`p-0 overflow-hidden flex flex-col ${isRatingExpanded ? "h-[98dvh]" : "h-auto"}`}
      >
        {/* Header Fixo - Sempre Visível no Topo */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-card dark:bg-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
              <Star size={18} strokeWidth={2} className="fill-amber-500" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-navy-900 dark:text-white leading-tight">
                Minha Nota & Avaliações
              </h3>
              <p className="text-[11px] text-muted dark:text-slate-400">
                Critérios de desempenho avaliados pelas academias
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsRatingExpanded(false);
              setShowRatingModal(false);
            }}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-700 text-slate-500 hover:text-navy-900 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Corpo com Rolagem Interna Suave */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 overscroll-contain">
          {currentInstructor.ratingCount > 0 ? (
            <div className="space-y-3.5">
              {/* Placar de Nota */}
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-4 sm:p-5 text-center shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="inline-flex items-center gap-1.5 bg-black/20 px-3 py-0.5 rounded-full text-[11px] font-bold text-amber-100 mb-1.5">
                  <Sparkles size={12} />
                  <span>Média Geral Consolidada</span>
                </div>
                <div className="text-3xl sm:text-4xl font-black tracking-tight flex items-center justify-center gap-2">
                  <Star size={28} className="fill-white text-white" strokeWidth={1.5} />
                  <span>{currentInstructor.rating.toFixed(1)}</span>
                </div>
                <p className="text-[11px] text-amber-100 mt-1 font-medium">
                  Baseado em {currentInstructor.ratingCount} {currentInstructor.ratingCount === 1 ? "avaliação recebida" : "avaliações recebidas"} de academias contratantes
                </p>
              </div>

              {/* Índice de Recontratação */}
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                <ThumbsUp className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.5} />
                <span>
                  <strong>{currentInstructor.wouldHireAgainRate ?? 98}%</strong> das academias contratariam você novamente
                </span>
              </div>

              {/* Elogios e Qualidades de Destaque */}
              {currentInstructor.badges && currentInstructor.badges.length > 0 && (
                <div className="bg-slate-50 dark:bg-navy-900/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-extrabold text-navy-900 dark:text-white uppercase tracking-wider">
                    Elogios e Qualidades Reconhecidas
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentInstructor.badges.map((b: string, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                        <span>{b}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Barras de Critérios (3 Pilares) */}
              <div className="bg-slate-50 dark:bg-navy-900/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-2.5">
                <h4 className="text-xs font-extrabold text-navy-900 dark:text-white uppercase tracking-wider">
                  Desempenho nos 3 Pilares
                </h4>
                <HorizontalBars criteria={currentInstructor.criteria} type="professor" />
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-primary/10 border border-blue-200/60 dark:border-primary/20 text-[11px] text-primary leading-relaxed flex items-start gap-2">
                <ShieldCheck size={15} className="shrink-0 mt-0.5" strokeWidth={1.5} />
                <span>
                  <strong>Como manter sua nota alta:</strong> Mantenha a pontualidade, confirme presenças no início da aula e mantenha excelente atendimento aos alunos.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Card de Novo Usuário */}
              <div className="bg-gradient-to-br from-primary to-blue-700 text-white rounded-2xl p-4 sm:p-5 text-center shadow-md relative overflow-hidden">
                <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-0.5 rounded-full text-[11px] font-bold text-blue-100 mb-1.5">
                  <Sparkles size={12} strokeWidth={1.5} />
                  <span>Novo Professor Cadastrado</span>
                </div>
                <div className="text-xl sm:text-2xl font-black tracking-tight">
                  Ainda Sem Avaliações
                </div>
                <p className="text-xs text-blue-100 mt-1.5 leading-relaxed">
                  Você começou recentemente! Nenhuma nota pública foi calculada ainda. Para as academias, seu perfil aparece destacado com o selo <strong>Novo Usuário</strong>.
                </p>
              </div>

              {/* Como funciona o sistema de notas */}
              <div className="bg-slate-50 dark:bg-navy-900/60 rounded-2xl p-3.5 sm:p-4 border border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <h4 className="text-xs font-extrabold text-navy-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-primary" strokeWidth={1.5} />
                  Como sua nota será construída:
                </h4>
                <ul className="space-y-1.5 text-[11px] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">1</span>
                    <span><strong>Conclua suas primeiras aulas:</strong> Candidate-se a vagas e realize os turnos na unidade.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">2</span>
                    <span><strong>Check-in validado:</strong> A academia valida sua presença no início e término do turno.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">3</span>
                    <span><strong>Avaliação por 3 pilares objetivos:</strong> Pontualidade & Presença, Domínio Técnico & Segurança e Postura & Atendimento.</span>
                  </li>
                </ul>
              </div>

              {/* Dica de início rápido */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                💡 <strong>Dica de início rápido:</strong> Pontualidade e comunicação são os fatores mais valorizados pelas academias para recontratações diretas.
              </div>
            </div>
          )}
        </div>

        {/* Footer Fixo (Sticky) - SEMPRE VISÍVEL na tela */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-card dark:bg-navy-800 shrink-0">
          <button
            type="button"
            onClick={() => setShowRatingModal(false)}
            className="w-full py-2.5 px-4 rounded-full text-xs font-bold bg-primary hover:bg-primary-hover active:scale-95 text-white shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Check size={14} />
            <span>Entendi</span>
          </button>
        </div>
      </AnimatedModal>

      {/* ===================== MODAL: MAPA DE OPORTUNIDADES & RAIO AMPLIADO ===================== */}
      <AnimatedModal
        isOpen={showMapModal}
        onClose={() => {
          setIsMapExpanded(false);
          setShowMapModal(false);
        }}
        maxWidth="max-w-md"
        isExpanded={isMapExpanded}
        onToggleExpand={setIsMapExpanded}
        className={`p-0 overflow-hidden flex flex-col ${isMapExpanded ? "h-[98dvh]" : "h-auto"}`}
      >
        {/* Header Fixo - Sempre Visível no Topo */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-card dark:bg-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-primary flex items-center justify-center shrink-0">
              <Compass size={18} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-navy-900 dark:text-white leading-tight">
                Mapa de Oportunidades
              </h3>
              <p className="text-[11px] text-muted dark:text-slate-400">
                Ajuste o raio de busca geográfica
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsMapExpanded(false);
              setShowMapModal(false);
            }}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-700 text-slate-500 hover:text-navy-900 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Corpo com Rolagem Interna Suave */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 overscroll-contain">
          {/* Controle de Raio Compacto e Touch-friendly */}
          <div className="bg-slate-50 dark:bg-navy-900/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-navy-900 dark:text-white">
                <Sliders size={14} className="text-primary" />
                <span>Raio de Proximidade:</span>
              </div>
              <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                {searchRadiusKm} km
              </span>
            </div>

            {/* Slider Contínuo de 5km a 100km */}
            <div className="space-y-1">
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={searchRadiusKm}
                onChange={(e) => setSearchRadiusKm(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-navy-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted dark:text-slate-400 font-bold">
                <span>5 km</span>
                <span>25 km</span>
                <span>50 km</span>
                <span>100 km (Máx)</span>
              </div>
            </div>

            {/* Pílulas de Seleção Rápida */}
            <div className="grid grid-cols-5 gap-1.5 pt-0.5">
              {[5, 10, 25, 50, 100].map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => setSearchRadiusKm(km)}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all text-center ${
                    searchRadiusKm === km
                      ? "bg-primary text-white shadow-xs"
                      : "bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary/50"
                  }`}
                >
                  {km}km
                </button>
              ))}
            </div>
          </div>

          {/* Mapa Visual Responsivo */}
          <div className={`relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner ${isMapExpanded ? "h-60 sm:h-72" : "h-44 sm:h-48"} transition-all duration-300 bg-slate-100 dark:bg-navy-950 flex items-center justify-center`}>
            <iframe
              title="Mapa de Vagas"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                -40.3128 - 0.012 * searchRadiusKm
              },${
                -20.3155 - 0.009 * searchRadiusKm
              },${
                -40.3128 + 0.012 * searchRadiusKm
              },${
                -20.3155 + 0.009 * searchRadiusKm
              }&layer=mapnik&marker=-20.3155,-40.3128`}
              className="w-full h-full border-0 contrast-125 opacity-90 dark:opacity-75"
              loading="lazy"
            />

            {/* Marcador Central e Pulso Radar */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="rounded-full border-2 border-primary bg-primary/15 transition-all duration-300 pointer-events-none"
                style={{
                  width: `${Math.min(190, 48 + (searchRadiusKm / 100) * 130)}px`,
                  height: `${Math.min(190, 48 + (searchRadiusKm / 100) * 130)}px`
                }}
              />
              <div className="absolute flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-xl ring-4 ring-white dark:ring-navy-900 animate-bounce">
                  <MapPin size={16} />
                </div>
                <span className="text-[10px] font-black text-navy-900 dark:text-white mt-1 bg-white/95 dark:bg-navy-900/95 px-2 py-0.5 rounded-full shadow-md border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                  Você ({searchRadiusKm} km)
                </span>
              </div>
            </div>

            {/* Badge flutuante de contagem */}
            <div className="absolute top-2.5 left-2.5 bg-navy-950/85 backdrop-blur-md text-white text-[10px] font-bold py-1 px-2.5 rounded-full shadow-md flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{filteredShifts.length} {filteredShifts.length === 1 ? "vaga no raio" : "vagas no raio"}</span>
            </div>
          </div>

          {/* Academias Encontradas no Raio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-navy-900 dark:text-white uppercase tracking-wider">
                Academias no Raio de {searchRadiusKm} km
              </h4>
              <span className="text-[10px] text-muted dark:text-slate-400 font-bold">
                {gyms.filter((g) => getGymDistanceKm(g.id) <= searchRadiusKm).length} encontrada(s)
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-navy-900/40">
              {(() => {
                const gymsInRadius = gyms
                  .map((gym) => ({
                    gym,
                    distance: getGymDistanceKm(gym.id),
                    shiftsCount: shifts.filter((s) => s.gymId === gym.id && s.status === "aberto").length
                  }))
                  .filter((item) => item.distance <= searchRadiusKm)
                  .sort((a, b) => a.distance - b.distance);

                if (gymsInRadius.length === 0) {
                  return (
                    <div className="p-4 text-center text-xs text-muted dark:text-slate-400 space-y-1">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        Nenhuma academia cadastrada a menos de {searchRadiusKm} km.
                      </p>
                      <p className="text-[11px]">
                        Aumente o raio para 25 km ou 50 km para expandir sua busca.
                      </p>
                    </div>
                  );
                }

                return gymsInRadius.map(({ gym, distance, shiftsCount }) => (
                  <div key={gym.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-navy-800 flex items-center justify-center shrink-0">
                        <Building2 size={15} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-navy-900 dark:text-white truncate">{gym.name}</p>
                        <p className="text-[11px] text-muted dark:text-slate-400 truncate">
                          {gym.neighborhood || gym.city} · <strong>{distance.toFixed(1)} km</strong>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {shiftsCount} {shiftsCount === 1 ? "vaga" : "vagas"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMapModal(false);
                          setActiveTab("inicio");
                        }}
                        className="text-primary hover:text-primary-hover font-bold text-xs"
                      >
                        Ver →
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Nota de Produção Compacta */}
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-primary/10 border border-blue-200/50 dark:border-primary/20 text-[10px] text-primary/90 dark:text-blue-300 leading-relaxed flex items-start gap-2">
            <ShieldCheck size={14} className="shrink-0 mt-0.5" />
            <span>
              <strong>Em produção:</strong> A localização é obtida diretamente pelo GPS nativo do celular com mapas OpenStreetMap, permitindo busca em até 100 km sem custos de API.
            </span>
          </div>
        </div>

        {/* Footer Fixo (Sticky) - SEMPRE VISÍVEL na tela */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-card dark:bg-navy-800 shrink-0">
          <button
            type="button"
            onClick={() => setShowMapModal(false)}
            className="w-full py-2.5 px-4 rounded-full text-xs font-bold bg-primary hover:bg-primary-hover active:scale-95 text-white shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Check size={14} />
            <span>Aplicar Raio de {searchRadiusKm} km ({filteredShifts.length} {filteredShifts.length === 1 ? "vaga" : "vagas"})</span>
          </button>
        </div>
      </AnimatedModal>

      {/* ===================== MODAL DE DETALHES DA ACADEMIA (3 PILARES & BADGES) ===================== */}
      {selectedGymDetail && (
        <AnimatedModal
          isOpen={Boolean(selectedGymDetail)}
          onClose={() => setSelectedGymDetail(null)}
          maxWidth="max-w-md"
          className="p-5 space-y-4 max-h-[88vh] overflow-y-auto"
          showHandle={true}
          align="bottom"
          ariaLabel="Detalhes da Academia"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 shadow-sm shrink-0">
                {selectedGymDetail.logo ? (
                  <img
                    src={selectedGymDetail.logo}
                    alt={selectedGymDetail.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                    <Building2 className="w-6 h-6 text-primary" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-navy-900 dark:text-white text-base truncate">
                  {selectedGymDetail.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {selectedGymDetail.neighborhood} · {selectedGymDetail.city}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedGymDetail(null)}
              type="button"
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Placar de Avaliação da Academia */}
          <div className="bg-slate-50 dark:bg-navy-900/60 p-4 rounded-2xl border border-slate-100 dark:border-navy-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-amber-500 font-extrabold text-lg">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" strokeWidth={1.5} />
                  <span>{selectedGymDetail.rating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  ({selectedGymDetail.ratingCount || 0} avaliações de professores)
                </span>
              </div>
            </div>

            {/* Selo de Recomendação */}
            <div className="flex items-center gap-2 pt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <ThumbsUp className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.5} />
              <span>
                <strong>{selectedGymDetail.wouldRecommendRate ?? 98}%</strong> dos professores recomendam esta academia
              </span>
            </div>
          </div>

          {/* Desempenho nos 3 Pilares da Academia */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Avaliação dos 3 Pilares da Unidade
            </h4>
            <div className="p-3.5 bg-white dark:bg-navy-900 rounded-2xl border border-slate-100 dark:border-navy-800 shadow-xs">
              <HorizontalBars criteria={selectedGymDetail.criteria} type="gym" />
            </div>
          </div>

          {/* Qualidades e Elogios de Professores */}
          {selectedGymDetail.badges && selectedGymDetail.badges.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Destaques & Qualidades
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedGymDetail.badges.map((b: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                    <span>{b}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Endereço Completo */}
          {selectedGymDetail.address && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-900/40 border border-slate-100 dark:border-navy-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>{selectedGymDetail.address}</span>
            </div>
          )}

          {/* Close button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setSelectedGymDetail(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-navy-900 dark:text-white font-bold text-xs transition"
            >
              Fechar Detalhes
            </button>
          </div>
        </AnimatedModal>
      )}

      {/* ===================== MODAL DE AVALIAÇÃO DA ACADEMIA (PÓS-TURNO) ===================== */}
      {reviewGymShift && (
        <ReviewModal
          isOpen={Boolean(reviewGymShift)}
          onClose={() => setReviewGymShift(null)}
          type="instructor_reviews_gym"
          targetName={reviewGymShift.gym.name}
          targetAvatarOrLogo={reviewGymShift.gym.logo}
          shiftTitle={reviewGymShift.shift.title}
          shiftDateFormatted={reviewGymShift.shift.dateFormatted || reviewGymShift.shift.date}
          onSubmit={(data) => {
            submitGymReview(
              reviewGymShift.shift.id,
              reviewGymShift.gym.id,
              data.rating,
              data.criteria as any,
              data.badges,
              data.recommend,
              data.comment
            );
          }}
        />
      )}

      {/* ===================== MODAL DE CANCELAMENTO DE AULA ===================== */}
      <CancelShiftModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setShiftToCancel(null);
        }}
        shift={shiftToCancel}
        role="professor"
        userName={rawInstructor.name}
        counterpartName={gyms.find((g) => g.id === shiftToCancel?.gymId)?.name || "Academia"}
        onConfirmCancel={async (reason) => {
          if (!shiftToCancel) return;
          await cancelShift(shiftToCancel.id, "professor", reason, rawInstructor.name);
        }}
      />

      <AnimatedModal
        isOpen={showOfferSlotWizard}
        onClose={() => setShowOfferSlotWizard(false)}
        maxWidth="max-w-lg"
        className="p-5 sm:p-6"
      >
        {(() => {
          const parseHours = (start: string, end: string) => {
            const [sh, sm] = (start || "07:00").split(":").map(Number);
            const [eh, em] = (end || "12:00").split(":").map(Number);
            const startMins = (sh || 0) * 60 + (sm || 0);
            const endMins = (eh || 0) * 60 + (em || 0);
            const diff = Math.max(30, endMins - startMins);
            return Math.round((diff / 60) * 10) / 10;
          };

          const durationHours = parseHours(offerStartTime, offerEndTime);
          const totalEstimate = Math.round(durationHours * offerHourlyRate);

          // Lógica de cálculo dos dias do mês para deslize horizontal no modal de oferecer horário
          const offerParts = (offerDate || "").split("-").map(Number);
          const offerYear = offerParts[0] || 2026;
          const offerMonth = offerParts[1] || 11;
          const offerDay = offerParts[2] || 11;
          const daysInOfferMonth = new Date(offerYear, offerMonth, 0).getDate();

          const weekdayShort = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
          const weekdayFull = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
          const monthNamesPt = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
          ];
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

          const offerMonthLabel = `${monthNamesPt[offerMonth - 1]} de ${offerYear}`;

          const handleOfferPrevMonth = () => {
            const prevD = new Date(offerYear, offerMonth - 2, 1);
            const mStr = String(prevD.getMonth() + 1).padStart(2, "0");
            setOfferDate(`${prevD.getFullYear()}-${mStr}-01`);
          };

          const handleOfferNextMonth = () => {
            const nextD = new Date(offerYear, offerMonth, 1);
            const mStr = String(nextD.getMonth() + 1).padStart(2, "0");
            setOfferDate(`${nextD.getFullYear()}-${mStr}-01`);
          };

          const offerMonthDays = Array.from({ length: daysInOfferMonth }, (_, i) => {
            const dNum = i + 1;
            const dObj = new Date(offerYear, offerMonth - 1, dNum);
            const dow = dObj.getDay();
            const dStr = `${offerYear}-${String(offerMonth).padStart(2, "0")}-${String(dNum).padStart(2, "0")}`;
            return {
              dateStr: dStr,
              dayNum: dNum,
              dayOfWeek: weekdayShort[dow],
              dayName: weekdayFull[dow],
              isToday: dStr === todayStr,
              isSelected: dStr === offerDate
            };
          });

          const selectedOfferDateObj = new Date(offerYear, offerMonth - 1, offerDay);
          const selectedDow = !isNaN(selectedOfferDateObj.getTime()) ? selectedOfferDateObj.getDay() : 0;
          const selectedDayMeta = {
            dayName: weekdayFull[selectedDow] || "Dia Selecionado",
            dayOfWeek: weekdayShort[selectedDow] || "DIA",
            formatted: formatDateDDMMAAAA(offerDate)
          };

          const modalitiesMeta = [
            { name: "Musculação", icon: Dumbbell },
            { name: "Spinning", icon: Bike },
            { name: "Funcional", icon: Zap },
            { name: "Pilates", icon: Activity },
            { name: "Alongamento / Yoga", icon: Heart },
            { name: "Cross Training", icon: Flame },
            { name: "Natação / Hidro", icon: Waves },
            { name: "Dança / Ritmos", icon: Music },
            { name: "Lutas / Boxe", icon: Shield }
          ];

          return (
            <div className="h-[520px] max-h-[85vh] flex flex-col justify-between">
              {/* Header do Wizard (Fixo no Topo) */}
              <div className="space-y-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-black text-navy-900 dark:text-white">
                      Quero Oferecer um Horário
                    </h3>
                    <p className="text-[11px] text-muted dark:text-slate-400">
                      Etapa {offerWizardStep} de 4 · {offerWizardStep === 1 ? "Valor da Aula" : offerWizardStep === 2 ? "Modalidades" : offerWizardStep === 3 ? "Data e Horário" : "Revisão e Confirmação"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowOfferSlotWizard(false)}
                    className="text-slate-400 hover:text-navy-900 dark:hover:text-white p-1 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Barra de Progresso Visual em 4 Etapas */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { step: 1, label: "1. Valor" },
                    { step: 2, label: "2. Modalidades" },
                    { step: 3, label: "3. Data/Hora" },
                    { step: 4, label: "4. Revisão" }
                  ].map((item) => (
                    <div key={item.step} className="space-y-1">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          offerWizardStep >= item.step
                            ? "bg-primary"
                            : "bg-slate-200 dark:bg-navy-700"
                        }`}
                      />
                      <span
                        className={`text-[10px] font-bold block text-center truncate ${
                          offerWizardStep === item.step
                            ? "text-primary"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Corpo da Etapa (com scroll se necessário, ocupando a altura constante) */}
              <div className="flex-1 overflow-y-auto py-3 pr-0.5 no-scrollbar flex flex-col justify-between">
                {/* ================= ETAPA 1: VALOR E TOGGLE DE NEGOCIAÇÃO ================= */}
                {offerWizardStep === 1 && (
                  <div className="space-y-4 animate-fade-in flex-1">
                    <div className="p-3 bg-blue-50 dark:bg-primary/10 rounded-2xl border border-primary/20 text-slate-700 dark:text-slate-300">
                      <span className="font-extrabold text-primary text-xs block mb-0.5">
                        Quanto você cobra pela sua hora-aula?
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        Informe o valor que deseja receber por hora para este horário.
                      </p>
                    </div>

                    {/* Campo de Valor Principal (Sem recomendação de valores) */}
                    <div className="bg-slate-50 dark:bg-navy-900/70 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-center space-y-2">
                      <label className="text-[11px] font-bold text-muted dark:text-slate-400 uppercase tracking-wider block">
                        Valor por Hora-Aula
                      </label>

                      <div className="flex items-baseline justify-center gap-1 font-black text-navy-900 dark:text-white">
                        <span className="text-2xl text-primary font-bold">R$</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={20}
                          value={offerHourlyRate || ""}
                          onKeyDown={blockNonNumericKeyDown}
                          onChange={(e) => {
                            const newRate = Math.max(0, Number(e.target.value));
                            setOfferHourlyRate(newRate);
                            if (newRate > 0 && (offerMinHourlyRate >= newRate || !offerMinHourlyRate)) {
                              setOfferMinHourlyRate(Math.max(15, newRate - 5));
                            }
                          }}
                          placeholder="0,00"
                          className="w-28 text-center font-black text-3xl sm:text-4xl bg-transparent border-b-2 border-primary focus:outline-none dark:text-white"
                        />
                        <span className="text-sm text-slate-400 font-bold">/hora</span>
                      </div>
                    </div>

                    {/* Toggle: Permitir negociação? */}
                    <div className="p-4 bg-card dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5 pr-2">
                          <span className="text-xs font-bold text-navy-900 dark:text-white block">
                            Permitir negociação?
                          </span>
                          <p className="text-[11px] text-muted dark:text-slate-400 leading-relaxed">
                            Se ativado você poderá receber propostas com outros valores, abaixo.
                          </p>
                        </div>

                        {/* Switch Toggle */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={offerAllowNegotiation}
                          onClick={() => {
                            const nextState = !offerAllowNegotiation;
                            setOfferAllowNegotiation(nextState);
                            if (nextState && (offerMinHourlyRate >= offerHourlyRate || !offerMinHourlyRate)) {
                              setOfferMinHourlyRate(Math.max(15, offerHourlyRate - 5));
                            }
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            offerAllowNegotiation ? "bg-primary" : "bg-slate-300 dark:bg-navy-700"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              offerAllowNegotiation ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {offerAllowNegotiation && (
                        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5 animate-fade-in">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              Valor mínimo aceitável:
                            </span>
                            <div className="flex items-center gap-1 font-black text-primary">
                              <span>R$</span>
                              <input
                                type="number"
                                inputMode="numeric"
                                min={15}
                                max={Math.max(15, offerHourlyRate - 1)}
                                value={offerMinHourlyRate || ""}
                                onKeyDown={blockNonNumericKeyDown}
                                onChange={(e) => setOfferMinHourlyRate(Math.max(0, Number(e.target.value)))}
                                className={`w-16 text-center p-1.5 bg-slate-100 dark:bg-navy-800 border rounded-lg text-xs font-bold dark:text-white focus:outline-primary transition-colors ${
                                  offerAllowNegotiation && offerHourlyRate > 0 && offerMinHourlyRate >= offerHourlyRate
                                    ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500"
                                    : "border-slate-300 dark:border-slate-600"
                                }`}
                              />
                              <span className="text-[10px] text-slate-400">/h</span>
                            </div>
                          </div>

                          {offerAllowNegotiation && offerHourlyRate > 0 && offerMinHourlyRate >= offerHourlyRate && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 mt-1 animate-shake">
                              <AlertCircle size={13} className="shrink-0" />
                              <span>O valor mínimo aceitável deve ser menor que o valor da hora-aula (máx. R$ {Math.max(0, offerHourlyRate - 1)}/h)</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ================= ETAPA 2: MODALIDADES (OUTLINE LIGHT ICONS) ================= */}
                {offerWizardStep === 2 && (
                  <div className="space-y-4 animate-fade-in flex-1">
                    <div className="p-3 bg-blue-50 dark:bg-primary/10 rounded-2xl border border-primary/20 text-slate-700 dark:text-slate-300">
                      <span className="font-extrabold text-primary text-xs block mb-0.5">
                        Quais modalidades você irá lecionar?
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        Selecione as modalidades aplicáveis para este horário ou adicione outra digitando.
                      </p>
                    </div>

                    {/* Grid com Ícones Outline Light */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-1 no-scrollbar">
                      {modalitiesMeta.map((item) => {
                        const Icon = item.icon;
                        const isSelected = offerModalities.includes(item.name);
                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                if (offerModalities.length > 1) {
                                  setOfferModalities(offerModalities.filter((m) => m !== item.name));
                                }
                              } else {
                                setOfferModalities([...offerModalities, item.name]);
                              }
                            }}
                            className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between gap-1.5 ${
                              isSelected
                                ? "bg-primary text-white border-primary shadow-xs"
                                : "bg-card dark:bg-navy-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <Icon size={15} strokeWidth={1.5} className={isSelected ? "text-white" : "text-slate-500"} />
                              <span className="truncate">{item.name}</span>
                            </div>
                            {isSelected && <Check size={13} strokeWidth={2} className="shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Digitar Outra Modalidade */}
                    <div className="p-2.5 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                      <label className="text-[11px] font-bold text-navy-900 dark:text-white block">
                        Adicionar outra modalidade digitando:
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={offerCustomModality}
                          onChange={(e) => setOfferCustomModality(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const val = offerCustomModality.trim();
                              if (val && !offerModalities.includes(val)) {
                                setOfferModalities([...offerModalities, val]);
                                setOfferCustomModality("");
                              }
                            }
                          }}
                          placeholder="Ex: Muay Thai, Treinamento Suspenso..."
                          className="flex-1 p-2 bg-card dark:bg-navy-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-navy-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = offerCustomModality.trim();
                            if (val && !offerModalities.includes(val)) {
                              setOfferModalities([...offerModalities, val]);
                              setOfferCustomModality("");
                            }
                          }}
                          disabled={!offerCustomModality.trim()}
                          className="px-3 py-2 bg-primary disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ================= ETAPA 3: CALENDÁRIO COM DESLIZE DOS DIAS DO MÊS E INTERVALO DE HORÁRIO ================= */}
                {offerWizardStep === 3 && (
                  <div className="space-y-3.5 animate-fade-in flex-1">
                    <div className="p-3 bg-blue-50 dark:bg-primary/10 rounded-2xl border border-primary/20 text-slate-700 dark:text-slate-300">
                      <span className="font-extrabold text-primary text-xs block mb-0.5">
                        Escolha o dia e o horário específico
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        Deslize pelos dias do mês para escolher a data, ou selecione qualquer outra data abaixo.
                      </p>
                    </div>

                    {/* Linha com Navegação de Mês e Slide Horizontal dos Dias */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleOfferPrevMonth}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors"
                            title="Mês anterior"
                          >
                            <ChevronLeft size={14} strokeWidth={2} />
                          </button>
                          <span className="text-xs font-black text-navy-900 dark:text-white">
                            {offerMonthLabel}
                          </span>
                          <button
                            type="button"
                            onClick={handleOfferNextMonth}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors"
                            title="Próximo mês"
                          >
                            <ChevronRight size={14} strokeWidth={2} />
                          </button>
                        </div>
                        <span className="text-[10px] text-primary font-bold">
                          {selectedDayMeta.dayName}, {selectedDayMeta.formatted}
                        </span>
                      </div>

                      {/* Container com scroll horizontal idêntico à Minha Agenda */}
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1.5 scroll-smooth">
                        {offerMonthDays.map((d) => (
                          <button
                            key={d.dateStr}
                            type="button"
                            onClick={() => setOfferDate(d.dateStr)}
                            className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-14 rounded-2xl transition-all relative ${
                              d.isSelected
                                ? "bg-primary text-white shadow-md scale-105 border-2 border-white dark:border-navy-900 ring-2 ring-primary/50"
                                : d.isToday
                                ? "bg-primary/10 dark:bg-primary/20 text-primary border-2 border-primary font-black"
                                : "bg-slate-100 dark:bg-navy-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-800 border border-transparent"
                            }`}
                          >
                            {d.isToday && (
                              <span className="absolute -top-1.5 px-1.5 py-0.2 rounded-full bg-primary text-white text-[7px] font-black uppercase tracking-tight shadow-2xs">
                                Hoje
                              </span>
                            )}
                            <span className={`text-[10px] font-bold ${d.isSelected ? "text-white/80" : "text-muted dark:text-slate-400"}`}>
                              {d.dayOfWeek}
                            </span>
                            <span className="text-sm font-black leading-tight">
                              {String(d.dayNum).padStart(2, "0")}
                            </span>
                            {d.isSelected && (
                              <span className="w-1 h-1 rounded-full bg-white mt-0.5" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Selecionar Outras Datas */}
                    <div className="p-2.5 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <label className="font-bold text-navy-900 dark:text-white flex items-center gap-1">
                        <Calendar size={12} strokeWidth={1.5} className="text-primary" />
                        Outra data:
                      </label>
                      <input
                        type="date"
                        value={offerDate}
                        onChange={(e) => setOfferDate(e.target.value)}
                        className="p-1.5 bg-card dark:bg-navy-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-navy-900 dark:text-white focus:outline-primary"
                      />
                    </div>

                    {/* Início e Fim do Horário */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-navy-900 dark:text-white flex items-center gap-1">
                          <Clock size={12} strokeWidth={1.5} className="text-primary" />
                          Início da Disponibilidade
                        </label>
                        <input
                          type="time"
                          value={offerStartTime}
                          onChange={(e) => setOfferStartTime(e.target.value)}
                          className="w-full p-2 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-navy-900 dark:text-white focus:outline-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-navy-900 dark:text-white flex items-center gap-1">
                          <Clock size={12} strokeWidth={1.5} className="text-primary" />
                          Término da Disponibilidade
                        </label>
                        <input
                          type="time"
                          value={offerEndTime}
                          onChange={(e) => setOfferEndTime(e.target.value)}
                          className="w-full p-2 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-navy-900 dark:text-white focus:outline-primary"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                      <span className="text-[11px] text-muted dark:text-slate-400">
                        {durationHours} horas ({offerStartTime} às {offerEndTime})
                      </span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        R$ {totalEstimate},00 potencial
                      </span>
                    </div>

                    {offerDate && offerStartTime && isTimeInPastForDate(offerDate, offerStartTime) && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl flex items-start gap-2 text-amber-800 dark:text-amber-200 text-xs">
                        <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <div>
                          <strong className="block font-bold">Horário no passado não permitido</strong>
                          O horário de início ({offerStartTime}) já passou para o dia de hoje ({formatDateDDMMAAAA(offerDate)}). Escolha um horário futuro para disponibilizar.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ================= ETAPA 4: REVISÃO E CONFIRMAÇÃO ================= */}
                {offerWizardStep === 4 && (
                  <div className="space-y-3.5 animate-fade-in flex-1">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 text-slate-700 dark:text-slate-300">
                      <span className="font-extrabold text-emerald-800 dark:text-emerald-300 text-xs block mb-0.5">
                        Tudo pronto! Revise seu horário disponível:
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        Ao confirmar, este horário específico ficará ativo e as academias poderão convidar você diretamente.
                      </p>
                    </div>

                    {/* Resumo */}
                    <div className="bg-card dark:bg-navy-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 shadow-xs">
                      <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted dark:text-slate-400 block tracking-wider">
                            Data e Horário
                          </span>
                          <h4 className="font-black text-sm text-navy-900 dark:text-white flex items-center gap-1.5">
                            <Calendar size={13} strokeWidth={1.5} className="text-primary" />
                            {formatDateDDMMAAAA(offerDate)} ({selectedDayMeta.dayName})
                          </h4>
                          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-1">
                            <Clock size={12} strokeWidth={1.5} className="text-primary" />
                            {offerStartTime} às {offerEndTime} ({durationHours}h)
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="bg-primary/10 text-primary font-black text-xs px-2.5 py-1 rounded-full block">
                            R$ {offerHourlyRate}/h
                          </span>
                          {offerAllowNegotiation && (
                            <span className="text-[10px] text-muted dark:text-slate-400 block mt-1">
                              Mín: R$ {offerMinHourlyRate}/h
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <span className="text-[10px] text-muted dark:text-slate-400 block">
                          Modalidades Selecionadas ({offerModalities.length})
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {offerModalities.map((m) => (
                            <span
                              key={m}
                              className="bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Rodapé com Botões de Ação (Posicionados com folga e consistência de altura) */}
              <div className="pt-3 pb-1 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                {offerWizardStep === 1 ? (
                  <button
                    type="button"
                    onClick={() => setShowOfferSlotWizard(false)}
                    className="w-1/3 py-2.5 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                  >
                    Cancelar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOfferWizardStep((prev) => (prev - 1) as any)}
                    className="w-1/3 py-2.5 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    <span>Voltar</span>
                  </button>
                )}

                {offerWizardStep < 4 ? (
                  <button
                    type="button"
                    disabled={
                      (offerWizardStep === 1 && (offerHourlyRate <= 0 || (offerAllowNegotiation && offerMinHourlyRate >= offerHourlyRate))) ||
                      (offerWizardStep === 2 && offerModalities.length === 0) ||
                      (offerWizardStep === 3 && (!offerDate || !offerStartTime || !offerEndTime || isTimeInPastForDate(offerDate, offerStartTime)))
                    }
                    onClick={() => setOfferWizardStep((prev) => (prev + 1) as any)}
                    className="w-2/3 py-2.5 rounded-full text-xs font-black bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1"
                  >
                    <span>
                      {offerWizardStep === 1
                        ? "Avançar: Modalidades"
                        : offerWizardStep === 2
                        ? "Avançar: Data e Horário"
                        : "Avançar para Revisão"}
                    </span>
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const currentId = currentInstructor.id || activeInstructorId;
                      updateInstructorProfile(currentId, {
                        hourlyRate: offerHourlyRate,
                        minHourlyRate: offerAllowNegotiation ? offerMinHourlyRate : offerHourlyRate,
                        modalities: offerModalities
                      });

                      // Mapeia o dia da semana da data escolhida para atualizar a grade
                      const parts = (offerDate || "").split("-").map(Number);
                      const dObj = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date();
                      const dayOfWeek = dObj.getDay();

                      const existingAvail = currentInstructor.availability || [];
                      const updatedAvail = existingAvail.map((a) => {
                        if (a.dayOfWeek === dayOfWeek) {
                          return {
                            ...a,
                            active: true,
                            slots: [{ start: offerStartTime, end: offerEndTime }]
                          };
                        }
                        return a;
                      });

                      if (!updatedAvail.some((a) => a.dayOfWeek === dayOfWeek)) {
                        updatedAvail.push({
                          dayOfWeek,
                          dayName: selectedDayMeta.dayName,
                          shortDay: selectedDayMeta.dayOfWeek,
                          active: true,
                          slots: [{ start: offerStartTime, end: offerEndTime }]
                        });
                      }

                      updateInstructorAvailability(currentId, updatedAvail);

                      setShowOfferSlotWizard(false);
                      setAgendaSubTab("grade");
                      setOfferSuccessMsg(`Horário para ${formatDateDDMMAAAA(offerDate)} (${offerStartTime} às ${offerEndTime}) disponibilizado com sucesso!`);
                      setTimeout(() => setOfferSuccessMsg(null), 5000);
                    }}
                    className="w-2/3 py-2.5 rounded-full text-xs font-black bg-gradient-to-r from-primary to-blue-600 hover:from-primary-hover hover:to-blue-700 text-white shadow-md transition-all active:scale-95 flex items-center justify-center"
                  >
                    Disponibilizar meu Horário
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </AnimatedModal>

    </div>
  );
};
