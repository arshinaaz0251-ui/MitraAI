import React from 'react';

interface TrendingTickerProps {
  elderMode: boolean;
  onTickerClick: (goal: string) => void;
}

const SCHEME_UPDATES = [
  "🌾 PM-Kisan 23rd Installment released: Biometric eKYC mandatory for registered farmer accounts.",
  "🎓 Post-Matric & Pre-Matric Scholarship (ePASS / NSP 2026-27): Verification window extended to 31st Oct.",
  "🏠 PM Awas Yojana (PMAY-G): DBT direct bank transfer list published for rural beneficiaries.",
  "⚡ Gruha Jyothi & Rythu Bandhu: Zero-bill verification active via MeeSeva / citizen login."
];

export default function TrendingTicker({ elderMode, onTickerClick }: TrendingTickerProps) {
  return (
    <div className="my-3 mx-auto max-w-7xl px-4 w-full">
      <div className="w-full py-2.5 px-4 rounded-xl border border-amber-200/60 shadow-sm bg-gradient-to-r from-amber-50 via-orange-50/70 to-yellow-50/50 dark:from-slate-900 dark:via-stone-900 dark:to-slate-900 flex items-center overflow-hidden relative">
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-xs tracking-wider uppercase px-3 py-1 rounded-md shadow-sm mr-4 flex-shrink-0 flex items-center whitespace-nowrap z-10">
          LATEST NOTIFICATIONS <span className="hidden sm:inline-block ml-1">/ తాజా ప్రకటనలు</span>
        </div>
        <div className="flex-1 overflow-hidden relative flex items-center">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes marquee {
              0% { transform: translateX(100%); }
              100% { transform: translateX(-150%); }
            }
            .animate-marquee {
              animation: marquee 35s linear infinite;
            }
            .animate-marquee:hover {
              animation-play-state: paused;
            }
          `}} />
          <div 
            className={`whitespace-nowrap ${elderMode ? '' : 'animate-marquee'} flex items-center text-sm font-medium text-slate-800 dark:text-stone-200 space-x-8`} 
            style={{ animationPlayState: elderMode ? 'paused' : undefined }}
          >
            {SCHEME_UPDATES.map((update, idx) => (
              <button 
                key={idx}
                onClick={() => onTickerClick(update)}
                className={`text-sm ${elderMode ? 'font-bold text-slate-900 text-base' : 'font-medium text-slate-800 dark:text-stone-200'} hover:text-amber-700 dark:hover:text-amber-400 hover:underline outline-none cursor-pointer transition-colors`}
              >
                • {update}
              </button>
            ))}
            {!elderMode && SCHEME_UPDATES.map((update, idx) => (
              <button 
                key={`dup-${idx}`}
                onClick={() => onTickerClick(update)}
                className="text-sm font-medium text-slate-800 dark:text-stone-200 hover:text-amber-700 dark:hover:text-amber-400 hover:underline outline-none cursor-pointer transition-colors"
              >
                • {update}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
