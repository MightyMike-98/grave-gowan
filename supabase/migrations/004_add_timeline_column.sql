-- =============================================================================
-- Migration 004: Timeline JSONB Spalte
-- Ausführen in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- Speichert Timeline-Events direkt im Memorial als JSONB Array.
-- Format: [{"year": "1989", "title": "Born", "description": "..."}, ...]
-- =============================================================================

ALTER TABLE memorials
    ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]'::jsonb;
