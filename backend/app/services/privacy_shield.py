"""
Privacy Shield (T4 — DPDP Compliance)

Strict redaction of all Aadhaar / National ID numbers before any processing
or display. This module is invoked BEFORE any data leaves the backend.
"""

import re


# ── Aadhaar patterns ──
# 12-digit Aadhaar, with or without spaces/dashes
AADHAAR_PATTERN = re.compile(
    r"\b(\d{4}[\s\-]?\d{4}[\s\-]?\d{4})\b"
)

# ── PAN pattern ──
PAN_PATTERN = re.compile(
    r"\b([A-Z]{5}\d{4}[A-Z])\b"
)

# ── Generic long digit sequences (10+ digits, catches phone-like IDs) ──
LONG_DIGIT_PATTERN = re.compile(
    r"\b(\d{10,})\b"
)

REDACTED_LABEL = "[REDACTED]"


def redact_aadhaar(text: str) -> str:
    """Replace all Aadhaar-like 12-digit sequences with [REDACTED]."""
    return AADHAAR_PATTERN.sub(REDACTED_LABEL, text)


def redact_pan(text: str) -> str:
    """Replace all PAN-like sequences with [REDACTED]."""
    return PAN_PATTERN.sub(REDACTED_LABEL, text)


def redact_long_ids(text: str) -> str:
    """Replace any 10+ digit number sequences with [REDACTED]."""
    return LONG_DIGIT_PATTERN.sub(REDACTED_LABEL, text)


def full_redaction(text: str) -> str:
    """
    Apply all redaction passes.

    Order matters: Aadhaar first (most specific), then PAN, then generic.
    """
    text = redact_aadhaar(text)
    text = redact_pan(text)
    text = redact_long_ids(text)
    return text


def redact_dict(data: dict) -> dict:
    """
    Recursively walk a dict and redact string values.
    Returns a new dict — does NOT mutate the original.
    """
    cleaned: dict = {}
    for key, value in data.items():
        if isinstance(value, str):
            cleaned[key] = full_redaction(value)
        elif isinstance(value, dict):
            cleaned[key] = redact_dict(value)
        elif isinstance(value, list):
            cleaned[key] = [
                redact_dict(item) if isinstance(item, dict)
                else full_redaction(item) if isinstance(item, str)
                else item
                for item in value
            ]
        else:
            cleaned[key] = value
    return cleaned
