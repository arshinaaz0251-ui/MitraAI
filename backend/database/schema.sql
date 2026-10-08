CREATE TABLE IF NOT EXISTS citizen_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone_number TEXT NULL,
    masked_id TEXT NULL,
    annual_income NUMERIC NOT NULL,
    category TEXT NOT NULL,
    state TEXT DEFAULT 'Telangana',
    age INT NULL,
    is_student BOOLEAN DEFAULT FALSE,
    verification_status TEXT DEFAULT 'verified',
    document_url TEXT NULL,
    raw_metadata JSONB NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
