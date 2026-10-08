"use client";

import React, { useState } from "react";
import {
  UserCircle2,
  ChevronDown,
  Eye,
  Volume2,
  VolumeX,
  Compass,
} from "lucide-react";
import type { Language } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";

interface GovHeaderProps {
  elderMode: boolean;
  setElderMode: (mode: boolean) => void;
  language?: Language;
  setLanguage?: (lang: Language) => void;
  isAuthenticated?: boolean;
  onLoginClick?: () => void;
  onLogout?: () => void;
  citizenName?: string;
}

export default function GovHeader({
  elderMode,
  setElderMode,
  language: propLanguage,
  setLanguage: propSetLanguage,
  isAuthenticated,
  onLoginClick,
  onLogout,
  citizenName,
}: GovHeaderProps) {
  const { language: ctxLanguage, setLanguage: ctxSetLanguage, t } = useLanguage();
  const activeLanguage = propLanguage || ctxLanguage;
  const handleSetLanguage = propSetLanguage || ctxSetLanguage;

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [textSize, setTextSize] = useState<"small" | "normal" | "large">("normal");
  const [screenReaderActive, setScreenReaderActive] = useState(false);

  const handleTextSizeChange = (size: "small" | "normal" | "large") => {
    setTextSize(size);
    document.documentElement.setAttribute("data-text-size", size);
  };

  const handleScreenReaderToggle = () => {
    const next = !screenReaderActive;
    setScreenReaderActive(next);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (next) {
        const u = new SpeechSynthesisUtterance(t("screenReaderEnabled"));
        window.speechSynthesis.speak(u);
      } else {
        window.speechSynthesis.cancel();
      }
    }
  };

  return (
    <header className="w-full bg-[#FFFFFF] border-b border-[#E2DED5] sticky top-0 z-40">
      {/* ── Slim Utility Bar (Calm, Neutral, Non-Government) ── */}
      <div className="bg-[#F0EEE8] border-b border-[#E2DED5] text-[#4B5563] text-xs py-1.5 px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[13px] text-[#4B5563]">
          <span className="inline-block w-2 h-2 rounded-full bg-[#0F4C5C]"></span>
          <span className="font-medium">
            {t("disclaimer")}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 ml-auto">
          {/* Text Size Scaler (A- A A+) */}
          <div
            className="inline-flex items-center rounded-lg bg-[#FFFFFF] border border-[#E2DED5] p-0.5"
            role="group"
            aria-label={t("textSize")}
          >
            <button
              type="button"
              onClick={() => handleTextSizeChange("small")}
              title={t("textSizeSmall")}
              aria-label={t("textSizeSmall")}
              className={`px-2 py-0.5 text-xs font-semibold rounded transition-colors ${
                textSize === "small"
                  ? "bg-[#0F4C5C] text-white"
                  : "text-[#4B5563] hover:text-[#1B2430]"
              }`}
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => handleTextSizeChange("normal")}
              title={t("textSizeNormal")}
              aria-label={t("textSizeNormal")}
              className={`px-2 py-0.5 text-xs font-semibold rounded transition-colors ${
                textSize === "normal"
                  ? "bg-[#0F4C5C] text-white"
                  : "text-[#4B5563] hover:text-[#1B2430]"
              }`}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => handleTextSizeChange("large")}
              title={t("textSizeLarge")}
              aria-label={t("textSizeLarge")}
              className={`px-2 py-0.5 text-xs font-semibold rounded transition-colors ${
                textSize === "large"
                  ? "bg-[#0F4C5C] text-white"
                  : "text-[#4B5563] hover:text-[#1B2430]"
              }`}
            >
              A+
            </button>
          </div>

          {/* Screen Reader Toggle */}
          <button
            type="button"
            onClick={handleScreenReaderToggle}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              screenReaderActive
                ? "bg-[#E3F0F2] text-[#0F4C5C] border-[#0F4C5C]"
                : "bg-[#FFFFFF] text-[#4B5563] border-[#E2DED5] hover:text-[#1B2430]"
            }`}
            aria-pressed={screenReaderActive}
          >
            {screenReaderActive ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span>{t("screenReader")}</span>
          </button>

          {/* Language Switcher */}
          <div className="relative inline-flex items-center">
            <select
              value={activeLanguage}
              onChange={(e) => handleSetLanguage(e.target.value as Language)}
              aria-label={t("chooseLanguage")}
              className="bg-[#FFFFFF] text-[#1B2430] border border-[#E2DED5] rounded-lg px-2.5 py-1 text-xs font-medium outline-none focus:border-[#0F4C5C] cursor-pointer"
            >
              <option value="en">English</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Main MitraAI Navigation Bar ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Left */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0F4C5C] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <Compass size={22} className="stroke-[2.2]" />
          </div>
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="text-2xl font-bold tracking-tight text-[#0F4C5C]">
              {t("brand")}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E3F0F2] text-[#0F4C5C] border border-[#0F4C5C]/20">
              {t("tagline")}
            </span>
          </div>
        </div>

        {/* Controls Right */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Prominent Elder Mode Toggle (visible on all screens) */}
          <button
            type="button"
            onClick={() => setElderMode(!elderMode)}
            aria-label={t("toggleElderMode", { status: elderMode ? "ON" : "OFF" })}
            aria-pressed={elderMode}
            className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              elderMode
                ? "bg-[#0F4C5C] text-white ring-2 ring-[#0F4C5C] ring-offset-2"
                : "bg-[#F0EEE8] text-[#1B2430] border border-[#E2DED5] hover:bg-[#E3F0F2]"
            }`}
          >
            <Eye size={16} className={elderMode ? "text-white" : "text-[#0F4C5C]"} />
            <span>{elderMode ? t("elderModeOn") : t("elderModeOff")}</span>
          </button>

          {/* User Auth / Profile Badge */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="inline-flex items-center gap-2 bg-[#FFFFFF] border border-[#E2DED5] hover:border-[#0F4C5C] text-[#1B2430] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                aria-expanded={isProfileOpen}
              >
                <UserCircle2 size={18} className="text-[#0F4C5C]" />
                <span className="max-w-[120px] truncate">{citizenName || t("demoProfile")}</span>
                <span className="text-[11px] px-2 py-0.2 rounded-full bg-[#E3F0F2] text-[#0F4C5C] font-semibold hidden sm:inline">
                  {t("demo")}
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform text-[#4B5563] ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#E2DED5] rounded-xl shadow-lg p-1.5 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-[#E2DED5] text-[#4B5563]">
                    {t("signedInAs")}{" "}
                    <span className="font-semibold text-[#1B2430]">{citizenName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-[#B91C1C] hover:bg-[#FDECEC] font-semibold transition-colors cursor-pointer mt-1"
                  >
                    {t("logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onLoginClick}
              className="inline-flex items-center gap-1.5 bg-[#0F4C5C] hover:bg-[#0B3A47] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <UserCircle2 size={16} />
              <span>{t("login")}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
