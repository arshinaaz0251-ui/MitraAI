/* ── MitraAI Type Definitions ── */

export type Language = "te" | "hi" | "en";

export type DocumentType =
  | "income_certificate"
  | "caste_certificate"
  | "ration_card"
  | "land_passbook"
  | "aadhaar"
  | "other";

export type EligibilityStatus = "eligible" | "blocked" | "partial";

export interface ExtractedDocument {
  document_type: DocumentType;
  holder_name: string;
  annual_income: number | null;
  category: string | null;
  issue_year: number | null;
  raw_text: string;
  is_expired: boolean;
  expiry_reason: string | null;
}

export interface CitizenProfile {
  name: string;
  annual_income: number | null;
  category: string | null;
  documents_held: DocumentType[];
  extracted_documents: ExtractedDocument[];
}

export interface SchemeResult {
  scheme_id: string;
  scheme_name: string;
  status: EligibilityStatus;
  eligible: boolean;
  reasons: string[];
  missing_documents: string[];
  expired_documents: string[];
  official_source_url: string;
  last_verified_date: string;
  benefits: string;
  application_steps: string[];
  dependency_chain: DependencyNode[];
}

export interface DependencyNode {
  parent: string;
  document: string;
  status: "have" | "missing";
  doc_key: string;
}

export interface MismatchAlert {
  field: string;
  values_found: string[];
  documents: string[];
  message: string;
}

export interface AuditResponse {
  citizen_profile: CitizenProfile;
  scheme_results: SchemeResult[];
  mismatch_alerts: MismatchAlert[];
  voice_guidance: string;
  language: Language;
  scam_warning: string;
  privacy_notice: string;
}

export interface SimulateRequest {
  current_income: number | null;
  hypothetical_income: number | null;
  current_category: string | null;
  hypothetical_category: string | null;
  documents_held: string[];
  hypothetical_documents: string[];
  language: Language;
}

export interface SimulateResponse {
  original_results: SchemeResult[];
  simulated_results: SchemeResult[];
  changes_summary: string;
  voice_guidance: string;
}

export interface SchemeInfo {
  scheme_id: string;
  name: string;
  description: string;
  eligibility_rules: {
    max_annual_income: number;
    eligible_categories: string[];
    required_documents: string[];
  };
  benefits: string;
  application_steps: string[];
  official_source_url: string;
  last_verified_date: string;
  state: string;
  category: string;
  required_documents: string[];
}

/* ── UI State Types ── */

export interface AppState {
  language: Language;
  elderMode: boolean;
  isListening: boolean;
  spokenText: string;
  uploadedFile: File | null;
  auditResult: AuditResponse | null;
  simulateResult: SimulateResponse | null;
  schemes: SchemeInfo[];
  isLoading: boolean;
  error: string | null;
  currentStep: "intake" | "processing" | "results";
}

/* ── i18n ── */

export const UI_STRINGS: Record<Language, Record<string, string>> = {
  en: {
    title: "MitraAI",
    subtitle: "AI guide for digital tasks",
    tagline: "Tell us what you need. We'll guide you through it.",
    speak: "Tap to speak your goal",
    upload: "Upload your document",
    uploadHint: "Income Certificate, Caste Certificate, or Ration Card",
    camera: "Take a photo",
    submit: "Check My Eligibility",
    eligible: "Eligible & Ready to Apply",
    blocked: "Action Required",
    missing: "Missing Documents",
    expired: "Expired Document",
    whyTitle: "Why this result?",
    source: "Official Source",
    verified: "Last verified",
    whatIf: "What-If Simulator",
    whatIfIncome: "What if my income changes?",
    whatIfDoc: "What if I get this document?",
    runSimulation: "Run Eligibility Simulation",
    simulating: "Checking criteria...",
    downloadChecklist: "Download WhatsApp Checklist",
    elderModeOn: "Elder Mode ON",
    elderModeOff: "Elder Mode OFF",
    scamWarning: "⚠️ Informational prototype with demo data. Official scheme applications are always free on official portals. Never pay unauthorized agents.",
    explainSimpler: "Explain Simpler",
    explainThis: "Explain This",
    step: "Step",
    mitraGuide: "Step Guide",
    processing: "Evaluating criteria...",
    privacyNotice: "🔒 Your documents are read only to check criteria. ID numbers are masked and uploaded images are not stored.",
  },
  te: {
    title: "మిత్రAI (MitraAI)",
    subtitle: "డిజిటల్ పనుల కోసం AI గైడ్",
    tagline: "మీకు ఏమి కావాలో చెప్పండి. మేము మీకు మార్గదర్శనం చేస్తాము.",
    speak: "మీ లక్ష్యం చెప్పడానికి నొక్కండి",
    upload: "మీ డాక్యుమెంట్ అప్‌లోడ్ చేయండి",
    uploadHint: "ఆదాయ ధృవీకరణ పత్రం, కులం ధృవీకరణ పత్రం లేదా రేషన్ కార్డు",
    camera: "ఫోటో తీయండి",
    submit: "నా అర్హత తనిఖీ చేయండి",
    eligible: "అర్హులు & దరఖాస్తుకు సిద్ధం",
    blocked: "చర్య అవసరం",
    missing: "తప్పిపోయిన పత్రాలు",
    expired: "గడువు ముగిసిన పత్రం",
    whyTitle: "ఈ ఫలితం ఎందుకు?",
    source: "అధికారిక మూలం",
    verified: "చివరిగా ధృవీకరించబడింది",
    whatIf: "ఊహా-పరీక్ష (What-If)",
    whatIfIncome: "నా ఆదాయం మారితే ఏమవుతుంది?",
    whatIfDoc: "ఈ పత్రం నాకు వస్తే?",
    runSimulation: "అర్హత సిమ్యులేషన్ రన్ చేయండి",
    simulating: "విశ్లేషణ జరుగుతోంది...",
    downloadChecklist: "WhatsApp జాబితా డౌన్‌లోడ్",
    elderModeOn: "పెద్దల మోడ్ ON",
    elderModeOff: "పెద్దల మోడ్ OFF",
    scamWarning: "⚠️ డెమో డేటాతో సమాచార ప్రోటోటైప్. అధికారిక పథకం దరఖాస్తులు అధికారిక పోర్టల్‌లలో ఎల్లప్పుడూ ఉచితం.",
    explainSimpler: "సులభంగా వివరించు",
    explainThis: "దీన్ని వివరించు",
    step: "దశ",
    mitraGuide: "స్టెప్ గైడ్ (Step Guide)",
    processing: "మీ పత్రాలను పరిశీలిస్తోంది...",
    privacyNotice: "🔒 మీ పత్రాలు ప్రమాణాలను తనిఖీ చేయడానికి మాత్రమే చదవబడతాయి. ID నంబర్లు మాస్క్ చేయబడతాయి.",
  },
  hi: {
    title: "मित्राAI (MitraAI)",
    subtitle: "डिजिटल कार्यों के लिए AI गाइड",
    tagline: "हमें बताएं कि आपको क्या चाहिए। हम आपका मार्गदर्शन करेंगे।",
    speak: "अपना लक्ष्य बोलने के लिए टैप करें",
    upload: "अपना दस्तावेज़ अपलोड करें",
    uploadHint: "आय प्रमाण पत्र, जाति प्रमाण पत्र, या राशन कार्ड",
    camera: "फोटो लें",
    submit: "मेरी पात्रता जांचें",
    eligible: "पात्र और आवेदन के लिए तैयार",
    blocked: "कार्रवाई आवश्यक",
    missing: "गुम दस्तावेज़",
    expired: "समय-सीमा समाप्त दस्तावेज़",
    whyTitle: "यह परिणाम क्यों?",
    source: "आधिकारिक स्रोत",
    verified: "अंतिम सत्यापन",
    whatIf: "क्या-अगर सिम्युलेटर (What-If)",
    whatIfIncome: "अगर मेरी आय बदल जाए?",
    whatIfDoc: "अगर मुझे यह दस्तावेज़ मिल जाए?",
    runSimulation: "पात्रता सिमुलेशन चलाएं",
    simulating: "जांच जारी है...",
    downloadChecklist: "WhatsApp चेकलिस्ट डाउनलोड",
    elderModeOn: "बड़ों का मोड ON",
    elderModeOff: "बड़ों का मोड OFF",
    scamWarning: "⚠️ डेमो डेटा के साथ सूचनात्मक प्रोटोटाइप। आधिकारिक पोर्टल पर आवेदन हमेशा मुफ़्त होते हैं।",
    explainSimpler: "आसान भाषा में समझाओ",
    explainThis: "यह समझाओ",
    step: "चरण",
    mitraGuide: "स्टेप गाइड (Step Guide)",
    processing: "दस्तावेज़ों का मूल्यांकन हो रहा है...",
    privacyNotice: "🔒 आपके दस्तावेज़ केवल पात्रता जांचने के लिए पढ़े जाते हैं। ID नंबर मास्क किए जाते हैं।",
  },
};
