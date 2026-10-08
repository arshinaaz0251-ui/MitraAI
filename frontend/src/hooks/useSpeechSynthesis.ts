"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import type { Language } from "@/lib/types";

const LANG_CODES: Record<Language, string> = {
  te: "te-IN",
  hi: "hi-IN",
  en: "en-IN",
};

interface UseSpeechSynthesisReturn {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  voiceUnavailable: boolean;
}

export function useSpeechSynthesis(
  language: Language,
  elderMode: boolean = false
): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceUnavailable, setVoiceUnavailable] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    setIsSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  // Reset voiceUnavailable when language changes
  useEffect(() => {
    setVoiceUnavailable(false);
  }, [language]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text || typeof window === "undefined") return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      setVoiceUnavailable(false);

      const voices = window.speechSynthesis.getVoices();
      const targetLang = LANG_CODES[language];
      const targetPrefix = language;

      // Check if browser has voice for this language if voices are loaded
      if (voices.length > 0) {
        const hasMatchingVoice = voices.some(
          (v) =>
            v.lang.toLowerCase() === targetLang.toLowerCase() ||
            v.lang.toLowerCase().startsWith(targetPrefix + "-") ||
            v.lang.toLowerCase().startsWith(targetPrefix)
        );
        if (!hasMatchingVoice && language !== "en") {
          // Voice for Telugu or Hindi not found in browser speech synthesis
          setVoiceUnavailable(true);
        }
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = targetLang;

      // Select specific voice if available
      if (voices.length > 0) {
        const matchingVoice = voices.find(
          (v) =>
            v.lang.toLowerCase() === targetLang.toLowerCase() ||
            v.lang.toLowerCase().startsWith(targetPrefix)
        );
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      utterance.rate = elderMode ? 0.8 : 1.0; // Slow playback in Elder Mode
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        setIsSpeaking(false);
        if (e.error === "not-allowed" || e.error === "language-unavailable") {
          setVoiceUnavailable(true);
        }
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [language, elderMode, isSupported]
  );

  const stop = useCallback(() => {
    if (isSupported && typeof window !== "undefined") {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return { speak, stop, isSpeaking, isSupported, voiceUnavailable };
}
