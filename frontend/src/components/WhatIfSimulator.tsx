"use client";

import React, { useState, useCallback } from "react";
import { Sliders, ArrowRight, RefreshCw, Check } from "lucide-react";
import type { Language, SchemeResult, SimulateRequest } from "@/lib/types";
import { simulateEligibility } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

interface WhatIfSimulatorProps {
  language?: Language;
  currentIncome: number | null;
  currentCategory: string | null;
  documentsHeld: string[];
  onSimulationResult: (
    original: SchemeResult[],
    simulated: SchemeResult[],
    summary: string
  ) => void;
}

export default function WhatIfSimulator({
  currentIncome,
  currentCategory,
  documentsHeld,
  onSimulationResult,
}: WhatIfSimulatorProps) {
  const { language, t } = useLanguage();
  const [hypotheticalIncome, setHypotheticalIncome] = useState<number>(
    currentIncome || 150000
  );
  const [addDocs, setAddDocs] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const availableDocs = [
    "income_certificate",
    "caste_certificate",
    "ration_card",
    "land_passbook",
  ].filter((d) => !documentsHeld.includes(d));

  const toggleDoc = useCallback((doc: string) => {
    setAddDocs((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]
    );
  }, []);

  const runSimulation = useCallback(async () => {
    setIsSimulating(true);
    try {
      const request: SimulateRequest = {
        current_income: currentIncome,
        hypothetical_income: hypotheticalIncome,
        current_category: currentCategory,
        hypothetical_category: null,
        documents_held: documentsHeld,
        hypothetical_documents: addDocs,
        language,
      };

      const result = await simulateEligibility(request);
      onSimulationResult(
        result.original_results,
        result.simulated_results,
        result.changes_summary
      );
    } catch (error) {
      console.error("Simulation failed:", error);
    } finally {
      setIsSimulating(false);
    }
  }, [
    currentIncome,
    hypotheticalIncome,
    currentCategory,
    documentsHeld,
    addDocs,
    language,
    onSimulationResult,
  ]);

  const formatCurrency = (value: number) =>
    `₹${value.toLocaleString("en-IN")}`;

  const formatDocLabel = (name: string) => {
    const key = `doc_${name}`;
    const translated = t(key);
    if (translated !== key) return translated;
    return name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="civora-card">
      {/* Header */}
      <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-[#E2DED5]">
        <div className="w-10 h-10 rounded-xl bg-[#E3F0F2] text-[#0F4C5C] flex items-center justify-center flex-shrink-0">
          <Sliders size={20} />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#1B2430] tracking-tight">
            {t("whatIf")}
          </h3>
          <p className="text-sm text-[#4B5563] mt-0.5">
            {t("whatIfSubtitle")}
          </p>
        </div>
      </div>

      {/* ── Income Slider Box ── */}
      <div className="mb-6 p-6 rounded-2xl bg-[#F0EEE8] border border-[#E2DED5]">
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-semibold text-[#1B2430]">
            {t("whatIfIncome")}
          </label>
          <span className="text-2xl font-bold text-[#0F4C5C]">
            {formatCurrency(hypotheticalIncome)}
          </span>
        </div>

        <div className="py-2">
          <input
            type="range"
            min={50000}
            max={500000}
            step={10000}
            value={hypotheticalIncome}
            onChange={(e) => setHypotheticalIncome(Number(e.target.value))}
            className="w-full accent-[#0F4C5C] bg-[#E2DED5] h-2.5 rounded-lg cursor-pointer"
            aria-label={t("whatIfIncome")}
          />
          <div className="flex justify-between items-center text-xs text-[#4B5563] font-medium mt-2">
            <span>{t("minIncome")}</span>
            <span>{t("maxIncome")}</span>
          </div>
        </div>

        {currentIncome && (
          <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E2DED5] text-xs text-[#4B5563]">
            <span>{t("currentBaseline")}</span>
            <span className="font-semibold text-[#1B2430]">{formatCurrency(currentIncome)}</span>
          </div>
        )}
      </div>

      {/* ── Hypothetical Certificates ── */}
      {availableDocs.length > 0 && (
        <div className="mb-6">
          <label className="form-label mb-3">
            {t("whatIfDoc")}
          </label>
          <div className="flex flex-wrap gap-3">
            {availableDocs.map((doc) => {
              const isSelected = addDocs.includes(doc);
              return (
                <button
                  type="button"
                  key={doc}
                  onClick={() => toggleDoc(doc)}
                  className={`min-h-[44px] px-5 rounded-full text-xs sm:text-sm font-semibold transition-all border cursor-pointer inline-flex items-center gap-2 ${
                    isSelected
                      ? "bg-[#0F4C5C] text-white border-[#0F4C5C] shadow-xs"
                      : "bg-white text-[#1B2430] border-[#E2DED5] hover:bg-[#F0EEE8]"
                  }`}
                >
                  {isSelected ? <Check size={14} className="stroke-[2.5]" /> : "+ "}
                  <span>{formatDocLabel(doc)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Run Simulation CTA ── */}
      <div className="pt-2">
        <button
          type="button"
          onClick={runSimulation}
          disabled={isSimulating}
          className="civora-btn-primary w-full max-w-md mx-auto block"
        >
          {isSimulating ? (
            <span className="inline-flex items-center justify-center gap-2">
              <RefreshCw size={18} className="animate-spin text-white" />
              <span>{t("simulating")}</span>
            </span>
          ) : (
            <span className="inline-flex items-center justify-center gap-2">
              <span>{t("runSimulation")}</span>
              <ArrowRight size={18} />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
