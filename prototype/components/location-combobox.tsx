"use client";

import React, { useState, useEffect, useRef } from "react";
import { BRAZIL_STATES, CITIES_BY_STATE, NEIGHBORHOODS_BY_CITY } from "@/store/brazil-locations";
import { ChevronDown, MapPin, Building2, Check } from "lucide-react";

interface LocationComboboxProps {
  state: string;
  city: string;
  neighborhood: string;
  onChange: (loc: { state: string; city: string; neighborhood: string }) => void;
  disabled?: boolean;
}

export function LocationCombobox({
  state,
  city,
  neighborhood,
  onChange,
  disabled = false
}: LocationComboboxProps) {
  const [selectedUf, setSelectedUf] = useState<string>(state || "ES");
  const [selectedCity, setSelectedCity] = useState<string>(city || "Vitória");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>(neighborhood || "");

  const [cityOpen, setCityOpen] = useState(false);
  const [citySearch, setCitySearch] = useState(city || "");

  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState(neighborhood || "");

  const cityRef = useRef<HTMLDivElement>(null);
  const neighborhoodRef = useRef<HTMLDivElement>(null);

  // Sincroniza props externas
  useEffect(() => {
    if (state && state !== selectedUf) setSelectedUf(state);
    if (city && city !== selectedCity) {
      setSelectedCity(city);
      setCitySearch(city);
    }
    if (neighborhood && neighborhood !== selectedNeighborhood) {
      setSelectedNeighborhood(neighborhood);
      setNeighborhoodSearch(neighborhood);
    }
  }, [state, city, neighborhood]);

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setCityOpen(false);
      }
      if (neighborhoodRef.current && !neighborhoodRef.current.contains(event.target as Node)) {
        setNeighborhoodOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const availableCities = CITIES_BY_STATE[selectedUf] || [
    "Capital / Região Central",
    "Outra Cidade"
  ];

  const filteredCities = availableCities.filter((c) =>
    c.toLowerCase().includes((citySearch || "").toLowerCase())
  );

  const availableNeighborhoods = NEIGHBORHOODS_BY_CITY[selectedCity] || [
    "Centro",
    "Bairro Principal",
    "Outro Bairro"
  ];

  const filteredNeighborhoods = availableNeighborhoods.filter((n) =>
    n.toLowerCase().includes((neighborhoodSearch || "").toLowerCase())
  );

  const handleUfChange = (newUf: string) => {
    setSelectedUf(newUf);
    const firstCity = (CITIES_BY_STATE[newUf] && CITIES_BY_STATE[newUf][0]) || "";
    setSelectedCity(firstCity);
    setCitySearch(firstCity);
    setSelectedNeighborhood("");
    setNeighborhoodSearch("");
    onChange({ state: newUf, city: firstCity, neighborhood: "" });
  };

  const handleSelectCity = (c: string) => {
    setSelectedCity(c);
    setCitySearch(c);
    setCityOpen(false);
    setSelectedNeighborhood("");
    setNeighborhoodSearch("");
    onChange({ state: selectedUf, city: c, neighborhood: "" });
  };

  const handleCustomCityInput = (val: string) => {
    setCitySearch(val);
    setSelectedCity(val);
    onChange({ state: selectedUf, city: val, neighborhood: selectedNeighborhood });
  };

  const handleSelectNeighborhood = (n: string) => {
    setSelectedNeighborhood(n);
    setNeighborhoodSearch(n);
    setNeighborhoodOpen(false);
    onChange({ state: selectedUf, city: selectedCity, neighborhood: n });
  };

  const handleCustomNeighborhoodInput = (val: string) => {
    setNeighborhoodSearch(val);
    setSelectedNeighborhood(val);
    onChange({ state: selectedUf, city: selectedCity, neighborhood: val });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
      {/* 1. UF (Estado) - 3 colunas */}
      <div className="sm:col-span-3">
        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
          Estado (UF)
        </label>
        <div className="relative">
          <select
            value={selectedUf}
            disabled={disabled}
            onChange={(e) => handleUfChange(e.target.value)}
            className="w-full h-10 px-3 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none pr-8 cursor-pointer disabled:opacity-60"
          >
            {BRAZIL_STATES.map((st) => (
              <option key={st.uf} value={st.uf}>
                {st.uf} - {st.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
      </div>

      {/* 2. Cidade - Combobox (4 colunas) */}
      <div className="sm:col-span-4 relative" ref={cityRef}>
        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
          Cidade
        </label>
        <div className="relative">
          <input
            type="text"
            value={citySearch}
            disabled={disabled}
            onFocus={() => setCityOpen(true)}
            onChange={(e) => handleCustomCityInput(e.target.value)}
            placeholder="Selecione ou digite..."
            className="w-full h-10 px-3 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 pr-8 disabled:opacity-60"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => setCityOpen((prev) => !prev)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-900 dark:hover:text-white"
          >
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Dropdown de Cidades */}
        {cityOpen && !disabled && (
          <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl shadow-xl py-1 text-xs">
            {filteredCities.length > 0 ? (
              filteredCities.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleSelectCity(c)}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors ${
                    selectedCity.toLowerCase() === c.toLowerCase()
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <span className="truncate">{c}</span>
                  {selectedCity.toLowerCase() === c.toLowerCase() && (
                    <Check size={13} className="text-primary flex-shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-slate-400 text-[11px]">
                Nenhuma sugestão. Pressione fora para manter "{citySearch}".
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Bairro - Combobox (5 colunas) */}
      <div className="sm:col-span-5 relative" ref={neighborhoodRef}>
        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
          Bairro
        </label>
        <div className="relative">
          <input
            type="text"
            value={neighborhoodSearch}
            disabled={disabled}
            onFocus={() => setNeighborhoodOpen(true)}
            onChange={(e) => handleCustomNeighborhoodInput(e.target.value)}
            placeholder="Selecione ou digite..."
            className="w-full h-10 px-3 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 pr-8 disabled:opacity-60"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => setNeighborhoodOpen((prev) => !prev)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-900 dark:hover:text-white"
          >
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Dropdown de Bairros */}
        {neighborhoodOpen && !disabled && (
          <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl shadow-xl py-1 text-xs">
            {filteredNeighborhoods.length > 0 ? (
              filteredNeighborhoods.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleSelectNeighborhood(n)}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors ${
                    selectedNeighborhood.toLowerCase() === n.toLowerCase()
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <span className="truncate">{n}</span>
                  {selectedNeighborhood.toLowerCase() === n.toLowerCase() && (
                    <Check size={13} className="text-primary flex-shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-slate-400 text-[11px]">
                Bairro não listado. Digite livremente e clique fora para confirmar.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
