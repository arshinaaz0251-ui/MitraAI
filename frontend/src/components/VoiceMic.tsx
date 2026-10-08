"use client";

import React from "react";
import { Mic, MicOff } from "lucide-react";
import type { Language } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";

interface VoiceMicProps {
  language?: Language;
  isListening: boolean;
  transcript: string;
  onToggle: () => void;
  isSupported: boolean;
}

export default function VoiceMic({
  isListening,
  onToggle,
  isSupported,
}: VoiceMicProps) {
  const { t } = useLanguage();

  if (!isSupported) {
    return (
      <div className="text-center p-2 text-[#4B5563] text-xs font-medium">
        {t("speechUnavailable")}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 flex-shrink-0">
      {/* Saffron Mic Button (min 64px circle, #E07A1F) */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={isListening ? t("stopListening") : t("tapToSpeakGoal")}
        aria-pressed={isListening}
        className={`civora-mic-btn ${isListening ? "is-listening" : ""}`}
      >
        {isListening ? (
          <MicOff size={28} className="animate-pulse" />
        ) : (
          <Mic size={28} />
        )}
      </button>

      {/* Visible Label */}
      <span
        className={`text-xs font-semibold tracking-normal text-center transition-colors ${
          isListening ? "text-[#15803D]" : "text-[#4B5563]"
        }`}
      >
        {isListening ? t("listening") : t("tapToSpeak")}
      </span>
    </div>
  );
}
