-- =============================================================================
-- Migration 005: Alle fehlenden Spalten auf einmal hinzufügen
-- Ausführen in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- Fügt hinzu:
-- 1. timeline      JSONB   (Life Journey Events)
-- 2. support_title TEXT    (Name der Spendenorganisation)
-- 3. support_url   TEXT    (Link zur Spendenorganisation)
-- 4. support_desc  TEXT    (Kurzbeschreibung)
-- =============================================================================

-- Timeline (falls 004 schon gelaufen ist, passiert hier nichts)
ALTER TABLE memorials
    ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]'::jsonb;

-- Support/Donations
ALTER TABLE memorials
    ADD COLUMN IF NOT EXISTS support_title TEXT;

ALTER TABLE memorials
    ADD COLUMN IF NOT EXISTS support_url TEXT;

ALTER TABLE memorials
    ADD COLUMN IF NOT EXISTS support_desc TEXT;
