"use client";

import React, { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";

interface RateStepperInputProps {
  value: number | string;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

export function RateStepperInput({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 5,
  className = "",
  ariaLabel = "Valor da hora/aula",
  disabled = false
}: RateStepperInputProps) {
  const numValue = typeof value === "number" ? value : parseInt(String(value).replace(/\D/g, ""), 10) || min;
  const [text, setText] = useState<string>(String(numValue || min));

  useEffect(() => {
    const val = typeof value === "number" ? value : parseInt(String(value).replace(/\D/g, ""), 10) || min;
    setText(String(val));
  }, [value, min]);

  const handleStep = (delta: number) => {
    if (disabled) return;
    const current = parseInt(text, 10) || min;
    let next = current + delta;
    if (next < min) next = min;
    if (next > max) next = max;
    setText(String(next));
    onChange(next);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    // Permite digitação numérica direta
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") {
      setText("");
      return;
    }
    const parsed = parseInt(raw, 10);
    const bounded = Math.min(max, parsed);
    setText(String(bounded));
    onChange(bounded);
  };

  const handleBlur = () => {
    if (disabled) return;
    const parsed = parseInt(text, 10);
    if (isNaN(parsed) || parsed < min) {
      setText(String(min));
      onChange(min);
    } else if (parsed > max) {
      setText(String(max));
      onChange(max);
    } else {
      setText(String(parsed));
      onChange(parsed);
    }
  };

  return (
    <div
      className={`inline-flex items-center rounded-xl border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 shadow-xs transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      } ${className}`}
    >
      {/* Botão '-' na esquerda */}
      <button
        type="button"
        onClick={() => handleStep(-step)}
        disabled={disabled || (parseInt(text, 10) || 0) <= min}
        title={`Diminuir (-R$ ${step})`}
        aria-label={`Diminuir ${ariaLabel}`}
        className="px-2 py-1.5 text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-700 rounded-l-xl transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      {/* Valor no meio com prefixo R$ */}
      <div className="flex items-center justify-center px-1.5 border-x border-slate-100 dark:border-navy-700 min-w-[70px]">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-0.5 select-none">
          R$
        </span>
        <input
          type="text"
          inputMode="numeric"
          aria-label={ariaLabel}
          disabled={disabled}
          value={text}
          onChange={handleTextChange}
          onBlur={handleBlur}
          placeholder="0"
          maxLength={4}
          className="w-9 text-center text-xs font-black text-navy-900 dark:text-white bg-transparent outline-none tracking-tight"
        />
      </div>

      {/* Botão '+' na direita */}
      <button
        type="button"
        onClick={() => handleStep(step)}
        disabled={disabled || (parseInt(text, 10) || 0) >= max}
        title={`Aumentar (+R$ ${step})`}
        aria-label={`Aumentar ${ariaLabel}`}
        className="px-2 py-1.5 text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-700 rounded-r-xl transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
