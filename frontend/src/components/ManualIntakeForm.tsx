import React, { useState, useEffect } from "react";
import { User, Phone, IndianRupee, GraduationCap, Calendar, ArrowRight, X, Loader2 } from "lucide-react";
import type { CitizenProfileCreate } from "@/lib/api";

interface ManualIntakeFormProps {
  initialData?: Partial<CitizenProfileCreate>;
  onSubmit: (data: CitizenProfileCreate) => void;
  isLoading?: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const CATEGORIES = ["General", "BC", "SC", "ST", "EWS"];
const INCOME_PRESETS = [
  { label: "₹1L", value: 100000 },
  { label: "₹1.5L", value: 150000 },
  { label: "₹2.5L", value: 250000 },
  { label: "₹5L", value: 500000 },
];

export default function ManualIntakeForm({ initialData, onSubmit, isLoading, isOpen, setIsOpen }: ManualIntakeFormProps) {
  const [formData, setFormData] = useState<CitizenProfileCreate>({
    full_name: initialData?.full_name || "",
    phone_number: initialData?.phone_number || "",
    annual_income: initialData?.annual_income || 0,
    category: initialData?.category || "General",
    age: initialData?.age || undefined,
    is_student: initialData?.is_student || false,
    state: "Telangana"
  });

  const [isElderMode, setIsElderMode] = useState(false);
  
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const observer = new MutationObserver(() => {
        setIsElderMode(document.documentElement.getAttribute("data-elder-mode") === "true");
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-elder-mode"] });
      setIsElderMode(document.documentElement.getAttribute("data-elder-mode") === "true");
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className={`w-full ${isElderMode ? 'py-5' : 'py-4'} px-4 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-700 font-bold hover:border-emerald-500 hover:bg-emerald-50 hover:shadow-md transition-all duration-300 flex items-center justify-center gap-3 bg-white hover:-translate-y-0.5`}
      >
        <User size={isElderMode ? 28 : 22} />
        {isElderMode ? 'ENTER DETAILS MANUALLY' : 'Enter Details Manually'}
      </button>
    );
  }

  const inputHeight = isElderMode ? 'min-h-[56px] text-lg' : 'min-h-[48px]';
  const labelSize = isElderMode ? 'text-base font-bold text-gray-800' : 'text-sm font-semibold text-gray-600';
  const iconSize = isElderMode ? 24 : 18;

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-xl p-5 sm:p-7 flex flex-col gap-7 block-in-left transition-all">
      <style dangerouslySetInnerHTML={{__html: `
        .no-spinners::-webkit-outer-spin-button,
        .no-spinners::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-spinners {
          -moz-appearance: textfield;
        }
      `}} />

      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <h3 className={`font-bold ${isElderMode ? 'text-2xl' : 'text-xl'} flex items-center gap-2 text-slate-800`}>
          <User className="text-emerald-600" size={isElderMode ? 28 : 24} />
          Citizen Profile
        </h3>
        <button 
          onClick={() => setIsOpen(false)} 
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 hover:scale-110"
          aria-label="Close"
        >
          <X size={isElderMode ? 24 : 20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="flex flex-col gap-2">
          <label className={labelSize}>Full Name *</label>
          <div className="relative flex items-center group w-full">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-emerald-500 transition-colors duration-300">
              <User size={iconSize} />
            </div>
            <input 
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              className={`w-full pl-10 pr-4 py-2.5 ${inputHeight} bg-slate-50 border border-slate-300 rounded-xl outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 ${isElderMode ? 'font-bold' : ''}`}
              placeholder="e.g. Srivalli Jalla"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-2">
          <label className={labelSize}>Phone Number</label>
          <div className="relative flex items-center group w-full">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-emerald-500 transition-colors duration-300">
              <Phone size={iconSize} />
            </div>
            <input 
              type="tel"
              value={formData.phone_number || ""}
              onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
              className={`w-full pl-10 pr-4 py-2.5 ${inputHeight} bg-slate-50 border border-slate-300 rounded-xl outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 ${isElderMode ? 'font-bold' : ''}`}
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className={labelSize}>Category / Caste *</label>
          <div className="flex flex-wrap gap-3 sm:gap-4 py-1">
            {CATEGORIES.map(cat => {
              const isActive = formData.category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setFormData({...formData, category: cat})}
                  className={`
                    ${isElderMode ? 'min-h-[52px] px-6 text-lg font-bold border-2' : 'min-h-[44px] px-5 font-semibold border'}
                    rounded-full transition-all duration-300 transform-gpu
                    ${isActive 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105' 
                      : 'bg-slate-50 text-slate-600 border-gray-200 hover:bg-white hover:border-emerald-400 hover:text-emerald-700 hover:shadow-sm hover:-translate-y-0.5'
                    }
                  `}
                >
                  {cat === "General" ? "General (OC)" : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Income */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className={labelSize}>Annual Family Income (₹) *</label>
          <div className="relative flex items-center mb-1 group w-full">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-emerald-500 transition-colors duration-300">
              <IndianRupee size={iconSize} />
            </div>
            <input 
              type="number"
              required
              value={formData.annual_income || ""}
              onChange={(e) => setFormData({...formData, annual_income: Number(e.target.value)})}
              className={`no-spinners w-full pl-10 pr-4 py-2.5 ${inputHeight} bg-slate-50 border border-slate-300 rounded-xl outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 ${isElderMode ? 'font-bold' : ''}`}
              placeholder="e.g. 150000"
            />
          </div>
          {/* Income Preset Pills */}
          <div className="flex flex-wrap gap-3">
            {INCOME_PRESETS.map(preset => (
              <button
                key={preset.label}
                onClick={() => setFormData({...formData, annual_income: preset.value})}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 border
                  ${formData.annual_income === preset.value 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-400 shadow-sm scale-105' 
                    : 'bg-slate-50 text-slate-600 border-gray-200 hover:bg-white hover:border-emerald-300 hover:text-emerald-600 hover:-translate-y-0.5 hover:shadow-sm'
                  }
                  ${isElderMode ? 'min-h-[48px] text-base px-5 border-2' : ''}
                `}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Age */}
        <div className="flex flex-col gap-2">
          <label className={labelSize}>Age</label>
          <div className="relative flex items-center group w-full">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-emerald-500 transition-colors duration-300">
              <Calendar size={iconSize} />
            </div>
            <input 
              type="number"
              value={formData.age || ""}
              onChange={(e) => setFormData({...formData, age: Number(e.target.value)})}
              className={`no-spinners w-full pl-10 pr-4 py-2.5 ${inputHeight} bg-slate-50 border border-slate-300 rounded-xl outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 ${isElderMode ? 'font-bold' : ''}`}
              placeholder="Optional"
            />
          </div>
        </div>
        
        {/* Student Toggle */}
        <div className="flex flex-col justify-center pt-2">
          <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:shadow-md transition-all duration-300 group ${formData.is_student ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-slate-50 border-gray-200 hover:border-emerald-300 hover:bg-white'} ${isElderMode ? 'min-h-[64px] border-2' : 'min-h-[48px]'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-colors duration-300 ${formData.is_student ? 'bg-emerald-200 text-emerald-700' : 'bg-gray-200 text-gray-500 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}>
                <GraduationCap size={iconSize} />
              </div>
              <span className={`${isElderMode ? 'text-lg font-bold' : 'font-semibold'} text-gray-800`}>Currently a Student?</span>
            </div>
            
            {/* iOS Style Switch */}
            <div className={`relative inline-block ${isElderMode ? 'w-14 h-8' : 'w-12 h-6'}`}>
              <input 
                type="checkbox" 
                checked={formData.is_student}
                onChange={(e) => setFormData({...formData, is_student: e.target.checked})}
                className="opacity-0 w-0 h-0 absolute"
              />
              <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-300 shadow-inner ${formData.is_student ? 'bg-emerald-500' : 'bg-gray-300 group-hover:bg-gray-400'}`}>
                <span className={`absolute bg-white rounded-full shadow-md transition-transform duration-300 ${isElderMode ? (formData.is_student ? 'translate-x-6' : 'translate-x-0') : (formData.is_student ? 'translate-x-6' : 'translate-x-0')}`} 
                  style={{
                    height: isElderMode ? '24px' : '20px', 
                    width: isElderMode ? '24px' : '20px',
                    left: isElderMode ? '6px' : '2px',
                    top: isElderMode ? '4px' : '2px'
                  }}></span>
              </span>
            </div>
          </label>
        </div>
      </div>

      <button
        onClick={() => onSubmit(formData)}
        disabled={isLoading || !formData.full_name || formData.annual_income === undefined}
        className={`
          mt-4 w-full rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3 group overflow-hidden relative
          ${isElderMode ? 'py-5 text-xl uppercase font-black tracking-wide border-b-4 border-emerald-800' : 'py-4 text-lg font-bold'}
          ${isLoading || !formData.full_name || formData.annual_income === undefined
            ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed border-b-0'
            : 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:from-emerald-500 hover:to-teal-400 shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:-translate-y-1'
          }
        `}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin relative z-10" size={isElderMode ? 28 : 22} />
            <span className="relative z-10">SAVING...</span>
          </>
        ) : (
          <>
            <span className="relative z-10">{isElderMode ? 'CHECK ELIGIBILITY' : 'Check Eligibility & Save'}</span>
            <ArrowRight size={isElderMode ? 28 : 22} className="relative z-10 group-hover:translate-x-1.5 transition-transform duration-300" />
            {/* Glossy Button Reflection Effect */}
            {formData.full_name && formData.annual_income !== undefined && (
              <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-700 opacity-50 blur-sm rounded-xl"></div>
            )}
          </>
        )}
      </button>
    </div>
  );
}
