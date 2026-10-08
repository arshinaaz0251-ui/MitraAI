"use client";

import React from "react";
import { CheckCircle2, XCircle, GitBranch } from "lucide-react";
import type { DependencyNode, Language } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";

interface DependencyTreeProps {
  schemeName: string;
  chain: DependencyNode[];
  language?: Language;
}

export default function DependencyTree({
  schemeName,
  chain,
}: DependencyTreeProps) {
  const { t } = useLanguage();
  if (chain.length === 0) return null;

  const formatDocName = (name: string) => {
    const key = `doc_${name}`;
    const translated = t(key);
    if (translated !== key) return translated;
    return name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const missingCount = chain.filter((c) => c.status !== "have").length;

  return (
    <div className="civora-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-[#E2DED5]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E3F0F2] text-[#0F4C5C] flex items-center justify-center flex-shrink-0">
            <GitBranch size={20} />
          </div>
          <div>
            <h4 className="text-base font-bold text-[#1B2430]">
              {t("prerequisiteSequence")}
            </h4>
            <p className="text-xs text-[#4B5563]">
              {t("dependencyChainDesc")}
            </p>
          </div>
        </div>

        {missingCount > 0 ? (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FEF3E2] text-[#B45309] border border-[#B45309]/20">
            {t("neededCount", { count: missingCount })}
          </span>
        ) : (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#E6F4EA] text-[#15803D] border border-[#15803D]/20">
            {t("allReady")}
          </span>
        )}
      </div>

      {/* Target Scheme */}
      <div className="p-4 rounded-xl bg-[#F0EEE8] border border-[#E2DED5] font-semibold text-sm text-[#1B2430] mb-5 flex items-center gap-2.5">
        <GitBranch size={16} className="text-[#0F4C5C] flex-shrink-0" />
        <span className="leading-snug">{schemeName}</span>
      </div>

      {/* Dependent Document Nodes */}
      <div className="space-y-3 pl-2">
        {chain.map((node, i) => {
          const isHave = node.status === "have";
          return (
            <div
              key={i}
              className="p-4 rounded-xl border border-[#E2DED5] bg-white flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                {isHave ? (
                  <CheckCircle2
                    size={18}
                    className="text-[#15803D] stroke-[2.5] flex-shrink-0"
                  />
                ) : (
                  <XCircle
                    size={18}
                    className="text-[#B91C1C] stroke-[2.5] flex-shrink-0"
                  />
                )}
                <span className="font-semibold text-sm text-[#1B2430] truncate">
                  {formatDocName(node.document)}
                </span>
              </div>

              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex-shrink-0 ${
                  isHave
                    ? "bg-[#E6F4EA] text-[#15803D] border-[#15803D]/20"
                    : "bg-[#FDECEC] text-[#B91C1C] border-[#B91C1C]/20"
                }`}
              >
                {isHave ? t("statusAvailable") : t("statusMissing")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
