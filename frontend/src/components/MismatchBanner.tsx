"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import type { MismatchAlert } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";

interface MismatchBannerProps {
  alerts: MismatchAlert[];
}

export default function MismatchBanner({ alerts }: MismatchBannerProps) {
  const { t } = useLanguage();
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert, i) => (
        <div
          key={i}
          className="p-5 md:p-6 rounded-2xl bg-[#FEF3E2] border border-[#B45309]/30 flex items-start gap-4 shadow-xs"
        >
          <div className="p-2 rounded-xl bg-white text-[#B45309] border border-[#B45309]/20 flex-shrink-0 mt-0.5">
            <AlertTriangle size={20} className="stroke-[2.2]" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-base text-[#B45309] mb-1">
              {t("crossDocMismatch")}
            </p>
            <p className="text-sm text-[#4B5563] leading-relaxed">
              {alert.message}
            </p>

            {alert.values_found.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {alert.values_found.map((val, j) => (
                  <span
                    key={j}
                    className="px-3 py-1 rounded-full bg-white text-[#B45309] border border-[#B45309]/20 text-xs font-semibold"
                  >
                    “{val}”
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
