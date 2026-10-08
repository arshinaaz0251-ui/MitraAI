"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Sparkles,
  Volume2,
  VolumeX,
  Loader2,
  Lock,
  User,
  FileCheck,
  AlertCircle,
  Download,
  Languages,
  Mic,
  ListOrdered,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import type {
  AuditResponse,
  SchemeResult,
} from "@/lib/types";
import { auditCitizen, explainSimpler, submitProfile, type CitizenProfileCreate } from "@/lib/api";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useLanguage } from "@/context/LanguageContext";
import VoiceMic from "@/components/VoiceMic";
import FileUpload from "@/components/FileUpload";
import SchemeCard from "@/components/SchemeCard";
import WhatIfSimulator from "@/components/WhatIfSimulator";
import DependencyTree from "@/components/DependencyTree";
import MismatchBanner from "@/components/MismatchBanner";
import Chatbot from "@/components/Chatbot";
import GovHeader from "@/components/GovHeader";
import CitizenProfileForm from "@/components/CitizenProfileForm";
import CitizenAuthCard from "@/components/CitizenAuthCard";

type AppStep = "dashboard" | "processing" | "results";

export default function HomePage() {
  const { language, setLanguage, t } = useLanguage();

  // ── Authentication & Citizen State ──
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [citizenUser, setCitizenUser] = useState<{
    name: string;
    phone?: string;
    maskedId?: string;
    profileId?: string;
  }>({
    name: "Srivalli Jalla",
    phone: "9876543210",
  });

  const [formData, setFormData] = useState<CitizenProfileCreate>({
    full_name: "Srivalli Jalla",
    phone_number: "9876543210",
    annual_income: 150000,
    category: "BC",
    age: 24,
    is_student: true,
    state: "Telangana",
  });

  // ── App UI & Mode State ──
  const [elderMode, setElderMode] = useState<boolean>(false);
  const [step, setStep] = useState<AppStep>("dashboard");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);

  // ── Simulation State ──
  const [simSummary, setSimSummary] = useState<string | null>(null);
  const [simResults, setSimResults] = useState<SchemeResult[] | null>(null);

  // ── Hooks ──
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: micSupported,
  } = useSpeechRecognition(language);

  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    voiceUnavailable,
  } = useSpeechSynthesis(language, elderMode);

  // ── Elder Mode Synchronizer ──
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-elder-mode",
      elderMode ? "true" : "false"
    );
  }, [elderMode]);

  // ── Dynamic language re-evaluation of schemes ──
  const prevLangRef = useRef(language);
  useEffect(() => {
    if (prevLangRef.current !== language) {
      prevLangRef.current = language;
      if (auditResult && isAuthenticated) {
        // Silently re-evaluate profile so scheme names, descriptions, application steps & voice guidance switch language
        submitProfile(formData, language)
          .then((updated) => {
            setAuditResult((prev) => {
              if (!prev) return updated;
              return {
                ...prev,
                scheme_results: updated.scheme_results,
                voice_guidance: updated.voice_guidance,
              };
            });
          })
          .catch((err) => console.error("Language switch re-evaluation failed:", err));
      }
    }
  }, [language, auditResult, isAuthenticated, formData]);

  // ── Auto-read guidance aloud when results load ──
  useEffect(() => {
    if (auditResult?.voice_guidance && step === "results") {
      speak(auditResult.voice_guidance);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditResult, step]);

  // ── Login Handler ──
  const handleLoginSuccess = useCallback(
    (user: { name: string; phone?: string; maskedId?: string; profileId?: string }) => {
      setIsAuthenticated(true);
      setCitizenUser(user);
      setFormData((prev) => ({
        ...prev,
        full_name: user.name || prev.full_name,
        phone_number: user.phone || prev.phone_number,
        masked_id: user.maskedId || prev.masked_id,
      }));
      setSyncSuccess(true);
    },
    []
  );

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setAuditResult(null);
    setSelectedFile(null);
    setStep("dashboard");
    stopSpeaking();
  }, [stopSpeaking]);

  // ── Submit Profile Intake ──
  const handleSyncProfile = useCallback(
    async (dataToSync: CitizenProfileCreate) => {
      setError(null);
      setIsSyncing(true);
      try {
        const result = await submitProfile(dataToSync, language);
        setAuditResult(result);
        setSyncSuccess(true);
        if (result.citizen_profile) {
          setFormData((prev) => ({
            ...prev,
            full_name: result.citizen_profile.name || prev.full_name,
            annual_income:
              result.citizen_profile.annual_income ?? prev.annual_income,
            category: result.citizen_profile.category || prev.category,
          }));
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to evaluate profile criteria";
        setError(msg);
      } finally {
        setIsSyncing(false);
      }
    },
    [language]
  );

  // ── Submit Document for Evaluation ──
  const handleDocumentAudit = useCallback(
    async (fileToAudit: File | null = selectedFile) => {
      if (!fileToAudit) return;
      setError(null);
      setStep("processing");

      try {
        const result = await auditCitizen(fileToAudit, transcript, language);
        setAuditResult(result);

        if (result.citizen_profile) {
          setFormData((prev) => {
            const updated = {
              ...prev,
              full_name: result.citizen_profile.name || prev.full_name,
              annual_income:
                result.citizen_profile.annual_income ?? prev.annual_income,
              category: result.citizen_profile.category || prev.category,
            };
            submitProfile(updated, language).catch((err) =>
              console.error("Auto-sync after document evaluation failed:", err)
            );
            return updated;
          });
        }
        setStep("results");
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Document evaluation failed. Please check file format and try again.";
        setError(msg);
        setStep("dashboard");
      }
    },
    [selectedFile, transcript, language]
  );

  // Trigger when a new file is dropped/chosen
  const handleFileSelect = useCallback(
    (file: File) => {
      setSelectedFile(file);
      handleDocumentAudit(file);
    },
    [handleDocumentAudit]
  );

  // ── Mic Toggle ──
  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // ── Explain Simpler ──
  const handleExplainSimpler = useCallback(
    async (schemeInfo: string) => {
      try {
        const explanation = await explainSimpler(schemeInfo, language);
        speak(explanation);
      } catch {
        speak("Unable to simplify at this time.");
      }
    },
    [language, speak]
  );

  // ── Simulation Result ──
  const handleSimulationResult = useCallback(
    (_original: SchemeResult[], simulated: SchemeResult[], summary: string) => {
      setSimResults(simulated);
      setSimSummary(summary);
    },
    []
  );

  // ── Download Checklist ──
  const handleDownloadChecklist = useCallback(() => {
    if (!auditResult) return;

    let text = `${t("checklistTitle")}\n\n`;
    text += `👤 ${t("beneficiary")} ${auditResult.citizen_profile.name || citizenUser.name}\n`;
    if (citizenUser.maskedId) text += `🔒 ${t("idLabel")} ${citizenUser.maskedId}\n`;
    text += `\n`;

    auditResult.scheme_results.forEach((r) => {
      const icon = r.eligible ? "✅" : "🟡";
      text += `${icon} ${r.scheme_name}\n`;
      if (r.missing_documents.length > 0) {
        const missingTranslated = r.missing_documents
          .map((d) => t(`doc_${d}`) || d.replace(/_/g, " "))
          .join(", ");
        text += `   ${t("requiredLabel")} ${missingTranslated}\n`;
      }
      text += `   ${t("sourceLabel")} ${r.official_source_url}\n\n`;
    });

    text += `${t("scamWarning")}\n\n`;
    text += `🔒 ${t("disclaimer")}`;

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = t("downloadFilename");
    a.click();
    URL.revokeObjectURL(url);
  }, [auditResult, citizenUser, t]);

  // Count eligible schemes
  const eligibleCount =
    auditResult?.scheme_results.filter((s) => s.eligible).length ?? 0;
  const totalCount = auditResult?.scheme_results.length ?? 0;

  // Masked phone format (last 4 digits only)
  const rawPhone = formData.phone_number || citizenUser.phone || "9876543210";
  const maskedPhone = `•••••• ${rawPhone.slice(-4)}`;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#1B2430]">
      {/* ═══ MitraAI Header ═══ */}
      <GovHeader
        elderMode={elderMode}
        setElderMode={setElderMode}
        language={language}
        setLanguage={setLanguage}
        isAuthenticated={isAuthenticated}
        citizenName={citizenUser.name}
        onLoginClick={() => setIsAuthenticated(true)}
        onLogout={handleLogout}
      />

      {/* ── Voice Unavailable Notice ── */}
      {voiceUnavailable && (
        <div className="bg-[#FEF3E2] border-b border-[#B45309]/20 px-4 py-2.5 text-xs text-[#B45309] text-center font-medium flex items-center justify-center gap-2">
          <AlertTriangle size={15} />
          <span>{t("voiceUnavailableNotice")}</span>
        </div>
      )}

      {/* ═══ STATE 1: Landing / Sign-in View (!isAuthenticated) ═══ */}
      {!isAuthenticated && (
        <main className="flex-1 flex flex-col justify-center items-center py-12 md:py-16 px-4 sm:px-6 lg:px-8">
          {/* Centred Hero Section */}
          <div className="text-center max-w-[720px] mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E3F0F2] text-[#0F4C5C] text-xs font-semibold mb-4 border border-[#0F4C5C]/20">
              <Sparkles size={14} />
              <span>{t("tagline")}</span>
            </div>

            <h1 className="text-h1 mb-4">
              {t("heroTitle")}
            </h1>

            <p className="text-base sm:text-lg text-[#4B5563] max-w-[60ch] mx-auto leading-relaxed">
              {t("heroSubtitle")}
            </p>
          </div>

          {/* Centred Login Card */}
          <CitizenAuthCard
            elderMode={elderMode}
            setElderMode={setElderMode}
            onLoginSuccess={handleLoginSuccess}
          />

          {/* Calm row of 4 indicators below the card */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-8 max-w-2xl text-xs sm:text-sm text-[#4B5563]">
            <div className="inline-flex items-center gap-2">
              <Languages size={16} className="text-[#0F4C5C]" />
              <span className="font-medium">{t("badgeMultilingual")}</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <Mic size={16} className="text-[#E07A1F]" />
              <span className="font-medium">{t("badgeVoiceFirst")}</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <ListOrdered size={16} className="text-[#0F4C5C]" />
              <span className="font-medium">{t("badgeStepByStep")}</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#15803D]" />
              <span className="font-medium">{t("badgePrivacy")}</span>
            </div>
          </div>
        </main>
      )}

      {/* ═══ STATE 2: Authenticated Dashboard (isAuthenticated) ═══ */}
      {isAuthenticated && (
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8 pb-32">
          {/* Top Greeting Row */}
          <section className="civora-card flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Identity & Status */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#0F4C5C] text-white flex items-center justify-center font-bold text-2xl flex-shrink-0 shadow-xs">
                {citizenUser.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-2xl font-bold text-[#1B2430] tracking-tight">
                    {t("greeting", { name: citizenUser.name })}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E3F0F2] text-[#0F4C5C] border border-[#0F4C5C]/20">
                    <User size={13} />
                    <span>{t("demoProfile")}</span>
                  </span>
                </div>
                <p className="text-sm text-[#4B5563] mt-1">
                  {t("stateMobile", {
                    state: formData.state || "Telangana",
                    mobile: maskedPhone,
                  })}
                </p>
              </div>
            </div>

            {/* Three Summary Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 w-full md:w-auto">
              {/* Tile 1: Criteria */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#F0EEE8] border border-[#E2DED5] text-left min-w-[140px]">
                <span className="text-xs font-semibold text-[#4B5563] block">
                  {t("tileCriteria")}
                </span>
                <span className="text-sm font-bold text-[#1B2430] block mt-1">
                  {formData.category} ({formData.is_student ? t("statusStudent") : t("statusGeneral")})
                </span>
              </div>

              {/* Tile 2: Eligible schemes */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#F0EEE8] border border-[#E2DED5] text-left min-w-[140px]">
                <span className="text-xs font-semibold text-[#4B5563] block">
                  {t("tileEligibleSchemes")}
                </span>
                <span className="text-sm font-bold text-[#15803D] block mt-1">
                  {auditResult ? `${eligibleCount} of ${totalCount}` : t("readyToCheck")}
                </span>
              </div>

              {/* Tile 3: Privacy */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#F0EEE8] border border-[#E2DED5] text-left min-w-[140px]">
                <span className="text-xs font-semibold text-[#4B5563] block">
                  {t("tilePrivacy")}
                </span>
                <span className="text-sm font-bold text-[#0F4C5C] flex items-center gap-1.5 mt-1">
                  <Lock size={14} />
                  <span>{t("maskedAndSafe")}</span>
                </span>
              </div>
            </div>
          </section>

          {/* Error Banner */}
          {error && (
            <div className="p-5 rounded-2xl bg-[#FDECEC] border border-[#B91C1C]/30 text-[#B91C1C] flex items-center justify-between gap-3 text-sm font-medium">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={20} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-xs font-bold underline cursor-pointer hover:opacity-80"
              >
                {t("dismiss")}
              </button>
            </div>
          )}

          {/* ═══ Main Area ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* LEFT CARD: "Your details" */}
            <div className={!selectedFile && !auditResult ? "order-2 lg:order-1" : "order-1"}>
              <CitizenProfileForm
                formData={formData}
                onChange={setFormData}
                onSyncWithSupabase={handleSyncProfile}
                isSyncing={isSyncing}
                elderMode={elderMode}
                syncSuccess={syncSuccess}
              />
            </div>

            {/* RIGHT CARD: "Check your documents" */}
            <div className={!selectedFile && !auditResult ? "order-1 lg:order-2" : "order-2"}>
              <div className="civora-card flex flex-col gap-6">
                
                {/* Header */}
                <div className="border-b border-[#E2DED5] pb-4">
                  <h3 className="text-xl md:text-2xl font-bold text-[#1B2430] tracking-tight flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-[#E3F0F2] text-[#0F4C5C]">
                      <FileCheck size={22} />
                    </span>
                    {t("checkDocuments")}
                  </h3>
                  <p className="text-sm text-[#4B5563] mt-1.5">
                    {t("checkDocumentsSubtitle")}
                  </p>
                </div>

                {/* Spoken-request box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#F0EEE8] border border-[#E2DED5] flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="text-xs font-semibold text-[#0F4C5C] block mb-1">
                      {t("spokenRequest")}
                    </span>
                    <p className="text-sm text-[#1B2430] font-medium truncate">
                      {transcript || t("tapMicPlaceholder")}
                    </p>
                  </div>
                  <VoiceMic
                    language={language}
                    isListening={isListening}
                    transcript={transcript}
                    onToggle={handleMicToggle}
                    isSupported={micSupported}
                  />
                </div>

                {/* Upload Zone */}
                <div className="space-y-4">
                  <FileUpload
                    language={language}
                    onFileSelect={handleFileSelect}
                    selectedFile={selectedFile}
                    onClear={() => setSelectedFile(null)}
                  />

                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => handleDocumentAudit(selectedFile)}
                      disabled={step === "processing"}
                      className="civora-btn-primary w-full"
                    >
                      {step === "processing" ? (
                        <>
                          <Loader2 size={18} className="animate-spin text-white" />
                          <span>{t("checkingCriteria")}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          <span>{t("checkCriteriaButton")}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Privacy reassurance note */}
                <div className="p-4 rounded-xl bg-[#F7F5F0] border border-[#E2DED5] flex items-start gap-3 text-xs text-[#4B5563] leading-relaxed">
                  <Lock size={16} className="text-[#0F4C5C] flex-shrink-0 mt-0.5" />
                  <span>
                    {t("privacyNotice")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ Processing State ═══ */}
          {step === "processing" && (
            <div className="civora-card text-center p-10 flex flex-col items-center justify-center gap-4">
              <Loader2 size={40} className="animate-spin text-[#0F4C5C]" />
              <div>
                <h3 className="text-lg font-bold text-[#1B2430]">
                  {t("evaluatingCriteria")}
                </h3>
                <p className="text-sm text-[#4B5563] mt-1">
                  {t("evaluatingSubtitle")}
                </p>
              </div>
              <div className="w-64 max-w-full h-2 rounded-full bg-[#E2DED5] overflow-hidden">
                <div className="h-full bg-[#0F4C5C] animate-pulse w-3/4 rounded-full"></div>
              </div>
            </div>
          )}

          {/* ═══ Results Section ═══ */}
          {auditResult && step !== "processing" && (
            <section className="space-y-8 animate-fade-up">
              
              {/* Spoken Guidance Advisory Card */}
              {auditResult.voice_guidance && (
                <div className="p-6 rounded-2xl bg-[#E3F0F2] border border-[#0F4C5C]/20 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-[#0F4C5C] text-white flex-shrink-0">
                      <Volume2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-[#0F4C5C] flex items-center gap-2">
                        {t("spokenAdvisory")}
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white text-[#0F4C5C] font-semibold border border-[#0F4C5C]/20">
                          {language === "te" ? "తెలుగు" : language === "hi" ? "हिन्दी" : "English"}
                        </span>
                      </h4>
                      <p className="text-sm text-[#1B2430] mt-1.5 leading-relaxed max-w-2xl">
                        {auditResult.voice_guidance}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        isSpeaking
                          ? stopSpeaking()
                          : speak(auditResult.voice_guidance)
                      }
                      className="civora-btn-primary h-11 px-4 text-xs sm:text-sm"
                    >
                      {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      <span>{isSpeaking ? t("stopVoice") : t("readAloud")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadChecklist}
                      className="civora-btn-secondary h-11 px-4 text-xs sm:text-sm"
                    >
                      <Download size={16} />
                      <span>{t("exportList")}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mismatch Alerts */}
              {auditResult.mismatch_alerts.length > 0 && (
                <MismatchBanner alerts={auditResult.mismatch_alerts} />
              )}

              {/* Eligible Schemes Grid */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-[#1B2430]">
                      {t("tileEligibleSchemes")}
                    </h3>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#E6F4EA] text-[#15803D] border border-[#15803D]/20">
                      {eligibleCount === 1
                        ? t("matchSingular", { count: eligibleCount })
                        : t("matchPlural", { count: eligibleCount })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#4B5563]">
                    {t("evaluatedFor", {
                      income: formData.annual_income.toLocaleString(),
                      category: formData.category,
                    })}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {auditResult.scheme_results.map((result) => (
                    <SchemeCard
                      key={result.scheme_id}
                      result={result}
                      language={language}
                      onSpeak={speak}
                      onExplainSimpler={handleExplainSimpler}
                    />
                  ))}
                </div>
              </div>

              {/* Document Dependency Chains */}
              {auditResult.scheme_results.some(
                (r) => r.dependency_chain.length > 0
              ) && (
                <div className="space-y-4 pt-4">
                  <div>
                    <h4 className="text-xl font-bold text-[#1B2430]">
                      {t("docDependencyChains")}
                    </h4>
                    <p className="text-sm text-[#4B5563] mt-1">
                      {t("docDependencySubtitle")}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {auditResult.scheme_results
                      .filter((r) => r.dependency_chain.length > 0)
                      .map((r) => (
                        <DependencyTree
                          key={r.scheme_id}
                          schemeName={r.scheme_name}
                          chain={r.dependency_chain}
                          language={language}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* What-If Simulator */}
              <div className="space-y-6 pt-4">
                <WhatIfSimulator
                  language={language}
                  currentIncome={formData.annual_income}
                  currentCategory={formData.category}
                  documentsHeld={auditResult.citizen_profile.documents_held}
                  onSimulationResult={handleSimulationResult}
                />

                {simResults && (
                  <div className="civora-card space-y-6">
                    <h5 className="text-lg font-bold text-[#1B2430]">
                      {t("simulatedOutcomes")}
                    </h5>
                    {simSummary && (
                      <p className="text-sm text-[#0F4C5C] bg-[#E3F0F2] p-4 rounded-xl border border-[#0F4C5C]/20 leading-relaxed font-medium">
                        {simSummary}
                      </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {simResults.map((result) => (
                        <SchemeCard
                          key={`sim-${result.scheme_id}`}
                          result={result}
                          language={language}
                          onSpeak={speak}
                          onExplainSimpler={handleExplainSimpler}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      )}

      {/* ═══ Simple Honest Footer ═══ */}
      <footer className="w-full bg-[#FFFFFF] border-t border-[#E2DED5] py-8 px-4 sm:px-6 lg:px-8 mt-auto text-center">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#4B5563]">
          <p>
            {t("disclaimer")}
          </p>
          <div className="flex items-center gap-4 text-xs">
            <span>{t("demoEnvironment")}</span>
            <span>•</span>
            <span>{t("ephemeralData")}</span>
          </div>
        </div>
      </footer>

      {/* ═══ Floating Chatbot Assistant ═══ */}
      <Chatbot />
    </div>
  );
}
