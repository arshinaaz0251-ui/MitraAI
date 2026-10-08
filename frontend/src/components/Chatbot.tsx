"use client";

import React, { useState, useEffect } from "react";
import { X, Send, HelpCircle, MessageSquare } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Chatbot() {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");

  // Initialize or re-initialize welcome message in current language
  useEffect(() => {
    setMessages([
      {
        role: "bot",
        text: t("chatWelcome"),
      },
    ]);
  }, [language, t]);

  const handleSend = () => {
    if (!input.trim()) return;
    const currentInput = input;
    setMessages((prev) => [...prev, { role: "user", text: currentInput }]);
    setInput("");

    // Simulate bot guidance response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: t("chatSimulatedResponse", { query: currentInput }),
        },
      ]);
    }, 600);
  };

  return (
    <>
      {/* ── Clearly Labelled Floating "Help" Button ── */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-[#0F4C5C] hover:bg-[#0B3A47] text-white font-semibold text-sm shadow-[0_4px_16px_rgba(15,76,92,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          aria-label={t("openHelpChat")}
        >
          <HelpCircle size={20} className="stroke-[2.2]" />
          <span>{t("help")}</span>
        </button>
      )}

      {/* ── Chat Modal Window ── */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={t("assistantTitle")}
          className="fixed bottom-6 right-6 z-50 w-[90vw] sm:w-[380px] h-[520px] max-h-[85vh] bg-white rounded-2xl border border-[#E2DED5] shadow-[0_8px_30px_rgba(16,24,40,0.14)] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#0F4C5C] text-white p-4.5 px-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight text-white m-0">
                  {t("assistantTitle")}
                </h3>
                <span className="text-xs text-white/80 font-medium">
                  {t("infoPrototype")}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label={t("closeChat")}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F7F5F0]">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-3.5 px-4 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#0F4C5C] text-white rounded-br-xs"
                      : "bg-white text-[#1B2430] border border-[#E2DED5] rounded-bl-xs shadow-xs"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-3.5 bg-white border-t border-[#E2DED5] flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={t("askQuestion")}
              className="flex-1 h-11 px-4 rounded-xl border border-[#E2DED5] text-sm text-[#1B2430] placeholder:text-[#6B7280] focus:border-[#0F4C5C] focus:ring-2 focus:ring-[#E3F0F2] outline-none"
            />
            <button
              type="button"
              onClick={handleSend}
              className="w-11 h-11 rounded-xl bg-[#0F4C5C] hover:bg-[#0B3A47] text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
              aria-label={t("sendMessage")}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
