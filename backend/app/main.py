"""
MitraAI — FastAPI Backend

CORE PRINCIPLE:
"The Python deterministic engine decides. Gemini explains.
 The AI must NEVER invent or hallucinate eligibility rules."
"""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.models.schemas import (
    AuditResponse,
    CitizenProfile,
    CitizenProfileCreate,
    DocumentType,
    Language,
    SchemeResult,
    SimulateRequest,
    SimulateResponse,
)
from app.services.gemini_service import (
    extract_document_data,
    generate_voice_guidance,
    explain_simpler,
)
from app.services.privacy_shield import full_redaction
from app.services.rules_engine import (
    check_document_expiry,
    detect_mismatches,
    evaluate_all_schemes,
    load_schemes,
    simulate_changes,
)
from app.services.supabase_client import upload_document, save_citizen_profile

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Scheme cache ──
_schemes_cache: list[dict] = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load verified schemes into memory on startup."""
    global _schemes_cache
    settings = get_settings()
    try:
        _schemes_cache = load_schemes(settings.schemes_file)
        logger.info("Loaded %d verified schemes", len(_schemes_cache))
    except FileNotFoundError:
        logger.warning("Schemes file not found — starting with empty scheme list")
        _schemes_cache = []
    yield


app = FastAPI(
    title="MitraAI API",
    description="AI Citizen Welfare Assistant — Deterministic eligibility engine with Gemini-powered explanations",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──
settings = get_settings()

# Origins configured in the backend .env
configured_origins = [
    origin.strip().rstrip("/")
    for origin in settings.cors_origins.split(",")
    if origin.strip()
]

# Local development origins.
# Your frontend may run on 3000 or 3001 depending on whether
# another process is already using port 3000.
local_dev_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

# Combine and remove duplicates.
allowed_origins = sorted(
    set(configured_origins + local_dev_origins)
)

logger.info("CORS allowed origins: %s", allowed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# POST /api/v1/audit — Main Audit Pipeline (P1-P5)
# ──────────────────────────────────────────────


@app.post("/api/v1/audit", response_model=AuditResponse)
async def audit_citizen(
    file: Optional[UploadFile] = File(None),
    spoken_goal: str = Form(""),
    language: str = Form("en"),
):
    """
    Full audit pipeline:
    1. Upload document to Supabase storage
    2. Extract data via Gemini Vision OCR
    3. Apply privacy redaction (DPDP)
    4. Deterministic eligibility evaluation
    5. Cross-document mismatch detection
    6. Regional voice guidance generation
    """
    lang = Language(language) if language in ("te", "hi", "en") else Language.ENGLISH

    profile = CitizenProfile()
    extracted_docs = []

    if file and file.filename:
        # ── P1: Read uploaded file ──
        file_bytes = await file.read()
        mime_type = file.content_type or "image/jpeg"

        # ── P2: Concurrently Upload to Supabase & Extract via Gemini ──
        async def _upload_task():
            try:
                upload_result = await upload_document(
                    file_bytes, file.filename, mime_type
                )
                logger.info("Document uploaded: %s", upload_result.get("path", "error"))
            except Exception as e:
                logger.error("Supabase upload failed (non-blocking): %s", str(e))

        async def _ocr_task():
            try:
                return await extract_document_data(file_bytes, mime_type)
            except Exception as e:
                logger.error("Gemini OCR failed: %s", str(e))
                raise HTTPException(
                    status_code=500,
                    detail=f"Document extraction failed: {str(e)}",
                )

        _, extracted = await asyncio.gather(_upload_task(), _ocr_task())

        # ── P3: Check document expiry ──
        extracted = check_document_expiry(extracted)
        extracted_docs.append(extracted)

        # ── Build citizen profile from extracted data ──
        profile.name = extracted.holder_name
        if extracted.annual_income is not None:
            profile.annual_income = extracted.annual_income
        if extracted.category:
            profile.category = extracted.category
        profile.documents_held = [extracted.document_type]
        profile.extracted_documents = extracted_docs

    # ── T4: Apply privacy redaction to profile name ──
    profile.name = full_redaction(profile.name)

    # ── Save Profile to DB ──
    profile_id = None
    if profile.name or profile.annual_income is not None:
        db_record = {
            "full_name": profile.name,
            "annual_income": profile.annual_income or 0,
            "category": profile.category or "General",
        }
        saved = await save_citizen_profile(db_record)
        if saved:
            profile_id = saved.get("id")

    # ── P3: Deterministic eligibility evaluation ──
    scheme_results = evaluate_all_schemes(profile, _schemes_cache, lang.value)

    # ── T1: Cross-document mismatch detection ──
    mismatch_alerts = detect_mismatches(extracted_docs)

    # ── P4: Generate regional voice guidance ──
    voice_guidance = ""
    if scheme_results:
        try:
            results_dicts = [r.model_dump() for r in scheme_results]
            voice_guidance = await generate_voice_guidance(
                results_dicts,
                citizen_name=profile.name,
                language=lang,
                spoken_goal=spoken_goal,
            )
        except Exception as e:
            logger.error("Voice guidance generation failed: %s", str(e))
            voice_guidance = "Unable to generate guidance at this time."

    return AuditResponse(
        citizen_profile=profile,
        scheme_results=scheme_results,
        mismatch_alerts=mismatch_alerts,
        voice_guidance=voice_guidance,
        language=lang,
        profile_id=profile_id,
    )


# ──────────────────────────────────────────────
# POST /api/v1/profile — Manual Intake Pipeline
# ──────────────────────────────────────────────


@app.post("/api/v1/profile", response_model=AuditResponse)
async def create_profile(
    profile_data: CitizenProfileCreate,
    language: str = "en",
):
    lang = Language(language) if language in ("te", "hi", "en") else Language.ENGLISH
    
    # Redact name and phone
    safe_name = full_redaction(profile_data.full_name)
    safe_phone = full_redaction(profile_data.phone_number) if profile_data.phone_number else None
    
    db_record = profile_data.model_dump()
    db_record["full_name"] = safe_name
    db_record["phone_number"] = safe_phone
    
    saved = await save_citizen_profile(db_record)
    profile_id = saved.get("id")
    
    # Build CitizenProfile for rules engine
    profile = CitizenProfile(
        name=safe_name,
        annual_income=int(profile_data.annual_income),
        category=profile_data.category,
        documents_held=[],
        extracted_documents=[],
    )
    
    scheme_results = evaluate_all_schemes(profile, _schemes_cache, lang.value)
    
    voice_guidance = ""
    if scheme_results:
        try:
            results_dicts = [r.model_dump() for r in scheme_results]
            voice_guidance = await generate_voice_guidance(
                results_dicts,
                citizen_name=profile.name,
                language=lang,
                spoken_goal="Manual Profile Intake",
            )
        except Exception as e:
            logger.error("Voice guidance generation failed: %s", str(e))
            voice_guidance = "Unable to generate guidance at this time."

    return AuditResponse(
        citizen_profile=profile,
        scheme_results=scheme_results,
        mismatch_alerts=[],
        voice_guidance=voice_guidance,
        language=lang,
        profile_id=profile_id,
    )


# ──────────────────────────────────────────────
# POST /api/v1/auth/register — Citizen Registration in Supabase
# ──────────────────────────────────────────────


@app.post("/api/v1/auth/register")
async def register_citizen(profile_data: CitizenProfileCreate):
    """
    Registers a new citizen in the Supabase 'citizen_profiles' table upon registration.
    Enforces privacy redaction before persisting.
    """
    safe_name = full_redaction(profile_data.full_name)
    safe_phone = full_redaction(profile_data.phone_number) if profile_data.phone_number else None

    db_record = profile_data.model_dump()
    db_record["full_name"] = safe_name
    db_record["phone_number"] = safe_phone
    if not db_record.get("verification_status"):
        db_record["verification_status"] = "verified"

    saved = await save_citizen_profile(db_record)
    logger.info("Citizen registered and saved in Supabase with ID: %s", saved.get("id"))
    return {
        "status": "success",
        "message": "Citizen profile registered in Supabase",
        "profile_id": saved.get("id"),
        "profile": saved,
    }


# ──────────────────────────────────────────────
# POST /api/v1/simulate — What-If Simulator (T2)
# ──────────────────────────────────────────────


@app.post("/api/v1/simulate", response_model=SimulateResponse)
async def simulate_eligibility(request: SimulateRequest):
    """
    What-If simulation: recalculate eligibility with hypothetical overrides.
    Converts Amber cards to Green cards without re-uploading documents.
    """
    lang = request.language

    # Build base profile from request
    base_profile = CitizenProfile(
        annual_income=request.current_income,
        category=request.current_category,
        documents_held=[
            DocumentType(d) for d in request.documents_held
            if d in [e.value for e in DocumentType]
        ],
    )

    # Run simulation
    original_results, simulated_results = simulate_changes(
        base_profile=base_profile,
        schemes=_schemes_cache,
        hypothetical_income=request.hypothetical_income,
        hypothetical_category=request.hypothetical_category,
        hypothetical_documents=request.hypothetical_documents,
        language=lang.value,
    )

    # Generate summary of changes
    changes = []
    for orig, sim in zip(original_results, simulated_results):
        if orig.status != sim.status:
            direction = "🟢 Now Eligible" if sim.eligible else "🟠 Still Blocked"
            changes.append(f"{sim.scheme_name}: {direction}")

    changes_summary = "; ".join(changes) if changes else "No changes in eligibility."

    # Generate voice guidance for simulation
    voice_guidance = ""
    try:
        sim_dicts = [r.model_dump() for r in simulated_results]
        voice_guidance = await generate_voice_guidance(
            sim_dicts,
            citizen_name="Citizen",
            language=lang,
            spoken_goal="What-If simulation results",
        )
    except Exception as e:
        logger.error("Simulation voice guidance failed: %s", str(e))

    return SimulateResponse(
        original_results=original_results,
        simulated_results=simulated_results,
        changes_summary=changes_summary,
        voice_guidance=voice_guidance,
    )


# ──────────────────────────────────────────────
# GET /api/v1/schemes — Verified Schemes (with dependency chains)
# ──────────────────────────────────────────────


@app.get("/api/v1/schemes")
async def get_schemes(language: str = "en"):
    """
    Return all verified schemes with dependency chains and official sources.
    """
    lang = language if language in ("te", "hi", "en") else "en"

    schemes_response = []
    for scheme in _schemes_cache:
        schemes_response.append(
            {
                "scheme_id": scheme["scheme_id"],
                "name": scheme["name"].get(lang, scheme["name"]["en"]),
                "description": scheme["description"].get(lang, scheme["description"]["en"]),
                "eligibility_rules": scheme["eligibility_rules"],
                "benefits": scheme["benefits"].get(lang, scheme["benefits"]["en"]),
                "application_steps": scheme["application_steps"].get(
                    lang, scheme["application_steps"]["en"]
                ),
                "official_source_url": scheme["official_source_url"],
                "last_verified_date": scheme["last_verified_date"],
                "state": scheme.get("state", ""),
                "category": scheme.get("category", ""),
                "required_documents": scheme["eligibility_rules"].get(
                    "required_documents", []
                ),
            }
        )

    return {"schemes": schemes_response, "total": len(schemes_response)}


# ──────────────────────────────────────────────
# POST /api/v1/explain — "Explain Simpler" (E1)
# ──────────────────────────────────────────────


@app.post("/api/v1/explain")
async def explain_scheme(
    scheme_info: str = Form(""),
    language: str = Form("en"),
):
    """
    Re-explain a scheme card using simpler regional language and analogies.
    """
    lang = Language(language) if language in ("te", "hi", "en") else Language.ENGLISH

    if not scheme_info:
        raise HTTPException(status_code=400, detail="scheme_info is required")

    try:
        explanation = await explain_simpler(scheme_info, lang)
    except Exception as e:
        logger.error("Explain simpler failed: %s", str(e))
        raise HTTPException(status_code=500, detail="Could not generate explanation")

    return {"explanation": explanation, "language": lang.value}


# ──────────────────────────────────────────────
# Health Check
# ──────────────────────────────────────────────


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "schemes_loaded": len(_schemes_cache),
        "service": "MitraAI Backend",
    }
