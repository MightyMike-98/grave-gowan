-- =============================================================================
-- Migration 022: memorial_stories.relation — Beziehung des Autors zum Verstorbenen
-- Ausführen in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- Ergänzt die Tabelle memorial_stories um die Spalte "relation".
-- Erlaubte Schlüssel (vom Frontend gesendet):
--   family, friend, colleague, fan, acquaintance, other
--
-- Spalte ist NULLABLE, damit Altbestände ohne Beziehung weiter existieren dürfen.
-- Neu abgesendete Stories setzen den Wert immer (vom UI erzwungen).
-- =============================================================================

ALTER TABLE memorial_stories
    ADD COLUMN IF NOT EXISTS relation TEXT;
