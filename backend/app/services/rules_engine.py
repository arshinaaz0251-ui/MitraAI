"""
Deterministic Rules Engine (P3)

CORE PRINCIPLE: "The Python deterministic engine decides. Gemini explains."
All eligibility calculations are pure functions evaluated against verified JSON rules.
No AI model is involved in eligibility decisions.
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Optional

from app.models.schemas import (
    CitizenProfile,
    DocumentType,
    EligibilityStatus,
    ExtractedDocument,
    MismatchAlert,
    SchemeResult,
)


def load_schemes(schemes_path: str) -> list[dict]:
    """Load verified schemes from the JSON seed file."""
    path = Path(schemes_path)
    if not path.exists():
        raise FileNotFoundError(f"Schemes file not found: {schemes_path}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# ── Document Expiry Check (P3) ──


def check_document_expiry(
    doc: ExtractedDocument,
    max_age_years: int = 1,
    reference_year: Optional[int] = None,
) -> ExtractedDocument:
    """
    Flag a document as EXPIRED if its issue_year is older than max_age_years.
    Pure function — returns a new ExtractedDocument with expiry fields set.
    """
    if reference_year is None:
        reference_year = datetime.now().year

    if doc.issue_year is not None and doc.document_type == DocumentType.INCOME_CERTIFICATE:
        age = reference_year - doc.issue_year
        if age > max_age_years:
            return doc.model_copy(
                update={
                    "is_expired": True,
                    "expiry_reason": (
                        f"Income certificate issued in {doc.issue_year} "
                        f"is {age} year(s) old (max allowed: {max_age_years} year)."
                    ),
                }
            )
    return doc


# ── Single Scheme Eligibility (P3) ──


def evaluate_scheme(
    profile: CitizenProfile,
    scheme: dict,
    language: str = "en",
) -> SchemeResult:
    """
    Deterministically evaluate a citizen's eligibility for one scheme.

    Returns a SchemeResult with status, reasons, and missing docs.
    This function NEVER calls any AI model.
    """
    rules = scheme["eligibility_rules"]
    reasons: list[str] = []
    missing_docs: list[str] = []
    expired_docs: list[str] = []
    eligible = True

    # ── Income check ──
    max_income = rules.get("max_annual_income")
    if max_income is not None and profile.annual_income is not None:
        if profile.annual_income > max_income:
            eligible = False
            reasons.append(
                f"Annual income ₹{profile.annual_income:,} exceeds "
                f"maximum ₹{max_income:,}."
            )
        else:
            reasons.append(
                f"Income ₹{profile.annual_income:,} is within the "
                f"₹{max_income:,} limit. ✓"
            )
    elif max_income is not None and profile.annual_income is None:
        reasons.append("Income information not yet provided.")

    # ── Category check ──
    eligible_cats = rules.get("eligible_categories", [])
    if "All Farmers" not in eligible_cats:
        if profile.category and profile.category.upper() not in [
            c.upper() for c in eligible_cats
        ]:
            eligible = False
            reasons.append(
                f"Category '{profile.category}' is not in eligible list: "
                f"{', '.join(eligible_cats)}."
            )
        elif profile.category:
            reasons.append(f"Category '{profile.category}' is eligible. ✓")
        else:
            reasons.append("Category information not yet provided.")

    # ── Required documents check ──
    required = rules.get("required_documents", [])
    held_types = [d.value for d in profile.documents_held]

    for req_doc in required:
        if req_doc not in held_types:
            eligible = False
            missing_docs.append(req_doc)
        else:
            # Check if the held document is expired
            for ext_doc in profile.extracted_documents:
                if ext_doc.document_type.value == req_doc and ext_doc.is_expired:
                    eligible = False
                    expired_docs.append(req_doc)
                    reasons.append(
                        ext_doc.expiry_reason
                        or f"Document '{req_doc}' is expired."
                    )

    if missing_docs:
        reasons.append(f"Missing documents: {', '.join(missing_docs)}.")

    # ── Determine status ──
    if eligible:
        status = EligibilityStatus.ELIGIBLE
    elif missing_docs or expired_docs:
        status = EligibilityStatus.BLOCKED
    else:
        status = EligibilityStatus.BLOCKED

    # ── Build dependency chain ──
    dependency_chain = build_dependency_chain(scheme, held_types, language)

    return SchemeResult(
        scheme_id=scheme["scheme_id"],
        scheme_name=scheme["name"].get(language, scheme["name"]["en"]),
        status=status,
        eligible=eligible,
        reasons=reasons,
        missing_documents=missing_docs,
        expired_documents=expired_docs,
        official_source_url=scheme.get("official_source_url", ""),
        last_verified_date=scheme.get("last_verified_date", ""),
        benefits=scheme.get("benefits", {}).get(language, ""),
        application_steps=scheme.get("application_steps", {}).get(language, []),
        dependency_chain=dependency_chain,
    )


# ── Batch Evaluation ──


def evaluate_all_schemes(
    profile: CitizenProfile,
    schemes: list[dict],
    language: str = "en",
) -> list[SchemeResult]:
    """Evaluate a citizen's profile against ALL loaded schemes."""
    return [evaluate_scheme(profile, scheme, language) for scheme in schemes]


# ── Cross-Document Mismatch Detector (T1) ──


def detect_mismatches(
    documents: list[ExtractedDocument],
) -> list[MismatchAlert]:
    """
    Compare names across uploaded documents.
    Flag discrepancies like 'Ravi Kumar' vs 'Ravikumar' as blocker alerts.
    """
    alerts: list[MismatchAlert] = []

    names: list[tuple[str, str]] = []
    for doc in documents:
        if doc.holder_name:
            names.append((doc.holder_name, doc.document_type.value))

    if len(names) < 2:
        return alerts

    # Normalize for comparison
    def normalize(name: str) -> str:
        return "".join(name.lower().split())

    reference_name, reference_doc = names[0]
    ref_norm = normalize(reference_name)

    for other_name, other_doc in names[1:]:
        other_norm = normalize(other_name)
        if ref_norm != other_norm:
            alerts.append(
                MismatchAlert(
                    field="name",
                    values_found=[reference_name, other_name],
                    documents=[reference_doc, other_doc],
                    message=(
                        f"Name mismatch detected: '{reference_name}' "
                        f"(on {reference_doc}) vs '{other_name}' "
                        f"(on {other_doc}). This may block your application."
                    ),
                )
            )

    return alerts


# ── Document Dependency Chain (M2) ──


def build_dependency_chain(
    scheme: dict,
    held_doc_types: list[str],
    language: str = "en",
) -> list[dict]:
    """
    Build an interactive dependency tree for a scheme.
    e.g., Scholarship -> needs Income Certificate (Missing) -> needs Ration Card (Have)
    """
    required = scheme.get("eligibility_rules", {}).get("required_documents", [])
    chain: list[dict] = []

    scheme_name = scheme["name"].get(language, scheme["name"]["en"])

    for doc_key in required:
        status = "have" if doc_key in held_doc_types else "missing"
        chain.append(
            {
                "parent": scheme_name,
                "document": doc_key.replace("_", " ").title(),
                "status": status,
                "doc_key": doc_key,
            }
        )

    return chain


# ── What-If Simulation (T2) ──


def simulate_changes(
    base_profile: CitizenProfile,
    schemes: list[dict],
    hypothetical_income: Optional[int] = None,
    hypothetical_category: Optional[str] = None,
    hypothetical_documents: Optional[list[str]] = None,
    language: str = "en",
) -> tuple[list[SchemeResult], list[SchemeResult]]:
    """
    Run a What-If simulation by temporarily overriding profile values.
    Returns (original_results, simulated_results).
    """
    # Original evaluation
    original_results = evaluate_all_schemes(base_profile, schemes, language)

    # Build hypothetical profile
    sim_profile = base_profile.model_copy()

    if hypothetical_income is not None:
        sim_profile.annual_income = hypothetical_income

    if hypothetical_category is not None:
        sim_profile.category = hypothetical_category

    if hypothetical_documents is not None:
        sim_profile.documents_held = list(base_profile.documents_held)
        for doc_str in hypothetical_documents:
            try:
                doc_type = DocumentType(doc_str)
                if doc_type not in sim_profile.documents_held:
                    sim_profile.documents_held.append(doc_type)
            except ValueError:
                pass

        # Remove expired flags for hypothetical documents (simulating renewal)
        renewed_docs: list[ExtractedDocument] = []
        for ext_doc in sim_profile.extracted_documents:
            if ext_doc.document_type.value in hypothetical_documents and ext_doc.is_expired:
                renewed_docs.append(
                    ext_doc.model_copy(
                        update={"is_expired": False, "expiry_reason": None}
                    )
                )
            else:
                renewed_docs.append(ext_doc)
        sim_profile.extracted_documents = renewed_docs

    simulated_results = evaluate_all_schemes(sim_profile, schemes, language)

    return original_results, simulated_results
