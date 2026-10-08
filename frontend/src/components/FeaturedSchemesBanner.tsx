import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Building, FileText, Activity, CalendarIcon } from 'lucide-react';

interface FeaturedSchemesBannerProps {
  elderMode: boolean;
  categoryFilter?: string;
  onOpenManualIntake: () => void;
  onScrollToAudit: () => void;
}

const CAROUSEL_ITEMS = [
  {
    title: "National Overseas Scholarship Scheme 2026-27",
    date: "Higher Education abroad, funding up to ₹30 Lakhs",
    agency: "Ministry of Social Justice & Empowerment",
    category: "Scholarships",
    bgImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "PM Kisan Samman Nidhi (23rd DBT Installment)",
    date: "Direct Benefit Transfer for small farmers",
    agency: "Ministry of Agriculture",
    category: "Agriculture",
    bgImage: "https://images.unsplash.com/photo-1592982537447-6f23349c2522?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "Telangana ePASS Post-Matric & Fee Reimbursement",
    date: "State welfare for students",
    agency: "Government of Telangana",
    category: "Scholarships",
    bgImage: "https://images.unsplash.com/photo-1571260899304-425070112059?q=80&w=2070&auto=format&fit=crop"
  }
];

export default function FeaturedSchemesBanner({ elderMode, categoryFilter, onOpenManualIntake, onScrollToAudit }: FeaturedSchemesBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const filteredItems = CAROUSEL_ITEMS.filter(item => {
    if (!categoryFilter) return true;
    if (categoryFilter.toLowerCase().includes('scholar')) return item.category === 'Scholarships';
    if (categoryFilter.toLowerCase().includes('agri') || categoryFilter.toLowerCase().includes('farm')) return item.category === 'Agriculture';
    return true; // Fallback to all if category doesn't strictly match the demo data
  });
  
  const displayItems = filteredItems.length > 0 ? filteredItems : CAROUSEL_ITEMS;

  useEffect(() => {
    setCurrentSlide(0);
  }, [categoryFilter]);

  useEffect(() => {
    if (elderMode) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % displayItems.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [elderMode, displayItems.length]);

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % displayItems.length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + displayItems.length) % displayItems.length);

  const activeItem = displayItems[currentSlide];
  const touchTarget = elderMode ? 'min-h-[64px]' : 'min-h-[48px]';

  return (
    <div className="w-full fade-up">
      <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[400px]">
        {/* Left: Featured Carousel */}
        <div 
          className="w-full lg:w-[65%] rounded-2xl overflow-hidden relative shadow-2xl transition-all duration-700 flex flex-col justify-between p-8 md:p-12 bg-cover bg-center"
          style={{ backgroundImage: `url(${activeItem.bgImage})` }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-slate-900/80 to-transparent"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="inline-block bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-4 border border-white/30 shadow-sm">
                  {activeItem.agency}
                </span>
                <h2 className={`${elderMode ? 'text-4xl' : 'text-3xl lg:text-4xl'} font-bold mb-3 leading-tight drop-shadow-md text-white max-w-lg`}>
                  {activeItem.title}
                </h2>
                <div className="flex items-center gap-4 text-emerald-300">
                  <span className={`flex items-center gap-2 ${elderMode ? 'text-xl font-bold' : 'text-base font-semibold'}`}>
                    <CalendarIcon className="w-5 h-5" />
                    {activeItem.date}
                  </span>
                </div>
              </div>
              <span className="bg-amber-500 text-black text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md shrink-0 mt-1 hidden sm:block">
                Featured
              </span>
            </div>

            <div className="flex justify-between items-end mt-12">
              <button className={`bg-white text-blue-900 font-bold px-6 py-3 rounded-full hover:bg-gray-100 transition shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2 ${elderMode ? 'text-lg px-8 py-4' : ''}`}>
                Apply / Check Norms <ArrowRight size={18} />
              </button>
              <div className="flex gap-3">
                <button onClick={prevSlide} className={`${touchTarget} w-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur flex items-center justify-center text-white transition shadow-sm`}>
                  <ArrowLeft size={20} />
                </button>
                <button onClick={nextSlide} className={`${touchTarget} w-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur flex items-center justify-center text-white transition shadow-sm`}>
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Progress dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {CAROUSEL_ITEMS.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all duration-500 shadow-sm ${i === currentSlide ? 'w-10 bg-amber-400' : 'w-2 bg-white/40'}`} />
            ))}
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="w-full lg:w-[35%] flex flex-col gap-4">
          <button 
            onClick={onOpenManualIntake}
            className={`w-full ${touchTarget} flex-1 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col items-start justify-center group`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Building size={24} />
              </div>
              <h3 className={`font-bold text-gray-800 ${elderMode ? 'text-xl' : 'text-lg'} text-left`}>Citizen Registration</h3>
            </div>
            <p className="text-gray-500 text-sm text-left ml-11">Create profile & unlock locker</p>
          </button>

          <button 
            onClick={onScrollToAudit}
            className={`w-full ${touchTarget} flex-1 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all flex flex-col items-start justify-center group`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <FileText size={24} />
              </div>
              <h3 className={`font-bold text-gray-800 ${elderMode ? 'text-xl' : 'text-lg'} text-left`}>Instant Audit Dropzone</h3>
            </div>
            <p className="text-gray-500 text-sm text-left ml-11">Upload documents for AI check</p>
          </button>

          <button 
            className={`w-full ${touchTarget} flex-1 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-amber-400 transition-all flex flex-col items-start justify-center group`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Activity size={24} />
              </div>
              <h3 className={`font-bold text-gray-800 ${elderMode ? 'text-xl' : 'text-lg'} text-left`}>Application Status</h3>
            </div>
            <p className="text-gray-500 text-sm text-left ml-11">Check DBT verification status</p>
          </button>
        </div>
      </div>
    </div>
  );
}
