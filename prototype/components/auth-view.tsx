"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";
import { maskPhone, maskCpf, maskCnpj } from "@/store/mock-data";
import { isValidEmail, isValidCpf, isValidCnpj, isValidPhone } from "@/lib/validations";
import {
  Building2,
  User,
  ArrowRight,
  ShieldCheck,
  Upload,
  CheckCircle2,
  KeyRound,
  Mail,
  Check,
  X,
  AlertCircle,
  AlertTriangle,
  LogIn,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  ArrowLeft
} from "lucide-react";

interface AuthViewProps {
  defaultRole?: "professor" | "academia";
}

export const AuthView: React.FC<AuthViewProps> = ({ defaultRole }) => {
  const { login, registerUser, verifyEmail, resendVerificationCode } = useAppStore();

  const [mode, setMode] = useState<"login" | "cadastro" | "esqueceu_senha" | "verificar_email">("login");
  const [selectedRole, setSelectedRole] = useState<"professor" | "academia">(defaultRole || "professor");

  // Alerta de erro da autenticação
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateEmailError, setDuplicateEmailError] = useState<{ email: string } | null>(null);

  // Campos de Validação de E-mail (OTP)
  const [emailToVerify, setEmailToVerify] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [devOtpHint, setDevOtpHint] = useState<string>("");
  const [deliveryWarning, setDeliveryWarning] = useState<string>("");
  const [topToast, setTopToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const otpInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Campos de Login (iniciam vazios com placeholders, preenchíveis pelo botão de teste)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Campos de Cadastro (SEMPRE iniciam 100% limpos e vazios)
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerCpfOrCnpj, setRegisterCpfOrCnpj] = useState("");
  const [registerCref, setRegisterCref] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [docUploaded, setDocUploaded] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Campos de Redefinição de Senha
  const [resetStep, setResetStep] = useState<1 | 2 | 3 | 4>(1);
  const [resetEmail, setResetEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  // Carrega e-mail salvo se "Lembrar de mim" estiver ativo
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("trainermatch_remembered_email");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (e) {}
  }, []);

  // Limpa campos ao alternar papel ou modo
  useEffect(() => {
    setAuthError("");
    if (mode === "login") {
      try {
        const savedEmail = localStorage.getItem("trainermatch_remembered_email");
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        } else {
          setEmail("");
        }
      } catch (e) {
        setEmail("");
      }
      setPassword("");
    } else if (mode === "cadastro") {
      // Garante que a tela de cadastro seja 100% limpa, sem emails de mock
      setRegisterName("");
      setRegisterEmail("");
      setRegisterCpfOrCnpj("");
      setRegisterCref("");
      setRegisterPhone("");
      setRegisterPassword("");
      setTermsAccepted(false);
      setDocUploaded(false);
      setUploadedImageSrc("");
    } else if (mode === "esqueceu_senha") {
      setResetEmail("");
      setVerificationCode("");
      setNewPassword("");
      setConfirmPassword("");
      setResetStep(1);
    }
  }, [selectedRole, mode]);

  // Validação de Nova Senha (mínimo 6 caracteres e confirmação coincidente)
  const hasMinLength = newPassword.length >= 6;
  const passwordsMatch = newPassword.length >= 6 && newPassword === confirmPassword;

  // Timer de contagem regressiva para reenvio de código
  useEffect(() => {
    if (mode !== "verificar_email" || resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, resendCooldown]);

  const showTopToast = (message: string, type: "success" | "error" = "success") => {
    setTopToast({ message, type });
    setTimeout(() => {
      setTopToast(null);
    }, 4500);
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    setOtpError("");
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || "";
    }
    setOtpDigits(newDigits);

    const nextFocusIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextFocusIndex]?.focus();
  };

  const handleVerifyOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setOtpError("");
    const fullCode = otpDigits.join("");
    if (fullCode.length < 6) {
      setOtpError("Por favor, digite os 6 dígitos do código de verificação.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await verifyEmail(emailToVerify, fullCode);
      if (!res.success) {
        setOtpError(res.error || "Código de verificação incorreto ou expirado.");
      } else {
        showTopToast("E-mail validado com sucesso! Bem-vindo ao TrainerMatch.", "success");
      }
    } catch (err: any) {
      setOtpError(err.message || "Erro de conexão ao validar código.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResendingOtp) return;
    setIsResendingOtp(true);
    setOtpError("");
    try {
      const res = await resendVerificationCode(emailToVerify);
      if (res.success) {
        setResendCooldown(60);
        if (res.devCode) setDevOtpHint(res.devCode);
        if (res.emailDeliveryError) {
          if (res.emailDeliveryError === "RESEND_API_KEY_NOT_FOUND") {
            setDeliveryWarning("A chave RESEND_API_KEY não foi encontrada nas variáveis de ambiente da Vercel. Lembre-se de fazer um Redeploy na Vercel.");
          } else {
            setDeliveryWarning(`Aviso do Resend: ${res.emailDeliveryError}`);
          }
        } else {
          setDeliveryWarning("");
        }
        showTopToast(res.emailDeliveryError ? "Novo código gerado para teste!" : "Novo código enviado para seu e-mail!", "success");
      } else {
        setOtpError(res.error || "Não foi possível reenviar o código.");
      }
    } catch (err: any) {
      setOtpError(err.message || "Falha na comunicação com o servidor.");
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsSubmitting(true);
    try {
      const result = await login(email, password, selectedRole);
      if (result?.requiresVerification) {
        setEmailToVerify(result.email || email.trim().toLowerCase());
        setOtpDigits(["", "", "", "", "", ""]);
        setResendCooldown(60);
        if (result.devCode) {
          setDevOtpHint(result.devCode);
        }
        setMode("verificar_email");
        showTopToast("Insira o código de 6 dígitos para validar sua conta.", "success");
        return;
      }

      if (result?.success) {
        try {
          if (rememberMe) {
            localStorage.setItem("trainermatch_remembered_email", email.trim().toLowerCase());
          } else {
            localStorage.removeItem("trainermatch_remembered_email");
          }
        } catch (e) {}
      } else {
        setAuthError(result?.error || "E-mail ou senha incorretos.");
      }
    } catch (err: any) {
      setAuthError(err.message || "Falha ao conectar com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
    if (file.size > MAX_FILE_SIZE) {
      alert("O arquivo selecionado excede o limite máximo de 3 MB. Por favor, escolha uma imagem de até 3 MB.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setUploadedImageSrc(data.url);
        setDocUploaded(true);
      } else {
        alert(data.error || "Erro no upload");
      }
    } catch (err) {
      alert("Erro ao enviar arquivo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setDuplicateEmailError(null);

    const cleanName = registerName.trim();
    const cleanEmail = registerEmail.trim().toLowerCase();
    const cleanDoc = registerCpfOrCnpj.trim();
    const cleanPhone = registerPhone.trim();

    if (!cleanName) {
      setAuthError("Por favor, preencha seu nome completo.");
      return;
    }

    if (!cleanEmail) {
      setAuthError("Por favor, preencha seu e-mail.");
      return;
    }

    // 1. Validação de E-mail
    if (!isValidEmail(cleanEmail)) {
      setAuthError("Por favor, informe um endereço de e-mail válido (ex: seu.nome@email.com).");
      return;
    }

    // 2. Validação de Documento (CPF para Professor / CNPJ para Academia)
    if (selectedRole === "professor") {
      if (!isValidCpf(cleanDoc)) {
        setAuthError("CPF inválido. Verifique os números digitados (deve conter 11 dígitos e dígitos verificadores válidos).");
        return;
      }
    } else {
      if (!isValidCnpj(cleanDoc)) {
        setAuthError("CNPJ inválido. Verifique os números digitados (deve conter 14 dígitos e dígitos verificadores válidos).");
        return;
      }
    }

    // 3. Validação de Telefone
    if (!cleanPhone) {
      setAuthError("Por favor, informe seu telefone / WhatsApp com DDD.");
      return;
    }
    if (!isValidPhone(cleanPhone)) {
      setAuthError("Telefone inválido. Informe o DDD e o número completo (ex: (27) 99881-2233).");
      return;
    }

    // CREF: SEM validação, livre conforme solicitado!

    if (!termsAccepted) {
      alert("Por favor, aceite os termos de pontualidade e ocorrências.");
      return;
    }

    if (!registerPassword || registerPassword.length < 6) {
      setAuthError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerUser({
        name: cleanName,
        email: cleanEmail,
        password: registerPassword,
        role: selectedRole,
        doc: cleanDoc,
        crefOrCnpj: registerCref.trim(),
        phone: cleanPhone,
        logoOrAvatar: uploadedImageSrc
      });

      if (result?.requiresVerification) {
        setEmailToVerify(result.email || cleanEmail);
        setOtpDigits(["", "", "", "", "", ""]);
        setResendCooldown(60);
        setMode("verificar_email");
        if (result.devCode) {
          setDevOtpHint(result.devCode);
        } else {
          setDevOtpHint("");
        }
        if (result.emailDeliveryError) {
          if (result.emailDeliveryError === "RESEND_API_KEY_NOT_FOUND") {
            setDeliveryWarning("A chave RESEND_API_KEY não foi encontrada nas variáveis de ambiente da Vercel. Lembre-se de fazer um Redeploy na Vercel.");
          } else {
            setDeliveryWarning(`Aviso do Resend: ${result.emailDeliveryError}`);
          }
        } else {
          setDeliveryWarning("");
        }
        showTopToast(result.emailDeliveryError ? "Código gerado para teste!" : "Código de verificação enviado para seu e-mail!", "success");
        return;
      }

      if (!result?.success) {
        if (result?.code === "EMAIL_ALREADY_EXISTS") {
          setDuplicateEmailError({ email: cleanEmail });
        } else {
          setAuthError(result?.error || "Erro ao criar conta.");
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "Falha ao cadastrar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setCodeError("");

    const targetEmail = resetEmail.trim().toLowerCase();
    if (!targetEmail) {
      setAuthError("Por favor, informe seu e-mail cadastrado.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.error || "E-mail não encontrado no sistema. Verifique o endereço digitado ou realize seu cadastro.");
        return;
      }

      setResetStep(2);
    } catch (err: any) {
      setAuthError("Erro na comunicação com o servidor. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.trim() === "849201" || verificationCode.length >= 4) {
      setCodeError("");
      setResetStep(3);
    } else {
      setCodeError("Código inválido. Digite o código de 6 dígitos enviado por e-mail.");
    }
  };

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!newPassword || newPassword.length < 6) {
      setAuthError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setAuthError("As senhas não coincidem. Certifique-se de digitar a mesma senha nos dois campos.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail.trim().toLowerCase(),
          code: verificationCode.trim(),
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.error || "Erro ao salvar a nova senha no banco de dados.");
        return;
      }

      setResetStep(4);
    } catch (err: any) {
      setAuthError("Falha ao salvar senha no servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-navy-900 flex items-center justify-center p-4 font-sans relative">
      {/* Notificação Flutuante de Sucesso/Alerta no Topo */}
      {topToast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[99999] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-4 transition-all ${
            topToast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {topToast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{topToast.message}</span>
        </div>
      )}

      <div className="bg-card dark:bg-navy-800 w-full max-w-md rounded-squircle p-8 shadow-floating space-y-5 border border-slate-100 dark:border-slate-700/60 animate-scale-up">
        {/* Header com Logo */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
            TM
          </div>
          <h1 className="text-2xl font-black text-navy-900 dark:text-white tracking-tight">
            TrainerMatch
          </h1>
          <p className="text-xs text-muted dark:text-slate-400">
            {mode === "login"
              ? "Entre para gerenciar turnos e contratações em produção"
              : mode === "cadastro"
              ? "Cadastre sua academia ou seu perfil de professor do zero"
              : mode === "verificar_email"
              ? "Validação de segurança e ativação de conta"
              : "Recuperação de Acesso e Redefinição de Senha"}
          </p>
        </div>

        {/* Alternar Perfil: Professor vs Academia (Apenas no login e cadastro) */}
        {mode !== "esqueceu_senha" && mode !== "verificar_email" && (
          <div className="flex bg-slate-100 dark:bg-navy-700 p-1 rounded-full text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setSelectedRole("professor");
                setAuthError("");
                setDuplicateEmailError(null);
              }}
              className={`flex-1 py-2 rounded-full flex items-center justify-center gap-1.5 transition-all ${
                selectedRole === "professor"
                  ? "bg-primary text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <User size={14} /> Sou Professor
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole("academia");
                setAuthError("");
                setDuplicateEmailError(null);
              }}
              className={`flex-1 py-2 rounded-full flex items-center justify-center gap-1.5 transition-all ${
                selectedRole === "academia"
                  ? "bg-primary text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <Building2 size={14} /> Sou Academia
            </button>
          </div>
        )}

        {/* Alerta de Erro */}
        {authError && mode !== "verificar_email" && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-start gap-2 text-red-700 dark:text-red-300 text-xs animate-shake">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {/* ===================== FORMULÁRIO DE LOGIN ===================== */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* Atalho rápido para usuários de teste */}
            {/* Atalho rápido para usuários de teste */}
            <div className="p-2.5 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-primary text-[11px] font-bold">
                <Sparkles size={13} />
                <span>Usuário de Teste:</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (selectedRole === "academia") {
                    setEmail("movagym@email.com");
                    setPassword("12345qwe");
                  } else {
                    setEmail("lucasf@email.com");
                    setPassword("12345qwe");
                  }
                  setAuthError("");
                }}
                className="text-[10px] font-bold text-primary hover:underline bg-white dark:bg-navy-900 px-2.5 py-1 rounded-md shadow-xs border border-primary/30 flex items-center gap-1 active:scale-95 transition-all"
                title="Clique para preencher os campos com o usuário de teste"
              >
                <span>Preencher: {selectedRole === "academia" ? "movagym@email.com" : "lucasf@email.com"}</span>
              </button>
            </div>

            <div>
              <label className="text-navy-900 dark:text-white font-bold block mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu email"
                className="w-full p-3 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-primary dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-navy-900 dark:text-white font-bold">Senha</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("esqueceu_senha");
                    setResetStep(1);
                    setResetEmail(email);
                  }}
                  className="text-primary font-semibold hover:underline bg-transparent border-0 p-0 cursor-pointer text-[11px]"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Insira sua senha"
                  className="w-full p-3 pr-10 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-primary dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  aria-label={showLoginPassword ? "Ocultar senha" : "Ver senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
                >
                  {showLoginPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            {/* Checkbox Lembrar de mim */}
            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-600 dark:bg-navy-900 cursor-pointer"
                />
                <span className="text-xs font-semibold">Lembrar de mim</span>
              </label>
              <span className="text-[10px] text-muted dark:text-slate-400">
                Salvar e-mail neste aparelho
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-extrabold py-3.5 rounded-full text-xs shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
            >
              <span>{isSubmitting ? "Acessando..." : "Acessar Plataforma"}</span>
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        {/* ===================== FLUXO: ESQUECEU A SENHA / REDEFINIÇÃO ===================== */}
        {mode === "esqueceu_senha" && (
          <div className="space-y-4 text-xs animate-fade-in">
            {resetStep === 1 && (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="p-3.5 bg-blue-50 dark:bg-primary/10 rounded-2xl border border-primary/20 text-slate-700 dark:text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    <KeyRound size={14} />
                    <span>Redefinição de Senha</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Informe seu e-mail cadastrado. Enviaremos um código de verificação para validar a alteração.
                  </p>
                </div>

                <div>
                  <label className="text-navy-900 dark:text-white font-bold block mb-1">E-mail Cadastrado</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full p-3 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-primary dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold py-3 rounded-full text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Mail size={14} />
                  <span>Enviar Código de Recuperação</span>
                </button>
              </form>
            )}

            {resetStep === 2 && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200/50 text-slate-700 dark:text-slate-300 space-y-1">
                  <span className="font-bold text-amber-700 dark:text-amber-300 block text-xs">
                    Código de Segurança Enviado!
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Enviamos um código de 6 dígitos para <strong>{resetEmail}</strong>.
                  </p>
                  <div className="pt-1 text-[11px] text-amber-800 dark:text-amber-200 font-mono font-bold">
                    Código de teste simulado: <span className="bg-amber-200/60 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">849201</span>
                  </div>
                </div>

                <div>
                  <label className="text-navy-900 dark:text-white font-bold block mb-1">Código de 6 Dígitos</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Ex: 849201"
                    className="w-full p-3 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-center text-sm font-bold tracking-widest focus:outline-primary dark:text-white"
                  />
                  {codeError && <p className="text-red-500 text-[11px] mt-1">{codeError}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold py-3 rounded-full text-xs shadow-sm transition-all"
                >
                  Validar Código
                </button>
              </form>
            )}

            {resetStep === 3 && (
              <form onSubmit={handleSaveNewPassword} className="space-y-3.5">
                <div>
                  <label className="text-navy-900 dark:text-white font-bold block mb-1">Nova Senha</label>
                  <div className="relative">
                    <input
                      type={showResetNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (authError) setAuthError("");
                      }}
                      placeholder="Mínimo de 6 caracteres"
                      className="w-full p-2.5 pr-10 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 font-medium dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                    >
                      {showResetNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-navy-900 dark:text-white font-bold block mb-1">Confirmar Nova Senha</label>
                  <div className="relative">
                    <input
                      type={showResetConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (authError) setAuthError("");
                      }}
                      placeholder="Repita a nova senha"
                      className="w-full p-2.5 pr-10 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 font-medium dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                    >
                      {showResetConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Dicas visuais da senha */}
                <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] transition-colors ${
                      hasMinLength
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold"
                        : "bg-slate-100 text-slate-500 dark:bg-navy-800 dark:text-slate-400"
                    }`}
                  >
                    {hasMinLength ? <Check size={11} className="stroke-[3]" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />}
                    Mínimo 6 caracteres
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] transition-colors ${
                      passwordsMatch
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold"
                        : "bg-slate-100 text-slate-500 dark:bg-navy-800 dark:text-slate-400"
                    }`}
                  >
                    {passwordsMatch ? <Check size={11} className="stroke-[3]" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />}
                    Senhas coincidem
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-full text-xs font-extrabold transition-all shadow-sm bg-primary hover:bg-primary-hover text-white flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Salvando nova senha...</span>
                    </>
                  ) : (
                    <span>Salvar Nova Senha</span>
                  )}
                </button>
              </form>
            )}

            {resetStep === 4 && (
              <div className="text-center space-y-4 py-2">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">Senha Redefinida com Sucesso!</h3>
                  <p className="text-[11px] text-muted dark:text-slate-400 mt-1">
                    Sua nova senha já está ativa no banco de dados. Você já pode fazer login.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setPassword(newPassword);
                  }}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold py-3 rounded-full text-xs shadow-sm transition-all"
                >
                  Voltar para o Login
                </button>
              </div>
            )}

            {resetStep !== 4 && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-xs text-muted hover:text-navy-900 dark:hover:text-white font-semibold"
                >
                  ← Voltar para o Login
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===================== FORMULÁRIO DE CADASTRO DO ZERO ===================== */}
        {mode === "cadastro" && duplicateEmailError && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-300 dark:border-amber-700/50 text-slate-800 dark:text-slate-200 animate-fade-in shadow-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400 mt-0.5">
                <AlertTriangle size={18} />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200">
                  E-mail já cadastrado!
                </h4>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  O e-mail <strong>{duplicateEmailError.email}</strong> já possui uma conta registrada no TrainerMatch.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(duplicateEmailError.email);
                      setPassword("");
                      setMode("login");
                      setDuplicateEmailError(null);
                      setAuthError("");
                    }}
                    className="flex-1 py-2 px-3 bg-white dark:bg-navy-900 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold rounded-xl text-[11px] hover:bg-amber-50 dark:hover:bg-navy-800 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <LogIn size={13} />
                    <span>Fazer Login</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(duplicateEmailError.email);
                      setVerificationCode("849201");
                      setResetStep(2);
                      setMode("esqueceu_senha");
                      setDuplicateEmailError(null);
                      setAuthError("");
                      showTopToast("Código de recuperação gerado para teste!", "success");
                    }}
                    className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <KeyRound size={13} />
                    <span>Criar Nova Senha</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === "cadastro" && (
          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            <div>
              <label className="text-navy-900 dark:text-white font-bold block mb-1">
                {selectedRole === "professor" ? "Nome Completo" : "Nome Fantasia da Academia"}
              </label>
              <input
                type="text"
                required
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder={selectedRole === "professor" ? "Digite seu nome completo" : "Digite o nome da academia"}
                className="w-full p-2.5 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 font-medium dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-navy-900 dark:text-white font-bold block mb-1">
                  {selectedRole === "professor" ? "CPF" : "CNPJ"}
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  value={registerCpfOrCnpj}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const masked = selectedRole === "professor" ? maskCpf(raw) : maskCnpj(raw);
                    setRegisterCpfOrCnpj(masked);
                  }}
                  placeholder={selectedRole === "professor" ? "000.000.000-00" : "00.000.000/0001-00"}
                  maxLength={selectedRole === "professor" ? 14 : 18}
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 font-medium dark:text-white"
                />
              </div>

              <div>
                <label className="text-navy-900 dark:text-white font-bold block mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 font-medium dark:text-white"
                />
              </div>
            </div>

            {selectedRole === "professor" && (
              <div>
                <label className="text-navy-900 dark:text-white font-bold block mb-1">
                  Registro CREF <span className="text-[10px] font-normal text-muted">(opcional / sem validação prévia)</span>
                </label>
                <input
                  type="text"
                  value={registerCref}
                  onChange={(e) => setRegisterCref(e.target.value)}
                  placeholder="Ex: 012845-G/ES"
                  maxLength={20}
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 font-medium dark:text-white"
                />
              </div>
            )}

            <div>
              <label className="text-navy-900 dark:text-white font-bold block mb-1">E-mail de Acesso</label>
              <input
                type="email"
                required
                value={registerEmail}
                onChange={(e) => {
                  setRegisterEmail(e.target.value);
                  if (duplicateEmailError) setDuplicateEmailError(null);
                }}
                placeholder="seu.email@exemplo.com"
                className="w-full p-2.5 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 font-medium dark:text-white"
              />
            </div>

            <div>
              <label className="text-navy-900 dark:text-white font-bold block mb-1">Senha de Acesso</label>
              <div className="relative">
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  required
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  className="w-full p-2.5 pr-10 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 font-medium dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                >
                  {showRegisterPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Upload Real de Logotipo / Foto Circular */}
            <div className="p-3 bg-slate-50 dark:bg-navy-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
              {uploadedImageSrc ? (
                <div className="flex items-center justify-center gap-3">
                  <img
                    src={uploadedImageSrc}
                    alt="Preview"
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary shadow-xs"
                  />
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">
                      ✓ Imagem Enviada com Sucesso
                    </span>
                    <span className="text-[10px] text-muted">Salvo no servidor</span>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto text-primary" size={20} />
                  <div className="text-[11px] font-bold text-navy-900 dark:text-white">
                    {selectedRole === "professor" ? "Foto de Perfil do Professor" : "Logotipo da Academia"}
                  </div>
                  <p className="text-[10px] text-muted">JPG ou PNG (formato circular automático)</p>
                </>
              )}

              <label className="inline-block cursor-pointer px-3 py-1.5 rounded-full text-[10px] font-bold bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-primary transition-all shadow-xs">
                {isUploading ? "Enviando arquivo..." : uploadedImageSrc ? "Alterar Imagem" : "Selecionar Imagem do Dispositivo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Termos de Ocorrências e Pontualidade */}
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded accent-primary"
              />
              <label htmlFor="terms" className="text-[10px] text-muted leading-tight">
                Declaro ciência dos termos da plataforma de contratação e política de ocorrências.
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-extrabold py-3.5 rounded-full text-xs shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
            >
              <span>{isSubmitting ? "Criando Conta..." : "Concluir Cadastro"}</span>
              <ShieldCheck size={14} />
            </button>
          </form>
        )}

        {/* ===================== TELA DE VALIDAÇÃO DE E-MAIL (OTP) ===================== */}
        {mode === "verificar_email" && (
          <div className="space-y-5 animate-scale-up text-center">
            {/* Ícone de Envelope com Badge */}
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center bg-primary/10 dark:bg-primary/20 rounded-2xl text-primary shadow-inner">
              <Mail size={32} />
              <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-1 shadow-sm">
                <ShieldCheck size={14} />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-navy-900 dark:text-white">
                Verifique seu E-mail
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                Enviamos um código de <span className="font-bold text-navy-900 dark:text-white">6 dígitos</span> para{" "}
                <span className="font-bold text-primary break-all">{emailToVerify}</span>.
              </p>
            </div>

            {/* Banner de Demonstração (Código de Validação Visível) */}
            {devOtpHint && (
              <div className="p-3 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl text-left text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 text-xs">
                    <Sparkles size={13} className="text-primary shrink-0" />
                    <span>Modo Demonstração (Sem Domínio Próprio)</span>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                    Ativo
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {deliveryWarning
                    ? deliveryWarning
                    : "Como o domínio próprio ainda não está ativo no Resend, utilize o código abaixo para validar e acessar o sistema:"}
                </p>
                <div className="bg-white dark:bg-navy-900 p-2 rounded-lg border border-blue-200 dark:border-blue-900 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">Código:</span>
                    <span className="font-mono text-sm font-black text-primary tracking-widest">
                      {devOtpHint}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const digits = devOtpHint.split("").slice(0, 6);
                      setOtpDigits(digits);
                      otpInputRefs.current[5]?.focus();
                    }}
                    className="text-xs font-bold text-white bg-primary hover:bg-primary-hover px-2.5 py-1 rounded-md transition-all active:scale-95 shadow-xs flex items-center gap-1"
                  >
                    <span>Preencher</span>
                    <Check size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Alerta de Erro específico do OTP */}
            {otpError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-start gap-2 text-red-700 dark:text-red-300 text-xs text-left animate-shake">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{otpError}</span>
              </div>
            )}

            {/* Inputs de 6 Dígitos */}
            <div className="flex justify-center items-center gap-2 my-4">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpInputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  className="w-11 h-12 text-center text-xl font-black rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-xs"
                />
              ))}
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              ⏱ O código é válido por 15 minutos. Você pode digitar ou colar diretamente.
            </p>

            {/* Botão de Validar e Entrar */}
            <button
              type="button"
              disabled={isVerifyingOtp || otpDigits.join("").length < 6}
              onClick={() => handleVerifyOtpSubmit()}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-extrabold py-3.5 rounded-full text-xs shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
            >
              {isVerifyingOtp ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Validando Código...</span>
                </>
              ) : (
                <>
                  <span>Validar e Acessar Conta</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>

            {/* Seção de Reenvio com Contador */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Não recebeu o código?{" "}
                {resendCooldown > 0 ? (
                  <span className="font-semibold text-slate-400 dark:text-slate-500">
                    Reenviar em {String(resendCooldown).padStart(2, "0")}s
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={isResendingOtp}
                    onClick={handleResendOtp}
                    className="text-primary font-bold hover:underline inline-flex items-center gap-1"
                  >
                    {isResendingOtp && <RefreshCw size={11} className="animate-spin" />}
                    <span>Reenviar código</span>
                  </button>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setAuthError("");
                    setOtpError("");
                  }}
                  className="text-[11px] text-slate-500 hover:text-navy-900 dark:hover:text-white inline-flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={12} />
                  <span>Voltar para o Login</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rodapé Alternador de Login / Cadastro */}
        {mode !== "esqueceu_senha" && mode !== "verificar_email" && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-center text-xs">
            {mode === "login" ? (
              <p className="text-muted">
                Ainda não tem conta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("cadastro");
                    setAuthError("");
                    setDuplicateEmailError(null);
                  }}
                  className="text-primary font-bold hover:underline"
                >
                  Cadastre-se Gratuitamente
                </button>
              </p>
            ) : (
              <p className="text-muted">
                Já possui uma conta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setAuthError("");
                    setDuplicateEmailError(null);
                  }}
                  className="text-primary font-bold hover:underline"
                >
                  Fazer login
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
