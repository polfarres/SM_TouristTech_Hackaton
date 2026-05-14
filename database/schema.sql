-- ============================================================
-- TouristTech - Cloud SQL (PostgreSQL) Schema
-- ============================================================
-- Run this script against your Cloud SQL instance to set up
-- the initial database structure.
-- ============================================================

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- Table: users
-- Stores the basic user identity.
-- In production, user_id could be tied to Firebase Auth UID
-- or Google Identity Platform.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    display_name  VARCHAR(255),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Table: user_preferences
-- Stores the dietary and language preferences per user.
-- One row per user (1-to-1 relationship).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_preferences (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    native_language     VARCHAR(10)  NOT NULL DEFAULT 'ca',   -- BCP-47 tag, e.g. 'ca', 'es', 'en', 'fr'
    dietary_restrictions TEXT[],                               -- e.g. ARRAY['gluten','lactose','nuts']
    allergies           TEXT[],                                -- e.g. ARRAY['shellfish','peanuts']
    extra_notes         TEXT,                                  -- Free-text notes (e.g. "strict vegan")
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_preferences_user UNIQUE (user_id)
);

-- ------------------------------------------------------------
-- Table: analysis_history
-- Keeps a log of every menu/sign analysis performed.
-- The Cloud Function writes a row here after finishing.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analysis_history (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_gcs_url     TEXT NOT NULL,          -- gs://bucket/path/to/image.jpg
    ocr_raw_text      TEXT,                   -- Raw text from Cloud Vision OCR
    gemini_result     TEXT,                   -- Filtered/recommended text from Gemini
    translated_text   TEXT,                   -- Final translated text
    audio_gcs_url     TEXT,                   -- gs://bucket/path/to/audio.mp3
    audio_public_url  TEXT,                   -- Public HTTPS URL for the audio player
    source_language   VARCHAR(10),            -- Detected source language BCP-47
    target_language   VARCHAR(10),            -- User's native language BCP-47
    status            VARCHAR(30) NOT NULL DEFAULT 'pending',
                                              -- 'pending' | 'processing' | 'done' | 'error'
    error_message     TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Indexes for common queries
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id
    ON user_preferences (user_id);

CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id
    ON analysis_history (user_id);

CREATE INDEX IF NOT EXISTS idx_analysis_history_created_at
    ON analysis_history (created_at DESC);

-- ------------------------------------------------------------
-- Helper function: auto-update updated_at on row changes
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_analysis_history_updated_at
    BEFORE UPDATE ON analysis_history
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- Seed data (optional - for local dev / demo)
-- ------------------------------------------------------------
INSERT INTO users (id, email, display_name) VALUES
    ('a1b2c3d4-0000-0000-0000-000000000001', 'demo@touristtech.app', 'Demo User')
ON CONFLICT DO NOTHING;

INSERT INTO user_preferences (user_id, native_language, dietary_restrictions, allergies, extra_notes) VALUES
    ('a1b2c3d4-0000-0000-0000-000000000001', 'ca', ARRAY['gluten'], ARRAY['peanuts'], 'Prefereixo opcions veganes')
ON CONFLICT DO NOTHING;
