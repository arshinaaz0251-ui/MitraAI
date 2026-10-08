"use client";

import React, { useState, useEffect } from "react";
import {
  Phone,
  Shield,
  CheckCircle2,
  Lock,
  ArrowRight,
  Loader2,
  User,
} from "lucide-react";
import { registerCitizen } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

interface CitizenAuthCardProps {
  onLoginSuccess: (user: {
    name: string;
    phone?: string;
    maskedId?: string;
    profileId?: string;
  }) => void;
  elderMode: boolean;
  setElderMode?: (mode: boolean) => void;
}

export default function CitizenAuthCard({
  onLoginSuccess,
}: CitizenAuthCardProps) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"phone" | "id">("phone");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [rawId, setRawId] = useState("");
  const [maskedDisplayId, setMaskedDisplayId] = useState("");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // OTP Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Format ####-####-####
  const handleIdInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
    setRawId(digits);

    let formatted = "";
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += "-";
      formatted += digits[i];
    }
    setMaskedDisplayId(formatted);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (tab === "phone") {
      const cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone.length < 10) {
        setError(t("errValidPhone"));
        return;
      }
    } else {
      if (rawId.length !== 12) {
        setError(t("errValidId"));
        return;
      }
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("otp");
      setTimer(30);
      setOtp("");
    }, 600);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (otp !== "123456") {
      setError(t("errInvalidOtp"));
      return;
    }

    setIsLoading(true);
    try {
      const masked = rawId ? `XXXX-XXXX-${rawId.slice(8)}` : undefined;
      const citizenName =
        fullName.trim() ||
        (tab === "phone" ? "Citizen " + phone.slice(-4) : "Demo Citizen");

      const regResponse = await registerCitizen({
        full_name: citizenName,
        phone_number: phone || null,
        masked_id: masked || null,
        annual_income: 150000,
        category: "General",
        state: "Telangana",
        is_student: false,
      });

      onLoginSuccess({
        name: citizenName,
        phone: phone || undefined,
        maskedId: masked,
        profileId: regResponse?.profile_id,
      });
    } catch {
      const masked = rawId ? `XXXX-XXXX-${rawId.slice(8)}` : undefined;
      const citizenName =
        fullName.trim() ||
        (tab === "phone" ? "Citizen " + phone.slice(-4) : "Demo Citizen");
      onLoginSuccess({
        name: citizenName,
        phone: phone || undefined,
        maskedId: masked,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* ── Login Card ── */}
      <div className="bg-[#FFFFFF] border border-[#E2DED5] rounded-2xl p-6 sm:p-8 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_8px_24px_rgba(16,24,40,0.06)]">
        {/* Card Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1B2430] tracking-tight">
            {t("signInTitle")}
          </h2>
          <p className="text-sm text-[#4B5563] mt-1.5">
            {t("signInSubtitle", { code: "123456" })}
          </p>
        </div>

        {/* Segmented Control Tabs (min-height 48px, 4px padding) */}
        <div
          role="tablist"
          className="grid grid-cols-2 p-1 bg-[#F0EEE8] border border-[#E2DED5] rounded-xl mb-6 min-h-[48px]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "phone"}
            onClick={() => {
              setTab("phone");
              setStep("input");
              setError("");
            }}
            className={`min-h-[40px] px-3 text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center text-center ${
              tab === "phone"
                ? "bg-[#0F4C5C] text-white shadow-xs"
                : "text-[#4B5563] hover:text-[#1B2430]"
            }`}
          >
            {t("tabMobileOtp")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "id"}
            onClick={() => {
              setTab("id");
              setStep("input");
              setError("");
            }}
            className={`min-h-[40px] px-3 text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center text-center ${
              tab === "id"
                ? "bg-[#0F4C5C] text-white shadow-xs"
                : "text-[#4B5563] hover:text-[#1B2430]"
            }`}
          >
            {t("tabCitizenId")}
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[#FDECEC] border border-[#B91C1C]/20 text-sm font-medium text-[#B91C1C]">
            {error}
          </div>
        )}

        {/* Step 1: Input details */}
        {step === "input" ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="civora-full-name" className="form-label mb-2">
                {t("fullNameLabel")}
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-[#6B7280] pointer-events-none">
                  <User size={18} />
                </div>
                <input
                  id="civora-full-name"
                  type="text"
                  placeholder={t("fullNamePlaceholder")}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="civora-input civora-input-with-icon"
                />
              </div>
            </div>

            {/* Mobile / ID Input */}
            {tab === "phone" ? (
              <div>
                <label htmlFor="civora-phone" className="form-label mb-2">
                  {t("mobileLabel")}
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-[#6B7280] pointer-events-none">
                    <Phone size={18} />
                  </div>
                  <input
                    id="civora-phone"
                    type="tel"
                    required
                    placeholder={t("mobilePlaceholder")}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="civora-input civora-input-with-icon"
                  />
                </div>
                <p className="text-sm text-[#4B5563] mt-2">
                  {t("mobileHint")}
                </p>
              </div>
            ) : (
              <div>
                <label htmlFor="civora-citizen-id" className="form-label mb-2">
                  {t("citizenIdLabel")}
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-[#6B7280] pointer-events-none">
                    <Shield size={18} />
                  </div>
                  <input
                    id="civora-citizen-id"
                    type="text"
                    required
                    placeholder={t("citizenIdPlaceholder")}
                    value={maskedDisplayId}
                    onChange={handleIdInput}
                    className="civora-input civora-input-with-icon font-mono tracking-wider"
                  />
                </div>
                <p className="text-sm text-[#4B5563] mt-2">
                  {t("citizenIdHint")}
                </p>
              </div>
            )}

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isLoading}
              className="civora-btn-primary w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-white" />
                  <span>{t("requestingOtp")}</span>
                </>
              ) : (
                <>
                  <span>{t("getOtp")}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: OTP verification */
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="p-4 bg-[#E3F0F2] border border-[#0F4C5C]/20 rounded-xl text-center">
              <p className="text-sm text-[#0F4C5C] font-semibold">
                {t("otpSentTo", {
                  dest: tab === "phone" ? phone : `ID ending in ${rawId.slice(-4)}`,
                })}
              </p>
              <p className="text-xs text-[#0F4C5C] mt-1 font-mono font-bold tracking-wider">
                {t("demoCode", { code: "123456" })}
              </p>
            </div>

            <div>
              <label htmlFor="civora-otp" className="form-label mb-2">
                {t("otpLabel")}
              </label>
              <input
                id="civora-otp"
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="civora-input text-center font-mono text-xl tracking-[0.3em] font-bold"
              />
              <div className="flex items-center justify-between text-xs text-[#4B5563] mt-2">
                <button
                  type="button"
                  onClick={() => setStep("input")}
                  className="hover:underline text-[#0F4C5C] font-semibold cursor-pointer"
                >
                  {tab === "phone" ? t("changeMobile") : t("changeId")}
                </button>
                {timer > 0 ? (
                  <span>{t("resendIn", { seconds: timer })}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTimer(30)}
                    className="text-[#0F4C5C] font-semibold hover:underline cursor-pointer"
                  >
                    {t("resendOtp")}
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length < 6}
              className="civora-btn-primary w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-white" />
                  <span>{t("verifyingCode")}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>{t("verifyAndContinue")}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Privacy line */}
        <div className="mt-4 pt-4 border-t border-[#E2DED5]">
          <p className="text-sm text-[#4B5563] flex items-start gap-2 leading-snug">
            <Lock size={15} className="text-[#0F4C5C] flex-shrink-0 mt-0.5" />
            <span>
              {t("privacyNotice")}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
