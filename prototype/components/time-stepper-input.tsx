"use client";

import React, { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, Clock } from "lucide-react";

interface TimeStepperInputProps {
  value: string; // "HH:MM"
  onChange: (newValue: string) => void;
  min?: string; // "HH:MM"
  max?: string; // "HH:MM"
  stepMinutes?: number;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

function timeToMinutes(time: string): number {
  if (!time) return 0;
  const parts = time.split(":").map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  return h * 60 + m;
}

function minutesToTime(totalMin: number): string {
  const bounded = Math.max(0, Math.min(23 * 60 + 59, totalMin));
  const h = Math.floor(bounded / 60);
  const m = bounded % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function TimeStepperInput({
  value,
  onChange,
  min = "05:00",
  max = "23:30",
  stepMinutes = 30,
  className = "",
  ariaLabel = "Horário",
  disabled = false
}: TimeStepperInputProps) {
  const [text, setText] = useState(value || "07:00");

  useEffect(() => {
    setText(value || "07:00");
  }, [value]);

  const handleStep = (deltaMinutes: number) => {
    if (disabled) return;
    const currentMin = timeToMinutes(text);
    const minBound = timeToMinutes(min);
    const maxBound = timeToMinutes(max);
    
    // Alinha para o próximo múltiplo de stepMinutes
    let nextMin = currentMin + deltaMinutes;
    if (nextMin < minBound) nextMin = minBound;
    if (nextMin > maxBound) nextMin = maxBound;

    const newTime = minutesToTime(nextMin);
    setText(newTime);
    onChange(newTime);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    // Aceita apenas números
    const rawDigits = e.target.value.replace(/\D/g, "").slice(0, 4);

    let formatted = rawDigits;
    if (rawDigits.length >= 3) {
      formatted = `${rawDigits.slice(0, 2)}:${rawDigits.slice(2)}`;
    }

    setText(formatted);

    // Se completou HH:MM, valida e propaga
    if (rawDigits.length === 4) {
      let hh = parseInt(rawDigits.slice(0, 2), 10);
      let mm = parseInt(rawDigits.slice(2, 4), 10);

      if (hh > 23) hh = 23;
      if (mm > 59) mm = 59;

      const validTime = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      setText(validTime);
      onChange(validTime);
    }
  };

  const handleBlur = () => {
    if (disabled) return;
    const rawDigits = text.replace(/\D/g, "");
    if (rawDigits.length === 0) {
      setText(value || "07:00");
      return;
    }

    let hh = 0;
    let mm = 0;

    if (rawDigits.length <= 2) {
      hh = parseInt(rawDigits, 10);
      mm = 0;
    } else {
      hh = parseInt(rawDigits.slice(0, 2), 10);
      mm = parseInt(rawDigits.slice(2, 4).padEnd(2, "0"), 10);
    }

    if (hh > 23) hh = 23;
    if (mm > 59) mm = 59;

    const validTime = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    setText(validTime);
    onChange(validTime);
  };

  return (
    <div
      className={`inline-flex items-center rounded-xl border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 shadow-sm transition-all focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      } ${className}`}
    >
      <div className="pl-2.5 text-slate-400 dark:text-navy-400 pointer-events-none">
        <Clock className="w-3.5 h-3.5" />
      </div>

      <input
        type="text"
        inputMode="numeric"
        aria-label={ariaLabel}
        disabled={disabled}
        value={text}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder="00:00"
        maxLength={5}
        className="w-16 px-1.5 py-1.5 text-sm font-semibold text-center text-slate-800 dark:text-white bg-transparent outline-none tracking-wider placeholder:text-slate-300 dark:placeholder:text-navy-500"
      />

      {/* Stepper buttons (▲ / ▼) */}
      <div className="flex flex-col border-l border-slate-100 dark:border-navy-700 pr-1 py-0.5">
        <button
          type="button"
          onClick={() => handleStep(stepMinutes)}
          disabled={disabled}
          title="Aumentar horário (+30 min)"
          className="p-0.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-navy-700 rounded transition-colors disabled:opacity-30"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleStep(-stepMinutes)}
          disabled={disabled}
          title="Diminuir horário (-30 min)"
          className="p-0.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-navy-700 rounded transition-colors disabled:opacity-30"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
