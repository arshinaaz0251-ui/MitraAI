"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Phone,
  IndianRupee,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Check,
  Save,
  Loader2,
} from "lucide-react";
import type { CitizenProfileCreate } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

interface CitizenProfileFormProps {
  formData: CitizenProfileCreate;
  onChange: (data: CitizenProfileCreate) => void;
  onSyncWithSupabase: (data: CitizenProfileCreate) => Promise<void> | void;
  isSyncing?: boolean;
  elderMode: boolean;
  syncSuccess?: boolean;
}

const CATEGORIES = ["General", "BC", "SC", "ST", "EWS"];
const INCOME_PRESETS = [
  { label: "₹1,00,000", value: 100000 },
  { label: "₹1,50,000", value: 150000 },
  { label: "₹2,50,000", value: 250000 },
  { label: "₹5,00,000", value: 500000 },
];

export default function CitizenProfileForm({
  formData,
  onChange,
  onSyncWithSupabase,
  isSyncing = false,
  syncSuccess = false,
}: CitizenProfileFormProps) {
  const { t } = useLanguage();
  const [localSaved, setLocalSaved] = useState(false);
  const isFirstMount = useRef(true);
  const lastSavedData = useRef<string>(JSON.stringify(formData));

  // Auto-sync debounced effect
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const serialized = JSON.stringify(formData);
    if (!formData.full_name || formData.full_name.trim().length === 0 || serialized === lastSavedData.current) {
      return;
    }

    const timer = setTimeout(() => {
      lastSavedData.current = serialized;
      onSyncWithSupabase(formData);
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData, onSyncWithSupabase]);

  useEffect(() => {
    if (syncSuccess) {
      setLocalSaved(true);
      const timer = setTimeout(() => setLocalSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [syncSuccess]);

  return (
    <div className="civora-card flex flex-col gap-8">
      {/* ── Card Header ── */}
      <div className="border-b border-[#E2DED5] pb-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#1B2430] tracking-tight">
              {t("yourDetails")}
            </h2>
            <p className="text-sm text-[#4B5563] mt-1">
              {t("yourDetailsSubtitle")}
            </p>
          </div>
          {/* Small auto-save helper indicator */}
          <div className="text-xs text-[#4B5563] flex items-center gap-1.5 bg-[#F0EEE8] px-3 py-1.5 rounded-full border border-[#E2DED5]">
            {isSyncing ? (
              <>
                <Loader2 size={13} className="animate-spin text-[#0F4C5C]" />
                <span>{t("savingChanges")}</span>
              </>
            ) : localSaved ? (
              <>
                <CheckCircle2 size={13} className="text-[#15803D]" />
                <span className="text-[#15803D] font-semibold">{t("changesSaved")}</span>
              </>
            ) : (
              <span>{t("autoSaveActive")}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 1: Identity & Contact ── */}
      <div className="space-y-6">
        <h3 className="text-base font-semibold text-[#1B2430] border-b border-[#E2DED5]/60 pb-2">
          {t("personalInfo")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label htmlFor="profile-full-name" className="form-label mb-2">
              {t("fullNameLabel")}
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-[#6B7280] pointer-events-none">
                <User size={18} />
              </div>
              <input
                id="profile-full-name"
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => onChange({ ...formData, full_name: e.target.value })}
                className="civora-input civora-input-with-icon"
                placeholder={t("fullNamePlaceholder")}
              />
            </div>
          </div>

          {/* Contact Mobile */}
          <div>
            <label htmlFor="profile-phone" className="form-label mb-2">
              {t("contactMobile")}
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-[#6B7280] pointer-events-none">
                <Phone size={18} />
              </div>
              <input
                id="profile-phone"
                type="tel"
                value={formData.phone_number || ""}
                onChange={(e) => onChange({ ...formData, phone_number: e.target.value })}
                className="civora-input civora-input-with-icon"
                placeholder={t("mobilePlaceholder")}
              />
            </div>
            <p className="text-sm text-[#4B5563] mt-2">
              {t("contactMobileHint")}
            </p>
          </div>
        </div>
      </div>

      {/* ── Section 2: Household & Category ── */}
      <div className="space-y-6">
        <h3 className="text-base font-semibold text-[#1B2430] border-b border-[#E2DED5]/60 pb-2">
          {t("socioeconomicCriteria")}
        </h3>

        {/* Category Chips */}
        <div>
          <label className="form-label mb-2">
            {t("socialCategory")}
          </label>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => {
              const isSelected = formData.category === cat;
              const catKey = `category_${cat}`;
              const label = t(catKey);
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => onChange({ ...formData, category: cat })}
                  className={`min-h-[48px] px-5 rounded-full text-sm font-semibold transition-all cursor-pointer inline-flex items-center gap-2 border text-center ${
                    isSelected
                      ? "bg-[#0F4C5C] text-white border-[#0F4C5C] shadow-xs"
                      : "bg-[#FFFFFF] text-[#1B2430] border-[#E2DED5] hover:bg-[#F0EEE8]"
                  }`}
                >
                  {isSelected && <Check size={15} className="text-white stroke-[2.5]" />}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-sm text-[#4B5563] mt-2">
            {t("categoryHint")}
          </p>
        </div>

        {/* Annual Income */}
        <div>
          <label htmlFor="profile-income" className="form-label mb-2">
            {t("annualIncome")}
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-4 text-[#6B7280] pointer-events-none">
              <IndianRupee size={18} />
            </div>
            <input
              id="profile-income"
              type="number"
              required
              value={formData.annual_income || ""}
              onChange={(e) =>
                onChange({ ...formData, annual_income: Number(e.target.value) })
              }
              className="civora-input civora-input-with-icon font-medium"
              placeholder={t("incomePlaceholder")}
            />
          </div>

          {/* Quick-select amounts */}
          <div className="mt-3">
            <span className="text-xs font-semibold text-[#4B5563] block mb-2">
              {t("quickSelect")}
            </span>
            <div className="flex flex-wrap gap-2.5">
              {INCOME_PRESETS.map((preset) => {
                const isSelected = formData.annual_income === preset.value;
                return (
                  <button
                    type="button"
                    key={preset.label}
                    onClick={() =>
                      onChange({ ...formData, annual_income: preset.value })
                    }
                    className={`min-h-[44px] px-4 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-[#0F4C5C] text-white border-[#0F4C5C] shadow-xs"
                        : "bg-[#FFFFFF] text-[#1B2430] border-[#E2DED5] hover:bg-[#F0EEE8]"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Age */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="profile-age" className="form-label mb-2">
              {t("ageYears")}
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-[#6B7280] pointer-events-none">
                <Calendar size={18} />
              </div>
              <input
                id="profile-age"
                type="number"
                value={formData.age || ""}
                onChange={(e) =>
                  onChange({ ...formData, age: Number(e.target.value) })
                }
                className="civora-input civora-input-with-icon"
                placeholder={t("agePlaceholder")}
              />
            </div>
          </div>

          {/* Student Toggle */}
          <div>
            <span className="form-label mb-2">{t("studentStatus")}</span>
            <div className="p-4 bg-[#FFFFFF] border border-[#E2DED5] rounded-xl flex items-center justify-between gap-4 min-h-[56px]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#E3F0F2] text-[#0F4C5C]">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-[#1B2430] block">
                    {t("currentlyStudent")}
                  </span>
                  <span className="text-xs text-[#4B5563]">
                    {t("studentHint")}
                  </span>
                </div>
              </div>

              {/* Accessible Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={formData.is_student}
                onClick={() =>
                  onChange({ ...formData, is_student: !formData.is_student })
                }
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.is_student ? "bg-[#0F4C5C]" : "bg-[#E2DED5]"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.is_student ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Save Button & Helper Note at bottom of card ── */}
      <div className="pt-4 border-t border-[#E2DED5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-[#4B5563]">
          {t("criteriaRealtime")}
        </p>

        <button
          type="button"
          onClick={() => onSyncWithSupabase(formData)}
          disabled={isSyncing || !formData.full_name}
          className="civora-btn-primary min-w-[180px]"
        >
          {isSyncing ? (
            <>
              <Loader2 size={18} className="animate-spin text-white" />
              <span>{t("saving")}</span>
            </>
          ) : localSaved ? (
            <>
              <CheckCircle2 size={18} />
              <span>{t("savedCheck")}</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>{t("saveDetails")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
