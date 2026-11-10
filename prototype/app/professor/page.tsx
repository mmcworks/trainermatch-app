"use client";

import React, { useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";
import { ProfessorView } from "@/components/professor-view";
import { AuthView } from "@/components/auth-view";

export default function ProfessorPage() {
  const { currentRole, isDarkMode, isAuthenticated, setRole, syncWithBackend, isLoaded } = useAppStore();

  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

  useEffect(() => {
    if (isAuthenticated && currentRole !== "professor") {
      setRole("professor");
    }
  }, [isAuthenticated, currentRole, setRole]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-navy-900">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted dark:text-slate-400 font-medium">Carregando aplicativo do professor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView defaultRole="professor" />;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark bg-navy-900 text-slate-100" : "bg-background text-navy-900"}`}>
      <ProfessorView />
    </div>
  );
}
