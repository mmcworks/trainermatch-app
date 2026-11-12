"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store/use-app-store";
import {
  Calendar as CalendarIcon,
  Users,
  User,
  Clock,
  CheckCircle,
  Plus,
  CreditCard,
  Building,
  Building2,
  Star,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Camera,
  Upload,
  Lock,
  Dumbbell,
  Bike,
  Zap,
  Activity,
  Heart,
  Flame,
  Waves,
  Music,
  Shield,
  Eye,
  Smartphone,
  Monitor,
  X,
  Mail,
  Phone,
  MapPin,
  Check,
  CheckCheck,
  MessageSquare,
  List,
  LayoutGrid,
  Copy,
  ZoomIn,
  ZoomOut,
  Crop,
  Search,
  Filter,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  DollarSign,
  LogOut,
  Bell,
  Trash2,
  Layers,
  HelpCircle,
  ThumbsUp,
  XCircle
} from "lucide-react";
import { PricingRules, formatDateDDMMAAAA, formatShiftDateTime, Shift, Instructor, canCancelShift, maskPhone, isTimeInPastForDate, getTodayDateString } from "@/store/mock-data";
import {
  getRecommendedInstructorsForShift,
  calculateSuggestedRate,
  RecommendationMatch
} from "@/store/use-app-store";
import { AnimatedModal } from "@/components/animated-modal";
import { OnboardingModal } from "@/components/onboarding-modal";
import { ReviewModal } from "@/components/review-modal";
import { CancelShiftModal } from "@/components/cancel-shift-modal";
import { HorizontalBars } from "@/components/horizontal-bars";
import { cropAndCompressImage } from "@/lib/image-utils";


export const AcademiaView: React.FC = () => {
  const {
    gyms,
    shifts,
    instructors,
    proposals,
    activeGymId,
    gymPlan,
    hiresThisMonth,
    isFirstHireFreeUsed,
    acceptProposal,
    rejectProposal,
    createShift,
    createMultipleShifts,
    deleteShift,
    completeShift,
    cancelShift,
    gymValidateAttendance,
    submitInstructorReview,
    inviteInstructor,
    updateGymPricing,
    subscribePlan,
    updateGymProfile,
    isDarkMode,
    toggleDarkMode,
    userName,
    userEmail,
    logout,
    deleteAccount
  } = useAppStore();

  const [shiftToCancel, setShiftToCancel] = useState<Shift | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);

  const [reviewShift, setReviewShift] = useState<{
    shift: Shift;
    instructor: Instructor;
  } | null>(null);

  const [instructorDetailModal, setInstructorDetailModal] = useState<Instructor | null>(null);

  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState<boolean>(false);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState<boolean>(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);

  const fallbackGym = {
    id: activeGymId || "gym-new",
    name: userName || "Academia",
    neighborhood: "Centro",
    city: "São Paulo",
    address: "",
    logo: "",
    facadeUrl: "",
    rating: 5.0,
    ratingCount: 0,
    phone: "",
    email: userEmail || "",
    cnpj: "",
    managerName: userName || "Gestor",
    managerRole: "Coordenação",
    managerPhone: "",
    managerEmail: userEmail || "",
    modalities: ["Musculação", "Funcional"],
    pricingRules: {
      modalityRates: { "Musculação": 45, "Funcional": 50 },
      peakHourAddition: 5,
      weekendAddition: 8
    }
  };

  const currentGym = gyms.find((g) => g.id === activeGymId) || (activeGymId ? fallbackGym : gyms[0]) || fallbackGym;

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem("trainermatch_onboarding_academia");
      if (!seen) {
        setShowOnboarding(true);
      }
    } catch (e) {}
  }, []);

  const [activeMenu, setActiveMenu] = useState<"turnos" | "propostas" | "professores" | "assinatura" | "perfil">("turnos");
  const [scheduleViewMode, setScheduleViewMode] = useState<"mes" | "semana">("mes");
  const [proposalFilter, setProposalFilter] = useState<"todas" | "aceita" | "pendente" | "recusada">("todas");
  const [showNewShiftModal, setShowNewShiftModal] = useState(false);
  // Wizard Quero Contratar um(a) Instrutor(a)
  const [showHireWizard, setShowHireWizard] = useState(false);
  const [hireWizardStep, setHireWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [hireRate, setHireRate] = useState<number>(50);
  const [hireAllowNegotiation, setHireAllowNegotiation] = useState<boolean>(true);
  const [hireMinNegotiableRate, setHireMinNegotiableRate] = useState<number>(40);
  const [hireModality, setHireModality] = useState<string>("Musculação");
  const [hireCustomModality, setHireCustomModality] = useState<string>("");
  const [hireDate, setHireDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [hireStartTime, setHireStartTime] = useState<string>("07:00");
  const [hireEndTime, setHireEndTime] = useState<string>("11:00");
  const [showMonthOverviewModal, setShowMonthOverviewModal] = useState<boolean>(false);
  const [mobileCalendarDayNumber, setMobileCalendarDayNumber] = useState<number | null>(new Date().getDate());
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);

  // Estados de Exclusão de Horários/Vagas
  const [shiftToDelete, setShiftToDelete] = useState<Shift | null>(null);
  const [deleteShiftError, setDeleteShiftError] = useState<string | null>(null);
  const [showDeleteShiftModal, setShowDeleteShiftModal] = useState<boolean>(false);

  const handleDeleteShiftClick = (shift: Shift) => {
    // 1. Só impede exclusão se houver um professor realmente contratado para aula futura
    const confirmedInst = instructors.find((i) => i.id === shift.confirmedInstructorId);
    const hasActiveContract = (shift.status === "confirmado") &&
      !!confirmedInst && !confirmedInst.isDeleted && (confirmedInst as any).isActive !== false;

    if (hasActiveContract && canCancelShift(shift).canCancel) {
      setDeleteShiftError("Não é possível excluir este horário pois já existe um professor contratado. Caso precise desmarcar a aula, utilize a opção 'Cancelar Aula Contratada'.");
      setShiftToDelete(shift);
      setShowDeleteShiftModal(true);
      return;
    }

    setDeleteShiftError(null);
    setShiftToDelete(shift);
    setShowDeleteShiftModal(true);
  };

  // Estados de Recomendação Automática de Professores
  const [selectedShiftForRecommendations, setSelectedShiftForRecommendations] = useState<string | null>(null);
  const [recommendationSortBy, setRecommendationSortBy] = useState<"horarios" | "valores" | "avaliacao">("horarios");

  // Filtros da Agenda Completa e Histórico de Meses
  const [selectedAgendaMonth, setSelectedAgendaMonth] = useState<string>("2026-11");
  const [historyViewTab, setHistoryViewTab] = useState<"calendario" | "relatorio">("calendario");

  const handlePrevMonth = () => {
    const [y, m] = selectedAgendaMonth.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = String(prevDate.getMonth() + 1).padStart(2, "0");
    setSelectedAgendaMonth(`${prevYear}-${prevMonth}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedAgendaMonth.split("-").map(Number);
    const nextDate = new Date(y, m, 1);
    const nextYear = nextDate.getFullYear();
    const nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
    setSelectedAgendaMonth(`${nextYear}-${nextMonth}`);
  };

  // Navegação da Grade Semanal
  // Data base da semana selecionada: Segunda-feira (padrão: 2026-11-09 - semana atual)
  const [selectedWeekStartDate, setSelectedWeekStartDate] = useState<string>("2026-11-09");

  const handlePrevWeek = () => {
    const [y, m, d] = selectedWeekStartDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 7);
    const prevY = date.getFullYear();
    const prevM = String(date.getMonth() + 1).padStart(2, "0");
    const prevD = String(date.getDate()).padStart(2, "0");
    setSelectedWeekStartDate(`${prevY}-${prevM}-${prevD}`);
  };

  const handleNextWeek = () => {
    const [y, m, d] = selectedWeekStartDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 7);
    const nextY = date.getFullYear();
    const nextM = String(date.getMonth() + 1).padStart(2, "0");
    const nextD = String(date.getDate()).padStart(2, "0");
    setSelectedWeekStartDate(`${nextY}-${nextM}-${nextD}`);
  };

  const handleCurrentWeek = () => {
    setSelectedWeekStartDate("2026-11-09");
  };

  // Filtros e Layout de "Todos os Horários Cadastrados"
  const [allShiftsModality, setAllShiftsModality] = useState<string>("todas");
  const [allShiftsPeriod, setAllShiftsPeriod] = useState<"todos" | "manha" | "tarde" | "noite">("todos");
  const [allShiftsDate, setAllShiftsDate] = useState<string>("todas");
  const [allShiftsLayout, setAllShiftsLayout] = useState<"grade" | "lista">("grade");
  const [copiedPixKey, setCopiedPixKey] = useState<string | null>(null);

  // Destaque de horário selecionado via Grade (Semanal ou Mensal)
  const [highlightedShiftId, setHighlightedShiftId] = useState<string | null>(null);

  // Modal para expandir horários do dia quando houver mais de 2 horários
  const [selectedDayShiftsModal, setSelectedDayShiftsModal] = useState<{
    date: string;
    dayNumber: number;
    shifts: Shift[];
  } | null>(null);

  const handleSelectShiftFromGrade = (shiftId: string) => {
    setHighlightedShiftId(shiftId);
    const targetShift = gymShifts.find((s) => s.id === shiftId);
    if (targetShift) {
      if (allShiftsDate !== "todas" && allShiftsDate !== targetShift.date) {
        setAllShiftsDate("todas");
      }
      if (allShiftsModality !== "todas" && allShiftsModality !== targetShift.modality) {
        setAllShiftsModality("todas");
      }
      if (allShiftsPeriod !== "todos") {
        setAllShiftsPeriod("todos");
      }
    }

    setTimeout(() => {
      const el = document.getElementById(`shift-card-${shiftId}`) || document.getElementById(`shift-row-${shiftId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  // Modal de Crop de Imagens (Logo e Fachada)
  const [showCropModal, setShowCropModal] = useState<boolean>(false);
  const [cropTarget, setCropTarget] = useState<"logo" | "facade">("logo");
  const [cropImageSrc, setCropImageSrc] = useState<string>("");
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropOffsetX, setCropOffsetX] = useState<number>(0);
  const [cropOffsetY, setCropOffsetY] = useState<number>(0);

  // Modal de Nova Modalidade
  const [showNewModalityModal, setShowNewModalityModal] = useState<boolean>(false);
  const [selectedPredefinedModality, setSelectedPredefinedModality] = useState<string>("Beach Tennis");
  const [customModalityInput, setCustomModalityInput] = useState<string>("");

  // Filtros Mobile - Foco inicial no dia atual
  const [mobileSelectedDate, setMobileSelectedDate] = useState<string>("2026-11-11");
  const [mobileSearchTeacher, setMobileSearchTeacher] = useState<string>("");
  const mobileTodayButtonRef = useRef<HTMLButtonElement | null>(null);

  // Efeito para rolar e centralizar no dia atual no calendário mobile da academia
  useEffect(() => {
    if (activeMenu === "turnos" && mobileTodayButtonRef.current) {
      const timer = setTimeout(() => {
        mobileTodayButtonRef.current?.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest"
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedAgendaMonth, activeMenu]);

  // Regras de Precificação da Academia (Item 5)
  const [pricingModalityRates, setPricingModalityRates] = useState<Record<string, number>>(
    currentGym.pricingRules?.modalityRates || {
      "Musculação": 40,
      "Spinning": 50,
      "Funcional": 45,
      "Pilates": 55,
      "Alongamento / Yoga": 45,
      "Cross Training": 50
    }
  );
  const [pricingPeakHourAddition, setPricingPeakHourAddition] = useState<number>(
    currentGym.pricingRules?.peakHourAddition ?? 5
  );
  const [pricingWeekendAddition, setPricingWeekendAddition] = useState<number>(
    currentGym.pricingRules?.weekendAddition ?? 8
  );

  // Form de novo turno
  const [newTitle, setNewTitle] = useState("Musculação - Turno Tarde");
  const [newModality, setNewModality] = useState("Musculação");
  const [newDate, setNewDate] = useState("2026-11-08");
  const [newStartTime, setNewStartTime] = useState("14:00");
  const [newEndTime, setNewEndTime] = useState("18:00");
  const [newMaxRate, setNewMaxRate] = useState<number>(() =>
    calculateSuggestedRate(currentGym, "Musculação", "14:00", "2026-11-08")
  );

  // Manipuladores dinâmicos que sugerem o valor de hora-aula ao alterar modalidade ou horário
  const handleModalityChange = (mod: string) => {
    setNewModality(mod);
    const suggested = calculateSuggestedRate(
      { ...currentGym, pricingRules: { modalityRates: pricingModalityRates, peakHourAddition: pricingPeakHourAddition, weekendAddition: pricingWeekendAddition } },
      mod,
      newStartTime,
      newDate
    );
    setNewMaxRate(suggested);
  };

  const handleStartTimeChange = (time: string) => {
    setNewStartTime(time);
    const suggested = calculateSuggestedRate(
      { ...currentGym, pricingRules: { modalityRates: pricingModalityRates, peakHourAddition: pricingPeakHourAddition, weekendAddition: pricingWeekendAddition } },
      newModality,
      time,
      newDate
    );
    setNewMaxRate(suggested);
  };

  const handleDateChange = (date: string) => {
    setNewDate(date);
    const suggested = calculateSuggestedRate(
      { ...currentGym, pricingRules: { modalityRates: pricingModalityRates, peakHourAddition: pricingPeakHourAddition, weekendAddition: pricingWeekendAddition } },
      newModality,
      newStartTime,
      date
    );
    setNewMaxRate(suggested);
  };

  // Form de Perfil da Academia
  const [profileName, setProfileName] = useState(currentGym.name);
  const [profileLogo, setProfileLogo] = useState(currentGym.logo);
  const [profileFacade, setProfileFacade] = useState(currentGym.facadeUrl);
  const [profileCnpj, setProfileCnpj] = useState(currentGym.cnpj || "14.285.912/0001-44");
  const [profilePhone, setProfilePhone] = useState(currentGym.phone);
  const [profileEmail, setProfileEmail] = useState(currentGym.email);
  const [profileAddress, setProfileAddress] = useState(currentGym.address);
  const [profileNeighborhood, setProfileNeighborhood] = useState(currentGym.neighborhood);
  const [profileCity, setProfileCity] = useState(currentGym.city);
  const [profileManagerName, setProfileManagerName] = useState(currentGym.managerName || "Carlos Eduardo Silva");
  const [profileManagerRole, setProfileManagerRole] = useState(currentGym.managerRole || "Coordenador Geral / Sócio");
  const [profileManagerPhone, setProfileManagerPhone] = useState(currentGym.managerPhone || "(27) 99812-4455");
  const [profileManagerEmail, setProfileManagerEmail] = useState(currentGym.managerEmail || "carlos.gerencia@movafit.com.br");
  const [profileModalities, setProfileModalities] = useState<string[]>(
    currentGym.modalities || ["Musculação", "Spinning", "Funcional", "Pilates"]
  );

  useEffect(() => {
    if (currentGym) {
      if (currentGym.name) setProfileName(currentGym.name);
      setProfileLogo(currentGym.logo || "");
      setProfileFacade(currentGym.facadeUrl || "");
      if (currentGym.cnpj) setProfileCnpj(currentGym.cnpj);
      if (currentGym.phone) setProfilePhone(currentGym.phone);
      if (currentGym.email) setProfileEmail(currentGym.email);
      if (currentGym.address) setProfileAddress(currentGym.address);
      if (currentGym.neighborhood) setProfileNeighborhood(currentGym.neighborhood);
      if (currentGym.city) setProfileCity(currentGym.city);
      if (currentGym.managerName) setProfileManagerName(currentGym.managerName);
      if (currentGym.managerRole) setProfileManagerRole(currentGym.managerRole);
      if (currentGym.managerPhone) setProfileManagerPhone(currentGym.managerPhone);
      if (currentGym.managerEmail) setProfileManagerEmail(currentGym.managerEmail);
      if (currentGym.modalities && currentGym.modalities.length > 0) {
        setProfileModalities(currentGym.modalities);
      }
    }
  }, [currentGym.id, currentGym.logo, currentGym.facadeUrl, currentGym.name, currentGym.cnpj, currentGym.address]);


  // Modo de cadastro da modal de horário: 'individual' ou 'grade'
  const [shiftModalMode, setShiftModalMode] = useState<"individual" | "grade">("individual");
  // Dias da semana selecionados para a grade (0 = Dom, 1 = Seg, 2 = Ter, 3 = Qua, 4 = Qui, 5 = Sex, 6 = Sáb)
  const [gridWeekDays, setGridWeekDays] = useState<number[]>([1, 3, 5]); // Padrão: Seg, Qua, Sex
  // Horários dentro da grade (suporte a múltiplos horários no mesmo dia, ex: Manhã e Noite)
  const [gridTimeSlots, setGridTimeSlots] = useState<{ id: string; start: string; end: string }[]>([
    { id: "slot-1", start: "07:00", end: "11:00" }
  ]);
  // Intervalo de datas da grade
  const [gridStartDate, setGridStartDate] = useState<string>("2026-11-06");
  const [gridEndDate, setGridEndDate] = useState<string>("2026-11-30");
  const [gridCreationFeedback, setGridCreationFeedback] = useState<string | null>(null);
  const [validationSuccessToast, setValidationSuccessToast] = useState<string | null>(null);

  // Professores ativos e disponíveis (exclui deletados e testes como José da Silva)
  const activeInstructors = instructors.filter(
    (i) => !i.isDeleted && i.isActive !== false && !i.name?.toLowerCase().includes("josé da silva") && i.cref !== "12345/ES"
  );

  // Propostas recebidas para esta academia (exclui propostas de usuários que não existem mais ou excluídos)
  const gymShifts = shifts.filter((s) => s.gymId === activeGymId);
  const gymProposals = proposals.filter((p) => {
    const shiftMatches = gymShifts.some((s) => s.id === p.shiftId);
    if (!shiftMatches) return false;
    const instructor = instructors.find((i) => i.id === p.instructorId);
    if (!instructor || instructor.isDeleted || (instructor as any).isActive === false || instructor.name?.toLowerCase().includes("josé da silva") || instructor.cref === "12345/ES") {
      return false;
    }
    return true;
  });

  // Aulas onde o professor confirmou início (check-in) e aguardam validação da academia
  const pendingCheckInShifts = gymShifts.filter(
    (s) => s.status === "confirmado" && Boolean(s.instructorCheckInAt)
  );

  // Manipulador para validar presença com toast de notificação
  const handleValidateAttendance = (shiftId: string, instructorName?: string) => {
    gymValidateAttendance(shiftId);
    setValidationSuccessToast(
      `Presença ${instructorName ? `de ${instructorName}` : "do professor"} validada com sucesso! Turno finalizado.`
    );
    setTimeout(() => {
      setValidationSuccessToast(null);
    }, 4500);

    const targetShift = shifts.find((s) => s.id === shiftId);
    const targetInstructor = instructors.find(
      (i) => i.id === targetShift?.confirmedInstructorId
    );
    if (targetShift && targetInstructor) {
      setTimeout(() => {
        setReviewShift({
          shift: targetShift,
          instructor: targetInstructor
        });
      }, 600);
    }
  };

  // Cálculo dos turnos gerados pela grade em tempo real
  const getCalculatedGridShifts = () => {
    if (!gridStartDate || !gridEndDate || gridWeekDays.length === 0 || gridTimeSlots.length === 0) {
      return [];
    }

    const start = new Date(gridStartDate + "T00:00:00");
    const end = new Date(gridEndDate + "T23:59:59");
    if (end < start) return [];

    const generatedShifts: Omit<Shift, "id" | "status">[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (gridWeekDays.includes(dayOfWeek)) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, "0");
        const day = String(current.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        gridTimeSlots.forEach((slot) => {
          if (slot.start && slot.end) {
            generatedShifts.push({
              gymId: activeGymId,
              title: newTitle || `${newModality} - Grade`,
              modality: newModality,
              date: dateStr,
              dateFormatted: `${formatDateDDMMAAAA(dateStr)} · ${slot.start} – ${slot.end}`,
              startTime: slot.start,
              endTime: slot.end,
              maxRate: newMaxRate
            });
          }
        });
      }
      current.setDate(current.getDate() + 1);
    }

    return generatedShifts;
  };

  const filteredProposals = gymProposals.filter((p) => {
    if (proposalFilter === "todas") return true;
    return p.status === proposalFilter;
  });

  const handleAcceptProposal = (proposalId: string) => {
    const result = acceptProposal(proposalId);
    if (result.hasConflict) {
      alert(`⚠️ Conflito de Horário / Deslocamento: ${result.conflictMessage}`);
      return;
    }
    if (result.requiresSubscription) {
      setShowSubscriptionModal(true);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const gymId = currentGym.id || activeGymId;
    updateGymProfile(gymId, {
      name: profileName,
      logo: profileLogo,
      facadeUrl: profileFacade,

      cnpj: profileCnpj,
      phone: profilePhone,
      email: profileEmail,
      address: profileAddress,
      neighborhood: profileNeighborhood,
      city: profileCity,
      managerName: profileManagerName,
      managerRole: profileManagerRole,
      managerPhone: profileManagerPhone,
      managerEmail: profileManagerEmail,
      modalities: profileModalities
    });
    setProfileSuccessMsg("Dados cadastrais e fotos da academia atualizados com sucesso!");
    setTimeout(() => setProfileSuccessMsg(null), 4000);
  };

  const handleSavePricing = () => {
    updateGymPricing(activeGymId, {
      modalityRates: pricingModalityRates,
      peakHourAddition: pricingPeakHourAddition,
      weekendAddition: pricingWeekendAddition
    });
    setProfileSuccessMsg("Tabela de valores por modalidade e horários atualizada com sucesso!");
    setTimeout(() => setProfileSuccessMsg(null), 4000);
  };

  const handleInviteTeacher = (shiftId: string, instructorId: string, instructorName: string) => {
    inviteInstructor(shiftId, instructorId);
    setInviteSuccessMsg(`Convite com valor fixo enviado com sucesso para ${instructorName}!`);
    setTimeout(() => setInviteSuccessMsg(null), 4000);
  };

  const toggleModality = (mod: string) => {
    if (profileModalities.includes(mod)) {
      setProfileModalities(profileModalities.filter((m) => m !== mod));
    } else {
      setProfileModalities([...profileModalities, mod]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, target: "logo" | "facade") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
    if (file.size > MAX_FILE_SIZE) {
      alert("A imagem selecionada excede o limite máximo de 3 MB. Por favor, escolha um arquivo menor.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropTarget(target);
      setCropZoom(1);
      setCropOffsetX(0);
      setCropOffsetY(0);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const openCropWithCurrent = (target: "logo" | "facade") => {
    setCropTarget(target);
    setCropImageSrc(target === "logo" ? profileLogo : profileFacade);
    setCropZoom(1);
    setCropOffsetX(0);
    setCropOffsetY(0);
    setShowCropModal(true);
  };

  const handleSaveCroppedImage = async () => {
    const gymId = currentGym.id || activeGymId;
    if (cropTarget === "logo") {
      const compressed = await cropAndCompressImage(cropImageSrc, 320, 320, cropZoom, cropOffsetX, cropOffsetY, 0.85);
      setProfileLogo(compressed);
      updateGymProfile(gymId, { logo: compressed });
    } else {
      const compressed = await cropAndCompressImage(cropImageSrc, 800, 450, cropZoom, cropOffsetX, cropOffsetY, 0.82);
      setProfileFacade(compressed);
      updateGymProfile(gymId, { facadeUrl: compressed });
    }
    setShowCropModal(false);
    setProfileSuccessMsg(
      cropTarget === "logo"
        ? "Logotipo circular atualizado com sucesso!"
        : "Foto da fachada recortada (16:9) e atualizada com sucesso!"
    );
    setTimeout(() => setProfileSuccessMsg(null), 4000);
  };


  const handleAddNewModality = () => {
    const modToAdd = customModalityInput.trim() ? customModalityInput.trim() : selectedPredefinedModality;
    if (!modToAdd) return;
    if (!profileModalities.includes(modToAdd)) {
      const updated = [...profileModalities, modToAdd];
      setProfileModalities(updated);
      updateGymProfile(activeGymId, { modalities: updated });
    }
    setCustomModalityInput("");
    setShowNewModalityModal(false);
    setProfileSuccessMsg(`Modalidade "${modToAdd}" adicionada à lista com sucesso!`);
    setTimeout(() => setProfileSuccessMsg(null), 4000);
  };

  // Turnos por data em Novembro
  const getShiftsForDay = (dateStr: string) => {
    return gymShifts.filter((s) => s.date === dateStr);
  };

  return (
    <div className="min-h-screen bg-background dark:bg-navy-900 text-navy-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* ===================== VERSÃO MOBILE DEDICADA DA ACADEMIA (SOMENTE EM CELULARES: < 768px) ===================== */}
      <div className="block md:hidden w-full max-w-md mx-auto min-h-screen pb-24 shadow-2xl relative font-sans transition-colors duration-200 flex flex-col overflow-x-hidden">
        
        {/* Header Mobile da Academia */}
        <header className="p-4 bg-card/95 dark:bg-navy-800/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center z-10 flex-shrink-0 sticky top-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-navy-900 p-0.5 border border-slate-200 dark:border-slate-700 flex-shrink-0 overflow-hidden shadow-xs flex items-center justify-center">
              {profileLogo ? (
                <img src={profileLogo} alt="Logo" className="w-full h-full object-cover rounded-full" />
              ) : (
                <Building2 size={18} className="text-primary" />
              )}
            </div>
            <div className="truncate">
              <span className="text-[10px] text-muted dark:text-slate-400 font-bold block leading-none">Academia</span>
              <h2 className="font-black text-sm text-navy-900 dark:text-white truncate mt-0.5">{profileName}</h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={toggleDarkMode}
              className="w-8 h-8 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white bg-slate-100 dark:bg-navy-700 rounded-full transition-colors"
              title="Alternar Modo Escuro"
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        {/* Conteúdo da Aba Selecionada (Mobile) */}
        <div className="flex-1 p-4 pb-28 space-y-4 animate-fade-in">

            {/* BANNER DE DESTAQUE: PROFESSOR INICIOU AULA (MOBILE) */}
            {pendingCheckInShifts.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-primary/10 border-2 border-emerald-500/80 p-3.5 rounded-2xl shadow-md space-y-2.5 animate-pulse-subtle">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bell size={14} className="animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.2 rounded-full">
                        Aula Iniciada ({pendingCheckInShifts.length})
                      </span>
                      <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">
                        Presença a Confirmar
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-navy-900 dark:text-white mt-0.5">
                      Professor confirmou início na unidade!
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-0.5">
                  {pendingCheckInShifts.map((shift) => {
                    const instructor = instructors.find((i) => i.id === shift.confirmedInstructorId);
                    return (
                      <div
                        key={shift.id}
                        className="bg-white/95 dark:bg-navy-800/95 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700/80 space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-xs font-black text-navy-900 dark:text-white block truncate">
                              {instructor?.name || "Professor"}
                            </span>
                            <span className="text-[10px] text-muted dark:text-slate-400 block">
                              {shift.modality} · {shift.startTime} – {shift.endTime}
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-black bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg shrink-0">
                            Iniciou às {shift.instructorCheckInAt}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleValidateAttendance(shift.id, instructor?.name)}
                          className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                        >
                          <CheckCheck size={14} />
                          <span>Validar Presença do Professor</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* ABA 1: AGENDA (MOBILE) */}
            {activeMenu === "turnos" && (
              <div className="space-y-4">
                {/* Botões de Ação da Agenda Mobile */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setShowHireWizard(true);
                      setHireWizardStep(1);
                    }}
                    className="w-full flex items-center justify-center bg-gradient-to-r from-primary to-blue-600 hover:from-primary-hover hover:to-blue-700 text-white text-xs font-black py-3.5 px-4 rounded-2xl shadow-md active:scale-[0.98] transition-all"
                  >
                    Quero contratar um(a) instrutor(a)
                  </button>

                  <button
                    onClick={() => {
                      setNewDate("2026-11-08");
                      setShowNewShiftModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 text-xs font-bold py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 active:scale-[0.98] transition-all"
                  >
                    <Plus size={14} />
                    <span>Cadastrar e disponibilizar horários</span>
                  </button>
                </div>

                {/* Calendário Horizontal Dinâmico com Destaque para a Semana Atual */}
                <div className="bg-card dark:bg-navy-800 p-3.5 rounded-squircle shadow-soft border border-slate-100 dark:border-slate-800 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-1 rounded-lg text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                        title="Mês anterior"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-xs font-black text-navy-900 dark:text-white flex items-center gap-1">
                        <CalendarIcon size={14} className="text-primary" />
                        {(() => {
                          const [y, m] = selectedAgendaMonth.split("-").map(Number);
                          const months = [
                            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                          ];
                          return `${months[m - 1]} ${y}`;
                        })()}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1 rounded-lg text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                        title="Próximo mês"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowMonthOverviewModal(true)}
                      className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 px-2.5 py-1 rounded-full transition-colors"
                      title="Ver Visão Geral do Mês"
                    >
                      <Eye size={12} strokeWidth={1.5} />
                      <span>Visão Geral</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between px-0.5">
                    <div className="flex items-center gap-2">
                      {mobileSelectedDate !== "todas" ? (
                        <button
                          type="button"
                          onClick={() => setMobileSelectedDate("todas")}
                          className="text-xs font-black text-primary hover:underline flex items-center gap-1.5 py-0.5"
                        >
                          <RotateCcw size={12} strokeWidth={2} /> Ver mês inteiro
                        </button>
                      ) : (
                        <span className="text-[11px] font-extrabold text-primary bg-primary/10 dark:bg-primary/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                          <CalendarIcon size={12} strokeWidth={2} /> Mês inteiro ({gymShifts.length} {gymShifts.length === 1 ? "horário" : "horários"})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1">
                    <button
                      type="button"
                      onClick={() => setMobileSelectedDate("todas")}
                      className={`flex-shrink-0 px-3 py-2.5 rounded-2xl text-xs font-black transition-all ${
                        mobileSelectedDate === "todas"
                          ? "bg-primary text-white shadow-xs"
                          : "bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      Todas
                    </button>

                    {(() => {
                      const [y, m] = selectedAgendaMonth.split("-").map(Number);
                      const daysInMonth = new Date(y, m, 0).getDate();
                      const weekdayShort = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
                      const today = new Date();

                      // Identifica os dias da semana atual do mês vigente
                      const isCurrentMonth =
                        (y === today.getFullYear() && m === today.getMonth() + 1) ||
                        (y === 2026 && m === 11);
                      const refTodayDay = isCurrentMonth
                        ? (y === today.getFullYear() && m === today.getMonth() + 1 ? today.getDate() : 11)
                        : null;

                      return Array.from({ length: daysInMonth }, (_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `${selectedAgendaMonth}-${String(dayNum).padStart(2, "0")}`;
                        const dateObj = new Date(y, m - 1, dayNum);
                        const dayOfWeek = weekdayShort[dateObj.getDay()];
                        const isToday = isCurrentMonth && dayNum === refTodayDay;
                        const isSel = mobileSelectedDate === dateStr;
                        const dayShifts = gymShifts.filter((s) => s.date === dateStr);
                        const hasShifts = dayShifts.length > 0;

                        return (
                          <button
                            key={dateStr}
                            ref={isToday ? mobileTodayButtonRef : null}
                            type="button"
                            onClick={() => setMobileSelectedDate(isSel ? "todas" : dateStr)}
                            className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[46px] h-14 rounded-2xl transition-all relative ${
                              isSel
                                ? "bg-primary text-white shadow-md border-2 border-white dark:border-navy-900 ring-2 ring-primary/50"
                                : isToday
                                ? "bg-primary/10 dark:bg-primary/20 text-primary border-2 border-primary font-black shadow-xs ring-1 ring-primary/30"
                                : "bg-slate-100 dark:bg-navy-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-800"
                            }`}
                          >
                            {isToday && (
                              <span className="absolute -top-1.5 px-1.5 py-0.2 rounded-full bg-primary text-white text-[7px] font-black uppercase tracking-tight shadow-2xs">
                                Hoje
                              </span>
                            )}
                            <span className={`text-[10px] font-bold ${
                              isSel ? "text-white/80" : isToday ? "text-primary dark:text-blue-400 font-extrabold" : "text-muted"
                            }`}>
                              {dayOfWeek}
                            </span>
                            <span className={`text-sm font-black leading-tight ${
                              isToday && !isSel ? "text-primary dark:text-blue-400" : ""
                            }`}>
                              {String(dayNum).padStart(2, "0")}
                            </span>
                            {hasShifts && (
                              <span
                                className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                                  isSel ? "bg-white" : "bg-primary"
                                }`}
                              />
                            )}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Lista de Horários em Cards Verticais Limpos */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                    Horários Cadastrados
                  </h3>

                  {(() => {
                    const list = gymShifts.filter(s => mobileSelectedDate === "todas" || s.date === mobileSelectedDate);
                    if (list.length === 0) {
                      return (
                        <div className="bg-card dark:bg-navy-800 p-6 rounded-squircle text-center border border-slate-100 dark:border-slate-800 space-y-2">
                          <CalendarIcon className="mx-auto text-slate-300 dark:text-slate-600" size={28} />
                          <p className="text-xs font-bold text-navy-900 dark:text-white">Nenhum horário para esta data</p>
                          <p className="text-[11px] text-muted dark:text-slate-400">Cadastre uma nova aula para abrir vagas.</p>
                        </div>
                      );
                    }

                    return list.map((shift) => {
                      const shiftProposals = gymProposals.filter(p => p.shiftId === shift.id);
                      const isConfirmed = shift.status === "confirmado";
                      const isCancelled = shift.status === "cancelado";
                      const isNegotiating = shift.status === "negociando" || (!isConfirmed && !isCancelled && shiftProposals.length > 0);
                      const confirmedProf = instructors.find(i => i.id === shift.confirmedInstructorId);
                      const cancelEligibility = canCancelShift(shift);

                      return (
                        <div
                          key={shift.id}
                          className="bg-card dark:bg-navy-800 p-4 rounded-squircle shadow-soft border border-slate-100 dark:border-slate-800 space-y-3"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-navy-900 dark:text-white">{shift.title}</span>
                                <span className="text-[10px] bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">
                                  {shift.modality}
                                </span>
                              </div>
                              <span className="text-[11px] text-muted dark:text-slate-400 block mt-0.5">
                                {formatDateDDMMAAAA(shift.date)} · {shift.startTime} – {shift.endTime}
                              </span>
                            </div>

                            {isConfirmed ? (
                              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800 px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1">
                                <CheckCircle size={11} /> Confirmado
                              </span>
                            ) : isCancelled ? (
                              <span className="text-[10px] bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800 px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1">
                                <XCircle size={11} strokeWidth={1.5} /> Cancelada
                              </span>
                            ) : isNegotiating ? (
                              <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800 px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1">
                                <Clock size={11} /> Negociando
                              </span>
                            ) : (
                              <span className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800 px-2.5 py-1 rounded-full font-extrabold">
                                Vaga Aberta
                              </span>
                            )}
                          </div>

                          {/* Informação adicional do turno */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex justify-between items-center text-xs">
                            <span className="text-muted dark:text-slate-400">Valor oferecido:</span>
                            <span className="font-black text-primary">R$ {shift.maxRate ?? (shift as any).rate ?? 45}/hora aula (Fixo)</span>
                          </div>

                          {/* Se cancelado, mostra dados do cancelamento */}
                          {isCancelled && (
                            <div className="p-2.5 bg-rose-50/60 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/50 space-y-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-rose-800 dark:text-rose-300 text-[11px]">
                                  {shift.cancelledBy === "academia" ? "Cancelada por Você" : "Cancelada pelo Professor"}
                                </span>
                                {shift.cancelledAt && (
                                  <span className="text-[10px] text-muted dark:text-slate-400">
                                    {formatDateDDMMAAAA(shift.cancelledAt)}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-700 dark:text-slate-300">
                                <strong className="font-bold">Motivo:</strong> {shift.cancellationReason || "Motivo não informado"}
                              </p>
                            </div>
                          )}

                          {/* Se confirmado ou realizada, mostra o professor e opção de cancelar */}
                          {(isConfirmed || shift.status === "realizada") && (confirmedProf || shift.confirmedInstructorName) && (() => {
                            const isDeleted = !confirmedProf || confirmedProf.isDeleted || (confirmedProf as any).isActive === false;
                            const profName = confirmedProf?.name || shift.confirmedInstructorName || "Professor";
                            const profCref = confirmedProf?.cref;

                            return (
                              <div className="space-y-2">
                                <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {confirmedProf?.avatar ? (
                                      <img src={confirmedProf.avatar} alt={profName} className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-navy-700 flex items-center justify-center text-slate-500 font-bold text-xs">
                                        {profName[0]}
                                      </div>
                                    )}
                                    <div>
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs font-bold text-navy-900 dark:text-white leading-tight">{profName}</span>
                                        {isDeleted && (
                                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-navy-700 px-1.5 py-0.2 rounded">
                                            (Usuário excluído)
                                          </span>
                                        )}
                                      </div>
                                      {profCref && (
                                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">{profCref}</span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-500">
                                    {shift.status === "realizada" ? "Realizada" : "Contratado"}
                                  </span>
                                </div>

                                {isConfirmed && cancelEligibility.canCancel && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShiftToCancel(shift);
                                      setShowCancelModal(true);
                                    }}
                                    className="w-full py-1.5 px-3 rounded-full border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-extrabold text-[11px] flex items-center justify-center gap-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                                  >
                                    <XCircle size={12} strokeWidth={1.5} />
                                    <span>Cancelar Aula Contratada</span>
                                  </button>
                                )}
                              </div>
                            );
                          })()}

                          {/* Botão de Recomendação Automática */}
                          {!isConfirmed && !isCancelled && (() => {
                            const recMatches = getRecommendedInstructorsForShift(shift, activeInstructors, "horarios", shifts, gyms);
                            const recCount = recMatches.filter((m) => m.isRecommended).length;

                            return (
                              <button
                                onClick={() => {
                                  setSelectedShiftForRecommendations(shift.id);
                                  setActiveMenu("professores");
                                }}
                                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-xs font-bold"
                              >
                                <div className="flex items-center gap-1.5">
                                  <Sparkles size={13} />
                                  <span>{recCount} {recCount === 1 ? "professor compatível" : "professores compatíveis"}</span>
                                </div>
                                <span className="text-[11px] font-extrabold underline">Ver Recomendados →</span>
                              </button>
                            );
                          })()}

                          {/* Se negociando, mostra atalho */}
                          {isNegotiating && !isConfirmed && (
                            <div className="flex justify-between items-center p-2.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-800/60">
                              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                                {shiftProposals.length} {shiftProposals.length === 1 ? "candidatura recebida" : "candidaturas recebidas"}
                              </span>
                              <button
                                onClick={() => setActiveMenu("propostas")}
                                className="text-xs font-bold text-primary hover:underline"
                              >
                                Ver Candidaturas →
                              </button>
                            </div>
                          )}

                          {/* Ação de Excluir Vaga Aberta/Vaga sem contratação */}
                          {!isConfirmed && !isCancelled && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleDeleteShiftClick(shift)}
                                className="text-[11px] font-bold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors"
                                title="Excluir horário vago da agenda"
                              >
                                <Trash2 size={13} strokeWidth={1.5} />
                                <span>Excluir Horário</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* ABA 2: PROPOSTAS (MOBILE) */}
            {activeMenu === "propostas" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-black text-navy-900 dark:text-white">Gerenciar Candidaturas</h2>
                  <p className="text-xs text-muted dark:text-slate-400">Analise e confirme professores pelo valor fixo da aula</p>
                </div>

                {/* Filtros de Propostas */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {[
                    { id: "todas", label: "Todas" },
                    { id: "pendente", label: "Pendentes" },
                    { id: "aceita", label: "Aceitas" },
                    { id: "recusada", label: "Recusadas" }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setProposalFilter(f.id as any)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        proposalFilter === f.id
                          ? "bg-primary text-white shadow-xs"
                          : "bg-card dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Lista de Propostas */}
                <div className="space-y-3">
                  {filteredProposals.length === 0 ? (
                    <div className="bg-card dark:bg-navy-800 p-8 rounded-squircle text-center border border-slate-100 dark:border-slate-800 space-y-2">
                      <Clock className="mx-auto text-slate-300 dark:text-slate-600" size={32} />
                      <p className="text-xs font-bold text-navy-900 dark:text-white">Nenhuma proposta nesta categoria</p>
                    </div>
                  ) : (
                    filteredProposals.map((proposal) => {
                      const shift = shifts.find(s => s.id === proposal.shiftId);
                      const instructor = instructors.find(i => i.id === proposal.instructorId);
                      if (!shift || !instructor) return null;

                      return (
                        <div
                          key={proposal.id}
                          className="bg-card dark:bg-navy-800 p-4 rounded-squircle shadow-soft border border-slate-100 dark:border-slate-800 space-y-3.5"
                        >
                          {/* Cabeçalho com o Turno */}
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">
                                {shift.modality} · {formatDateDDMMAAAA(shift.date)}
                              </span>
                              <h4 className="text-xs font-black text-navy-900 dark:text-white">{shift.title}</h4>
                              <span className="text-[11px] text-muted dark:text-slate-400">{shift.startTime} – {shift.endTime}</span>
                            </div>

                            <div className="text-right">
                              <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full block">
                                R$ {proposal.proposedRate}/h fixo
                              </span>
                              <span className="text-[10px] text-muted dark:text-slate-400 mt-1 block">
                                {proposal.type === "convite" ? "Convite enviado" : "Candidatura recebida"}
                              </span>
                            </div>
                          </div>

                          {/* Card do Professor com Avaliação 1 a 5 Estrelas */}
                          <div
                            onClick={() => setInstructorDetailModal(instructor)}
                            className="p-3 bg-slate-50 hover:bg-slate-100/80 dark:bg-navy-900/60 dark:hover:bg-navy-900/90 rounded-2xl flex items-center gap-3 border border-slate-100 dark:border-slate-700/60 cursor-pointer transition-colors group"
                            title="Ver detalhes e avaliações do professor"
                          >
                            <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-200 dark:bg-navy-700 shrink-0 border border-white dark:border-navy-700 flex items-center justify-center">
                              {instructor.avatar ? (
                                <img src={instructor.avatar} alt={instructor.name} className="w-full h-full object-cover" />
                              ) : (
                                <User size={22} className="text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h5 className="text-xs font-bold text-navy-900 dark:text-white truncate group-hover:text-primary transition-colors">{instructor.name}</h5>
                                <ChevronRight size={14} className="text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                              </div>
                              {(instructor.ratingCount || 0) > 0 ? (
                                <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold mt-0.5">
                                  <Star size={12} fill="currentColor" strokeWidth={1.5} />
                                  <span>{instructor.rating.toFixed(1)}</span>
                                  <span className="text-slate-400 font-normal">· {instructor.ratingCount} contratações</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                                  <Sparkles size={11} strokeWidth={1.5} />
                                  <span>Novo Professor · Sem avaliações</span>
                                </div>
                              )}
                              <span className="text-[10px] text-muted dark:text-slate-400 block truncate">{instructor.cref}</span>
                            </div>
                          </div>

                          {/* Ações da Proposta com Valor Fixo */}
                          {proposal.status === "pendente" && (
                            <div className="space-y-2 pt-1">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAcceptProposal(proposal.id)}
                                  className="flex-1 py-2.5 rounded-full text-xs font-extrabold bg-primary hover:bg-primary-hover text-white shadow-xs transition-all active:scale-95"
                                >
                                  Aprovar e Contratar (R$ {proposal.proposedRate}/h)
                                </button>
                                <button
                                  onClick={() => rejectProposal(proposal.id)}
                                  className="px-3 py-2.5 rounded-full text-xs font-bold text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                                >
                                  Recusar
                                </button>
                              </div>
                            </div>
                          )}

                          {proposal.status === "aceita" && (
                            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
                              <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-extrabold pb-1.5 border-b border-emerald-200/60 dark:border-emerald-800/40">
                                <span className="flex items-center gap-1">
                                  <ShieldCheck size={13} className="text-emerald-600" /> Contatos Liberados
                                </span>
                                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full">
                                  CREF Ativo
                                </span>
                              </div>
                              <div className="space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                                <div className="flex items-center gap-1.5">
                                  <Phone size={12} className="text-primary" />
                                  <span>{instructor.phone}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Mail size={12} className="text-primary" />
                                  <span className="truncate">{instructor.email}</span>
                                </div>
                                <div className="flex items-center justify-between bg-white dark:bg-navy-900 p-1.5 rounded-lg border border-emerald-100 dark:border-navy-700">
                                  <span className="text-[10px] text-muted dark:text-slate-400 font-bold">Pix:</span>
                                  <span className="font-mono text-[11px] font-bold text-navy-900 dark:text-white truncate">
                                    {instructor.pixKey || instructor.email}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1.5 pt-1">
                                <a
                                  href={`https://wa.me/55${instructor.phone.replace(/\D/g, "")}?text=Olá%20${encodeURIComponent(instructor.name)},%20sua%20aula%20foi%20confirmada%20na%20${encodeURIComponent(currentGym.name)}!`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] flex items-center justify-center gap-1 shadow-xs transition-colors"
                                >
                                  <MessageSquare size={12} />
                                  <span>WhatsApp</span>
                                </a>
                                {shift && shift.status === "confirmado" && (
                                  <button
                                    type="button"
                                    onClick={() => handleValidateAttendance(shift.id, instructor.name)}
                                    className={`flex-1 py-1.5 rounded-full text-white font-extrabold text-[10px] flex items-center justify-center gap-1 shadow-xs transition-colors ${
                                      shift.instructorCheckInAt
                                        ? "bg-primary hover:bg-primary-hover"
                                        : "bg-navy-900 hover:bg-navy-800"
                                    }`}
                                  >
                                    <CheckCheck size={12} />
                                    <span>{shift.instructorCheckInAt ? "Validar Presença" : "Validar Aula"}</span>
                                  </button>
                                )}
                                {shift && shift.status === "realizada" && (
                                  shift.instructorReviewedByGym ? (
                                    <div className="flex-1 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px] flex items-center justify-center gap-1">
                                      <CheckCheck size={12} className="text-emerald-600" />
                                      <span>Validada · Avaliado ★</span>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setReviewShift({ shift, instructor })}
                                      className="flex-1 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] flex items-center justify-center gap-1 shadow-xs transition-colors"
                                    >
                                      <Star size={12} strokeWidth={1.5} />
                                      <span>Avaliar Professor</span>
                                    </button>
                                  )
                                )}
                              </div>
                              {shift?.instructorCheckInAt && (
                                <div className="text-[10px] text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-xl mt-1.5 flex items-center gap-1 border border-primary/20">
                                  <Clock size={11} />
                                  <span>Professor iniciou a aula às {shift.instructorCheckInAt}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {proposal.status === "recusada" && (
                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-navy-700/60 text-center text-[11px] font-bold text-slate-500">
                              Candidatura Recusada
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ABA 3: PROFESSORES (MOBILE) */}
            {activeMenu === "professores" && (() => {
              const activeTargetShift = gymShifts.find(s => s.id === (selectedShiftForRecommendations || gymShifts[0]?.id));
              const shiftRecommendations = activeTargetShift
                ? getRecommendedInstructorsForShift(activeTargetShift, activeInstructors, recommendationSortBy, shifts, gyms)
                : [];

              return (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-black text-navy-900 dark:text-white">Professores & Recomendações</h2>
                    <p className="text-xs text-muted dark:text-slate-400">Recomendação automática baseada na grade de horários dos instrutores</p>
                  </div>

                  {inviteSuccessMsg && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border border-emerald-200/50">
                      <CheckCircle size={14} />
                      <span>{inviteSuccessMsg}</span>
                    </div>
                  )}

                  {/* Seletor de Turno para Recomendações */}
                  {gymShifts.length > 0 && (
                    <div className="bg-card dark:bg-navy-800 p-3.5 rounded-squircle shadow-soft border border-slate-100 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-extrabold text-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles size={13} className="text-primary" /> Turno para Recomendações
                        </label>
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          Fixo R$ {activeTargetShift?.maxRate ?? (activeTargetShift as any)?.rate ?? 45}/h
                        </span>
                      </div>

                      <select
                        value={activeTargetShift?.id || ""}
                        onChange={(e) => setSelectedShiftForRecommendations(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-navy-900 text-navy-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-primary"
                      >
                        {gymShifts.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title} ({s.date} · {s.startTime}–{s.endTime})
                          </option>
                        ))}
                      </select>

                      {/* Filtros de Ordenação das Recomendações */}
                      <div>
                        <span className="text-[10px] font-bold text-muted dark:text-slate-400 block mb-1.5">
                          Ordenar recomendações por:
                        </span>
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                          <button
                            onClick={() => setRecommendationSortBy("horarios")}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                              recommendationSortBy === "horarios"
                                ? "bg-primary text-white shadow-xs"
                                : "bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            ⏱️ Por Horários (Maior disponibilidade)
                          </button>
                          <button
                            onClick={() => setRecommendationSortBy("valores")}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                              recommendationSortBy === "valores"
                                ? "bg-primary text-white shadow-xs"
                                : "bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            💰 Por Valores (Menor taxa)
                          </button>
                          <button
                            onClick={() => setRecommendationSortBy("avaliacao")}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                              recommendationSortBy === "avaliacao"
                                ? "bg-primary text-white shadow-xs"
                                : "bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            ⭐ Por Avaliação
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lista de Recomendações Automáticas para o Turno */}
                  {activeTargetShift && shiftRecommendations.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-black text-navy-900 dark:text-white flex items-center gap-1.5">
                          <Sparkles size={13} className="text-primary" /> {shiftRecommendations.length} Professores Disponíveis
                        </span>
                        <span className="text-[10px] text-muted dark:text-slate-400">
                          {recommendationSortBy === "horarios" ? "Ordenado por horas livres" : recommendationSortBy === "valores" ? "Ordenado por menor taxa" : "Ordenado por nota"}
                        </span>
                      </div>

                      {shiftRecommendations.map((rec) => {
                        const inst = rec.instructor;
                        const alreadyInvited = proposals.some(
                          (p) => p.shiftId === activeTargetShift.id && p.instructorId === inst.id
                        );

                        return (
                          <div
                            key={inst.id}
                            className="bg-card dark:bg-navy-800 p-4 rounded-squircle shadow-soft border border-slate-100 dark:border-slate-800 space-y-3"
                          >
                            <div
                              onClick={() => setInstructorDetailModal(inst)}
                              className="flex items-center gap-3 cursor-pointer group"
                              title="Ver detalhes, avaliações e pilares do professor"
                            >
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-navy-700 shrink-0 border border-white dark:border-navy-700 flex items-center justify-center">
                                {inst.avatar ? (
                                  <img src={inst.avatar} alt={inst.name} className="w-full h-full object-cover" />
                                ) : (
                                  <User size={24} className="text-primary" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-black text-navy-900 dark:text-white truncate group-hover:text-primary transition-colors">{inst.name}</h4>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-black text-navy-900 dark:text-white">R$ {inst.hourlyRate || 45}/h</span>
                                    <ChevronRight size={13} className="text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">{inst.cref} (Ativo)</span>
                                {(inst.ratingCount || 0) > 0 ? (
                                  <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold mt-0.5">
                                    <Star size={12} fill="currentColor" strokeWidth={1.5} />
                                    <span>{inst.rating.toFixed(1)}</span>
                                    <span className="text-slate-400 font-normal">({inst.ratingCount} contratações)</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                                    <Sparkles size={11} strokeWidth={1.5} />
                                    <span>Novo Usuário · Sem avaliações</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Badge de Prioridade de Cobertura de Horário */}
                            <div className="flex flex-wrap gap-1.5">
                              {rec.isExactMatch ? (
                                <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-[10px] font-black flex items-center gap-1">
                                  <Sparkles size={11} className="text-amber-500 fill-amber-500" />
                                  ★ Intervalo Idêntico (1º Recomendado)
                                </span>
                              ) : rec.isFullMatch ? (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[10px] font-black flex items-center gap-1">
                                  <CheckCircle size={11} className="text-emerald-600" />
                                  Cobertura Total do Horário (100%)
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-primary border border-blue-200 dark:border-blue-800 text-[10px] font-black flex items-center gap-1">
                                  <Clock size={11} />
                                  Cobertura Parcial da Faixa ({rec.overlapHours}h compatíveis)
                                </span>
                              )}
                            </div>

                            {/* Badge de Horas e Compatibilidade */}
                            <div className="p-2.5 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 space-y-1">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="font-extrabold text-primary flex items-center gap-1">
                                  <Sparkles size={11} /> {rec.overlapHours}h compatíveis ({rec.matchScore}% do turno)
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                  {rec.dayName}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-600 dark:text-slate-300 block truncate">
                                Grade disponível: {rec.matchingSlotsText}
                              </span>
                            </div>

                            {/* Alerta de Conflito de Horário / Deslocamento */}
                            {rec.hasConflict && (
                              <div className={`p-2 rounded-xl text-[10px] font-semibold flex items-start gap-1.5 border ${
                                rec.conflictType === "overlap"
                                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50"
                                  : "bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900/50"
                              }`}>
                                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                                <span>{rec.conflictMessage}</span>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                              {inst.modalities.map((m) => (
                                <span key={m} className="bg-slate-100 dark:bg-navy-700 px-2 py-0.5 rounded-full">
                                  {m}
                                </span>
                              ))}
                            </div>

                            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex justify-between items-center">
                              <div className="text-[10px]">
                                <span className="text-muted dark:text-slate-400 block">Valor Fixo da Vaga:</span>
                                <span className="font-extrabold text-navy-900 dark:text-white">R$ {activeTargetShift.maxRate ?? (activeTargetShift as any).rate ?? 45}/h</span>
                              </div>

                              {rec.hasConflict ? (
                                <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-navy-700 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700">
                                  {rec.conflictType === "overlap" ? "Conflito de Horário" : "Deslocamento Curto"}
                                </span>
                              ) : alreadyInvited ? (
                                <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-navy-700 text-slate-500">
                                  Convite Enviado
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleInviteTeacher(activeTargetShift.id, inst.id, inst.name)}
                                  className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-primary text-white hover:bg-primary-hover shadow-xs transition-all active:scale-95"
                                >
                                  Convidar para Vaga
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Input de Busca Geral */}
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-muted dark:text-slate-400 block mb-2 uppercase tracking-wider">
                      Todos os Professores Cadastrados
                    </span>
                    <div className="relative">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={mobileSearchTeacher}
                        onChange={(e) => setMobileSearchTeacher(e.target.value)}
                        placeholder="Buscar por nome ou modalidade..."
                        className="w-full pl-9 pr-4 py-2.5 bg-card dark:bg-navy-800 rounded-full text-xs text-navy-900 dark:text-white border border-slate-100 dark:border-slate-800 focus:outline-primary"
                      />
                    </div>
                  </div>

                  {/* Lista Geral de Professores */}
                  <div className="space-y-3">
                    {activeInstructors
                      .filter(i => 
                        mobileSearchTeacher === "" ||
                        i.name.toLowerCase().includes(mobileSearchTeacher.toLowerCase()) ||
                        i.modalities.some(m => m.toLowerCase().includes(mobileSearchTeacher.toLowerCase()))
                      )
                      .map((inst) => (
                        <div
                          key={inst.id}
                          className="bg-card dark:bg-navy-800 p-4 rounded-squircle shadow-soft border border-slate-100 dark:border-slate-800 space-y-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-navy-700 shrink-0 border border-white dark:border-navy-700 flex items-center justify-center">
                              {inst.avatar ? (
                                <img src={inst.avatar} alt={inst.name} className="w-full h-full object-cover" />
                              ) : (
                                <User size={24} className="text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-navy-900 dark:text-white truncate">{inst.name}</h4>
                                <span className="text-xs font-black text-navy-900 dark:text-white">R$ {inst.hourlyRate || 45}/h</span>
                              </div>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">{inst.cref} (Ativo)</span>
                              {(inst.ratingCount || 0) > 0 ? (
                                <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold mt-0.5">
                                  <Star size={12} fill="currentColor" />
                                  <span>{inst.rating.toFixed(1)}</span>
                                  <span className="text-slate-400 font-normal">({inst.ratingCount} contratações)</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                                  <Sparkles size={11} />
                                  <span>Novo Professor · Sem avaliações</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            {inst.modalities.map(m => (
                              <span key={m} className="bg-slate-100 dark:bg-navy-700 px-2.5 py-0.5 rounded-full">
                                {m}
                              </span>
                            ))}
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex justify-between items-center">
                            <span className="text-[11px] text-muted dark:text-slate-400">Vitória · 4 km</span>
                            <button
                              onClick={() => {
                                setNewTitle(`${inst.modalities[0] || "Musculação"} - Convite`);
                                setNewModality(inst.modalities[0] || "Musculação");
                                setShowNewShiftModal(true);
                              }}
                              className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-primary text-white hover:bg-primary-hover shadow-xs transition-all"
                            >
                              Convidar para Vaga
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })()}

            {/* ABA 4: PERFIL (MOBILE) */}
            {activeMenu === "perfil" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-black text-navy-900 dark:text-white">Perfil da Academia</h2>
                  <p className="text-xs text-muted dark:text-slate-400">Dados cadastrais, fotos e modalidades da unidade</p>
                </div>

                {profileSuccessMsg && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border border-emerald-200/50">
                    <CheckCircle size={14} />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                {/* Fotos da Academia com Botões de Crop */}
                <div className="bg-card dark:bg-navy-800 p-4 rounded-squircle shadow-soft border border-slate-100 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">Identidade Visual</h4>
                  
                  {/* Fachada 16:9 */}
                  <div className="relative h-28 rounded-2xl overflow-hidden bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-slate-700">
                    <img src={profileFacade} alt="Fachada" className="w-full h-full object-cover" />
                    <button
                      onClick={() => openCropWithCurrent("facade")}
                      className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 hover:bg-black/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs transition-colors"
                    >
                      <Crop size={12} />
                      <span>Crop Fachada (16:9)</span>
                    </button>
                  </div>

                  {/* Logo Circular */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-navy-900 p-0.5 border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 shadow-xs flex items-center justify-center">
                      {profileLogo ? (
                        <img src={profileLogo} alt="Logo" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <Building2 size={24} className="text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-bold text-navy-900 dark:text-white block">{profileName}</span>
                      <button
                        onClick={() => openCropWithCurrent("logo")}
                        className="mt-1 flex items-center gap-1 text-primary text-[11px] font-bold hover:underline"
                      >
                        <Crop size={12} />
                        <span>Recortar Logotipo Circular</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modalidades com Botão Nova Modalidade */}
                <div className="bg-card dark:bg-navy-800 p-4 rounded-squircle shadow-soft border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">Modalidades Ativas</h4>
                    <button
                      onClick={() => {
                        setCustomModalityInput("");
                        setShowNewModalityModal(true);
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <Plus size={13} />
                      <span>Nova</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {profileModalities.map(m => (
                      <span key={m} className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tabela de Valores de Hora-Aula por Modalidade e Horários (Item 5) */}
                <div className="bg-card dark:bg-navy-800 p-4 rounded-squircle shadow-soft border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-primary flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                        Tabela de Valores de Hora-Aula
                      </h4>
                      <p className="text-[10px] text-muted dark:text-slate-400">
                        Valores padrão por modalidade e adicionais de horário
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="text-[11px] font-bold text-navy-900 dark:text-white block">
                      Valor Base por Modalidade (R$/h)
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(pricingModalityRates).map(([mod, rate]) => (
                        <div key={mod} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200/60 dark:border-slate-700/60">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[85px]">{mod}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">R$</span>
                            <input
                              type="number"
                              value={rate}
                              onChange={(e) => setPricingModalityRates({
                                ...pricingModalityRates,
                                [mod]: Number(e.target.value)
                              })}
                              className="w-12 p-1 text-right font-black text-xs bg-white dark:bg-navy-800 text-navy-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-primary"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <label className="text-[11px] font-bold text-navy-900 dark:text-white block">
                      Adicionais por Horário e Dia
                    </label>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200/60 dark:border-slate-700/60">
                        <div>
                          <span className="font-bold text-navy-900 dark:text-white block">Horário Noturno / Pico</span>
                          <span className="text-[10px] text-muted dark:text-slate-400">A partir das 18:00</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-primary">+ R$</span>
                          <input
                            type="number"
                            value={pricingPeakHourAddition}
                            onChange={(e) => setPricingPeakHourAddition(Number(e.target.value))}
                            className="w-12 p-1 text-right font-black text-xs bg-white dark:bg-navy-800 text-navy-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-primary"
                          />
                          <span className="text-[10px] text-slate-400">/h</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200/60 dark:border-slate-700/60">
                        <div>
                          <span className="font-bold text-navy-900 dark:text-white block">Fins de Semana</span>
                          <span className="text-[10px] text-muted dark:text-slate-400">Sábado e Domingo</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-primary">+ R$</span>
                          <input
                            type="number"
                            value={pricingWeekendAddition}
                            onChange={(e) => setPricingWeekendAddition(Number(e.target.value))}
                            className="w-12 p-1 text-right font-black text-xs bg-white dark:bg-navy-800 text-navy-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-primary"
                          />
                          <span className="text-[10px] text-slate-400">/h</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSavePricing}
                    className="w-full py-2.5 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                  >
                    Salvar Regras de Precificação
                  </button>
                </div>

                {/* Dados da Unidade */}
                <div className="bg-card dark:bg-navy-800 p-4 rounded-squircle shadow-soft border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <h4 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider mb-2">Dados da Unidade</h4>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                    <span className="text-muted dark:text-slate-400">CNPJ:</span>
                    <span className="font-bold text-navy-900 dark:text-white">{profileCnpj}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                    <span className="text-muted dark:text-slate-400">Telefone:</span>
                    <span className="font-bold text-navy-900 dark:text-white">{profilePhone}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                    <span className="text-muted dark:text-slate-400">Endereço:</span>
                    <span className="font-bold text-navy-900 dark:text-white truncate max-w-[200px] text-right">{profileAddress}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted dark:text-slate-400">Responsável:</span>
                    <span className="font-bold text-navy-900 dark:text-white">{profileManagerName}</span>
                  </div>
                </div>

                {/* Plano da Academia */}
                <div className="bg-card dark:bg-navy-800 p-4 rounded-squircle shadow-soft border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-black text-navy-900 dark:text-white block">Plano Atual: {gymPlan.toUpperCase()}</span>
                      <span className="text-[11px] text-muted dark:text-slate-400">
                        {isFirstHireFreeUsed ? `${hiresThisMonth} contratações neste mês` : "1ª contratação gratuita ativa"}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowSubscriptionModal(true)}
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      Mudar Plano
                    </button>
                  </div>
                </div>

                {/* Card de Usuário Logado & Log Off (Mobile) */}
                <div className="bg-card dark:bg-navy-800 p-4 rounded-squircle shadow-soft border border-slate-100 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">Conta Conectada</h4>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm flex-shrink-0">
                      {(userName || profileManagerName || "CE").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-black text-navy-900 dark:text-white truncate">
                        {userName || profileManagerName || "Carlos Eduardo Silva"}
                      </h5>
                      <p className="text-[10px] text-muted dark:text-slate-400 truncate">
                        {userEmail || "carlos.silva@mova.com.br"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          Plano {gymPlan.toUpperCase()}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                          Gestor da Unidade
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => logout()}
                    className="w-full py-2.5 px-4 rounded-full border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors active:scale-95"
                  >
                    <LogOut size={14} />
                    <span>Sair da Conta (Log Off)</span>
                  </button>
                </div>
              </div>
            )}

            {/* ABA 5: ASSINATURA & PLANOS (MOBILE) */}
            {activeMenu === "assinatura" && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-navy-900 dark:text-white">Planos de Assinatura</h2>
                    <p className="text-xs text-muted dark:text-slate-400">
                      O cadastro e a 1ª contratação são 100% gratuitos. Escolha o plano ideal.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveMenu("perfil")}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    ← Voltar
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Grátis (Informativo) */}
                  {gymPlan === "gratis" && (
                    <div className="p-4 rounded-squircle border border-slate-200 dark:border-slate-700 bg-card dark:bg-navy-800 space-y-2 shadow-soft">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-navy-900 dark:text-white">Plano Grátis</h3>
                        <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">Plano Ativo</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {isFirstHireFreeUsed ? "1ª contratação gratuita já realizada" : "1ª contratação gratuita ativa para teste."}
                      </p>
                    </div>
                  )}

                  {/* Essencial */}
                  <div className="p-4 rounded-squircle border border-slate-200 dark:border-slate-700 bg-card dark:bg-navy-800 space-y-2.5 shadow-soft">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-navy-900 dark:text-white">Essencial</h3>
                      <span className="text-sm font-black text-navy-900 dark:text-white">R$ 89<span className="text-[10px] text-muted font-normal">/mês</span></span>
                    </div>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      <li>✓ Até 4 contratações por mês</li>
                      <li>✓ 1 unidade / 1 gestor</li>
                      <li>✓ Liberação imediata de contatos</li>
                    </ul>
                    <button
                      type="button"
                      onClick={() => subscribePlan("essencial")}
                      className={`w-full py-2 rounded-full text-xs font-bold transition-colors ${
                        gymPlan === "essencial"
                          ? "bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300 cursor-default"
                          : "bg-primary text-white hover:bg-primary-hover"
                      }`}
                    >
                      {gymPlan === "essencial" ? "Plano Ativo" : "Assinar Essencial"}
                    </button>
                  </div>

                  {/* Pro */}
                  <div className="p-4 rounded-squircle border-2 border-primary bg-primary/5 dark:bg-primary/10 space-y-2.5 relative shadow-soft">
                    <span className="absolute -top-2.5 right-4 bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                      MAIS POPULAR
                    </span>
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-navy-900 dark:text-white">Pro</h3>
                      <span className="text-sm font-black text-primary">R$ 189<span className="text-[10px] text-muted font-normal">/mês</span></span>
                    </div>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      <li>✓ Até 15 contratações por mês</li>
                      <li>✓ 1 unidade / 3 gestores</li>
                      <li>✓ Turnos urgentes SOS com destaque</li>
                    </ul>
                    <button
                      type="button"
                      onClick={() => subscribePlan("pro")}
                      className={`w-full py-2 rounded-full text-xs font-bold transition-colors ${
                        gymPlan === "pro"
                          ? "bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300 cursor-default"
                          : "bg-primary text-white hover:bg-primary-hover shadow-sm"
                      }`}
                    >
                      {gymPlan === "pro" ? "Plano Ativo" : "Assinar Pro"}
                    </button>
                  </div>

                  {/* Rede */}
                  <div className="p-4 rounded-squircle border border-slate-200 dark:border-slate-700 bg-card dark:bg-navy-800 space-y-2.5 shadow-soft">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-navy-900 dark:text-white">Rede</h3>
                      <span className="text-xs font-black text-navy-900 dark:text-white">A partir de R$ 390<span className="text-[10px] text-muted font-normal">/mês</span></span>
                    </div>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      <li>✓ Contratações ilimitadas</li>
                      <li>✓ Múltiplas unidades e gestores</li>
                    </ul>
                    <button
                      type="button"
                      onClick={() => subscribePlan("rede")}
                      className={`w-full py-2 rounded-full text-xs font-bold transition-colors ${
                        gymPlan === "rede"
                          ? "bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300 cursor-default"
                          : "bg-navy-900 dark:bg-primary text-white hover:opacity-90"
                      }`}
                    >
                      {gymPlan === "rede" ? "Plano Ativo" : "Assinar Plano Rede"}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Bar Mobile Fixa (Somente Celular: < 768px) */}
          <nav
            aria-label="Navegação da Academia Mobile"
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto md:hidden z-40 bg-card/95 dark:bg-navy-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-700/60 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex justify-around items-center transition-colors duration-200"
          >
            <button
              onClick={() => setActiveMenu("turnos")}
              className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
                activeMenu === "turnos" ? "text-primary" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              <CalendarIcon size={18} />
              <span>Agenda</span>
            </button>
            <button
              onClick={() => setActiveMenu("propostas")}
              className={`flex flex-col items-center gap-1 text-[11px] font-bold relative transition-colors ${
                activeMenu === "propostas" ? "text-primary" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              <Clock size={18} />
              <span>Propostas</span>
              {gymProposals.some(p => p.status === "pendente") && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-white dark:ring-navy-900" />
              )}
            </button>
            <button
              onClick={() => setActiveMenu("professores")}
              className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
                activeMenu === "professores" ? "text-primary" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              <Users size={18} />
              <span>Professores</span>
            </button>
            <button
              onClick={() => setActiveMenu("perfil")}
              className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
                activeMenu === "perfil" ? "text-primary" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              <Building size={18} />
              <span>Perfil</span>
            </button>
          </nav>
        </div>

        {/* ===================== PAINEL WEB (TABLETS E DESKTOPS: >= 768px) ===================== */}
        <div className="hidden md:flex w-full min-h-screen flex-row flex-1">
          {/* SIDEBAR WEB */}
          <aside
            aria-label="Menu Principal da Academia"
            className="w-full md:w-72 bg-card dark:bg-navy-800 p-5 md:h-screen md:sticky md:top-0 flex flex-col justify-between shadow-soft border-r border-slate-100 dark:border-slate-800 z-20 shrink-0"
          >
            {/* PARTE SUPERIOR DA SIDEBAR (SCROLLÁVEL SE A TELA FOR BAIXA) */}
            <div className="space-y-5 w-full overflow-y-auto no-scrollbar">
              {/* Logo e Foto da Unidade */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-primary text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                      TM
                    </div>
                    <div>
                      <span className="font-extrabold text-base text-navy-900 dark:text-white tracking-tight block leading-tight">TrainerMatch</span>
                      <span className="text-[10px] text-muted dark:text-slate-400 font-medium">Portal da Academia</span>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setActiveMenu("perfil")}
                  className="relative h-24 rounded-squircle-sm overflow-hidden bg-slate-100 dark:bg-navy-900 shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer group"
                  title="Clique para editar dados da academia"
                >
                  <img src={currentGym.facadeUrl} alt="Fachada" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/20 to-transparent flex items-end p-2.5 justify-between">
                    <span className="text-white text-xs font-bold truncate">{currentGym.name}</span>
                    <span className="text-[10px] text-primary-light font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Editar perfil</span>
                  </div>
                </div>
              </div>

              {/* Menus da Sidebar */}
              <nav aria-label="Navegação da Academia" className="space-y-1.5 text-xs font-bold">
                <button
                  onClick={() => setActiveMenu("turnos")}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-squircle-sm transition-all ${
                    activeMenu === "turnos"
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700"
                  }`}
                >
                  <CalendarIcon size={16} />
                  Agenda & Escala
                  <span className="ml-auto bg-slate-100 dark:bg-navy-900/60 text-slate-600 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-full">
                    {gymShifts.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveMenu("propostas")}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-squircle-sm transition-all ${
                    activeMenu === "propostas"
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700"
                  }`}
                >
                  <Clock size={16} />
                  Gerenciar Propostas
                  {gymProposals.length > 0 && (
                    <span className="ml-auto bg-primary-subtle dark:bg-primary/20 text-primary text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {gymProposals.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveMenu("professores")}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-squircle-sm transition-all ${
                    activeMenu === "professores"
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700"
                  }`}
                >
                  <Users size={16} />
                  Buscar Professores
                </button>

                <button
                  onClick={() => setActiveMenu("assinatura")}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-squircle-sm transition-all ${
                    activeMenu === "assinatura"
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700"
                  }`}
                >
                  <CreditCard size={16} />
                  Assinatura & Planos
                </button>

                <button
                  onClick={() => setActiveMenu("perfil")}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-squircle-sm transition-all ${
                    activeMenu === "perfil"
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700"
                  }`}
                >
                  <Building size={16} />
                  Perfil da Unidade
                </button>
              </nav>
            </div>

            {/* PARTE INFERIOR FIXA DA SIDEBAR: PLANO CONTRATADO E USUÁRIO LOGADO COM LOG OFF (SEM ROLAGEM) */}
            <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60 space-y-3 mt-auto shrink-0">
              {/* Card do Plano Contratado */}
              <div className="bg-primary/5 dark:bg-primary/10 p-3 rounded-2xl border border-primary/15 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted dark:text-slate-400 uppercase tracking-wider">
                    Plano Contratado
                  </span>
                  <span className="text-[10px] font-extrabold text-primary flex items-center gap-1 bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-full capitalize">
                    <ShieldCheck size={11} className="text-primary" />
                    {gymPlan === "gratis" ? "Plano Grátis" : gymPlan === "essencial" ? "Plano Essencial" : gymPlan === "pro" ? "Plano Pro" : "Plano Rede"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-tight">
                  {gymPlan === "gratis"
                    ? isFirstHireFreeUsed ? "1 contratação realizada" : "1ª contratação gratuita ativa"
                    : `${hiresThisMonth} contratações neste mês`}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveMenu("assinatura")}
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 pt-0.5"
                >
                  Gerenciar plano →
                </button>
                <button
                  type="button"
                  onClick={() => setShowOnboarding(true)}
                  className="text-[11px] font-bold text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary flex items-center gap-1 pt-1"
                >
                  <HelpCircle size={12} />
                  Como Funciona o App
                </button>
              </div>

              {/* Card do Usuário Logado + Botão de Log Off */}
              <div className="bg-slate-50 dark:bg-navy-900/80 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs ring-2 ring-primary/20 shrink-0">
                    {(currentGym.managerName || userName || "GE").split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0 text-left">
                    <span className="font-extrabold text-navy-900 dark:text-white text-xs truncate block leading-tight">
                      {currentGym.managerName || userName}
                    </span>
                    <span className="text-[10px] text-muted dark:text-slate-400 truncate block leading-tight">
                      {currentGym.managerRole || "Gestão da Unidade"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => logout()}
                  title="Sair da Conta (Log off)"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-all shrink-0 active:scale-95 border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </aside>

          {/* MAIN DESKTOP */}
          <main className="flex-1 p-5 md:p-8 space-y-6 overflow-y-auto pb-10">
            {/* Topo / Header com controles */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white">{currentGym.name}</h1>
                  <span className="bg-primary/10 text-primary text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    Unidade Ativa
                  </span>
                </div>
                <p className="text-xs text-muted dark:text-slate-400 mt-0.5">
                  {currentGym.neighborhood} · {currentGym.city} — Gestão de Escala, Vagas e Contratações
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-2.5">

                <button
                  onClick={toggleDarkMode}
                  className="bg-card dark:bg-navy-800 border border-slate-200 dark:border-slate-700 text-xs font-bold px-3 py-2 rounded-full shadow-xs hover:bg-slate-50 dark:hover:bg-navy-700 text-navy-900 dark:text-white transition-all"
                >
                  {isDarkMode ? "☀️ Claro" : "🌙 Escuro"}
                </button>

                <button
                  onClick={() => {
                    setShowHireWizard(true);
                    setHireWizardStep(1);
                  }}
                  className="flex items-center bg-gradient-to-r from-primary to-blue-600 hover:from-primary-hover hover:to-blue-700 text-white text-xs font-black px-4 py-2 rounded-full shadow-md transition-all active:scale-95"
                >
                  Quero contratar um(a) instrutor(a)
                </button>

                <button
                  onClick={() => {
                    setNewDate("2026-11-08");
                    setShowNewShiftModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold px-4 py-2 rounded-full shadow-xs transition-all active:scale-95"
                >
                  <Plus size={15} />
                  Cadastrar e disponibilizar horários
                </button>
              </div>
            </div>

            {/* BANNER DE DESTAQUE: PROFESSOR INICIOU AULA (DESKTOP) */}
            {pendingCheckInShifts.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-primary/10 border-2 border-emerald-500/80 p-4 rounded-2xl shadow-md space-y-3 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Bell size={18} className="animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-0.5 rounded-full">
                          {pendingCheckInShifts.length === 1 ? "1 Aula Iniciada" : `${pendingCheckInShifts.length} Aulas Iniciadas`}
                        </span>
                        <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <Clock size={12} /> Presença Aguardando Validação da Academia
                        </span>
                      </div>
                      <p className="text-xs font-bold text-navy-900 dark:text-white mt-0.5">
                        O professor confirmou que iniciou a aula na unidade. Valide a presença para confirmar a realização:
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {pendingCheckInShifts.map((shift) => {
                    const instructor = instructors.find((i) => i.id === shift.confirmedInstructorId);
                    return (
                      <div
                        key={shift.id}
                        className="bg-white/95 dark:bg-navy-800/95 p-3 rounded-xl border border-emerald-300 dark:border-emerald-700/80 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 dark:bg-navy-700 shrink-0 border border-emerald-400 flex items-center justify-center">
                            {instructor?.avatar ? (
                              <img
                                src={instructor.avatar}
                                alt={instructor?.name || "Professor"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={18} className="text-primary" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-navy-900 dark:text-white truncate">
                                {instructor?.name || "Professor"}
                              </span>
                              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded-md shrink-0">
                                {shift.modality}
                              </span>
                            </div>
                            <div className="text-[11px] text-muted dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>{formatDateDDMMAAAA(shift.date)} · {shift.startTime} – {shift.endTime}</span>
                              <span>•</span>
                              <span className="text-emerald-700 dark:text-emerald-400 font-black">
                                Check-in às {shift.instructorCheckInAt}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleValidateAttendance(shift.id, instructor?.name)}
                          className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0"
                        >
                          <CheckCheck size={14} />
                          <span>Validar Presença</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* ===================== ABA 1: AGENDA (MÊS COMPLETO & SEMANAL) ===================== */}
          {activeMenu === "turnos" && (
            <div className="space-y-6">
              
              {/* Barra Superior da Agenda: Modos de Visualização (Esquerda), Legendas (Ao Lado) e Dropdown de Mês (Direita) */}
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-card dark:bg-navy-800 p-4 rounded-squircle shadow-soft border border-slate-100 dark:border-slate-800">
                
                {/* LADO ESQUERDO: Botões de Visão + Legendas ao lado */}
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  {/* Botões de Visão (Visão Mensal vs Grade Semanal) */}
                  <div className="flex bg-slate-100 dark:bg-navy-900 p-1 rounded-full text-xs font-bold border border-slate-200/60 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setScheduleViewMode("mes")}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all ${
                        scheduleViewMode === "mes"
                          ? "bg-white dark:bg-navy-800 text-primary shadow-xs font-black"
                          : "text-slate-600 dark:text-slate-300 hover:text-navy-900"
                      }`}
                    >
                      <CalendarIcon size={13} />
                      <span>Visão Mensal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleViewMode("semana")}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all ${
                        scheduleViewMode === "semana"
                          ? "bg-white dark:bg-navy-800 text-primary shadow-xs font-black"
                          : "text-slate-600 dark:text-slate-300 hover:text-navy-900"
                      }`}
                    >
                      <Clock size={13} />
                      <span>Grade Semanal</span>
                    </button>
                  </div>

                  {/* Legendas de Status ao lado dos botões */}
                  <div className="flex items-center gap-2.5 text-[11px] font-bold">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Confirmado
                    </span>
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <span className="w-2 h-2 rounded-full bg-primary" /> Negociando
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Em Aberto
                    </span>
                    {selectedAgendaMonth < "2026-11" && (
                      <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 font-extrabold text-[10px]">
                        <CheckCheck size={11} className="text-emerald-600" /> Realizadas
                      </span>
                    )}
                  </div>
                </div>

                {/* LADO DIREITO: Controles de Navegação de Mês (< Mês Anterior, Dropdown de Meses, Próximo Mês >) */}
                <div className="flex items-center gap-1.5 self-start lg:self-auto">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-navy-900 text-slate-600 dark:text-slate-300 hover:text-navy-900 hover:bg-slate-100 dark:hover:bg-navy-700 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
                    title="Mês anterior"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <div className="relative flex items-center">
                    <div className="absolute left-3 pointer-events-none text-primary">
                      <CalendarIcon size={14} />
                    </div>
                    <select
                      value={selectedAgendaMonth}
                      onChange={(e) => setSelectedAgendaMonth(e.target.value)}
                      aria-label="Selecionar Mês da Agenda"
                      className="pl-9 pr-8 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-navy-900 text-navy-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-xs outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:border-primary/50 transition-all appearance-none"
                    >
                      <option value="2026-08">Agosto 2026</option>
                      <option value="2026-09">Setembro 2026 (Realizadas)</option>
                      <option value="2026-10">Outubro 2026 (Realizadas)</option>
                      <option value="2026-11">Novembro 2026 (Atual)</option>
                      <option value="2026-12">Dezembro 2026</option>
                      <option value="2027-01">Janeiro 2027</option>
                      <option value="2027-02">Fevereiro 2027</option>
                      <option value="2027-03">Março 2027</option>
                    </select>
                    <div className="absolute right-2.5 pointer-events-none text-slate-400">
                      <ChevronRight size={13} className="rotate-90" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-navy-900 text-slate-600 dark:text-slate-300 hover:text-navy-900 hover:bg-slate-100 dark:hover:bg-navy-700 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
                    title="Próximo mês"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

              </div>

              {/* CONTEÚDO DA AGENDA: VISÃO MENSAL DINÂMICA / ESCALA SEMANAL / RELATÓRIO AUDITADO */}
              {(() => {
                const [calYear, calMonth] = selectedAgendaMonth.split("-").map(Number);
                const monthDate = new Date(calYear, calMonth - 1, 1);
                const daysInMonth = new Date(calYear, calMonth, 0).getDate();
                const rawFirstDay = monthDate.getDay(); // 0 = Domingo, 1 = Segunda...
                const firstDayOfWeek = (rawFirstDay + 6) % 7; // 0 = Segunda, 1 = Terça ... 6 = Domingo
                const daysInPrevMonth = new Date(calYear, calMonth - 1, 0).getDate();
                const trailingDaysCount = (7 - ((firstDayOfWeek + daysInMonth) % 7)) % 7;

                const monthNamesPt = [
                  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                ];
                const displayMonthName = monthNamesPt[calMonth - 1] || "Mês";
                const isPastClosedMonth = selectedAgendaMonth < "2026-11";

                const currentMonthShifts = shifts.filter(
                  (s) => s.gymId === activeGymId && s.date.startsWith(selectedAgendaMonth)
                );

                const todaySystem = new Date();
                const isCurrentMonthActive =
                  (calYear === todaySystem.getFullYear() && calMonth === todaySystem.getMonth() + 1) ||
                  (calYear === 2026 && calMonth === 11);
                const refTodayDay = isCurrentMonthActive
                  ? (calYear === todaySystem.getFullYear() && calMonth === todaySystem.getMonth() + 1 ? todaySystem.getDate() : 11)
                  : null;



                return (
                  <div className="space-y-4">
                    {/* Se for mês anterior fechado/auditado, exibe banner com alternador de Grade vs Relatório */}
                    {isPastClosedMonth && (
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <CheckCheck className="text-emerald-500 shrink-0" size={20} />
                          <div>
                            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                              Mês Fechado e Auditado — {displayMonthName} {calYear}
                            </span>
                            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/70">
                              Alterne entre a grade do calendário com os dias exatos do mês ou o relatório analítico consolidado.
                            </p>
                          </div>
                        </div>

                        <div className="flex bg-white dark:bg-navy-800 p-1 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold self-start sm:self-auto shrink-0 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => setHistoryViewTab("calendario")}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                              historyViewTab === "calendario"
                                ? "bg-primary text-white shadow-xs"
                                : "text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white"
                            }`}
                          >
                            📅 Grade do Calendário
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistoryViewTab("relatorio")}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                              historyViewTab === "relatorio"
                                ? "bg-primary text-white shadow-xs"
                                : "text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white"
                            }`}
                          >
                            📋 Relatório Auditado
                          </button>
                        </div>
                      </div>
                    )}

                    {/* SE ESTIVER EM MÊS ANTERIOR E OPÇÃO "RELATÓRIO", MOSTRA O PAINEL DE AUDITORIA */}
                    {isPastClosedMonth && historyViewTab === "relatorio" ? (
                      <div className="bg-card dark:bg-navy-800 rounded-squircle p-6 shadow-soft border border-slate-100 dark:border-slate-800 space-y-6">
                        {/* Cabeçalho do Histórico */}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-700">
                          <div>
                            <h2 className="text-base font-extrabold text-navy-900 dark:text-white flex items-center gap-2">
                              <CheckCheck className="text-emerald-500" size={18} />
                              Histórico de Aulas Realizadas — {displayMonthName} {calYear}
                            </h2>
                            <p className="text-xs text-muted dark:text-slate-400">
                              Registro auditado de todas as aulas ministradas e confirmadas na unidade
                            </p>
                          </div>
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 self-start sm:self-auto">
                            ✓ Mês Fechado e Auditado
                          </span>
                        </div>

                        {/* Cards de Métricas do Mês */}
                        {(() => {
                          const monthCompletedShifts = shifts.filter(
                            (s) => s.gymId === activeGymId && s.date.startsWith(selectedAgendaMonth) && s.status === "realizada"
                          );
                          const totalHours = monthCompletedShifts.reduce((acc, s) => {
                            const [sh, sm] = s.startTime.split(":").map(Number);
                            const [eh, em] = s.endTime.split(":").map(Number);
                            return acc + Math.max(1, (eh * 60 + em - (sh * 60 + sm)) / 60);
                          }, 0);
                          const totalInvested = monthCompletedShifts.reduce(
                            (acc, s) => acc + (s.agreedRate || s.maxRate || (s as any).rate || 45) * 3,
                            0
                          );
                          const uniqueInstructors = Array.from(
                            new Set(monthCompletedShifts.map((s) => s.confirmedInstructorId).filter(Boolean))
                          );

                          return (
                            <>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-slate-700/60 text-center">
                                  <span className="text-[11px] font-bold text-muted dark:text-slate-400 uppercase tracking-wider block">
                                    Aulas Realizadas
                                  </span>
                                  <span className="text-2xl font-black text-navy-900 dark:text-white mt-1 block">
                                    {monthCompletedShifts.length}
                                  </span>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-slate-700/60 text-center">
                                  <span className="text-[11px] font-bold text-muted dark:text-slate-400 uppercase tracking-wider block">
                                    Horas Ministradas
                                  </span>
                                  <span className="text-2xl font-black text-primary mt-1 block">
                                    {totalHours}h
                                  </span>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-slate-700/60 text-center">
                                  <span className="text-[11px] font-bold text-muted dark:text-slate-400 uppercase tracking-wider block">
                                    Total Pago em Aulas
                                  </span>
                                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                                    R$ {totalInvested},00
                                  </span>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-slate-700/60 text-center">
                                  <span className="text-[11px] font-bold text-muted dark:text-slate-400 uppercase tracking-wider block">
                                    Professores Contratados
                                  </span>
                                  <span className="text-2xl font-black text-navy-900 dark:text-white mt-1 block">
                                    {uniqueInstructors.length}
                                  </span>
                                </div>
                              </div>

                              {/* Listagem das Aulas Concluídas */}
                              <div className="space-y-3">
                                <h3 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                                  Detalhamento de Aulas do Período
                                </h3>

                                {monthCompletedShifts.length === 0 ? (
                                  <div className="p-8 text-center text-muted dark:text-slate-400 bg-slate-50 dark:bg-navy-900/40 rounded-2xl">
                                    Nenhuma aula realizada registrada neste mês para esta unidade.
                                  </div>
                                ) : (
                                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-navy-900">
                                    <table className="w-full text-left border-collapse text-xs">
                                      <thead>
                                        <tr className="bg-slate-50 dark:bg-navy-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold">
                                          <th className="p-3">Data & Horário</th>
                                          <th className="p-3">Aula / Modalidade</th>
                                          <th className="p-3">Professor Contratado</th>
                                          <th className="p-3">Valor Pago</th>
                                          <th className="p-3">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {monthCompletedShifts.map((shift) => {
                                          const inst = instructors.find((i) => i.id === shift.confirmedInstructorId);

                                          return (
                                            <tr key={shift.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/50 transition-colors">
                                              <td className="p-3 font-semibold text-navy-900 dark:text-white">
                                                <div>{formatDateDDMMAAAA(shift.date)}</div>
                                                <div className="text-[11px] text-muted dark:text-slate-400 font-normal">
                                                  {shift.startTime} às {shift.endTime}
                                                </div>
                                              </td>
                                              <td className="p-3">
                                                <div className="font-bold text-navy-900 dark:text-white">{shift.title}</div>
                                                <div className="text-[11px] text-primary font-semibold">{shift.modality}</div>
                                              </td>
                                              <td className="p-3">
                                                {inst ? (
                                                  <div className="flex items-center gap-2">
                                                    <img src={inst.avatar} alt={inst.name} className="w-8 h-8 rounded-full object-cover" />
                                                    <div>
                                                      <div className="font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                                                        <span>{inst.name}</span>
                                                        {(inst.isDeleted || (inst as any).isActive === false) && (
                                                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-navy-700 px-1.5 py-0.2 rounded">
                                                            (Usuário excluído)
                                                          </span>
                                                        )}
                                                      </div>
                                                      <div className="text-[10px] text-muted dark:text-slate-400">CREF {inst.cref}</div>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-navy-700 flex items-center justify-center text-slate-500 text-xs font-bold">
                                                      {(shift.confirmedInstructorName || "P")[0]}
                                                    </div>
                                                    <div>
                                                      <div className="font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                                                        <span>{shift.confirmedInstructorName || "Professor"}</span>
                                                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-navy-700 px-1.5 py-0.2 rounded">
                                                          (Usuário excluído)
                                                        </span>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
                                              </td>
                                              <td className="p-3 font-extrabold text-navy-900 dark:text-white">
                                                R$ {shift.agreedRate || shift.maxRate || (shift as any).rate || 45}/h
                                              </td>
                                              <td className="p-3">
                                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/60">
                                                  <CheckCheck size={12} /> Aula Realizada
                                                </span>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <>
                        {/* VISUALIZAÇÃO A: AGENDA DO MÊS COMPLETA (GRADE DE DIAS EXATOS) */}
                        {scheduleViewMode === "mes" && (
                          <div className="bg-card dark:bg-navy-800 rounded-squircle p-5 md:p-6 shadow-soft border border-slate-100 dark:border-slate-800 space-y-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h2 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-wider text-xs">
                                  {displayMonthName} {calYear} — Visão Geral Mensal
                                </h2>
                                <p className="text-xs text-muted dark:text-slate-400">
                                  Todos os horários cadastrados da unidade distribuídos pelos dias do mês
                                </p>
                              </div>

                              <span className="text-xs font-bold bg-primary-subtle dark:bg-primary/20 text-primary px-3 py-1 rounded-full">
                                {currentMonthShifts.length} {currentMonthShifts.length === 1 ? "horário cadastrado no mês" : "horários cadastrados no mês"}
                              </span>
                            </div>

                            {/* Cabeçalho dos dias da semana */}
                            <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-extrabold text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-700">
                              <span>SEGUNDA</span>
                              <span>TERÇA</span>
                              <span>QUARTA</span>
                              <span>QUINTA</span>
                              <span>SEXTA</span>
                              <span>SÁBADO</span>
                              <span>DOMINGO</span>
                            </div>

                            {/* Grade Dinâmica com Preceding, Current e Trailing Days */}
                            <div className="grid grid-cols-7 gap-2">
                              {/* Dias prévios (Mês anterior) para alinhar a 1ª semana */}
                              {Array.from({ length: firstDayOfWeek }, (_, idx) => {
                                const prevDayNum = daysInPrevMonth - firstDayOfWeek + 1 + idx;
                                return (
                                  <div
                                    key={`prev-${idx}`}
                                    className="min-h-24 p-2 rounded-2xl bg-slate-50/40 dark:bg-navy-900/30 text-slate-300 dark:text-slate-600 text-xs font-bold"
                                  >
                                    {prevDayNum}
                                  </div>
                                );
                              })}

                              {/* Dias do Mês Selecionado (1 a daysInMonth) */}
                              {Array.from({ length: daysInMonth }, (_, i) => {
                                const dayNumber = i + 1;
                                const dateStr = `${selectedAgendaMonth}-${dayNumber < 10 ? `0${dayNumber}` : dayNumber}`;
                                const dayShifts = shifts.filter(
                                  (s) => s.gymId === activeGymId && s.date === dateStr
                                );
                                const isToday = isCurrentMonthActive && dayNumber === refTodayDay;
                                const visibleShifts = dayShifts.slice(0, 2);
                                const remainingShiftsCount = dayShifts.length - 2;

                                return (
                                  <div
                                    key={dateStr}
                                    className={`min-h-[130px] p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                                      isToday
                                        ? "bg-blue-50/50 dark:bg-primary/10 border-primary/40 ring-1 ring-primary/20"
                                        : "bg-slate-50/70 dark:bg-navy-900/60 border-slate-100 dark:border-slate-700/60 hover:border-slate-300"
                                    }`}
                                  >
                                    <div>
                                      <div className="flex justify-between items-center mb-1">
                                        <span className={`text-xs font-black ${isToday ? "text-primary" : "text-navy-900 dark:text-white"}`}>
                                          {dayNumber < 10 ? `0${dayNumber}` : dayNumber}
                                        </span>
                                        <button
                                          onClick={() => {
                                            setNewDate(dateStr);
                                            setShowNewShiftModal(true);
                                          }}
                                          className="text-slate-300 hover:text-primary p-0.5 text-xs font-bold"
                                          title="Cadastrar horário para este dia"
                                        >
                                          +
                                        </button>
                                      </div>

                                      {/* Lista de Aulas no Dia (máximo 2 visíveis diretamente) */}
                                      <div className="space-y-1.5">
                                        {visibleShifts.map((s) => (
                                          <div
                                            key={s.id}
                                            onClick={() => handleSelectShiftFromGrade(s.id)}
                                            className={`p-1.5 rounded-xl text-[11px] font-bold leading-tight border transition-all cursor-pointer hover:scale-[1.02] shadow-2xs ${
                                              s.status === "realizada"
                                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300/60"
                                                : s.status === "confirmado"
                                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/50"
                                                : s.status === "negociando"
                                                ? "bg-blue-50 dark:bg-blue-950/40 text-primary border border-blue-200/50"
                                                : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/50"
                                            } ${highlightedShiftId === s.id ? "ring-2 ring-primary ring-offset-2 scale-[1.03]" : ""}`}
                                            title="Clique para visualizar e destacar este horário nos cadastros"
                                          >
                                            <div className="truncate font-black">{s.startTime} {s.modality}</div>
                                            <div className="flex justify-between items-center text-[10px] opacity-80 mt-0.5 font-semibold">
                                              <span className="capitalize">{s.status === "realizada" ? "Realizada" : s.status}</span>
                                              <span className="font-black">R$ {s.agreedRate || s.maxRate || (s as any).rate || 45}/h</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Se houver mais de 2 horários, exibe o botão de expansão em modal */}
                                    {remainingShiftsCount > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedDayShiftsModal({ date: dateStr, dayNumber, shifts: dayShifts })}
                                        className="w-full mt-1.5 py-1 px-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-black flex items-center justify-center gap-1 transition-all border border-primary/20 shadow-2xs active:scale-95 group"
                                        title={`Ver todos os ${dayShifts.length} horários cadastrados neste dia em modal expandida`}
                                      >
                                        <span>+{remainingShiftsCount} {remainingShiftsCount === 1 ? "horário" : "horários"}</span>
                                        <span className="text-[9px] group-hover:translate-x-0.5 transition-transform">→</span>
                                      </button>
                                    )}

                                    {dayShifts.length === 0 && (
                                      <span className="text-[10px] text-slate-300 dark:text-slate-600 italic">Livre</span>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Dias posteriores (Mês seguinte) para completar as colunas */}
                              {Array.from({ length: trailingDaysCount }, (_, idx) => {
                                const nextDayNum = idx + 1;
                                return (
                                  <div
                                    key={`next-${idx}`}
                                    className="min-h-24 p-2 rounded-2xl bg-slate-50/40 dark:bg-navy-900/30 text-slate-300 dark:text-slate-600 text-xs font-bold"
                                  >
                                    {nextDayNum}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* VISUALIZAÇÃO B: GRADE SEMANAL (ESTILO FUSYNC COM LINHAS FINAS E NAVEGAÇÃO) */}
                        {scheduleViewMode === "semana" && (
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Grade Semanal FuSync-Style Dinâmica */}
                            <div className="lg:col-span-2 bg-card dark:bg-navy-800 rounded-squircle p-6 shadow-soft border border-slate-100 dark:border-slate-800 space-y-4">
                              {(() => {
                                const [wy, wm, wd] = selectedWeekStartDate.split("-").map(Number);
                                const monday = new Date(wy, wm - 1, wd);

                                const getWeekDay = (offset: number) => {
                                  const d = new Date(monday);
                                  d.setDate(monday.getDate() + offset);
                                  const y = d.getFullYear();
                                  const m = String(d.getMonth() + 1).padStart(2, "0");
                                  const day = String(d.getDate()).padStart(2, "0");
                                  return {
                                    dateStr: `${y}-${m}-${day}`,
                                    dayMonth: `${day}/${m}`,
                                    dayNumber: day
                                  };
                                };

                                const seg = getWeekDay(0);
                                const ter = getWeekDay(1);
                                const qua = getWeekDay(2);
                                const qui = getWeekDay(3);
                                const sex = getWeekDay(4);
                                const sab = getWeekDay(5);
                                const dom = getWeekDay(6);

                                const weekRangeLabel = `${seg.dayMonth} a ${dom.dayMonth}`;
                                const isCurrentWeek = selectedWeekStartDate === "2026-11-09";

                                const allWeekDates = [
                                  seg.dateStr,
                                  ter.dateStr,
                                  qua.dateStr,
                                  qui.dateStr,
                                  sex.dateStr,
                                  sab.dateStr,
                                  dom.dateStr
                                ];

                                const weekShifts = gymShifts.filter((s) => allWeekDates.includes(s.date));

                                const weekCols = [
                                  { id: "seg", label: `Segunda (${seg.dayMonth})`, dates: [seg.dateStr] },
                                  { id: "ter", label: `Terça (${ter.dayMonth})`, dates: [ter.dateStr] },
                                  { id: "qua", label: `Quarta (${qua.dayMonth})`, dates: [qua.dateStr] },
                                  { id: "qui", label: `Quinta (${qui.dayMonth})`, dates: [qui.dateStr] },
                                  { id: "sex", label: `Sexta (${sex.dayMonth})`, dates: [sex.dateStr] },
                                  { id: "fds", label: `Sáb / Dom (${sab.dayNumber}-${dom.dayNumber})`, dates: [sab.dateStr, dom.dateStr] }
                                ];

                                const turnos = [
                                  { id: "manha", label: "Manhã", isTurno: (time: string) => time < "12:00" },
                                  { id: "tarde", label: "Tarde", isTurno: (time: string) => time >= "12:00" && time < "18:00" },
                                  { id: "noite", label: "Noite", isTurno: (time: string) => time >= "18:00" }
                                ];

                                return (
                                  <>
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h2 className="text-sm font-black text-navy-900 dark:text-white uppercase tracking-wider">
                                            Escala Semanal ({weekRangeLabel})
                                          </h2>
                                          {isCurrentWeek ? (
                                            <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300/60">
                                              Semana Atual
                                            </span>
                                          ) : (
                                            <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-300/60">
                                              {selectedWeekStartDate < "2026-11-09" ? "Semana Anterior" : "Próxima Semana"}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs text-muted dark:text-slate-400 mt-0.5">
                                          Linhas finas e blocos de status por turno
                                        </p>
                                      </div>

                                      {/* Controles de Navegação por Semanas (< e >) */}
                                      <div className="flex items-center gap-1.5 self-start sm:self-auto">
                                        <button
                                          type="button"
                                          onClick={handlePrevWeek}
                                          className="p-1.5 rounded-xl bg-slate-50 dark:bg-navy-900 text-slate-600 dark:text-slate-300 hover:text-navy-900 hover:bg-slate-100 dark:hover:bg-navy-700 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
                                          title="Semana anterior (<)"
                                        >
                                          <ChevronLeft size={14} />
                                        </button>

                                        {!isCurrentWeek && (
                                          <button
                                            type="button"
                                            onClick={handleCurrentWeek}
                                            className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors border border-primary/20 shadow-2xs"
                                            title="Voltar para a semana atual"
                                          >
                                            Hoje
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          onClick={handleNextWeek}
                                          className="p-1.5 rounded-xl bg-slate-50 dark:bg-navy-900 text-slate-600 dark:text-slate-300 hover:text-navy-900 hover:bg-slate-100 dark:hover:bg-navy-700 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
                                          title="Próxima semana (>)"
                                        >
                                          <ChevronRight size={14} />
                                        </button>

                                        <span className="text-xs text-primary font-bold bg-primary-subtle dark:bg-primary/20 px-3 py-1 rounded-full ml-1">
                                          {weekShifts.length} {weekShifts.length === 1 ? "horário ativo" : "horários ativos"}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Tabela com Linhas Finas Explícitas e Mapeamento Dinâmico */}
                                    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto bg-white dark:bg-navy-900">
                                      <table className="w-full text-left border-collapse text-xs min-w-[620px]">
                                        <thead>
                                          <tr className="bg-slate-50 dark:bg-navy-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold">
                                            <th className="p-3 border-r border-slate-200 dark:border-slate-700 w-20">Turno</th>
                                            {weekCols.map((col, idx) => {
                                              const isColumnToday = col.dates.includes("2026-11-09");
                                              return (
                                                <th
                                                  key={col.id}
                                                  className={`p-3 ${idx < weekCols.length - 1 ? "border-r border-slate-200 dark:border-slate-700" : ""} ${
                                                    isColumnToday ? "bg-blue-50/60 dark:bg-primary/10 text-primary" : ""
                                                  }`}
                                                >
                                                  <div className="flex items-center gap-1.5">
                                                    <span>{col.label}</span>
                                                    {isColumnToday && (
                                                      <span className="w-2 h-2 rounded-full bg-primary inline-block" title="Hoje" />
                                                    )}
                                                  </div>
                                                </th>
                                              );
                                            })}
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                          {turnos.map((turno) => (
                                            <tr key={turno.id} className="min-h-16">
                                              <td className="p-3 font-semibold text-slate-400 border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-navy-800/50 align-top">
                                                {turno.label}
                                              </td>
                                              {weekCols.map((col, idx) => {
                                                const matchingShifts = gymShifts.filter(
                                                  (s) => col.dates.includes(s.date) && turno.isTurno(s.startTime)
                                                );

                                                return (
                                                  <td
                                                    key={col.id}
                                                    className={`p-2 align-top ${idx < weekCols.length - 1 ? "border-r border-slate-200 dark:border-slate-700" : ""}`}
                                                  >
                                                    {matchingShifts.length > 0 ? (
                                                      <div className="space-y-1.5">
                                                        {matchingShifts.map((s) => (
                                                          <div
                                                            key={s.id}
                                                            onClick={() => handleSelectShiftFromGrade(s.id)}
                                                            className={`p-2 rounded-xl text-xs font-bold leading-tight border transition-all cursor-pointer hover:scale-[1.02] shadow-2xs ${
                                                              s.status === "realizada"
                                                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300/60"
                                                                : s.status === "confirmado"
                                                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/50"
                                                                : s.status === "negociando"
                                                                ? "bg-blue-50 dark:bg-blue-950/40 text-primary border border-blue-200/50"
                                                                : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/50"
                                                            } ${highlightedShiftId === s.id ? "ring-2 ring-primary ring-offset-2 scale-[1.03]" : ""}`}
                                                            title="Clique para visualizar e destacar este horário nos cadastros"
                                                          >
                                                            <div className="truncate font-black">{s.startTime} {s.modality}</div>
                                                            <div className="flex justify-between items-center text-[10px] opacity-80 mt-1 font-semibold">
                                                              <span className="capitalize">{s.status === "realizada" ? "Realizada" : s.status}</span>
                                                              <span className="font-black">R$ {s.agreedRate || s.maxRate || (s as any).rate || 45}/h</span>
                                                            </div>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    ) : (
                                                      <span className="text-slate-300 dark:text-slate-600 italic text-[11px]">— Livre</span>
                                                    )}
                                                  </td>
                                                );
                                              })}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>

                            {/* Painel Lateral: Propostas Recentes */}
                            <div className="bg-card dark:bg-navy-800 rounded-squircle p-6 shadow-soft border border-slate-100 dark:border-slate-800 space-y-4">
                              <div className="flex justify-between items-center">
                                <h2 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-wider text-xs">
                                  Propostas Recentes
                                </h2>
                                <button
                                  onClick={() => setActiveMenu("propostas")}
                                  className="text-xs text-primary font-bold hover:underline"
                                >
                                  Ver todas →
                                </button>
                              </div>

                              {gymProposals.length === 0 ? (
                                <p className="text-xs text-muted dark:text-slate-400 py-8 text-center">Nenhuma proposta no momento.</p>
                              ) : (
                                gymProposals.slice(0, 3).map((prop) => {
                                  const inst = instructors.find((i) => i.id === prop.instructorId);

                                  return (
                                    <div key={prop.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-900/60 space-y-3 border border-slate-100 dark:border-slate-700">
                                      <div className="flex gap-3 items-center">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-navy-700 shrink-0 border border-white dark:border-navy-700 flex items-center justify-center">
                                          {inst?.avatar ? (
                                            <img src={inst.avatar} alt="Prof" className="w-full h-full object-cover" />
                                          ) : (
                                            <User size={20} className="text-primary" />
                                          )}
                                        </div>
                                        <div>
                                          <h3 className="text-sm font-bold text-navy-900 dark:text-white">{inst?.name}</h3>
                                          <div className="flex items-center gap-1.5 text-[11px] text-muted dark:text-slate-400">
                                            {(inst?.ratingCount || 0) > 0 ? (
                                              <>
                                                <Star size={11} className="text-amber-400 fill-amber-400" />
                                                <span className="font-bold text-navy-900 dark:text-white">{inst?.rating.toFixed(1)}</span>
                                              </>
                                            ) : (
                                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded-md">
                                                Novo
                                              </span>
                                            )}
                                            <span>· CREF {inst?.cref}</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted dark:text-slate-400">Valor solicitado:</span>
                                        <span className="font-extrabold text-navy-900 dark:text-white text-sm">
                                          R$ {prop.proposedRate}/h
                                        </span>
                                      </div>

                                      {prop.status === "pendente" && (
                                        <div className="flex gap-2 pt-1">
                                          <button
                                            onClick={() => handleAcceptProposal(prop.id)}
                                            className="flex-1 bg-primary hover:bg-primary-hover text-white font-extrabold py-2 rounded-full text-xs shadow-xs transition-all active:scale-95"
                                          >
                                            Aprovar (R$ {prop.proposedRate}/h)
                                          </button>
                                          <button
                                            onClick={() => rejectProposal(prop.id)}
                                            className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-full transition-colors"
                                          >
                                            Recusar
                                          </button>
                                        </div>
                                      )}

                                      {prop.status === "aceita" && (
                                        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                                          <CheckCircle size={13} /> Contratação Aceita
                                        </div>
                                      )}

                                      {prop.status === "recusada" && (
                                        <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-2 rounded-xl text-xs font-bold text-center">
                                          Proposta Recusada
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}

              {/* LISTA COMPLETA DE TODOS OS HORÁRIOS CADASTRADOS DA UNIDADE */}
              {(() => {
                const uniqueModalities = Array.from(new Set(gymShifts.map((s) => s.modality)));
                const uniqueDates = Array.from(new Set(gymShifts.map((s) => s.date))).sort();

                const filteredAllShifts = gymShifts.filter((shift) => {
                  if (allShiftsDate !== "todas" && shift.date !== allShiftsDate) {
                    return false;
                  }
                  if (allShiftsModality !== "todas" && shift.modality !== allShiftsModality) {
                    return false;
                  }
                  if (allShiftsPeriod !== "todos") {
                    const [h] = shift.startTime.split(":").map(Number);
                    if (allShiftsPeriod === "manha" && h >= 12) return false;
                    if (allShiftsPeriod === "tarde" && (h < 12 || h >= 18)) return false;
                    if (allShiftsPeriod === "noite" && h < 18) return false;
                  }
                  return true;
                });

                return (
                  <div className="bg-card dark:bg-navy-800 rounded-squircle p-6 shadow-soft border border-slate-100 dark:border-slate-800 space-y-5">
                    {/* Topo do Card com Título e Ação de Cadastro */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-navy-900 dark:text-white uppercase tracking-wider">
                            Todos os Horários Cadastrados
                          </h3>
                          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                            {filteredAllShifts.length} de {gymShifts.length}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted dark:text-slate-400 mt-0.5">
                          Gerenciamento completo das grades de aula, turnos e status de contratação
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Seletor de Layout: Grade vs Lista */}
                        <div className="flex bg-slate-100 dark:bg-navy-900 p-1 rounded-xl text-xs font-bold border border-slate-200/60 dark:border-slate-700/60">
                          <button
                            type="button"
                            onClick={() => setAllShiftsLayout("grade")}
                            title="Visualização em Grade de Cards"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                              allShiftsLayout === "grade"
                                ? "bg-white dark:bg-navy-800 text-primary shadow-xs font-black"
                                : "text-slate-600 dark:text-slate-400 hover:text-navy-900"
                            }`}
                          >
                            <LayoutGrid size={13} />
                            <span>Cards</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAllShiftsLayout("lista")}
                            title="Visualização Completa em Listagem Tabular"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                              allShiftsLayout === "lista"
                                ? "bg-white dark:bg-navy-800 text-primary shadow-xs font-black"
                                : "text-slate-600 dark:text-slate-400 hover:text-navy-900"
                            }`}
                          >
                            <List size={13} />
                            <span>Listagem</span>
                          </button>
                        </div>

                        <button
                          onClick={() => setShowNewShiftModal(true)}
                          className="text-xs font-bold bg-primary hover:bg-primary-hover text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                        >
                          <Plus size={14} /> Novo Horário
                        </button>
                      </div>
                    </div>

                    {/* Filtros por Turno, Data e Modalidade */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-slate-700/60 text-xs">
                      {/* Filtro por Turno (Manhã, Tarde, Noite) */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-muted dark:text-slate-400 text-[11px] mr-1">Turno:</span>
                        {[
                          { id: "todos", label: "Todos os Turnos" },
                          { id: "manha", label: "Manhã (06h–12h)" },
                          { id: "tarde", label: "Tarde (12h–18h)" },
                          { id: "noite", label: "Noite (18h–23h)" }
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setAllShiftsPeriod(t.id as any)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                              allShiftsPeriod === t.id
                                ? "bg-navy-900 dark:bg-primary text-white shadow-xs"
                                : "bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      {/* Filtros por Data e Modalidade */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Filtro por Data */}
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-muted dark:text-slate-400 text-[11px]">Data:</span>
                          <select
                            value={allShiftsDate}
                            onChange={(e) => setAllShiftsDate(e.target.value)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 text-navy-900 dark:text-white outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="todas">Todas as Datas ({uniqueDates.length})</option>
                            {uniqueDates.map((d) => (
                              <option key={d} value={d}>
                                {formatDateDDMMAAAA(d)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Filtro por Modalidade */}
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-muted dark:text-slate-400 text-[11px]">Modalidade:</span>
                          <select
                            value={allShiftsModality}
                            onChange={(e) => setAllShiftsModality(e.target.value)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 text-navy-900 dark:text-white outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="todas">Todas as Modalidades ({uniqueModalities.length})</option>
                            {uniqueModalities.map((mod) => (
                              <option key={mod} value={mod}>
                                {mod}
                              </option>
                            ))}
                          </select>
                        </div>

                        {(allShiftsModality !== "todas" || allShiftsPeriod !== "todos" || allShiftsDate !== "todas") && (
                          <button
                            type="button"
                            onClick={() => {
                              setAllShiftsModality("todas");
                              setAllShiftsPeriod("todos");
                              setAllShiftsDate("todas");
                            }}
                            className="text-xs text-primary font-bold hover:underline"
                          >
                            Limpar filtros
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Vazio */}
                    {filteredAllShifts.length === 0 ? (
                      <div className="p-8 text-center text-muted dark:text-slate-400 bg-slate-50 dark:bg-navy-900/40 rounded-2xl">
                        Nenhum horário cadastrado corresponde aos filtros selecionados.
                      </div>
                    ) : allShiftsLayout === "grade" ? (
                      /* VISUALIZAÇÃO EM CARDS (GRADE) */
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredAllShifts.map((shift) => {
                          const confirmedInst = instructors.find((i) => i.id === shift.confirmedInstructorId);

                          return (
                            <div
                              id={`shift-card-${shift.id}`}
                              key={shift.id}
                              className={`p-4 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border flex flex-col justify-between space-y-3 transition-all duration-300 ${
                                highlightedShiftId === shift.id
                                  ? "ring-4 ring-primary ring-offset-2 border-primary bg-primary/10 shadow-lg scale-[1.02]"
                                  : "border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                              }`}
                            >
                              {highlightedShiftId === shift.id && (
                                <div className="flex items-center justify-between bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse shadow-xs">
                                  <span className="flex items-center gap-1">
                                    <Sparkles size={11} /> Selecionado na Grade
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setHighlightedShiftId(null);
                                    }}
                                    className="text-white hover:text-slate-200 text-xs font-bold ml-2"
                                    title="Remover destaque"
                                  >
                                    ×
                                  </button>
                                </div>
                              )}
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-xs font-black text-navy-900 dark:text-white block">
                                    {shift.title}
                                  </span>
                                  <span className="text-[11px] text-muted dark:text-slate-400 mt-0.5 block">
                                    {shift.modality} · {formatDateDDMMAAAA(shift.date)}
                                  </span>
                                  <span className="text-[11px] text-primary font-bold mt-1 block">
                                    {shift.startTime} – {shift.endTime}
                                  </span>
                                </div>
                                <span
                                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                    shift.status === "realizada"
                                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60"
                                      : shift.status === "confirmado"
                                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/50"
                                      : shift.status === "negociando"
                                      ? "bg-blue-100 dark:bg-blue-950/60 text-primary border border-blue-300/50"
                                      : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/50"
                                  }`}
                                >
                                  {shift.status === "realizada" ? "Realizada" : shift.status}
                                </span>
                              </div>

                              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-muted dark:text-slate-400">Valor hora-aula:</span>
                                  <span className="font-black text-navy-900 dark:text-white">
                                    R$ {shift.agreedRate || shift.maxRate || (shift as any).rate || 45}/h (Fixo)
                                  </span>
                                </div>

                                {(confirmedInst || shift.confirmedInstructorName) ? (
                                  <div className="space-y-2">
                                    <div className="p-2 rounded-xl bg-white dark:bg-navy-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-2 min-w-0">
                                        {confirmedInst?.avatar ? (
                                          <img src={confirmedInst.avatar} alt="Prof" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                                        ) : (
                                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-navy-700 flex items-center justify-center text-slate-500 text-xs font-bold flex-shrink-0">
                                            {(confirmedInst?.name || shift.confirmedInstructorName || "P")[0]}
                                          </div>
                                        )}
                                        <div className="min-w-0">
                                          <div className="font-bold text-navy-900 dark:text-white truncate flex items-center gap-1.5">
                                            <span>{confirmedInst?.name || shift.confirmedInstructorName}</span>
                                            {(!confirmedInst || confirmedInst.isDeleted || (confirmedInst as any).isActive === false) && (
                                              <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 dark:bg-navy-700 px-1 py-0.2 rounded shrink-0">
                                                (Usuário excluído)
                                              </span>
                                            )}
                                          </div>
                                          {confirmedInst?.cref && (
                                            <div className="text-[10px] text-muted dark:text-slate-400">CREF {confirmedInst.cref}</div>
                                          )}
                                        </div>
                                      </div>
                                      {confirmedInst?.phone && !confirmedInst.isDeleted && (
                                        <a
                                          href={`https://wa.me/55${confirmedInst.phone.replace(/\D/g, "")}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                          title="WhatsApp"
                                        >
                                          <MessageSquare size={13} />
                                        </a>
                                      )}
                                    </div>

                                    {shift.instructorCheckInAt && (
                                      <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary flex items-center justify-between">
                                        <span className="flex items-center gap-1">
                                          <Clock size={11} />
                                          Check-in do Professor
                                        </span>
                                        <span>às {shift.instructorCheckInAt}</span>
                                      </div>
                                    )}

                                    {shift.status === "confirmado" && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleValidateAttendance(shift.id, confirmedInst?.name)}
                                          className={`w-full py-2 px-3 rounded-full text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-all ${
                                            shift.instructorCheckInAt
                                              ? "bg-primary hover:bg-primary-hover ring-2 ring-primary/20"
                                              : "bg-emerald-600 hover:bg-emerald-700"
                                          }`}
                                        >
                                          <CheckCheck size={13} />
                                          <span>{shift.instructorCheckInAt ? "Validar Presença do Professor" : "Confirmar Presença (Gestor)"}</span>
                                        </button>

                                        {canCancelShift(shift).canCancel && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setShiftToCancel(shift);
                                              setShowCancelModal(true);
                                            }}
                                            className="w-full mt-2 py-2 px-3 rounded-full border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-extrabold text-[11px] flex items-center justify-center gap-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                                          >
                                            <XCircle size={13} strokeWidth={1.5} />
                                            <span>Cancelar Aula Contratada</span>
                                          </button>
                                        )}
                                      </>
                                    )}

                                    {shift.status === "cancelado" && (
                                      <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs space-y-1.5">
                                        <div className="flex items-center justify-between">
                                          <span className="flex items-center gap-1.5 font-black text-rose-700 dark:text-rose-300">
                                            <XCircle size={14} strokeWidth={1.5} className="text-rose-600 dark:text-rose-400" />
                                            Aula Cancelada
                                          </span>
                                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                                            {shift.cancelledBy === "academia" ? "Por Você" : "Pelo Professor"}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-700 dark:text-slate-300 pl-5">
                                          <strong className="font-bold">Motivo:</strong> {shift.cancellationReason || "Motivo não informado"}
                                        </p>
                                        {shift.cancelledAt && (
                                          <p className="text-[10px] text-muted dark:text-slate-400 pl-5">
                                            Cancelado em {formatDateDDMMAAAA(shift.cancelledAt)} · Autor: {shift.cancelledByName || (shift.cancelledBy === "academia" ? "Academia" : "Professor")}
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    {shift.status === "realizada" && (
                                      shift.instructorReviewedByGym ? (
                                        <div className="w-full py-1.5 px-3 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px] flex items-center justify-center gap-1.5">
                                          <CheckCheck size={13} className="text-emerald-600" />
                                          <span>Presença Validada · Avaliado ★</span>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (confirmedInst) setReviewShift({ shift, instructor: confirmedInst });
                                          }}
                                          className="w-full py-1.5 px-3 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-all"
                                        >
                                          <Star size={13} strokeWidth={1.5} />
                                          <span>Avaliar Professor</span>
                                        </button>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  (() => {
                                    const matchCount = getRecommendedInstructorsForShift(shift, activeInstructors, "horarios", shifts, gyms).length;
                                    return (
                                      <div className="space-y-1.5">
                                        <button
                                          onClick={() => {
                                            setSelectedShiftForRecommendations(shift.id);
                                            setActiveMenu("professores");
                                          }}
                                          className="w-full py-2 px-3 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                          <Sparkles size={12} />
                                          <span>{matchCount > 0 ? `${matchCount} professores recomendados` : "Ver recomendações"}</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteShiftClick(shift)}
                                          className="w-full py-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                                          title="Excluir horário da agenda"
                                        >
                                          <Trash2 size={11} strokeWidth={1.5} />
                                          <span>Excluir Horário</span>
                                        </button>
                                      </div>
                                    );
                                  })()
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* VISUALIZAÇÃO COMPLETA EM LISTAGEM (TABELA RESPONSIVA) */
                      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-navy-900">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-navy-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold">
                                <th className="p-3">Data & Horário</th>
                                <th className="p-3">Aula / Modalidade</th>
                                <th className="p-3">Turno</th>
                                <th className="p-3">Valor Fixo</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Professor Designado</th>
                                <th className="p-3 text-right">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {filteredAllShifts.map((shift) => {
                                const confirmedInst = instructors.find((i) => i.id === shift.confirmedInstructorId);
                                const [h] = shift.startTime.split(":").map(Number);
                                const turnoLabel = h < 12 ? "Manhã" : h < 18 ? "Tarde" : "Noite";

                                return (
                                  <tr
                                    id={`shift-row-${shift.id}`}
                                    key={shift.id}
                                    className={`transition-colors ${
                                      highlightedShiftId === shift.id
                                        ? "bg-primary/15 dark:bg-primary/25 font-bold ring-2 ring-primary"
                                        : "hover:bg-slate-50/50 dark:hover:bg-navy-800/50"
                                    }`}
                                  >
                                    <td className="p-3 font-semibold text-navy-900 dark:text-white whitespace-nowrap">
                                      <div>{formatDateDDMMAAAA(shift.date)}</div>
                                      <div className="text-[11px] text-primary font-bold">
                                        {shift.startTime} – {shift.endTime}
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-navy-900 dark:text-white">{shift.title}</span>
                                        {highlightedShiftId === shift.id && (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary text-white animate-pulse">
                                            Selecionado
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-muted dark:text-slate-400">{shift.modality}</div>
                                    </td>
                                    <td className="p-3">
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300">
                                        {turnoLabel}
                                      </span>
                                    </td>
                                    <td className="p-3 font-extrabold text-navy-900 dark:text-white whitespace-nowrap">
                                      R$ {shift.agreedRate || shift.maxRate || (shift as any).rate || 45}/h
                                    </td>
                                    <td className="p-3 whitespace-nowrap">
                                      <span
                                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                          shift.status === "realizada"
                                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                                            : shift.status === "confirmado"
                                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                            : shift.status === "negociando"
                                            ? "bg-blue-100 dark:bg-blue-950/60 text-primary"
                                            : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                                        }`}
                                      >
                                        {shift.status === "realizada" ? "Realizada" : shift.status}
                                      </span>
                                    </td>
                                    <td className="p-3">
                                      {confirmedInst ? (
                                        <div className="flex items-center gap-2">
                                          <img src={confirmedInst.avatar} alt="Prof" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                                          <div>
                                            <div className="font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                                              <span>{confirmedInst.name}</span>
                                              {(confirmedInst.isDeleted || (confirmedInst as any).isActive === false) && (
                                                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-navy-700 px-1.5 py-0.2 rounded">
                                                  (Usuário excluído)
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-[10px] text-muted dark:text-slate-400">CREF {confirmedInst.cref}</div>
                                          </div>
                                        </div>
                                      ) : (shift.status === "realizada" || shift.status === "confirmado") && shift.confirmedInstructorName ? (
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-navy-700 flex items-center justify-center text-slate-500 text-xs font-bold flex-shrink-0">
                                            {shift.confirmedInstructorName[0]}
                                          </div>
                                          <div>
                                            <div className="font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                                              <span>{shift.confirmedInstructorName}</span>
                                              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-navy-700 px-1.5 py-0.2 rounded">
                                                (Usuário excluído)
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-slate-400 italic text-[11px]">Nenhum ainda</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-right whitespace-nowrap">
                                      {shift.status === "confirmado" ? (
                                        <button
                                          type="button"
                                          onClick={() => handleValidateAttendance(shift.id, confirmedInst?.name)}
                                          className={`py-1 px-3 rounded-full text-white font-bold text-[11px] shadow-xs transition-colors ${
                                            shift.instructorCheckInAt
                                              ? "bg-primary hover:bg-primary-hover"
                                              : "bg-emerald-600 hover:bg-emerald-700"
                                          }`}
                                        >
                                          {shift.instructorCheckInAt ? "Validar Presença" : "Confirmar Presença"}
                                        </button>
                                      ) : shift.status === "realizada" ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                          <CheckCheck size={13} /> Concluída
                                        </span>
                                      ) : (
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedShiftForRecommendations(shift.id);
                                              setActiveMenu("professores");
                                            }}
                                            className="py-1 px-3 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] transition-colors"
                                          >
                                            Recomendações
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteShiftClick(shift)}
                                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                                            title="Excluir horário da agenda"
                                          >
                                            <Trash2 size={13} strokeWidth={1.5} />
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          )}

          {/* ===================== ABA 2: GERENCIAR PROPOSTAS ===================== */}
          {activeMenu === "propostas" && (
            <div className="bg-card dark:bg-navy-800 rounded-squircle p-6 shadow-soft border border-slate-100 dark:border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-navy-900 dark:text-white">Gerenciar Propostas</h2>
                  <p className="text-xs text-muted dark:text-slate-400">
                    Controle de propostas aceitas, em negociação e recusadas
                  </p>
                </div>

                {/* Filtro em Pílulas */}
                <div className="flex bg-slate-100 dark:bg-navy-900 p-1 rounded-full text-xs font-bold">
                  {(["todas", "pendente", "aceita", "recusada"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setProposalFilter(filter)}
                      className={`px-3 py-1.5 rounded-full capitalize transition-all ${
                        proposalFilter === filter
                          ? "bg-primary text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-navy-900"
                      }`}
                    >
                      {filter === "pendente" ? "Aguardando" : filter}
                    </button>
                  ))}
                </div>
              </div>

              {filteredProposals.length === 0 ? (
                <div className="p-8 text-center text-muted dark:text-slate-400">
                  Nenhuma proposta encontrada neste filtro.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProposals.map((prop) => {
                    const inst = instructors.find((i) => i.id === prop.instructorId);
                    const shift = shifts.find((s) => s.id === prop.shiftId);

                    return (
                      <div
                        key={prop.id}
                        className="p-5 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-slate-700/60 space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex gap-3 items-center">
                            <img src={inst?.avatar} alt={inst?.name} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                              <h3 className="text-sm font-bold text-navy-900 dark:text-white">{inst?.name}</h3>
                              <p className="text-[11px] text-muted dark:text-slate-400">CREF {inst?.cref}</p>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                              prop.status === "aceita"
                                ? "bg-emerald-100 text-emerald-800"
                                : prop.status === "pendente"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {prop.status === "pendente" ? "Aguardando" : prop.status}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs bg-white dark:bg-navy-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                          <div className="flex justify-between">
                            <span className="text-muted dark:text-slate-400">Turno:</span>
                            <span className="font-bold text-navy-900 dark:text-white">{shift?.title}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted dark:text-slate-400">Data e Hora:</span>
                            <span className="font-bold text-primary">{shift?.date} · {shift?.startTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted dark:text-slate-400">Valor da Proposta:</span>
                            <span className="font-extrabold text-navy-900 dark:text-white">R$ {prop.proposedRate}/h (Fixo)</span>
                          </div>
                        </div>

                        {prop.status === "pendente" && (
                          <div className="space-y-2 pt-1">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptProposal(prop.id)}
                                className="flex-1 bg-primary text-white font-extrabold py-2.5 rounded-full text-xs shadow-xs hover:bg-primary-hover transition-all active:scale-95"
                              >
                                Aprovar e Contratar (R$ {prop.proposedRate}/h)
                              </button>
                              <button
                                onClick={() => rejectProposal(prop.id)}
                                className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                              >
                                Recusar
                              </button>
                            </div>
                          </div>
                        )}

                        {prop.status === "aceita" && (
                          <div className="space-y-3 pt-1">
                            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3.5 space-y-2.5 text-xs">
                              <div className="flex justify-between items-center pb-2 border-b border-emerald-200/60 dark:border-emerald-800/40">
                                <span className="font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 text-xs">
                                  <ShieldCheck size={14} className="text-emerald-600" /> Contatos do Professor Liberados
                                </span>
                                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-extrabold px-2 py-0.5 rounded-full">
                                  CREF Ativo
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                                <div className="flex items-center gap-2">
                                  <Phone size={13} className="text-primary flex-shrink-0" />
                                  <span className="font-semibold">{inst?.phone || "(27) 99933-8822"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail size={13} className="text-primary flex-shrink-0" />
                                  <span className="truncate">{inst?.email || "contato@professor.com"}</span>
                                </div>
                              </div>

                              {/* Chave Pix do Professor */}
                              <div className="bg-white dark:bg-navy-900 p-2.5 rounded-lg border border-emerald-100 dark:border-navy-700 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <span className="text-[10px] text-muted dark:text-slate-400 block font-bold">Chave Pix para Acerto:</span>
                                  <span className="font-mono font-bold text-navy-900 dark:text-white truncate block text-[11px]">
                                    {inst?.pixKey || inst?.email || "lucas.ferreira.ef@gmail.com"}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                                      navigator.clipboard.writeText(inst?.pixKey || inst?.email || "");
                                    }
                                    setCopiedPixKey(inst?.id || "copied");
                                    setTimeout(() => setCopiedPixKey(null), 3000);
                                  }}
                                  className="px-2.5 py-1 rounded bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors"
                                >
                                  {copiedPixKey === inst?.id ? (
                                    <>
                                      <Check size={11} className="text-emerald-500" />
                                      <span className="text-emerald-600">Copiado!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={11} />
                                      <span>Copiar Pix</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Ações: WhatsApp direto e Confirmação de Aula Realizada */}
                              <div className="flex flex-wrap gap-2 pt-1">
                                <a
                                  href={`https://wa.me/55${(inst?.phone || "").replace(/\D/g, "")}?text=Olá%20${encodeURIComponent(inst?.name || "Professor")},%20sua%20aula%20foi%20confirmada%20na%20${encodeURIComponent(currentGym.name)}!`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 min-w-[120px] py-2 px-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-all"
                                >
                                  <MessageSquare size={13} />
                                  <span>Abrir WhatsApp</span>
                                </a>

                                {shift && shift.status === "confirmado" && (
                                  <button
                                    type="button"
                                    onClick={() => handleValidateAttendance(shift.id, inst?.name)}
                                    className="flex-1 min-w-[140px] py-2 px-3 rounded-full bg-navy-900 hover:bg-navy-800 dark:bg-primary dark:hover:bg-primary-hover text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-all"
                                  >
                                    <CheckCheck size={13} />
                                    <span>{shift.instructorCheckInAt ? `Validar Presença (${shift.instructorCheckInAt})` : "Confirmar Presença"}</span>
                                  </button>
                                )}

                                 {shift && shift.status === "realizada" && (
                                   <>
                                     <div className="w-full py-1.5 px-3 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px] flex items-center justify-center gap-1.5">
                                       <CheckCheck size={13} className="text-emerald-600" />
                                       <span>Presença Validada · {shift.instructorReviewedByGym ? "Avaliado ★" : "Pendente Avaliação"}</span>
                                     </div>
                                     {!shift.instructorReviewedByGym && (
                                       <button
                                         type="button"
                                         onClick={() => {
                                           if (inst) setReviewShift({ shift, instructor: inst });
                                         }}
                                         className="w-full py-2 px-3 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-all mt-1"
                                       >
                                         <Star size={13} strokeWidth={1.5} />
                                         <span>Avaliar Professor</span>
                                       </button>
                                     )}
                                   </>
                                 )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===================== ABA 3: BUSCAR PROFESSORES ===================== */}
          {activeMenu === "professores" && (() => {
            const activeTargetShift = gymShifts.find(
              (s) => s.id === (selectedShiftForRecommendations || gymShifts[0]?.id)
            );
            const shiftRecommendations = activeTargetShift
              ? getRecommendedInstructorsForShift(activeTargetShift, activeInstructors, recommendationSortBy, shifts, gyms)
              : [];

            return (
              <div className="bg-card dark:bg-navy-800 rounded-squircle p-6 shadow-soft border border-slate-100 dark:border-slate-800 space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-navy-900 dark:text-white">
                    Professores & Recomendações Automáticas
                  </h2>
                  <p className="text-xs text-muted dark:text-slate-400">
                    O sistema cruza automaticamente a grade semanal dos professores cadastrados com os horários dos turnos da academia
                  </p>
                </div>

                {inviteSuccessMsg && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border border-emerald-200/50">
                    <CheckCircle size={16} />
                    <span>{inviteSuccessMsg}</span>
                  </div>
                )}

                {/* Painel de Controle de Recomendações: Seletor de Turno + Filtros */}
                {gymShifts.length > 0 && (
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-slate-700/60 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-extrabold text-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                          <Sparkles size={14} className="text-primary" /> Turno Aberto para Recomendação
                        </label>
                        <select
                          value={activeTargetShift?.id || ""}
                          onChange={(e) => setSelectedShiftForRecommendations(e.target.value)}
                          className="w-full md:max-w-md p-2.5 bg-white dark:bg-navy-800 text-navy-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-primary"
                        >
                          {gymShifts.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.title} ({s.date} · {s.startTime}–{s.endTime} · R$ {s.maxRate ?? (s as any).rate ?? 45}/h)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filtros em Pílulas: Horários, Valores, Avaliação */}
                      <div>
                        <span className="text-[11px] font-bold text-muted dark:text-slate-400 block mb-1.5 md:text-right">
                          Ordenar candidatos por:
                        </span>
                        <div className="flex bg-white dark:bg-navy-800 p-1 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700">
                          <button
                            onClick={() => setRecommendationSortBy("horarios")}
                            className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                              recommendationSortBy === "horarios"
                                ? "bg-primary text-white shadow-xs"
                                : "text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white"
                            }`}
                          >
                            <Clock size={12} />
                            <span>Horários (Mais horas livres)</span>
                          </button>
                          <button
                            onClick={() => setRecommendationSortBy("valores")}
                            className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                              recommendationSortBy === "valores"
                                ? "bg-primary text-white shadow-xs"
                                : "text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white"
                            }`}
                          >
                            <DollarSign size={12} />
                            <span>Valores (Menor taxa)</span>
                          </button>
                          <button
                            onClick={() => setRecommendationSortBy("avaliacao")}
                            className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                              recommendationSortBy === "avaliacao"
                                ? "bg-primary text-white shadow-xs"
                                : "text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white"
                            }`}
                          >
                            <Star size={12} />
                            <span>Avaliação</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Grade de Professores Recomendados */}
                {activeTargetShift && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
                        <Sparkles size={14} className="text-primary" />
                        <span>Professores Recomendados para este Horário ({shiftRecommendations.length})</span>
                      </h3>
                      <span className="text-xs text-primary font-bold bg-primary/10 px-3 py-1 rounded-full">
                        Valor Fixo Oferecido: R$ {activeTargetShift.maxRate ?? (activeTargetShift as any).rate ?? 45}/h
                      </span>
                    </div>

                    {shiftRecommendations.length === 0 ? (
                      <div className="p-8 text-center text-muted dark:text-slate-400 bg-slate-50 dark:bg-navy-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        Nenhum professor com horários compatíveis na grade semanal para este turno.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {shiftRecommendations.map((rec) => {
                          const inst = rec.instructor;
                          const alreadyInvited = proposals.some(
                            (p) => p.shiftId === activeTargetShift.id && p.instructorId === inst.id
                          );

                          return (
                            <div
                              key={inst.id}
                              className="p-5 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-slate-700/60 space-y-3.5 flex flex-col justify-between"
                            >
                              <div className="space-y-3">
                                <div className="flex gap-3 items-center">
                                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-navy-700 shrink-0 border border-white dark:border-navy-700 flex items-center justify-center">
                                    {inst.avatar ? (
                                      <img
                                        src={inst.avatar}
                                        alt={inst.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <User size={24} className="text-primary" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                      <h3 className="text-sm font-bold text-navy-900 dark:text-white truncate">
                                        {inst.name}
                                      </h3>
                                      <span className="text-xs font-black text-navy-900 dark:text-white">
                                        R$ {inst.hourlyRate || 45}/h
                                      </span>
                                    </div>
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block">
                                      CREF {inst.cref} (Ativo)
                                    </span>
                                    {(inst.ratingCount || 0) > 0 ? (
                                      <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-0.5">
                                        <Star size={12} fill="currentColor" />
                                        <span>{inst.rating.toFixed(1)}</span>
                                        <span className="text-slate-400 font-normal">
                                          ({inst.ratingCount} contratações)
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                                        <Sparkles size={11} />
                                        <span>Novo Usuário · Sem avaliações</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Badge de Prioridade de Cobertura de Horário */}
                                <div className="flex flex-wrap gap-1.5">
                                  {rec.isExactMatch ? (
                                    <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-[10px] font-black flex items-center gap-1">
                                      <Sparkles size={11} className="text-amber-500 fill-amber-500" />
                                      ★ Intervalo Idêntico (1º Recomendado)
                                    </span>
                                  ) : rec.isFullMatch ? (
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[10px] font-black flex items-center gap-1">
                                      <CheckCircle size={11} className="text-emerald-600" />
                                      Cobertura Total do Horário (100%)
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-primary border border-blue-200 dark:border-blue-800 text-[10px] font-black flex items-center gap-1">
                                      <Clock size={11} />
                                      Cobertura Parcial da Faixa ({rec.overlapHours}h compatíveis)
                                    </span>
                                  )}
                                </div>

                                {/* Badge de Compatibilidade de Horários */}
                                <div className="p-2.5 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 space-y-1 text-xs">
                                  <div className="flex justify-between items-center">
                                    <span className="font-extrabold text-primary flex items-center gap-1 text-[11px]">
                                      <Sparkles size={11} /> {rec.overlapHours}h compatíveis ({rec.matchScore}% do turno)
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                      {rec.dayName}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-600 dark:text-slate-300 block truncate">
                                    Grade semanal: {rec.matchingSlotsText}
                                  </span>
                                </div>

                                {/* Alerta de Conflito de Horário / Deslocamento */}
                                {rec.hasConflict && (
                                  <div className={`p-2 rounded-xl text-[11px] font-semibold flex items-start gap-1.5 border ${
                                    rec.conflictType === "overlap"
                                      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50"
                                      : "bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900/50"
                                  }`}>
                                    <AlertCircle size={13} className="shrink-0 mt-0.5" />
                                    <span>{rec.conflictMessage}</span>
                                  </div>
                                )}

                                <div className="flex flex-wrap gap-1">
                                  {inst.modalities.map((m) => (
                                    <span
                                      key={m}
                                      className="bg-white dark:bg-navy-800 px-2 py-0.5 rounded-full text-[10px] text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700"
                                    >
                                      {m}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between items-center">
                                <div className="text-[11px]">
                                  <span className="text-muted dark:text-slate-400 block">Valor Fixo da Vaga:</span>
                                  <span className="font-extrabold text-navy-900 dark:text-white">
                                    R$ {activeTargetShift.maxRate ?? (activeTargetShift as any).rate ?? 45}/h
                                  </span>
                                </div>

                                {rec.hasConflict ? (
                                  <span className="px-3.5 py-2 rounded-full text-xs font-bold bg-slate-200 dark:bg-navy-700 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700">
                                    {rec.conflictType === "overlap" ? "Conflito de Horário" : "Deslocamento Curto"}
                                  </span>
                                ) : alreadyInvited ? (
                                  <span className="px-3.5 py-2 rounded-full text-xs font-bold bg-slate-200 dark:bg-navy-700 text-slate-500">
                                    Convite já enviado
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleInviteTeacher(activeTargetShift.id, inst.id, inst.name)}
                                    className="px-4 py-2 rounded-full text-xs font-extrabold bg-primary text-white hover:bg-primary-hover shadow-xs transition-all active:scale-95"
                                  >
                                    Convidar com Valor Fixo
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Todos os Professores da Plataforma */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-4">
                  <h3 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                    Todos os Instrutores Cadastrados na Plataforma
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeInstructors.map((inst) => (
                      <div
                        key={inst.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-slate-700/60 space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2.5">
                          <div className="flex gap-3 items-center">
                            <img
                              src={inst.avatar}
                              alt={inst.name}
                              className="w-12 h-12 rounded-full object-cover border border-white dark:border-navy-700"
                            />
                            <div>
                              <h4 className="text-sm font-bold text-navy-900 dark:text-white">{inst.name}</h4>
                              <span className="text-xs text-primary font-semibold">CREF {inst.cref}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted dark:text-slate-400">Valor base:</span>
                            <span className="font-extrabold text-navy-900 dark:text-white">R$ {inst.hourlyRate || 45}/h</span>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {inst.modalities.map((m) => (
                              <span
                                key={m}
                                className="bg-white dark:bg-navy-800 px-2 py-0.5 rounded-full text-[10px] text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setNewTitle(`${inst.modalities[0] || "Musculação"} - Convite`);
                            setNewModality(inst.modalities[0] || "Musculação");
                            setShowNewShiftModal(true);
                          }}
                          className="w-full bg-navy-900 dark:bg-primary hover:bg-navy-800 dark:hover:bg-primary-hover text-white font-bold py-2 rounded-full text-xs transition-all"
                        >
                          Criar Vaga para este Professor
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ===================== ABA 4: ASSINATURA & PLANOS ===================== */}
          {activeMenu === "assinatura" && (
            <div className="bg-card dark:bg-navy-800 rounded-squircle p-6 shadow-soft border border-slate-100 dark:border-slate-800 space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-navy-900 dark:text-white">Planos de Assinatura</h2>
                <p className="text-xs text-muted dark:text-slate-400">
                  O cadastro e a 1ª contratação são 100% gratuitos. Escolha o plano ideal para a sua rotina.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Essencial */}
                <div className="p-6 rounded-squircle border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-900/60 space-y-4">
                  <h3 className="text-lg font-bold text-navy-900 dark:text-white">Essencial</h3>
                  <div className="text-3xl font-extrabold text-navy-900 dark:text-white">
                    R$ 89<span className="text-xs text-muted dark:text-slate-400 font-normal">/mês</span>
                  </div>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                    <li>✓ Até 4 contratações por mês</li>
                    <li>✓ 1 unidade / 1 gestor</li>
                    <li>✓ Liberação imediata de contatos</li>
                    <li>✓ Chat integrado</li>
                  </ul>
                  <button
                    onClick={() => subscribePlan("essencial")}
                    className="w-full py-2.5 rounded-full text-xs font-bold bg-navy-900 dark:bg-primary text-white hover:bg-navy-800 dark:hover:bg-primary-hover transition-colors"
                  >
                    {gymPlan === "essencial" ? "Plano Ativo" : "Assinar Essencial"}
                  </button>
                </div>

                {/* Pro (Destaque) */}
                <div className="p-6 rounded-squircle border-2 border-primary bg-primary-subtle/30 dark:bg-primary/10 space-y-4 relative">
                  <span className="absolute -top-3 right-6 bg-primary text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                    MAIS POPULAR
                  </span>
                  <h3 className="text-lg font-bold text-navy-900 dark:text-white">Pro</h3>
                  <div className="text-3xl font-extrabold text-primary">
                    R$ 189<span className="text-xs text-muted dark:text-slate-400 font-normal">/mês</span>
                  </div>
                  <ul className="text-xs text-slate-700 dark:text-slate-200 space-y-2">
                    <li>✓ Até 15 contratações por mês</li>
                    <li>✓ 1 unidade / 3 gestores</li>
                    <li>✓ Turnos urgentes SOS com destaque</li>
                    <li>✓ Aceite automático configurável</li>
                  </ul>
                  <button
                    onClick={() => subscribePlan("pro")}
                    className="w-full py-2.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-sm transition-colors"
                  >
                    {gymPlan === "pro" ? "Plano Ativo" : "Assinar Pro"}
                  </button>
                </div>

                {/* Rede */}
                <div className="p-6 rounded-squircle border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-900/60 space-y-4">
                  <h3 className="text-lg font-bold text-navy-900 dark:text-white">Rede</h3>
                  <div className="text-3xl font-extrabold text-navy-900 dark:text-white">
                    R$ 390<span className="text-xs text-muted dark:text-slate-400 font-normal">/mês</span>
                  </div>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                    <li>✓ Contratações ilimitadas</li>
                    <li>✓ Múltiplas filiais e gestores</li>
                    <li>✓ Relatório unificado de custos</li>
                  </ul>
                  <button
                    onClick={() => subscribePlan("rede")}
                    className="w-full py-2.5 rounded-full text-xs font-bold bg-slate-200 dark:bg-navy-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-navy-600 transition-colors"
                  >
                    {gymPlan === "rede" ? "Plano Ativo" : "Assinar Rede"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===================== ABA 5: PERFIL DA ACADEMIA (NOVO) ===================== */}
          {activeMenu === "perfil" && (
            <div className="bg-card dark:bg-navy-800 rounded-squircle p-6 shadow-soft border border-slate-100 dark:border-slate-800 space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-navy-900 dark:text-white">Perfil da Unidade</h2>
                <p className="text-xs text-muted dark:text-slate-400">
                  Cadastre o logotipo, foto da fachada, endereço, modalidades, dados dos responsáveis e senha.
                </p>
              </div>

              {profileSuccessMsg && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border border-emerald-200/50">
                  <CheckCircle size={16} />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* 1. Identidade Visual (Logotipo 1:1 e Foto da Fachada 16:9 com Crop) */}
                <div className="p-5 bg-slate-50 dark:bg-navy-900/60 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Camera size={14} className="text-primary" /> Identidade Visual & Fotos com Enquadramento
                      </h3>
                      <p className="text-[11px] text-muted dark:text-slate-400 mt-0.5">
                        Faça upload de fotos e ajuste o enquadramento (crop) exato para o app e web.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Logotipo Circular */}
                    <div className="bg-white dark:bg-navy-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <label className="text-xs font-bold text-navy-900 dark:text-white block">
                            Logotipo da Academia (Circular)
                          </label>
                          <span className="text-[10px] text-muted dark:text-slate-400">
                            Formato circular · Recomendado 500x500px
                          </span>
                        </div>
                        <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                          Crop Circular
                        </span>
                      </div>

                      <div className="flex items-center gap-3.5">
                        <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-navy-900 p-1 border-2 border-primary/40 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs relative group">
                          {profileLogo ? (
                            <img src={profileLogo} alt="Logo da Academia" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <Building2 size={32} className="text-primary" />
                          )}
                          <div
                            onClick={() => openCropWithCurrent("logo")}
                            className="absolute inset-0 bg-navy-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-[10px] font-bold rounded-full"
                          >
                            <Crop size={14} />
                          </div>
                        </div>

                        <div className="flex-1 space-y-2">
                          <input
                            type="file"
                            id="logo-file-input"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e, "logo")}
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <label
                              htmlFor="logo-file-input"
                              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary-hover shadow-xs transition-all active:scale-95"
                            >
                              <Upload size={13} />
                              <span>Upload & Recortar</span>
                            </label>

                            {profileLogo && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openCropWithCurrent("logo")}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-navy-700 text-navy-900 dark:text-slate-200 text-xs font-bold rounded-full hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors"
                                >
                                  <Crop size={13} />
                                  <span>Ajustar Crop</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setProfileLogo("")}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold rounded-full transition-colors border border-red-200 dark:border-red-900/40"
                                >
                                  <Trash2 size={13} />
                                  <span>Remover</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Foto da Fachada 16:9 Panorâmica */}
                    <div className="bg-white dark:bg-navy-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <label className="text-xs font-bold text-navy-900 dark:text-white block">
                            Foto da Fachada / Recepção (16:9)
                          </label>
                          <span className="text-[10px] text-muted dark:text-slate-400">
                            Proporção widescreen · Recomendado 1280x720px
                          </span>
                        </div>
                        <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                          Crop 16:9
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        <div className="relative h-24 rounded-2xl overflow-hidden bg-slate-100 dark:bg-navy-900 border-2 border-primary/30 shadow-xs group">
                          <img src={profileFacade} alt="Fachada da Academia" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div
                            onClick={() => openCropWithCurrent("facade")}
                            className="absolute inset-0 bg-navy-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-xs font-bold gap-1.5"
                          >
                            <Crop size={15} />
                            <span>Recortar Enquadramento</span>
                          </div>
                        </div>

                        <input
                          type="file"
                          id="facade-file-input"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileSelect(e, "facade")}
                        />
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <label
                              htmlFor="facade-file-input"
                              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary-hover shadow-xs transition-all active:scale-95"
                            >
                              <Upload size={13} />
                              <span>Upload & Recortar</span>
                            </label>

                            {profileFacade && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openCropWithCurrent("facade")}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-navy-700 text-navy-900 dark:text-slate-200 text-xs font-bold rounded-full hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors"
                                >
                                  <Crop size={13} />
                                  <span>Ajustar Crop</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setProfileFacade("")}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold rounded-full transition-colors border border-red-200 dark:border-red-900/40"
                                >
                                  <Trash2 size={13} />
                                  <span>Remover</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Dados da Empresa & Endereço */}
                <div className="p-5 bg-slate-50 dark:bg-navy-900/60 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
                  <h3 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Building size={14} className="text-primary" /> Dados da Unidade & Localização
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-navy-800 dark:text-slate-200 block mb-1">Nome Fantasia</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-navy-800 text-navy-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-navy-800 dark:text-slate-200 block mb-1">CNPJ</label>
                      <input
                        type="text"
                        value={profileCnpj}
                        onChange={(e) => setProfileCnpj(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-navy-800 text-navy-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-navy-800 dark:text-slate-200 block mb-1">Telefone da Recepção</label>
                      <input
                        type="text"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(maskPhone(e.target.value))}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        className="w-full p-2.5 bg-white dark:bg-navy-800 text-navy-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-navy-800 dark:text-slate-200 block mb-1">E-mail da Unidade</label>
                      <input
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        placeholder="contato@suaacademia.com.br"
                        className="w-full p-2.5 bg-white dark:bg-navy-800 text-navy-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="md:col-span-2">
                      <label className="font-bold text-navy-800 dark:text-slate-200 block mb-1">Endereço Completo</label>
                      <input
                        type="text"
                        value={profileAddress}
                        onChange={(e) => setProfileAddress(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-navy-800 text-navy-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-navy-800 dark:text-slate-200 block mb-1">Bairro & Cidade</label>
                      <input
                        type="text"
                        value={`${profileNeighborhood} - ${profileCity}`}
                        onChange={(e) => {
                          const parts = e.target.value.split("-");
                          setProfileNeighborhood(parts[0]?.trim() || "");
                          setProfileCity(parts[1]?.trim() || "");
                        }}
                        className="w-full p-2.5 bg-white dark:bg-navy-800 text-navy-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Modalidades Oferecidas + Botão Nova Modalidade */}
                <div className="p-5 bg-slate-50 dark:bg-navy-900/60 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3.5">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                        Modalidades Ativas na Unidade
                      </h3>
                      <p className="text-[11px] text-muted dark:text-slate-400">
                        Clique para ativar/desativar modalidades ou adicione novas para a sua escala
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCustomModalityInput("");
                        setShowNewModalityModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-full shadow-xs transition-all active:scale-95"
                    >
                      <Plus size={13} />
                      <span>Nova Modalidade</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {profileModalities.map((mod) => (
                      <button
                        type="button"
                        key={mod}
                        onClick={() => toggleModality(mod)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 bg-primary text-white shadow-xs"
                      >
                        <Check size={12} />
                        <span>{mod}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Tabela de Valores por Modalidade e Horários (Item 5) */}
                <div className="p-5 bg-slate-50 dark:bg-navy-900/60 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign size={14} className="text-primary" /> Tabela de Valores por Modalidade e Horários
                      </h3>
                      <p className="text-[11px] text-muted dark:text-slate-400">
                        Configure o valor fixo base de hora-aula para cada modalidade e os acréscimos automáticos de horário e dias
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSavePricing}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-full shadow-xs transition-all active:scale-95"
                    >
                      <Check size={13} />
                      <span>Salvar Regras de Valores</span>
                    </button>
                  </div>

                  {/* Grid de Valores Base por Modalidade */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-navy-800 dark:text-slate-200 block">
                      Valor Base por Modalidade (R$/h)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {Object.entries(pricingModalityRates).map(([mod, rate]) => (
                        <div
                          key={mod}
                          className="p-3 bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5"
                        >
                          <span className="font-bold text-xs text-navy-900 dark:text-white truncate block">
                            {mod}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-400">R$</span>
                            <input
                              type="number"
                              value={rate}
                              onChange={(e) =>
                                setPricingModalityRates({
                                  ...pricingModalityRates,
                                  [mod]: Number(e.target.value)
                                })
                              }
                              className="w-full p-1.5 text-right font-extrabold text-sm bg-slate-50 dark:bg-navy-900 text-navy-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-primary"
                            />
                            <span className="text-[10px] text-muted dark:text-slate-400">/h</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Adicionais por Horário e Final de Semana */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                    <label className="text-xs font-bold text-navy-800 dark:text-slate-200 block">
                      Regras de Adicionais Automáticos
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3.5 bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-navy-900 dark:text-white block">
                            Adicional Noturno / Horário de Pico
                          </span>
                          <span className="text-[11px] text-muted dark:text-slate-400">
                            Aplicado automaticamente a turnos a partir das 18:00
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-xs font-bold text-primary">+ R$</span>
                          <input
                            type="number"
                            value={pricingPeakHourAddition}
                            onChange={(e) => setPricingPeakHourAddition(Number(e.target.value))}
                            className="w-16 p-1.5 text-right font-extrabold text-sm bg-slate-50 dark:bg-navy-900 text-navy-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-primary"
                          />
                          <span className="text-xs text-muted dark:text-slate-400">/h</span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-navy-900 dark:text-white block">
                            Adicional de Fins de Semana
                          </span>
                          <span className="text-[11px] text-muted dark:text-slate-400">
                            Aplicado automaticamente para aulas aos Sábados e Domingos
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-xs font-bold text-primary">+ R$</span>
                          <input
                            type="number"
                            value={pricingWeekendAddition}
                            onChange={(e) => setPricingWeekendAddition(Number(e.target.value))}
                            className="w-16 p-1.5 text-right font-extrabold text-sm bg-slate-50 dark:bg-navy-900 text-navy-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-primary"
                          />
                          <span className="text-xs text-muted dark:text-slate-400">/h</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Dados do Responsável / Gestor */}
                <div className="p-5 bg-slate-50 dark:bg-navy-900/60 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
                  <h3 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-primary" /> Dados do Gestor / Responsável
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-navy-800 dark:text-slate-200 block mb-1">Nome do Gestor</label>
                      <input
                        type="text"
                        value={profileManagerName}
                        onChange={(e) => setProfileManagerName(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-navy-800 text-navy-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-navy-800 dark:text-slate-200 block mb-1">Cargo / Função</label>
                      <input
                        type="text"
                        value={profileManagerRole}
                        onChange={(e) => setProfileManagerRole(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-navy-800 text-navy-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-navy-800 dark:text-slate-200 block mb-1">Celular / WhatsApp Direto</label>
                      <input
                        type="text"
                        value={profileManagerPhone}
                        onChange={(e) => setProfileManagerPhone(maskPhone(e.target.value))}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        className="w-full p-2.5 bg-white dark:bg-navy-800 text-navy-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-navy-800 dark:text-slate-200 block mb-1">E-mail do Gestor</label>
                      <input
                        type="email"
                        value={profileManagerEmail}
                        onChange={(e) => setProfileManagerEmail(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-navy-800 text-navy-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Segurança & Alteração de Senha */}
                <div className="p-5 bg-slate-50 dark:bg-navy-900/60 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
                  <h3 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Lock size={14} className="text-primary" /> Segurança e Senha de Acesso
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-navy-800 dark:text-slate-200 block mb-1">Senha Atual</label>
                      <input
                        type="password"
                        defaultValue="••••••••"
                        className="w-full p-2.5 bg-white dark:bg-navy-800 text-navy-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-navy-800 dark:text-slate-200 block mb-1">Nova Senha</label>
                      <input
                        type="password"
                        placeholder="Mínimo 8 dígitos"
                        className="w-full p-2.5 bg-white dark:bg-navy-800 text-navy-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-navy-800 dark:text-slate-200 block mb-1">Confirmar Nova Senha</label>
                      <input
                        type="password"
                        placeholder="Repita a senha"
                        className="w-full p-2.5 bg-white dark:bg-navy-800 text-navy-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-6 py-3 rounded-full shadow-md transition-all active:scale-95"
                  >
                    Salvar Dados Cadastrais da Academia
                  </button>
                </div>
              </form>

              {/* 6. Sessão, Conta e Log Off */}
              <div className="p-5 bg-slate-50 dark:bg-navy-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <LogOut size={14} className="text-primary" /> Sessão Ativa & Conta da Unidade
                    </h3>
                    <p className="text-[11px] text-muted dark:text-slate-400 mt-0.5">
                      Você está conectado como <strong className="text-navy-900 dark:text-white">{currentGym.managerName || userName}</strong> ({currentGym.managerEmail || userEmail})
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new CustomEvent("open-install-shortcut-modal"))}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-full shadow-2xs transition-all active:scale-95"
                    >
                      <Smartphone size={13} className="text-primary" />
                      <span>Instalar no Celular</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowOnboarding(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-full shadow-2xs transition-all active:scale-95"
                    >
                      <HelpCircle size={13} className="text-primary" />
                      <span>Como Funciona o App</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => logout()}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-full shadow-xs transition-all active:scale-95"
                    >
                      <LogOut size={13} />
                      <span>Sair da Conta (Log off)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeleteConfirmChecked(false);
                        setShowDeleteAccountModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full shadow-xs transition-all active:scale-95"
                    >
                      <Trash2 size={13} />
                      <span>Excluir Conta da Unidade</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          </main>
        </div>

      {/* ===================== MODAL DE CADASTRAR HORÁRIO DE AULA (INDIVIDUAL OU GRADE) ===================== */}
      <AnimatedModal
        isOpen={showNewShiftModal}
        onClose={() => setShowNewShiftModal(false)}
        maxWidth="max-w-lg"
        className="p-5 sm:p-6 space-y-4"
      >
        {(() => {
          const calculatedGridShifts = getCalculatedGridShifts();
          const daysMeta = [
            { day: 1, label: "Seg", full: "Segunda" },
            { day: 2, label: "Ter", full: "Terça" },
            { day: 3, label: "Qua", full: "Quarta" },
            { day: 4, label: "Qui", full: "Quinta" },
            { day: 5, label: "Sex", full: "Sexta" },
            { day: 6, label: "Sáb", full: "Sábado" },
            { day: 0, label: "Dom", full: "Domingo" }
          ];

          return (
            <>
              
              {/* Topo da Modal */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
                <div>
                  <h3 className="text-base font-extrabold text-navy-900 dark:text-white flex items-center gap-2">
                    <CalendarIcon size={18} className="text-primary" />
                    <span>Cadastrar e disponibilizar horários</span>
                  </h3>
                  <p className="text-xs text-muted dark:text-slate-400">
                    Cadastre um horário pontual ou preencha múltiplos dias da grade semanal
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewShiftModal(false)}
                  className="text-slate-400 hover:text-navy-900 dark:hover:text-white p-1 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* SEGMENTED CONTROL: TOGGLE ENTRE HORÁRIO INDIVIDUAL E GRADE DE HORÁRIOS */}
              <div className="bg-slate-100 dark:bg-navy-900 p-1 rounded-2xl flex gap-1 border border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setShiftModalMode("individual")}
                  className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    shiftModalMode === "individual"
                      ? "bg-white dark:bg-navy-800 text-primary shadow-xs ring-1 ring-black/5 dark:ring-white/10"
                      : "text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white"
                  }`}
                >
                  <Clock size={13} />
                  <span>Horário Individual</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShiftModalMode("grade")}
                  className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    shiftModalMode === "grade"
                      ? "bg-white dark:bg-navy-800 text-primary shadow-xs ring-1 ring-black/5 dark:ring-white/10"
                      : "text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white"
                  }`}
                >
                  <Layers size={13} />
                  <span>Grade / Múltiplos Dias</span>
                </button>
              </div>

              {/* CONTEÚDO MODO 1: HORÁRIO INDIVIDUAL */}
              {shiftModalMode === "individual" && (
                <div className="space-y-4 text-xs animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-navy-800 dark:text-slate-200 block font-bold mb-1">Modalidade</label>
                      <select
                        value={newModality}
                        onChange={(e) => handleModalityChange(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-navy-900 text-navy-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-primary"
                      >
                        <option>Musculação</option>
                        <option>Spinning</option>
                        <option>Funcional</option>
                        <option>Pilates</option>
                        <option>Alongamento / Yoga</option>
                        <option>Cross Training</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-navy-800 dark:text-slate-200 block font-bold mb-1">Título do Horário</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Ex: Turno Tarde"
                        className="w-full p-2.5 bg-slate-50 dark:bg-navy-900 text-navy-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-navy-800 dark:text-slate-200 block font-bold mb-1">Data da Aula</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-navy-900 dark:text-white focus:outline-primary cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-navy-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                    <div>
                      <label className="text-navy-800 dark:text-slate-200 block font-bold mb-1 flex items-center gap-1">
                        <Clock size={12} className="text-primary" /> Hora de Início
                      </label>
                      <input
                        type="time"
                        value={newStartTime}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 font-extrabold text-navy-900 dark:text-white text-sm focus:outline-primary"
                      />
                    </div>

                    <div>
                      <label className="text-navy-800 dark:text-slate-200 block font-bold mb-1 flex items-center gap-1">
                        <Clock size={12} className="text-primary" /> Hora de Término
                      </label>
                      <input
                        type="time"
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 font-extrabold text-navy-900 dark:text-white text-sm focus:outline-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-navy-800 dark:text-slate-200 block font-bold mb-1">
                      Valor Fixo da Hora-Aula (R$/h)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-400">R$</span>
                      <input
                        type="number"
                        value={newMaxRate}
                        onChange={(e) => setNewMaxRate(Number(e.target.value))}
                        className="flex-1 p-2.5 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 font-extrabold text-navy-900 dark:text-white text-base focus:outline-primary"
                      />
                      <span className="text-xs text-muted dark:text-slate-400">/ hora (Fixo)</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted dark:text-slate-400">
                      <span>Sugerido pela tabela de precificação da unidade:</span>
                      <span className="font-bold text-primary">
                        R$ {calculateSuggestedRate(
                          { ...currentGym, pricingRules: { modalityRates: pricingModalityRates, peakHourAddition: pricingPeakHourAddition, weekendAddition: pricingWeekendAddition } },
                          newModality,
                          newStartTime,
                          newDate
                        )}/h
                      </span>
                    </div>

                    {newDate && newStartTime && isTimeInPastForDate(newDate, newStartTime) && (
                      <div className="mt-2.5 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl flex items-start gap-2 text-amber-800 dark:text-amber-200 text-xs">
                        <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <div>
                          <strong className="block font-bold">Horário no passado não permitido</strong>
                          O horário de início ({newStartTime}) já passou para o dia de hoje ({formatDateDDMMAAAA(newDate)}). Escolha um horário futuro para cadastrar.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CONTEÚDO MODO 2: GRADE RECORRENTE / MÚLTIPLOS DIAS */}
              {shiftModalMode === "grade" && (
                <div className="space-y-4 text-xs animate-fade-in max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
                  
                  {/* Modalidade e Título Base */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-navy-800 dark:text-slate-200 block font-bold mb-1">Modalidade</label>
                      <select
                        value={newModality}
                        onChange={(e) => handleModalityChange(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-navy-900 text-navy-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-primary"
                      >
                        <option>Musculação</option>
                        <option>Spinning</option>
                        <option>Funcional</option>
                        <option>Pilates</option>
                        <option>Alongamento / Yoga</option>
                        <option>Cross Training</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-navy-800 dark:text-slate-200 block font-bold mb-1">Título da Grade</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Ex: Musculação - Grade Semanal"
                        className="w-full p-2.5 bg-slate-50 dark:bg-navy-900 text-navy-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-primary"
                      />
                    </div>
                  </div>

                  {/* SELETOR DE DIAS DA SEMANA COM ATALHOS RÁPIDOS */}
                  <div className="space-y-2 p-3 bg-slate-50 dark:bg-navy-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                    <div className="flex justify-between items-center">
                      <label className="text-navy-800 dark:text-slate-200 font-extrabold flex items-center gap-1.5">
                        <CalendarIcon size={13} className="text-primary" />
                        <span>Dias da Semana Ativos</span>
                      </label>
                      <span className="text-[10px] text-muted dark:text-slate-400 font-bold">
                        {gridWeekDays.length} {gridWeekDays.length === 1 ? "dia selecionado" : "dias selecionados"}
                      </span>
                    </div>

                    {/* Atalhos Rápidos de 1 Toque */}
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      <button
                        type="button"
                        onClick={() => setGridWeekDays([1, 2, 3, 4, 5])}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-primary hover:text-primary transition-all active:scale-95"
                      >
                        Seg a Sex
                      </button>
                      <button
                        type="button"
                        onClick={() => setGridWeekDays([1, 3, 5])}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-primary hover:text-primary transition-all active:scale-95"
                      >
                        Seg / Qua / Sex
                      </button>
                      <button
                        type="button"
                        onClick={() => setGridWeekDays([2, 4])}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-primary hover:text-primary transition-all active:scale-95"
                      >
                        Ter / Qui
                      </button>
                      <button
                        type="button"
                        onClick={() => setGridWeekDays([6, 0])}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-primary hover:text-primary transition-all active:scale-95"
                      >
                        Fim de Semana
                      </button>
                      <button
                        type="button"
                        onClick={() => setGridWeekDays([0, 1, 2, 3, 4, 5, 6])}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-primary hover:text-primary transition-all active:scale-95"
                      >
                        Todos
                      </button>
                    </div>

                    {/* Botões dos 7 Dias da Semana */}
                    <div className="grid grid-cols-7 gap-1.5 pt-1">
                      {daysMeta.map((item) => {
                        const isSelected = gridWeekDays.includes(item.day);
                        return (
                          <button
                            key={item.day}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setGridWeekDays(gridWeekDays.filter((d) => d !== item.day));
                              } else {
                                setGridWeekDays([...gridWeekDays, item.day]);
                              }
                            }}
                            className={`py-2 rounded-xl text-center font-black transition-all ${
                              isSelected
                                ? "bg-primary text-white shadow-xs scale-102"
                                : "bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300"
                            }`}
                            title={item.full}
                          >
                            <span className="text-[11px] block">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* HORÁRIOS DA GRADE COM SUPORTE A MÚLTIPLOS TURNOS */}
                  <div className="space-y-2.5 p-3 bg-slate-50 dark:bg-navy-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                    <div className="flex justify-between items-center">
                      <label className="text-navy-800 dark:text-slate-200 font-extrabold flex items-center gap-1.5">
                        <Clock size={13} className="text-primary" />
                        <span>Horários para os Dias Selecionados</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setGridTimeSlots([
                            ...gridTimeSlots,
                            { id: `slot-${Date.now()}`, start: "18:00", end: "22:00" }
                          ]);
                        }}
                        className="text-[10px] font-black text-primary hover:underline flex items-center gap-1"
                      >
                        <Plus size={11} /> Adicionar outro horário
                      </button>
                    </div>

                    <div className="space-y-2">
                      {gridTimeSlots.map((slot, index) => (
                        <div
                          key={slot.id}
                          className="flex items-center gap-2 p-2 bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-slate-700"
                        >
                          <span className="text-[10px] font-bold text-muted dark:text-slate-400 w-12 shrink-0">
                            Turno {index + 1}:
                          </span>

                          <div className="flex-1 flex items-center gap-1.5">
                            <input
                              type="time"
                              value={slot.start}
                              onChange={(e) => {
                                const val = e.target.value;
                                setGridTimeSlots(
                                  gridTimeSlots.map((s, i) => (i === index ? { ...s, start: val } : s))
                                );
                              }}
                              className="w-full p-1.5 bg-slate-50 dark:bg-navy-900 rounded-lg border border-slate-200 dark:border-slate-700 font-black text-xs text-navy-900 dark:text-white text-center focus:outline-primary"
                            />
                            <span className="text-xs text-slate-400 font-bold">até</span>
                            <input
                              type="time"
                              value={slot.end}
                              onChange={(e) => {
                                const val = e.target.value;
                                setGridTimeSlots(
                                  gridTimeSlots.map((s, i) => (i === index ? { ...s, end: val } : s))
                                );
                              }}
                              className="w-full p-1.5 bg-slate-50 dark:bg-navy-900 rounded-lg border border-slate-200 dark:border-slate-700 font-black text-xs text-navy-900 dark:text-white text-center focus:outline-primary"
                            />
                          </div>

                          {gridTimeSlots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setGridTimeSlots(gridTimeSlots.filter((_, i) => i !== index));
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title="Remover este horário da grade"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PERÍODO DE VIGÊNCIA DA GRADE */}
                  <div className="space-y-2 p-3 bg-slate-50 dark:bg-navy-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                    <div className="flex justify-between items-center">
                      <label className="text-navy-800 dark:text-slate-200 font-extrabold flex items-center gap-1.5">
                        <CalendarIcon size={13} className="text-primary" />
                        <span>Período da Grade</span>
                      </label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setGridStartDate("2026-11-06");
                            setGridEndDate("2026-11-30");
                          }}
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary transition-all"
                        >
                          Fim de Novembro
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGridStartDate("2026-11-06");
                            setGridEndDate("2026-11-20");
                          }}
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary transition-all"
                        >
                          2 Semanas
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[10px] text-muted dark:text-slate-400 block font-bold mb-1">Data Inicial</span>
                        <input
                          type="date"
                          value={gridStartDate}
                          onChange={(e) => setGridStartDate(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-navy-900 dark:text-white text-xs focus:outline-primary cursor-pointer"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-muted dark:text-slate-400 block font-bold mb-1">Data Final</span>
                        <input
                          type="date"
                          value={gridEndDate}
                          onChange={(e) => setGridEndDate(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-navy-900 dark:text-white text-xs focus:outline-primary cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Valor Fixo da Hora-Aula */}
                  <div>
                    <label className="text-navy-800 dark:text-slate-200 block font-bold mb-1">
                      Valor Fixo da Hora-Aula (R$/h)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-400">R$</span>
                      <input
                        type="number"
                        value={newMaxRate}
                        onChange={(e) => setNewMaxRate(Number(e.target.value))}
                        className="flex-1 p-2.5 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 font-extrabold text-navy-900 dark:text-white text-base focus:outline-primary"
                      />
                      <span className="text-xs text-muted dark:text-slate-400">/ hora (Fixo para toda a grade)</span>
                    </div>
                  </div>

                  {/* CARD DE RESUMO E PREVIEW EM TEMPO REAL (UX MASTERCLASS) */}
                  <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-3.5 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-navy-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles size={14} className="text-primary" />
                        <span>Resumo da Geração da Grade</span>
                      </span>
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-primary text-white shadow-2xs">
                        {calculatedGridShifts.length} {calculatedGridShifts.length === 1 ? "aula" : "aulas"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      Esta grade irá cadastrar automaticamente <strong>{calculatedGridShifts.length} horários</strong> de <strong>{newModality}</strong> entre {formatDateDDMMAAAA(gridStartDate)} e {formatDateDDMMAAAA(gridEndDate)} para os {gridWeekDays.length} dias da semana selecionados.
                    </p>
                    {calculatedGridShifts.length === 0 && (
                      <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 pt-1">
                        <AlertCircle size={12} /> Selecione ao menos 1 dia da semana para gerar a grade.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* RODAPÉ DA MODAL COM BOTÕES DE AÇÃO */}
              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowNewShiftModal(false)}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                >
                  Cancelar
                </button>

                {shiftModalMode === "individual" ? (
                  <button
                    type="button"
                    onClick={() => {
                      createShift({
                        gymId: activeGymId,
                        title: newTitle,
                        modality: newModality,
                        date: newDate,
                        dateFormatted: `${formatDateDDMMAAAA(newDate)} · ${newStartTime} – ${newEndTime}`,
                        startTime: newStartTime,
                        endTime: newEndTime,
                        maxRate: newMaxRate
                      });
                      setShowNewShiftModal(false);
                      setGridCreationFeedback("Horário de aula cadastrado com sucesso!");
                      setTimeout(() => setGridCreationFeedback(null), 4000);
                    }}
                    disabled={isTimeInPastForDate(newDate, newStartTime)}
                    className="flex-1 py-2.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95"
                  >
                    Salvar Horário de Aula
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={calculatedGridShifts.length === 0}
                    onClick={() => {
                      if (calculatedGridShifts.length > 0) {
                        createMultipleShifts(calculatedGridShifts);
                        setShowNewShiftModal(false);
                        setGridCreationFeedback(`Grade com ${calculatedGridShifts.length} horários cadastrada com sucesso!`);
                        setTimeout(() => setGridCreationFeedback(null), 5000);
                      }
                    }}
                    className={`flex-1 py-2.5 rounded-full text-xs font-black transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1.5 ${
                      calculatedGridShifts.length > 0
                        ? "bg-primary text-white hover:bg-primary-hover"
                        : "bg-slate-200 dark:bg-navy-700 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Check size={14} />
                    <span>Cadastrar Grade ({calculatedGridShifts.length} Horários)</span>
                  </button>
                )}
              </div>
            </>
          );
        })()}
      </AnimatedModal>

      {/* ===================== WIZARD: QUERO CONTRATAR UM(A) INSTRUTOR(A) ===================== */}
      <AnimatedModal
        isOpen={showHireWizard}
        onClose={() => setShowHireWizard(false)}
        maxWidth="max-w-lg"
        className="p-5 sm:p-6"
      >
        {(() => {
          const parseHours = (start: string, end: string) => {
            const [sh, sm] = (start || "07:00").split(":").map(Number);
            const [eh, em] = (end || "11:00").split(":").map(Number);
            const startMins = (sh || 0) * 60 + (sm || 0);
            const endMins = (eh || 0) * 60 + (em || 0);
            const diff = Math.max(30, endMins - startMins);
            return Math.round((diff / 60) * 10) / 10;
          };

          const durationHours = parseHours(hireStartTime, hireEndTime);
          const totalEstimate = Math.round(durationHours * hireRate);
          const modalityToUse = hireModality === "Outra" ? (hireCustomModality.trim() || "Musculação") : hireModality;

          // Lógica de cálculo dos dias do mês para deslize horizontal no modal de contratação
          const hireParts = (hireDate || "").split("-").map(Number);
          const hireYear = hireParts[0] || 2026;
          const hireMonth = hireParts[1] || 11;
          const hireDay = hireParts[2] || 11;
          const daysInHireMonth = new Date(hireYear, hireMonth, 0).getDate();

          const weekdayShort = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
          const weekdayFull = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
          const monthNamesPt = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
          ];
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

          const hireMonthLabel = `${monthNamesPt[hireMonth - 1]} de ${hireYear}`;

          const handleHirePrevMonth = () => {
            const prevD = new Date(hireYear, hireMonth - 2, 1);
            const mStr = String(prevD.getMonth() + 1).padStart(2, "0");
            setHireDate(`${prevD.getFullYear()}-${mStr}-01`);
          };

          const handleHireNextMonth = () => {
            const nextD = new Date(hireYear, hireMonth, 1);
            const mStr = String(nextD.getMonth() + 1).padStart(2, "0");
            setHireDate(`${nextD.getFullYear()}-${mStr}-01`);
          };

          const hireMonthDays = Array.from({ length: daysInHireMonth }, (_, i) => {
            const dNum = i + 1;
            const dObj = new Date(hireYear, hireMonth - 1, dNum);
            const dow = dObj.getDay();
            const dStr = `${hireYear}-${String(hireMonth).padStart(2, "0")}-${String(dNum).padStart(2, "0")}`;
            return {
              dateStr: dStr,
              dayNum: dNum,
              dayOfWeek: weekdayShort[dow],
              dayName: weekdayFull[dow],
              isToday: dStr === todayStr,
              isSelected: dStr === hireDate
            };
          });

          const selectedHireDateObj = new Date(hireYear, hireMonth - 1, hireDay);
          const selectedDow = !isNaN(selectedHireDateObj.getTime()) ? selectedHireDateObj.getDay() : 0;
          const selectedDayMeta = {
            dayName: weekdayFull[selectedDow] || "Dia Selecionado",
            dayOfWeek: weekdayShort[selectedDow] || "DIA",
            formatted: formatDateDDMMAAAA(hireDate)
          };

          const predefinedModalities = [
            { name: "Musculação", icon: Dumbbell, desc: "Acompanhamento de salão" },
            { name: "Spinning", icon: Bike, desc: "Ciclismo indoor e ritmo" },
            { name: "Funcional", icon: Zap, desc: "Treino funcional e circuitos" },
            { name: "Pilates", icon: Activity, desc: "Solo ou aparelhos" },
            { name: "Alongamento / Yoga", icon: Heart, desc: "Flexibilidade e relaxamento" },
            { name: "Cross Training", icon: Flame, desc: "WOD e condicionamento" },
            { name: "Natação / Hidro", icon: Waves, desc: "Aulas em piscina" },
            { name: "Dança / Ritmos", icon: Music, desc: "Zumba, ritmos e cardio" },
            { name: "Lutas / Boxe", icon: Shield, desc: "Boxe, Muay Thai e artes marciais" }
          ];

          return (
            <div className="h-[520px] max-h-[85vh] flex flex-col justify-between">
              {/* Header do Wizard (Fixo no Topo) */}
              <div className="space-y-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-black text-navy-900 dark:text-white">
                      Quero Contratar um(a) Instrutor(a)
                    </h3>
                    <p className="text-[11px] text-muted dark:text-slate-400">
                      Etapa {hireWizardStep} de 4 · {hireWizardStep === 1 ? "Valor da Aula" : hireWizardStep === 2 ? "Modalidade" : hireWizardStep === 3 ? "Data e Horário" : "Revisão e Publicação"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHireWizard(false)}
                    className="text-slate-400 hover:text-navy-900 dark:hover:text-white p-1 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Barra de Progresso Visual em 4 Etapas */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { step: 1, label: "1. Valor" },
                    { step: 2, label: "2. Modalidade" },
                    { step: 3, label: "3. Data/Hora" },
                    { step: 4, label: "4. Revisão" }
                  ].map((item) => (
                    <div key={item.step} className="space-y-1">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          hireWizardStep >= item.step
                            ? "bg-primary"
                            : "bg-slate-200 dark:bg-navy-700"
                        }`}
                      />
                      <span
                        className={`text-[10px] font-bold block text-center truncate ${
                          hireWizardStep === item.step
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

              {/* Corpo da Etapa (com scroll se necessário, altura constante) */}
              <div className="flex-1 overflow-y-auto py-3 pr-0.5 no-scrollbar flex flex-col justify-between">
                {/* ================= ETAPA 1: VALOR E TOGGLE DE NEGOCIAÇÃO ================= */}
                {hireWizardStep === 1 && (
                  <div className="space-y-4 animate-fade-in flex-1">
                    <div className="p-3 bg-blue-50 dark:bg-primary/10 rounded-2xl border border-primary/20 text-slate-700 dark:text-slate-300">
                      <span className="font-extrabold text-primary text-xs block mb-0.5">
                        Quanto a academia vai pagar pela hora-aula?
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        Defina o valor por hora oferecido para esta contratação.
                      </p>
                    </div>

                    {/* Campo de Valor Principal (Sem recomendação de valores) */}
                    <div className="bg-slate-50 dark:bg-navy-900/70 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-center space-y-2">
                      <label className="text-[11px] font-bold text-muted dark:text-slate-400 uppercase tracking-wider block">
                        Valor por Hora-Aula Oferecido
                      </label>

                      <div className="flex items-baseline justify-center gap-1 font-black text-navy-900 dark:text-white">
                        <span className="text-2xl text-primary font-bold">R$</span>
                        <input
                          type="number"
                          min={20}
                          value={hireRate || ""}
                          onChange={(e) => {
                            const newRate = Math.max(0, Number(e.target.value));
                            setHireRate(newRate);
                            if (newRate > 0 && (hireMinNegotiableRate >= newRate || !hireMinNegotiableRate)) {
                              setHireMinNegotiableRate(Math.max(15, newRate - 5));
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
                          aria-checked={hireAllowNegotiation}
                          onClick={() => {
                            const nextState = !hireAllowNegotiation;
                            setHireAllowNegotiation(nextState);
                            if (nextState && (hireMinNegotiableRate >= hireRate || !hireMinNegotiableRate)) {
                              setHireMinNegotiableRate(Math.max(15, hireRate - 5));
                            }
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            hireAllowNegotiation ? "bg-primary" : "bg-slate-300 dark:bg-navy-700"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              hireAllowNegotiation ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {hireAllowNegotiation && (
                        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5 animate-fade-in">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              Valor mínimo aceitável:
                            </span>
                            <div className="flex items-center gap-1 font-black text-primary">
                              <span>R$</span>
                              <input
                                type="number"
                                min={15}
                                max={Math.max(15, hireRate - 1)}
                                value={hireMinNegotiableRate || ""}
                                onChange={(e) => setHireMinNegotiableRate(Math.max(0, Number(e.target.value)))}
                                className={`w-16 text-center p-1.5 bg-slate-100 dark:bg-navy-800 border rounded-lg text-xs font-bold dark:text-white focus:outline-primary transition-colors ${
                                  hireAllowNegotiation && hireRate > 0 && hireMinNegotiableRate >= hireRate
                                    ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500"
                                    : "border-slate-300 dark:border-slate-600"
                                }`}
                              />
                              <span className="text-[10px] text-slate-400">/h</span>
                            </div>
                          </div>

                          {hireAllowNegotiation && hireRate > 0 && hireMinNegotiableRate >= hireRate && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 mt-1 animate-shake">
                              <AlertCircle size={13} className="shrink-0" />
                              <span>O valor mínimo aceitável deve ser menor que o valor da hora-aula (máx. R$ {Math.max(0, hireRate - 1)}/h)</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ================= ETAPA 2: MODALIDADE DA AULA (OUTLINE LIGHT ICONS) ================= */}
                {hireWizardStep === 2 && (
                  <div className="space-y-4 animate-fade-in flex-1">
                    <div className="p-3 bg-blue-50 dark:bg-primary/10 rounded-2xl border border-primary/20 text-slate-700 dark:text-slate-300">
                      <span className="font-extrabold text-primary text-xs block mb-0.5">
                        Qual modalidade o(a) professor(a) irá ministrar?
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        Selecione uma das opções abaixo ou informe uma modalidade digitando.
                      </p>
                    </div>

                    {/* Grid com Ícones Outline Light */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-1 no-scrollbar">
                      {predefinedModalities.map((item) => {
                        const Icon = item.icon;
                        const isSel = hireModality === item.name;
                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => {
                              setHireModality(item.name);
                              setHireCustomModality("");
                            }}
                            className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between gap-1.5 ${
                              isSel
                                ? "bg-primary text-white border-primary shadow-xs"
                                : "bg-card dark:bg-navy-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <Icon size={15} strokeWidth={1.5} className={isSel ? "text-white" : "text-slate-500"} />
                              <span className="truncate">{item.name}</span>
                            </div>
                            {isSel && <Check size={13} strokeWidth={2} className="shrink-0" />}
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
                          value={hireCustomModality}
                          onChange={(e) => {
                            setHireCustomModality(e.target.value);
                            if (e.target.value.trim()) {
                              setHireModality("Outra");
                            }
                          }}
                          placeholder="Ex: Treinamento Funcional Kids, GAP..."
                          className="flex-1 p-2 bg-card dark:bg-navy-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-navy-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (hireCustomModality.trim()) {
                              setHireModality("Outra");
                            }
                          }}
                          disabled={!hireCustomModality.trim()}
                          className="px-3 py-2 bg-primary disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Usar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ================= ETAPA 3: CALENDÁRIO COM DESLIZE DOS DIAS DO MÊS E INTERVALO DE HORÁRIO ================= */}
                {hireWizardStep === 3 && (
                  <div className="space-y-3.5 animate-fade-in flex-1">
                    <div className="p-3 bg-blue-50 dark:bg-primary/10 rounded-2xl border border-primary/20 text-slate-700 dark:text-slate-300">
                      <span className="font-extrabold text-primary text-xs block mb-0.5">
                        Qual é o dia e horário da aula?
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
                            onClick={handleHirePrevMonth}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors"
                            title="Mês anterior"
                          >
                            <ChevronLeft size={14} strokeWidth={2} />
                          </button>
                          <span className="text-xs font-black text-navy-900 dark:text-white">
                            {hireMonthLabel}
                          </span>
                          <button
                            type="button"
                            onClick={handleHireNextMonth}
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
                        {hireMonthDays.map((d) => (
                          <button
                            key={d.dateStr}
                            type="button"
                            onClick={() => setHireDate(d.dateStr)}
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
                        <CalendarIcon size={12} strokeWidth={1.5} className="text-primary" />
                        Outra data:
                      </label>
                      <input
                        type="date"
                        value={hireDate}
                        onChange={(e) => setHireDate(e.target.value)}
                        className="p-1.5 bg-card dark:bg-navy-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-navy-900 dark:text-white focus:outline-primary"
                      />
                    </div>

                    {/* Intervalo de Horário: Início e Fim */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-navy-900 dark:text-white flex items-center gap-1">
                          <Clock size={12} strokeWidth={1.5} className="text-primary" />
                          Início da Aula
                        </label>
                        <input
                          type="time"
                          value={hireStartTime}
                          onChange={(e) => setHireStartTime(e.target.value)}
                          className="w-full p-2 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-navy-900 dark:text-white focus:outline-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-navy-900 dark:text-white flex items-center gap-1">
                          <Clock size={12} strokeWidth={1.5} className="text-primary" />
                          Término da Aula
                        </label>
                        <input
                          type="time"
                          value={hireEndTime}
                          onChange={(e) => setHireEndTime(e.target.value)}
                          className="w-full p-2 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-navy-900 dark:text-white focus:outline-primary"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                      <span className="text-[11px] text-muted dark:text-slate-400">
                        {durationHours} horas ({hireStartTime} às {hireEndTime})
                      </span>
                      <span className="font-black text-primary">
                        R$ {totalEstimate},00 total
                      </span>
                    </div>

                    {hireDate && hireStartTime && isTimeInPastForDate(hireDate, hireStartTime) && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl flex items-start gap-2 text-amber-800 dark:text-amber-200 text-xs">
                        <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <div>
                          <strong className="block font-bold">Horário no passado não permitido</strong>
                          O horário de início selecionado ({hireStartTime}) já passou para o dia de hoje ({formatDateDDMMAAAA(hireDate)}). Escolha um horário futuro para continuar.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ================= ETAPA 4: REVISÃO E PUBLICAÇÃO ================= */}
                {hireWizardStep === 4 && (
                  <div className="space-y-3.5 animate-fade-in flex-1">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 text-slate-700 dark:text-slate-300">
                      <span className="font-extrabold text-emerald-800 dark:text-emerald-300 text-xs block mb-0.5">
                        Tudo pronto! Revise as informações antes de publicar:
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        Ao publicar, instrutores com compatibilidade de horários e valores serão recomendados para a sua unidade.
                      </p>
                    </div>

                    {/* Card de Resumo Completo */}
                    <div className="bg-card dark:bg-navy-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 shadow-xs">
                      <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted dark:text-slate-400 block tracking-wider">
                            Modalidade
                          </span>
                          <h4 className="font-black text-sm text-navy-900 dark:text-white">
                            {modalityToUse}
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="bg-primary/10 text-primary font-black text-xs px-2.5 py-1 rounded-full block">
                            R$ {hireRate}/h
                          </span>
                          {hireAllowNegotiation && (
                            <span className="text-[10px] text-muted dark:text-slate-400 block mt-1">
                              Mín: R$ {hireMinNegotiableRate}/h
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-muted dark:text-slate-400 block">Data da Aula</span>
                          <p className="font-bold text-navy-900 dark:text-white flex items-center gap-1">
                            <CalendarIcon size={12} strokeWidth={1.5} className="text-primary" />
                            {formatDateDDMMAAAA(hireDate)}
                          </p>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[10px] text-muted dark:text-slate-400 block">Horário e Duração</span>
                          <p className="font-bold text-navy-900 dark:text-white flex items-center gap-1">
                            <Clock size={12} strokeWidth={1.5} className="text-primary" />
                            {hireStartTime} às {hireEndTime} ({durationHours}h)
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[10px] text-muted dark:text-slate-400 block">Unidade Solicitante</span>
                          <span className="font-bold text-navy-900 dark:text-white">{currentGym.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-muted dark:text-slate-400 block">Total Estimado</span>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">R$ {totalEstimate},00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Rodapé com Botões de Ação (Posicionados com folga e consistência de altura) */}
              <div className="pt-3 pb-1 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                {hireWizardStep === 1 ? (
                  <button
                    type="button"
                    onClick={() => setShowHireWizard(false)}
                    className="w-1/3 py-2.5 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                  >
                    Cancelar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setHireWizardStep((prev) => (prev - 1) as any)}
                    className="w-1/3 py-2.5 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    <span>Voltar</span>
                  </button>
                )}

                {hireWizardStep < 4 ? (
                  <button
                    type="button"
                    disabled={
                      (hireWizardStep === 1 && (hireRate <= 0 || (hireAllowNegotiation && hireMinNegotiableRate >= hireRate))) ||
                      (hireWizardStep === 2 && !modalityToUse) ||
                      (hireWizardStep === 3 && (!hireDate || !hireStartTime || !hireEndTime || isTimeInPastForDate(hireDate, hireStartTime)))
                    }
                    onClick={() => setHireWizardStep((prev) => (prev + 1) as any)}
                    className="w-2/3 py-2.5 rounded-full text-xs font-black bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1"
                  >
                    <span>
                      {hireWizardStep === 1
                        ? "Avançar: Modalidade"
                        : hireWizardStep === 2
                        ? "Avançar: Data e Horário"
                        : "Avançar para Revisão"}
                    </span>
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      createShift({
                        gymId: activeGymId,
                        title: `${modalityToUse} - Aula`,
                        modality: modalityToUse,
                        date: hireDate,
                        dateFormatted: `${formatDateDDMMAAAA(hireDate)} · ${hireStartTime} – ${hireEndTime}`,
                        startTime: hireStartTime,
                        endTime: hireEndTime,
                        maxRate: hireRate
                      });
                      setShowHireWizard(false);
                      setGridCreationFeedback(`Vaga de ${modalityToUse} publicada com sucesso! Buscando instrutores compatíveis...`);
                      setTimeout(() => setGridCreationFeedback(null), 5000);
                    }}
                    className="w-2/3 py-2.5 rounded-full text-xs font-black bg-primary text-white hover:bg-primary-hover shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>Publicar Vaga e Encontrar Instrutores</span>
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </AnimatedModal>

      {/* ===================== MODAL DE VISÃO GERAL DO MÊS (ACADEMIA) ===================== */}
      <AnimatedModal
        isOpen={showMonthOverviewModal}
        onClose={() => setShowMonthOverviewModal(false)}
        maxWidth="max-w-md"
        className="p-5 space-y-4"
      >
        {(() => {
          const [y, m] = selectedAgendaMonth.split("-").map(Number);
          const monthNames = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
          ];
          const displayMonthName = monthNames[m - 1] || "Mês";
          const daysInMonth = new Date(y, m, 0).getDate();
          const firstDayOfMonth = new Date(y, m - 1, 1).getDay(); // 0 = Dom
          const weekdayHeaders = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

          const monthShifts = shifts.filter(
            (s) => s.gymId === activeGymId && s.date.startsWith(selectedAgendaMonth)
          );
          const confirmedCount = monthShifts.filter((s) => s.status === "confirmado" || s.status === "realizada").length;
          const openCount = monthShifts.filter((s) => s.status === "aberto" || s.status === "negociando").length;

          const today = new Date();
          const isCurrentMonth = (y === today.getFullYear() && m === today.getMonth() + 1) || (y === 2026 && m === 11);
          const refTodayDay = isCurrentMonth ? (y === today.getFullYear() && m === today.getMonth() + 1 ? today.getDate() : 11) : null;

          return (
            <>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <CalendarIcon size={16} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-navy-900 dark:text-white">Visão Geral do Mês</h3>
                    <p className="text-[11px] text-muted dark:text-slate-400">
                      {displayMonthName} de {y} · {currentGym.name}
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
                <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 p-2.5 rounded-2xl">
                  <span className="text-[10px] font-extrabold text-primary block uppercase tracking-tight">
                    Total
                  </span>
                  <span className="text-lg font-black text-primary mt-0.5 block">
                    {monthShifts.length}
                  </span>
                  <span className="text-[9px] text-muted dark:text-slate-400 font-semibold">aulas</span>
                </div>

                <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 p-2.5 rounded-2xl">
                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 block uppercase tracking-tight">
                    Confirmadas
                  </span>
                  <span className="text-lg font-black text-emerald-800 dark:text-emerald-300 mt-0.5 block">
                    {confirmedCount}
                  </span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400/80 font-semibold">com professor</span>
                </div>

                <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 p-2.5 rounded-2xl">
                  <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 block uppercase tracking-tight">
                    Abertas
                  </span>
                  <span className="text-lg font-black text-amber-800 dark:text-amber-300 mt-0.5 block">
                    {openCount}
                  </span>
                  <span className="text-[9px] text-amber-600 dark:text-amber-400/80 font-semibold">em busca</span>
                </div>
              </div>

              {/* Grade do Mês */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted dark:text-slate-400 font-bold">
                  {weekdayHeaders.map((w) => (
                    <span key={w}>{w}</span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold">
                  {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                    <span key={`pad-${idx}`} className="py-2 text-slate-300 dark:text-slate-700 text-xs">
                      ·
                    </span>
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dateStr = `${selectedAgendaMonth}-${String(dayNum).padStart(2, "0")}`;
                    const isSelected = mobileSelectedDate === dateStr;
                    const isToday = isCurrentMonth && dayNum === refTodayDay;
                    const dayShifts = monthShifts.filter((s) => s.date === dateStr);
                    const hasShifts = dayShifts.length > 0;

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => {
                          setMobileSelectedDate(dateStr);
                          setShowMonthOverviewModal(false);
                        }}
                        className={`py-2 rounded-xl text-xs font-bold transition-all relative flex flex-col items-center justify-center ${
                          isSelected
                            ? "bg-primary text-white shadow-xs"
                            : isToday
                            ? "bg-primary/10 text-primary border border-primary font-black"
                            : hasShifts
                            ? "bg-blue-50 dark:bg-navy-900 text-primary border border-primary/20"
                            : "bg-slate-50 dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-700 text-navy-900 dark:text-slate-200"
                        }`}
                      >
                        <span>{String(dayNum).padStart(2, "0")}</span>
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

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileSelectedDate("todas");
                    setShowMonthOverviewModal(false);
                  }}
                  className="w-full py-2.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors"
                >
                  Ver Todas as Datas do Mês
                </button>
              </div>
            </>
          );
        })()}
      </AnimatedModal>

      {/* ===================== MODAL DE PAYWALL (EXIGE ASSINATURA) ===================== */}
      <AnimatedModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        maxWidth="max-w-md"
        className="p-6 space-y-4 text-center"
      >
        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 rounded-full flex items-center justify-center mx-auto">
          <CreditCard size={24} />
        </div>

        <h3 className="text-lg font-extrabold text-navy-900 dark:text-white">Teste Gratuito Utilizado!</h3>
        <p className="text-xs text-muted dark:text-slate-300 leading-relaxed">
          Você já realizou a sua <strong>1ª contratação gratuita</strong> de boas-vindas. Para confirmar esta nova contratação e liberar os contatos do professor, ative um plano mensal.
        </p>

        <div className="p-4 bg-slate-50 dark:bg-navy-900/60 rounded-2xl text-left space-y-2 border border-slate-100 dark:border-slate-700 text-xs">
          <div className="flex justify-between font-bold text-navy-900 dark:text-white">
            <span>Plano Essencial (até 4 contratações)</span>
            <span className="text-primary font-extrabold">R$ 89,00/mês</span>
          </div>
          <p className="text-[11px] text-muted dark:text-slate-400">Sem fidelidade · Cobrança via Asaas (Pix / Cartão / Boleto)</p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => setShowSubscriptionModal(false)}
            className="flex-1 py-2.5 rounded-full text-xs font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
          >
            Depois
          </button>
          <button
            onClick={() => {
              subscribePlan("essencial");
              setShowSubscriptionModal(false);
            }}
            className="flex-1 py-2.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-sm transition-all active:scale-95"
          >
            Ativar Plano Simulado
          </button>
        </div>
      </AnimatedModal>

      {/* ===================== MODAL DE CROP DE IMAGEM (CIRCULAR E 16:9) ===================== */}
      <AnimatedModal
        isOpen={showCropModal}
        onClose={() => setShowCropModal(false)}
        maxWidth="max-w-lg"
        className="p-6 space-y-4"
      >
        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Crop size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-navy-900 dark:text-white">
                {cropTarget === "logo" ? "Recortar Logotipo Circular" : "Recortar Foto da Fachada (Proporção 16:9)"}
              </h3>
              <p className="text-[11px] text-muted dark:text-slate-400">
                {cropTarget === "logo" ? "Ajuste o zoom e posição para o logotipo circular exibido na web e no app" : "Ajuste o enquadramento widescreen da fachada/instalações"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCropModal(false)}
            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-navy-700 flex items-center justify-center text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Viewport de Crop */}
        <div className="bg-slate-950 p-6 rounded-2xl flex items-center justify-center overflow-hidden min-h-[280px] relative">
          <div
            className={`relative overflow-hidden border-2 border-primary shadow-2xl flex items-center justify-center bg-black/90 ${
              cropTarget === "logo" ? "w-56 h-56 rounded-full border-4 ring-8 ring-black/60" : "w-80 h-44 rounded-2xl"
            }`}
          >
            <img
              src={cropImageSrc}
              alt="Crop preview"
              className="max-w-none transition-transform duration-75 select-none pointer-events-none"
              style={{
                transform: `scale(${cropZoom}) translate(${cropOffsetX}px, ${cropOffsetY}px)`,
                maxHeight: cropTarget === "logo" ? "100%" : "auto",
                maxWidth: cropTarget === "facade" ? "100%" : "auto"
              }}
            />

            {/* Guia de enquadramento: circular para logotipo, terços para fachada */}
            {cropTarget === "logo" ? (
              <div className="absolute inset-2 rounded-full border border-white/40 border-dashed pointer-events-none flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/80" />
              </div>
            ) : (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20 border border-white">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div />
              </div>
            )}
          </div>
        </div>

        {/* Controles de Zoom e Posição */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-3">
            <ZoomOut size={16} className="text-slate-400" />
            <input
              type="range"
              min="1"
              max="2.5"
              step="0.05"
              value={cropZoom}
              onChange={(e) => setCropZoom(Number(e.target.value))}
              className="flex-1 accent-primary cursor-pointer"
            />
            <ZoomIn size={16} className="text-slate-400" />
            <span className="text-xs font-bold text-navy-900 dark:text-white w-10 text-right">
              {Math.round(cropZoom * 100)}%
            </span>
          </div>

          {/* Ajuste fino de posicionamento */}
          <div className="flex items-center justify-between text-xs text-muted dark:text-slate-400 pt-1">
            <span className="text-[11px]">Ajuste fino de enquadramento:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setCropOffsetY(cropOffsetY - 8)}
                className="px-2 py-1 bg-slate-100 dark:bg-navy-700 rounded-lg font-bold hover:bg-slate-200"
                title="Mover para cima"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => setCropOffsetY(cropOffsetY + 8)}
                className="px-2 py-1 bg-slate-100 dark:bg-navy-700 rounded-lg font-bold hover:bg-slate-200"
                title="Mover para baixo"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => setCropOffsetX(cropOffsetX - 8)}
                className="px-2 py-1 bg-slate-100 dark:bg-navy-700 rounded-lg font-bold hover:bg-slate-200"
                title="Mover para a esquerda"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => setCropOffsetX(cropOffsetX + 8)}
                className="px-2 py-1 bg-slate-100 dark:bg-navy-700 rounded-lg font-bold hover:bg-slate-200"
                title="Mover para a direita"
              >
                →
              </button>
              <button
                type="button"
                onClick={() => {
                  setCropZoom(1);
                  setCropOffsetX(0);
                  setCropOffsetY(0);
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
            onClick={() => setShowCropModal(false)}
            className="flex-1 py-2.5 rounded-full text-xs font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveCroppedImage}
            className="flex-1 py-2.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-sm transition-all"
          >
            Confirmar Recorte & Salvar
          </button>
        </div>
      </AnimatedModal>

      {/* ===================== MODAL DE NOVA MODALIDADE ===================== */}
      <AnimatedModal
        isOpen={showNewModalityModal}
        onClose={() => setShowNewModalityModal(false)}
        className="p-6 space-y-4"
      >
        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Plus size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-navy-900 dark:text-white">Cadastrar Nova Modalidade</h3>
              <p className="text-[11px] text-muted dark:text-slate-400">Adicione modalidades à escala da academia</p>
            </div>
          </div>
          <button
            onClick={() => setShowNewModalityModal(false)}
            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-navy-700 flex items-center justify-center text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* Combobox com Opções Populares */}
          <div className="space-y-1">
            <label className="font-bold text-navy-900 dark:text-white block">
              Selecione uma modalidade sugerida:
            </label>
            <select
              value={selectedPredefinedModality}
              onChange={(e) => setSelectedPredefinedModality(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-navy-900 text-navy-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-semibold focus:outline-primary"
            >
              <option>Beach Tennis</option>
              <option>Cross Training / CrossFit</option>
              <option>Natação / Hidroginástica</option>
              <option>Dança / Zumba</option>
              <option>Boxe / Muay Thai</option>
              <option>Jiu-Jitsu / Artes Marciais</option>
              <option>Yoga / Alongamento</option>
              <option>Pilates Clínico / Aparelhos</option>
              <option>Levantamento de Peso (LPO)</option>
              <option>Calistenia</option>
              <option>Corrida de Rua / Cardio</option>
              <option>Funcional Kids</option>
            </select>
          </div>

          {/* Input customizado se não estiver na lista */}
          <div className="space-y-1">
            <label className="font-bold text-navy-900 dark:text-white block">
              Ou digite outra modalidade personalizada:
            </label>
            <input
              type="text"
              value={customModalityInput}
              onChange={(e) => setCustomModalityInput(e.target.value)}
              placeholder="Ex: Treinamento Suspenso (TRX)"
              className="w-full p-2.5 bg-slate-50 dark:bg-navy-900 text-navy-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 font-semibold focus:outline-primary"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setShowNewModalityModal(false)}
            className="flex-1 py-2.5 rounded-full text-xs font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAddNewModality}
            className="flex-1 py-2.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-sm transition-all"
          >
            Adicionar Modalidade
          </button>
        </div>
      </AnimatedModal>

      {/* ===================== MODAL DE HORÁRIOS EXPANDIDOS DO DIA ===================== */}
      <AnimatedModal
        isOpen={!!selectedDayShiftsModal}
        onClose={() => setSelectedDayShiftsModal(null)}
        maxWidth="max-w-md"
        className="p-6 space-y-4"
      >
        {selectedDayShiftsModal && (
          <>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <CalendarIcon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-navy-900 dark:text-white">
                    Horários de {formatDateDDMMAAAA(selectedDayShiftsModal.date)}
                  </h3>
                  <p className="text-[11px] text-muted dark:text-slate-400">
                    Visão detalhada e sem sobreposição da grade do dia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayShiftsModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-navy-700 flex items-center justify-center text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">
                Total de horários neste dia:
              </span>
              <span className="bg-primary-subtle dark:bg-primary/20 text-primary font-black px-2.5 py-0.5 rounded-full text-xs">
                {selectedDayShiftsModal.shifts.length} {selectedDayShiftsModal.shifts.length === 1 ? "horário" : "horários"}
              </span>
            </div>

            {/* Listagem com Scroll dos Horários do Dia */}
            <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
              {selectedDayShiftsModal.shifts.map((s) => {
                const inst = instructors.find((i) => i.id === s.confirmedInstructorId);

                return (
                  <div
                    key={s.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                      s.status === "realizada"
                        ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60"
                        : s.status === "confirmado"
                        ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60"
                        : s.status === "negociando"
                        ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/60"
                        : "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/60"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-navy-900 dark:text-white">
                            {s.startTime} às {s.endTime}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-navy-800 text-primary border border-slate-200 dark:border-slate-700">
                            {s.modality}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted dark:text-slate-400 block mt-0.5">
                          {s.title}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-navy-900 dark:text-white block">
                          R$ {s.agreedRate || s.maxRate || (s as any).rate || 45}/h
                        </span>
                        <span className={`text-[10px] font-bold capitalize ${
                          s.status === "realizada" || s.status === "confirmado"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : s.status === "negociando"
                            ? "text-primary"
                            : "text-amber-600 dark:text-amber-400"
                        }`}>
                          {s.status === "realizada" ? "✓ Realizada" : s.status}
                        </span>
                      </div>
                    </div>

                    {/* Professor Vinculado, se houver */}
                    {inst ? (
                      <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                        <img
                          src={inst.avatar}
                          alt={inst.name}
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                        />
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-navy-900 dark:text-white leading-tight truncate">
                              {inst.name}
                            </span>
                            {(inst.isDeleted || (inst as any).isActive === false) && (
                              <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 dark:bg-navy-700 px-1 py-0.2 rounded shrink-0">
                                (Usuário excluído)
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted dark:text-slate-400 block leading-none">
                            CREF {inst.cref}
                          </span>
                        </div>
                      </div>
                    ) : (s.status === "realizada" || s.status === "confirmado") && s.confirmedInstructorName ? (
                      <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-navy-700 flex items-center justify-center text-slate-500 font-bold text-[10px] shrink-0">
                          {s.confirmedInstructorName[0]}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-navy-900 dark:text-white leading-tight truncate">
                              {s.confirmedInstructorName}
                            </span>
                            <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 dark:bg-navy-700 px-1 py-0.2 rounded shrink-0">
                              (Usuário excluído)
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Botão para destacar nos cadastros ou excluir vaga livre */}
                    <div className="pt-1 flex items-center justify-between">
                      {s.status !== "confirmado" && s.status !== "realizada" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDayShiftsModal(null);
                            handleDeleteShiftClick(s);
                          }}
                          className="text-[11px] font-bold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors"
                        >
                          <Trash2 size={12} strokeWidth={1.5} />
                          <span>Excluir Horário</span>
                        </button>
                      ) : <div />}

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDayShiftsModal(null);
                          handleSelectShiftFromGrade(s.id);
                        }}
                        className="text-[11px] font-black text-primary hover:underline flex items-center gap-1"
                      >
                        <span>✨ Visualizar e destacar nos cadastros</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rodapé da Modal com Opção de Adicionar Horário */}
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedDayShiftsModal(null)}
                className="flex-1 py-2.5 rounded-full text-xs font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetDate = selectedDayShiftsModal.date;
                  setSelectedDayShiftsModal(null);
                  setNewDate(targetDate);
                  setShowNewShiftModal(true);
                }}
                className="flex-1 py-2.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Plus size={14} />
                <span>Novo Horário neste Dia</span>
              </button>
            </div>
          </>
        )}
      </AnimatedModal>

      {/* ===================== MODAL DE EXCLUSÃO DE HORÁRIO/VAGA (ACADEMIA) ===================== */}
      <AnimatedModal
        isOpen={showDeleteShiftModal}
        onClose={() => {
          setShowDeleteShiftModal(false);
          setShiftToDelete(null);
          setDeleteShiftError(null);
        }}
        maxWidth="max-w-md"
        className="p-5 space-y-4"
      >
        {deleteShiftError ? (
          <div className="space-y-4 animate-fade-in text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
              <AlertCircle size={24} strokeWidth={1.5} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-navy-900 dark:text-white">
                Horário Não Pode Ser Excluído
              </h3>
              <p className="text-xs text-muted dark:text-slate-300 leading-relaxed">
                {deleteShiftError}
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (shiftToDelete) {
                    await cancelShift(shiftToDelete.id, "academia", "Cancelado para exclusão do horário da agenda", currentGym?.name || "Academia");
                    deleteShift(shiftToDelete.id, true);
                    setShowDeleteShiftModal(false);
                    setShiftToDelete(null);
                    setDeleteShiftError(null);
                    setProfileSuccessMsg("Aula cancelada e horário excluído com sucesso!");
                    setTimeout(() => setProfileSuccessMsg(null), 3000);
                  }
                }}
                className="w-full py-2.5 rounded-full text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Cancelar Aula Contratada e Excluir</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteShiftModal(false);
                  setShiftToDelete(null);
                  setDeleteShiftError(null);
                }}
                className="w-full py-2.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 size={20} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-sm font-black text-navy-900 dark:text-white">
                  Excluir Horário de Aula
                </h3>
                <p className="text-[11px] text-muted dark:text-slate-400">
                  Remover vaga aberta da agenda da academia
                </p>
              </div>
            </div>

            {shiftToDelete && (
              <div className="p-3 bg-slate-50 dark:bg-navy-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-black text-navy-900 dark:text-white">{shiftToDelete.title}</span>
                  <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full text-[10px]">
                    {shiftToDelete.modality}
                  </span>
                </div>
                <div className="text-[11px] text-muted dark:text-slate-400">
                  <span>{formatDateDDMMAAAA(shiftToDelete.date)} · {shiftToDelete.startTime} às {shiftToDelete.endTime}</span>
                </div>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Valor: R$ {shiftToDelete.maxRate ?? (shiftToDelete as any).rate ?? 45}/h
                </div>
              </div>
            )}

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Tem certeza que deseja excluir este horário? Esta ação removerá a vaga aberta da agenda.
            </p>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteShiftModal(false);
                  setShiftToDelete(null);
                }}
                className="w-1/2 py-2.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (shiftToDelete) {
                    const res = deleteShift(shiftToDelete.id);
                    if (res.success) {
                      setShowDeleteShiftModal(false);
                      setShiftToDelete(null);
                      setProfileSuccessMsg("Horário de aula excluído com sucesso!");
                      setTimeout(() => setProfileSuccessMsg(null), 3000);
                    } else if (res.error) {
                      setDeleteShiftError(res.error);
                    }
                  }
                }}
                className="w-1/2 py-2.5 rounded-full text-xs font-black bg-rose-600 text-white hover:bg-rose-700 shadow-sm transition-all"
              >
                Sim, Excluir Horário
              </button>
            </div>
          </div>
        )}
      </AnimatedModal>

      {/* TOAST FLUTUANTE DE VALIDAÇÃO DE PRESENÇA */}
      {validationSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-slide-up border border-emerald-500">
          <CheckCheck size={18} className="text-white shrink-0" />
          <span className="text-xs font-black">{validationSuccessToast}</span>
        </div>
      )}

      {/* TOAST FLUTUANTE DE CADASTRO DE GRADE / HORÁRIO */}
      {gridCreationFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy-900 dark:bg-white text-white dark:text-navy-900 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-slide-up border border-slate-700 dark:border-slate-200">
          <CheckCircle size={18} className="text-emerald-500 shrink-0" />
          <span className="text-xs font-black">{gridCreationFeedback}</span>
        </div>
      )}

      {/* MODAL DE ONBOARDING DA ACADEMIA */}
      <OnboardingModal
        role="academia"
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
              Excluir Conta da Unidade Definitivamente
            </h3>
            <p className="text-xs text-muted dark:text-slate-400 mt-0.5">
              Esta ação removerá permanentemente a unidade e todos os dados
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300 space-y-2 leading-relaxed">
          <p className="font-bold flex items-center gap-1.5">
            <AlertCircle size={15} className="shrink-0 text-red-600" />
            Aviso Importante: A exclusão é permanente e irreversível!
          </p>
          <p>
            Todos os horários, vagas abertas, propostas, relatórios de auditoria e configurações desta unidade serão excluídos de forma irrecuperável do banco de dados.
          </p>
          <p className="font-medium">
            Se a academia desejar utilizar o TrainerMatch novamente no futuro, <strong>deverá realizar um novo cadastro da unidade</strong>.
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
            Estou ciente de que a exclusão é definitiva e desejo apagar esta conta agora.
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

      {/* ===================== MODAL DE DETALHES DO PROFESSOR (3 PILARES & BADGES) ===================== */}
      {instructorDetailModal && (() => {
        const modalCriteria = instructorDetailModal.criteria || {
          pontualidade: instructorDetailModal.rating || 5.0,
          tecnica: instructorDetailModal.rating || 5.0,
          postura: instructorDetailModal.rating || 5.0
        };
        const modalRating = Number(((modalCriteria.pontualidade + modalCriteria.tecnica + modalCriteria.postura) / 3).toFixed(1));

        return (
        <AnimatedModal
          isOpen={Boolean(instructorDetailModal)}
          onClose={() => setInstructorDetailModal(null)}
          maxWidth="max-w-md"
          className="p-5 space-y-4 max-h-[88vh] overflow-y-auto"
          showHandle={true}
          align="bottom"
          ariaLabel="Detalhes do Professor"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 shadow-sm shrink-0">
                {instructorDetailModal.avatar ? (
                  <img
                    src={instructorDetailModal.avatar}
                    alt={instructorDetailModal.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                    {instructorDetailModal.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-navy-900 dark:text-white text-base">
                  {instructorDetailModal.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    CREF {instructorDetailModal.cref}
                  </span>
                  <span className="text-[10px] bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">
                    R$ {instructorDetailModal.hourlyRate || 45}/h
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setInstructorDetailModal(null)}
              type="button"
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Rating Summary Card */}
          <div className="bg-slate-50 dark:bg-navy-900/60 p-4 rounded-2xl border border-slate-100 dark:border-navy-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-amber-500 font-extrabold text-lg">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" strokeWidth={1.5} />
                  <span>{modalRating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  ({instructorDetailModal.ratingCount || 0} avaliações de academias)
                </span>
              </div>
            </div>

            {/* Recommendation badge */}
            <div className="flex items-center gap-2 pt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <ThumbsUp className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.5} />
              <span>
                <strong>{instructorDetailModal.wouldHireAgainRate ?? 98}%</strong> das academias contratariam este professor novamente
              </span>
            </div>
          </div>

          {/* 3 Pillars Breakdown */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Desempenho nos 3 Pilares
            </h4>
            <div className="p-3.5 bg-white dark:bg-navy-900 rounded-2xl border border-slate-100 dark:border-navy-800 shadow-xs">
              <HorizontalBars criteria={modalCriteria} type="professor" />
            </div>
          </div>

          {/* Quality Badges */}
          {instructorDetailModal.badges && instructorDetailModal.badges.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Elogios e Qualidades de Destaque
              </h4>
              <div className="flex flex-wrap gap-2">
                {instructorDetailModal.badges.map((b: string, i: number) => (
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

          {/* Modalities */}
          {instructorDetailModal.modalities && instructorDetailModal.modalities.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Modalidades que Leciona
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {instructorDetailModal.modalities.map((m: string, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Close button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setInstructorDetailModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-navy-900 dark:text-white font-bold text-xs transition"
            >
              Fechar Detalhes
            </button>
          </div>
        </AnimatedModal>
        );
      })()}

      {/* ===================== MODAL DE AVALIAÇÃO DO PROFESSOR (PÓS-TURNO) ===================== */}
      {reviewShift && (
        <ReviewModal
          isOpen={Boolean(reviewShift)}
          onClose={() => setReviewShift(null)}
          type="gym_reviews_instructor"
          targetName={reviewShift.instructor.name}
          targetAvatarOrLogo={reviewShift.instructor.avatar}
          shiftTitle={reviewShift.shift.title}
          shiftDateFormatted={reviewShift.shift.dateFormatted || reviewShift.shift.date}
          onSubmit={(data) => {
            submitInstructorReview(
              reviewShift.shift.id,
              reviewShift.instructor.id,
              data.rating,
              data.criteria as any,
              data.badges,
              data.recommend,
              data.comment
            );
          }}
        />
      )}

      {/* ===================== MODAL DE CANCELAMENTO DE AULA (ACADEMIA) ===================== */}
      <CancelShiftModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setShiftToCancel(null);
        }}
        shift={shiftToCancel}
        role="academia"
        userName={currentGym.name || "Academia"}
        counterpartName={instructors.find((i) => i.id === shiftToCancel?.confirmedInstructorId)?.name || "Professor Contratado"}
        onConfirmCancel={async (reason) => {
          if (!shiftToCancel) return;
          await cancelShift(shiftToCancel.id, "academia", reason, currentGym.name || "Academia");
        }}
      />

    </div>
  );
};
