"""
Supabase Storage Client

Handles file uploads to the Supabase 'documents' storage bucket.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime

# pyrefly: ignore [missing-import]
from supabase import create_client, Client

from app.config import get_settings

logger = logging.getLogger(__name__)

BUCKET_NAME = "documents"

import io

def _get_supabase() -> Client | None:
    """Create a Supabase client using service role key for storage operations."""
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        logger.warning("Supabase URL or Key is missing. Upload is disabled.")
        return None
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


async def upload_document(
    file_bytes: bytes,
    original_filename: str,
    mime_type: str = "image/jpeg",
) -> dict:
    """
    Upload a document file to the Supabase 'documents' storage bucket.
    """
    upload_id = uuid.uuid4().hex[:12]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    ext = original_filename.rsplit(".", 1)[-1] if "." in original_filename else "jpg"
    storage_path = f"uploads/{timestamp}_{upload_id}.{ext}"

    supabase = _get_supabase()
    if not supabase:
        return {
            "path": "",
            "public_url": "",
            "upload_id": upload_id,
            "error": "Supabase credentials missing",
        }

    try:
        # Wrap bytes in BytesIO for safer compatibility with older storage3 versions
        file_obj = io.BytesIO(file_bytes)
        result = supabase.storage.from_(BUCKET_NAME).upload(
            path=storage_path,
            file=file_obj,
            file_options={"content-type": mime_type},
        )

        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(storage_path)

        logger.info("Uploaded document to %s", storage_path)

        return {
            "path": storage_path,
            "public_url": public_url,
            "upload_id": upload_id,
        }

    except Exception as e:
        logger.error("Failed to upload document: %s", str(e))
        return {
            "path": "",
            "public_url": "",
            "upload_id": upload_id,
            "error": str(e),
        }

async def save_citizen_profile(profile_data: dict) -> dict:
    """Save a citizen profile to the database."""
    supabase = _get_supabase()
    if not supabase:
        return {}

    saved_record = {}

    # 1. Primary insert: 'citizens' table (active in Supabase)
    try:
        citizen_record = {
            "session_id": str(uuid.uuid4()),
            "preferred_language": profile_data.get("language") or "en",
            "accessibility_mode": "elder" if profile_data.get("elder_mode") else "standard",
            "extracted_name": profile_data.get("full_name") or profile_data.get("name") or "Citizen",
            "extracted_income": int(profile_data.get("annual_income") or 0),
            "extracted_category": profile_data.get("category") or "General",
        }
        res_citizens = supabase.table("citizens").insert(citizen_record).execute()
        if res_citizens.data:
            saved_record = res_citizens.data[0]
            logger.info("Successfully saved citizen to 'citizens' table: %s", saved_record.get("id"))
    except Exception as e:
        logger.error("Failed to save to 'citizens' table: %s", str(e))

    # 2. Secondary insert: 'citizen_profiles' table (if created via schema.sql)
    try:
        response = supabase.table("citizen_profiles").insert(profile_data).execute()
        if response.data:
            saved_record = response.data[0]
            logger.info("Successfully saved citizen to 'citizen_profiles' table: %s", saved_record.get("id"))
    except Exception as e:
        logger.debug("Optional citizen_profiles insert: %s", str(e))

    return saved_record

