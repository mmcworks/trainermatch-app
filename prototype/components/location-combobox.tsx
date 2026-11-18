"use client";

import React, { useState, useEffect, useRef } from "react";
import { BRAZIL_STATES, CITIES_BY_STATE, NEIGHBORHOODS_BY_CITY, fetchCitiesForUf } from "@/store/brazil-locations";
import { ChevronDown, Check, Loader2 } from "lucide-react";

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
  const [selectedUf, setSelectedUf] = useState<string>(state || "");
  const [selectedCity, setSelectedCity] = useState<string>(city || "");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>(neighborhood || "");

  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState<boolean>(false);

  const [cityOpen, setCityOpen] = useState(false);
  const [citySearch, setCitySearch] = useState(city || "");

  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);
  const [neighborhoodSearch, setNeighborhoodSearch] = useState(neighborhood || "");

  const cityRef = useRef<HTMLDivElement>(null);
  const neighborhoodRef = useRef<HTMLDivElement>(null);

  // Sincroniza props externas quando mudam (ex: ao selecionar academia cadastrada ou editar)
  useEffect(() => {
    setSelectedUf(state || "");
  }, [state]);

  useEffect(() => {
    setSelectedCity(city || "");
    setCitySearch(city || "");
  }, [city]);

  useEffect(() => {
    setSelectedNeighborhood(neighborhood || "");
    setNeighborhoodSearch(neighborhood || "");
  }, [neighborhood]);

  // Carrega cidades da UF selecionada (com suporte a todas as cidades de qualquer estado via IBGE e fallback)
  useEffect(() => {
    let isCancelled = false;
    if (!selectedUf) {
      setAvailableCities([]);
      setIsLoadingCities(false);
      return;
    }

    // Carrega instantaneamente o fallback estático se disponível
    const initialFallback = CITIES_BY_STATE[selectedUf] || [];
    setAvailableCities(initialFallback);
    setIsLoadingCities(true);

    fetchCitiesForUf(selectedUf)
      .then((cities) => {
        if (!isCancelled) {
          if (cities && cities.length > 0) {
            setAvailableCities(cities);
          }
          setIsLoadingCities(false);
        }
      })
      .catch(() => {
        if (!isCancelled) setIsLoadingCities(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedUf]);

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
    setSelectedCity("");
    setCitySearch("");
    setSelectedNeighborhood("");
    setNeighborhoodSearch("");
    onChange({ state: newUf, city: "", neighborhood: "" });
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
            className={`w-full h-10 px-3 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none pr-8 cursor-pointer disabled:opacity-60 ${
              !selectedUf ? "text-slate-400 dark:text-slate-500" : "text-navy-900 dark:text-white"
            }`}
          >
            <option value="">Digite ou selecione</option>
            {BRAZIL_STATES.map((st) => (
              <option key={st.uf} value={st.uf} className="text-navy-900 dark:text-white">
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
        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center justify-between">
          <span>Cidade</span>
          {isLoadingCities && (
            <span className="text-[10px] text-primary flex items-center gap-1 font-normal">
              <Loader2 size={10} className="animate-spin" /> Carregando...
            </span>
          )}
        </label>
        <div className="relative">
          <input
            type="text"
            value={citySearch}
            disabled={disabled}
            onFocus={() => setCityOpen(true)}
            onChange={(e) => handleCustomCityInput(e.target.value)}
            placeholder="Digite ou selecione"
            className="w-full h-10 px-3 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl text-xs font-semibold text-navy-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 pr-8 disabled:opacity-60"
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
          <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl shadow-xl py-1 text-xs">
            {!selectedUf ? (
              <div className="px-3 py-2 text-slate-500 dark:text-slate-400 text-[11px]">
                Selecione primeiro o Estado (UF) para carregar as cidades ou digite o nome diretamente.
              </div>
            ) : filteredCities.length > 0 ? (
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
                Nenhuma cidade encontrada na lista. Pressione fora para manter "{citySearch}".
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
            placeholder="Digite ou selecione"
            className="w-full h-10 px-3 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl text-xs font-semibold text-navy-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 pr-8 disabled:opacity-60"
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
          <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl shadow-xl py-1 text-xs">
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
                Digite livremente o nome do bairro e clique fora para confirmar.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
