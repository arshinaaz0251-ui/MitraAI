# MitraAI — AI Citizen Welfare Assistant with Mitra Guide

> **Core Principle:** "The Python deterministic engine decides. Gemini explains. The AI must NEVER invent or hallucinate eligibility rules."

## Architecture

```
MitraAI/
├── backend/              # FastAPI (Python 3.11+)
│   ├── app/
│   │   ├── main.py       # FastAPI server, CORS, endpoints
│   │   ├── config.py     # Pydantic settings
│   │   ├── models/
│   │   │   └── schemas.py    # Pydantic request/response models
│   │   └── services/
│   │       ├── rules_engine.py    # DETERMINISTIC eligibility logic
│   │       ├── gemini_service.py  # Gemini Vision OCR + Voice Guidance
│   │       ├── privacy_shield.py  # DPDP Aadhaar/ID redaction
│   │       └── supabase_client.py # Document storage upload
│   ├── requirements.txt
│   └── .env.example
├── frontend/             # Next.js (App Router, React 19, TypeScript)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx     # Root layout with fonts & SEO
│   │   │   ├── page.tsx       # Main hero + intake + dashboard
│   │   │   └── globals.css    # Design system, animations, Elder Mode
│   │   ├── components/
│   │   │   ├── VoiceMic.tsx          # Pulsing microphone (Web Speech API)
│   │   │   ├── FileUpload.tsx        # Drag-drop + camera upload
│   │   │   ├── SchemeCard.tsx        # Green/Amber eligibility cards
│   │   │   ├── WhatIfSimulator.tsx   # Income/doc slider simulator
│   │   │   ├── DependencyTree.tsx    # Document dependency chain viewer
│   │   │   └── MismatchBanner.tsx    # Cross-document alert
│   │   ├── hooks/
│   │   │   ├── useSpeechRecognition.ts  # te-IN, hi-IN, en-IN
│   │   │   └── useSpeechSynthesis.ts    # Auto-readout with Elder Mode rate
│   │   └── lib/
│   │       ├── api.ts       # Backend API client
│   │       └── types.ts     # TypeScript types + i18n strings
│   ├── package.json
│   └── .env.example
└── database/
    └── seed_schemes.json  # Verified government schemes with rules
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase project with `documents` storage bucket
- Google API key with Gemini 3.8 Flash access

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Supabase & Google API keys

# Start the server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Start the dev server
npm run dev
```

### 3. Open the App

Navigate to [http://localhost:3000](http://localhost:3000)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/audit` | Full audit pipeline (OCR → Rules → Guidance) |
| `POST` | `/api/v1/simulate` | What-If eligibility simulation |
| `GET`  | `/api/v1/schemes` | List all verified schemes |
| `POST` | `/api/v1/explain` | Re-explain in simpler language |
| `GET`  | `/health` | Health check |

## Feature Map

| ID | Feature | Status |
|----|---------|--------|
| P1 | Voice & Document Intake | ✅ |
| P2 | Document OCR (Gemini Vision) | ✅ |
| P3 | Deterministic Eligibility Engine | ✅ |
| P4 | Regional Voice Guidance (te/hi/en) | ✅ |
| P5 | Citizen Dashboard (Green/Amber Cards) | ✅ |
| T1 | Cross-Document Mismatch Detector | ✅ |
| T2 | What-If Simulator | ✅ |
| T3 | "Why?" Explainer with Official Source | ✅ |
| T4 | Privacy Shield (DPDP/Aadhaar Redaction) | ✅ |
| T9 | Scam Warning Banner | ✅ |
| M1 | Mitra Step-by-Step Guide | ✅ |
| M2 | Document Dependency Chain | ✅ |
| E1 | "Explain Simpler" Button | ✅ |
| E6 | Elder Mode (1.35x, 56px targets, 0.8x audio) | ✅ |
| G3 | Language Selector (te/hi/en) | ✅ |

# MitraAI
