"""Pydantic models for request/response schemas."""

from __future__ import annotations
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


# ── Enums ──


class Language(str, Enum):
    TELUGU = "te"
    HINDI = "hi"
    ENGLISH = "en"


class DocumentType(str, Enum):
    INCOME_CERTIFICATE = "income_certificate"
    CASTE_CERTIFICATE = "caste_certificate"
    RATION_CARD = "ration_card"
    LAND_PASSBOOK = "land_passbook"
    AADHAAR = "aadhaar"
    OTHER = "other"


class EligibilityStatus(str, Enum):
    ELIGIBLE = "eligible"
    BLOCKED = "blocked"
    PARTIAL = "partial"


# ── Extracted Document Data ──


class ExtractedDocument(BaseModel):
    """Data extracted from a document via Gemini Vision OCR."""

    document_type: DocumentType
    holder_name: str = ""
    annual_income: Optional[int] = None
    category: Optional[str] = None  # SC, ST, BC, EBC, General
    issue_year: Optional[int] = None
    raw_text: str = ""
    is_expired: bool = False
    expiry_reason: Optional[str] = None


# ── Citizen Profile ──


class CitizenProfile(BaseModel):
    """Aggregated citizen profile from all documents."""

    name: str = ""
    annual_income: Optional[int] = None
    category: Optional[str] = None
    documents_held: list[DocumentType] = Field(default_factory=list)
    extracted_documents: list[ExtractedDocument] = Field(default_factory=list)


class CitizenProfileCreate(BaseModel):
    """Schema for manual citizen intake / creation."""

    full_name: str
    phone_number: Optional[str] = None
    annual_income: float
    category: str
    state: str = "Telangana"
    age: Optional[int] = None
    is_student: bool = False
    document_url: Optional[str] = None
    raw_metadata: Optional[dict] = None


# ── Scheme Eligibility Result ──


class SchemeResult(BaseModel):
    """Deterministic eligibility result for a single scheme."""

    scheme_id: str
    scheme_name: str
    status: EligibilityStatus
    eligible: bool
    reasons: list[str] = Field(default_factory=list)
    missing_documents: list[str] = Field(default_factory=list)
    expired_documents: list[str] = Field(default_factory=list)
    official_source_url: str = ""
    last_verified_date: str = ""
    benefits: str = ""
    application_steps: list[str] = Field(default_factory=list)
    dependency_chain: list[dict] = Field(default_factory=list)


# ── Cross-Document Mismatch ──


class MismatchAlert(BaseModel):
    """Alert for cross-document discrepancy."""

    field: str  # e.g., "name", "dob"
    values_found: list[str]
    documents: list[str]
    message: str


# ── Audit Response ──


class AuditRequest(BaseModel):
    """Request body for the audit endpoint (non-file fields)."""

    spoken_goal: str = ""
    language: Language = Language.ENGLISH


class AuditResponse(BaseModel):
    """Full audit response returned to the frontend."""

    citizen_profile: CitizenProfile
    scheme_results: list[SchemeResult] = Field(default_factory=list)
    mismatch_alerts: list[MismatchAlert] = Field(default_factory=list)
    voice_guidance: str = ""
    language: Language = Language.ENGLISH
    scam_warning: str = (
        "Official application is 100% FREE. Never pay an unauthorized agent."
    )
    privacy_notice: str = "All Aadhaar/ID numbers have been redacted for your safety."
    profile_id: Optional[str] = None


# ── Simulate Request/Response ──


class SimulateRequest(BaseModel):
    """What-If simulation request."""

    current_income: Optional[int] = None
    hypothetical_income: Optional[int] = None
    current_category: Optional[str] = None
    hypothetical_category: Optional[str] = None
    documents_held: list[str] = Field(default_factory=list)
    hypothetical_documents: list[str] = Field(default_factory=list)
    language: Language = Language.ENGLISH


class SimulateResponse(BaseModel):
    """What-If simulation response."""

    original_results: list[SchemeResult] = Field(default_factory=list)
    simulated_results: list[SchemeResult] = Field(default_factory=list)
    changes_summary: str = ""
    voice_guidance: str = ""
