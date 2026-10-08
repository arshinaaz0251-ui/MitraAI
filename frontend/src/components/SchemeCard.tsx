"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Volume2,
  Lightbulb,
  Calendar,
  FileWarning,
} from "lucide-react";
import type { SchemeResult, Language } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";

interface SchemeCardProps {
  result: SchemeResult;
  language?: Language;
  onSpeak: (text: string) => void;
  onExplainSimpler: (schemeInfo: string) => void;
  animationClass?: string;
}

export default function SchemeCard({
  result,
  onSpeak,
  onExplainSimpler,
  animationClass = "",
}: SchemeCardProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const isEligible = result.eligible;
  const schemeInfoForExplain = `${result.scheme_name}: ${result.benefits}. ${result.reasons.join(" ")}`;

  const getDocName = (doc: string) => {
    const key = `doc_${doc}`;
    const translated = t(key);
    if (translated !== key) return translated;
    return doc.replace(/_/g, " ");
  };

  return (
    <div
      className={`civora-card transition-all ${
        isEligible
          ? "border-[#15803D]/30 hover:border-[#15803D]/60"
          : "border-[#B45309]/30 hover:border-[#B45309]/60"
      } ${animationClass}`}
    >
      {/* ── Card Header ── */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          {/* Status Badge */}
          <div className="mb-2">
            {isEligible ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E6F4EA] text-[#15803D] border border-[#15803D]/20">
                <CheckCircle2 size={14} className="stroke-[2.5]" />
                <span>{t("eligibleReady")}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3E2] text-[#B45309] border border-[#B45309]/20">
                <AlertTriangle size={14} className="stroke-[2.5]" />
                <span>{t("actionRequired")}</span>
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-[#1B2430] tracking-tight leading-snug">
            {result.scheme_name}
          </h3>
        </div>

        {/* Audio & Simplification Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => onSpeak(schemeInfoForExplain)}
            className="w-11 h-11 rounded-xl bg-white hover:bg-[#F0EEE8] text-[#0F4C5C] border border-[#E2DED5] transition-colors flex items-center justify-center cursor-pointer"
            aria-label={t("readAloudDetails")}
            title={t("explainThis")}
          >
            <Volume2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => onExplainSimpler(schemeInfoForExplain)}
            className="w-11 h-11 rounded-xl bg-[#E3F0F2] hover:bg-[#0F4C5C]/15 text-[#0F4C5C] border border-[#0F4C5C]/20 transition-colors flex items-center justify-center cursor-pointer"
            aria-label={t("explainSimpler")}
            title={t("explainSimpler")}
          >
            <Lightbulb size={18} />
          </button>
        </div>
      </div>

      {/* ── Benefits Description ── */}
      {result.benefits && (
        <p className="text-base text-[#4B5563] mb-5 leading-relaxed">
          {result.benefits}
        </p>
      )}

      {/* ── Criteria & Document Status Chips ── */}
      <div className="flex flex-wrap gap-2.5 mb-5">
        {result.reasons.map((reason, i) => {
          const isPassed =
            reason.includes("✓") ||
            reason.toLowerCase().includes("eligible") ||
            reason.toLowerCase().includes("within");
          return (
            <span
              key={i}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 border ${
                isPassed
                  ? "bg-[#E6F4EA] text-[#15803D] border-[#15803D]/20"
                  : "bg-[#F0EEE8] text-[#4B5563] border-[#E2DED5]"
              }`}
            >
              {isPassed ? (
                <CheckCircle2 size={13} className="text-[#15803D] stroke-[2.5]" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-[#4B5563]"></span>
              )}
              <span>{reason}</span>
            </span>
          );
        })}

        {/* Missing document status chips */}
        {result.missing_documents.map((doc) => (
          <span
            key={doc}
            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#FDECEC] text-[#B91C1C] border border-[#B91C1C]/20 inline-flex items-center gap-1.5"
          >
            <FileWarning size={13} className="stroke-[2.5]" />
            <span>{t("missingDoc", { doc: getDocName(doc) })}</span>
          </span>
        ))}

        {/* Expired document status chips */}
        {result.expired_documents.map((doc) => (
          <span
            key={doc}
            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#EEF1F5] text-[#475569] border border-[#475569]/20 inline-flex items-center gap-1.5"
          >
            <Calendar size={13} className="stroke-[2.5]" />
            <span>{t("expiredDoc", { doc: getDocName(doc) })}</span>
          </span>
        ))}
      </div>

      {/* ── Expandable: Mitra Guide Accordion ── */}
      <div className="border-t border-[#E2DED5] pt-4 mt-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left py-2 text-sm font-semibold text-[#0F4C5C] hover:text-[#0B3A47] cursor-pointer transition-colors"
          aria-expanded={isExpanded}
        >
          <span className="flex items-center gap-2">
            <span>{t("whyTitle")} & {t("mitraGuide")}</span>
          </span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isExpanded && (
          <div className="p-5 rounded-xl bg-[#F0EEE8] border border-[#E2DED5] mt-3 space-y-4">
            {/* Source Reference */}
            {result.official_source_url && (
              <div className="flex items-center gap-2 text-xs">
                <ExternalLink size={14} className="text-[#0F4C5C] flex-shrink-0" />
                <span className="text-[#4B5563]">{t("officialSource")}:</span>
                <a
                  href={result.official_source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0F4C5C] font-semibold underline truncate hover:text-[#0B3A47]"
                >
                  {result.official_source_url}
                </a>
              </div>
            )}

            {result.last_verified_date && (
              <p className="text-xs text-[#4B5563]">
                {t("lastVerified")}: {result.last_verified_date}
              </p>
            )}

            {/* Step-by-Step Mitra Guide */}
            {result.application_steps.length > 0 && (
              <div className="pt-3 border-t border-[#E2DED5]">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#1B2430] mb-3">
                  {t("mitraGuide")} ({t("stepByStep")})
                </h4>
                <div className="space-y-2.5">
                  {result.application_steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-[#E2DED5] text-sm leading-relaxed"
                    >
                      <span className="w-6 h-6 rounded-full bg-[#E3F0F2] text-[#0F4C5C] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-[#1B2430]">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
