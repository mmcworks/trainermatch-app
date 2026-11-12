"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";
import { maskPhone, maskCpf, maskCnpj } from "@/store/mock-data";
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
  Eye,
  EyeOff,
  Sparkles
} from "lucide-react";

interface AuthViewProps {
  defaultRole?: "professor" | "academia";
}

export const AuthView: React.FC<AuthViewProps> = ({ defaultRole }) => {
  const { login, registerUser } = useAppStore();

  const [mode, setMode] = useState<"login" | "cadastro" | "esqueceu_senha">("login");
  const [selectedRole, setSelectedRole] = useState<"professor" | "academia">(defaultRole || "professor");

  // Alerta de erro da autenticação
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Campos de Login (iniciam vazios com placeholders, preenchíveis pelo botão de teste)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

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

  // Limpa campos ao alternar papel ou modo
  useEffect(() => {
    setAuthError("");
    if (mode === "login") {
      setEmail("");
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

  // Validação de Senha Forte
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordStrong = hasMinLength && hasUppercase && hasNumber && hasSpecial && passwordsMatch;
  const strengthScore = [hasMinLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsSubmitting(true);
    try {
      const result = await login(email, password, selectedRole);
      if (!result?.success) {
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

    if (!registerName.trim()) {
      setAuthError("Por favor, preencha seu nome.");
      return;
    }

    if (!registerEmail.trim()) {
      setAuthError("Por favor, preencha seu e-mail.");
      return;
    }

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
        name: registerName.trim(),
        email: registerEmail.trim().toLowerCase(),
        password: registerPassword,
        role: selectedRole,
        doc: registerCpfOrCnpj.trim(),
        crefOrCnpj: registerCref.trim(),
        phone: registerPhone.trim(),
        logoOrAvatar: uploadedImageSrc
      });

      if (!result?.success) {
        setAuthError(result?.error || "Erro ao criar conta.");
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
    if (!isPasswordStrong) return;

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
    <div className="min-h-screen bg-background dark:bg-navy-900 flex items-center justify-center p-4 font-sans">
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
              : "Recuperação de Acesso e Redefinição de Senha"}
          </p>
        </div>

        {/* Alternar Perfil: Professor vs Academia */}
        {mode !== "esqueceu_senha" && (
          <div className="flex bg-slate-100 dark:bg-navy-700 p-1 rounded-full text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setSelectedRole("professor");
                setAuthError("");
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
        {authError && (
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
                    pattern="[0-9]*"
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
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
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
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
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

                <button
                  type="submit"
                  disabled={!isPasswordStrong}
                  className={`w-full py-3 rounded-full text-xs font-extrabold transition-all shadow-sm ${
                    isPasswordStrong
                      ? "bg-primary hover:bg-primary-hover text-white"
                      : "bg-slate-200 dark:bg-navy-700 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  Salvar Nova Senha
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
                  pattern="[0-9]*"
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
                  {selectedRole === "professor" ? "Registro CREF" : "Telefone / WhatsApp"}
                </label>
                <input
                  type={selectedRole === "professor" ? "text" : "tel"}
                  inputMode={selectedRole === "professor" ? undefined : "numeric"}
                  pattern={selectedRole === "professor" ? undefined : "[0-9]*"}
                  required
                  value={selectedRole === "professor" ? registerCref : registerPhone}
                  onChange={(e) => selectedRole === "professor" ? setRegisterCref(e.target.value) : setRegisterPhone(maskPhone(e.target.value))}
                  placeholder={selectedRole === "professor" ? "Ex: 012845-G/ES" : "(00) 00000-0000"}
                  maxLength={selectedRole === "professor" ? 20 : 15}
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-slate-700 font-medium dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-navy-900 dark:text-white font-bold block mb-1">E-mail de Acesso</label>
              <input
                type="email"
                required
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
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

        {/* Rodapé Alternador de Login / Cadastro */}
        {mode !== "esqueceu_senha" && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-center text-xs">
            {mode === "login" ? (
              <p className="text-muted">
                Ainda não tem conta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("cadastro");
                    setAuthError("");
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
                  onClick={() => {
                    setMode("login");
                    setAuthError("");
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
