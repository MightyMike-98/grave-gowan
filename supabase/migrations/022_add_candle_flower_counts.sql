-- =============================================================================
-- Migration 022: Kerzen- und Blumenzähler für Gedenkseiten
-- Ausführen in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- Fügt candle_count und flower_count zur memorials-Tabelle hinzu.
-- Jeder Besucher (auch anonym) kann Kerzen/Blumen hinzufügen.
-- =============================================================================

-- Spalten hinzufügen (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memorials' AND column_name = 'candle_count') THEN
        ALTER TABLE memorials ADD COLUMN candle_count INTEGER NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memorials' AND column_name = 'flower_count') THEN
        ALTER TABLE memorials ADD COLUMN flower_count INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- RPC: Kerze anzünden (jeder darf, auch anon)
CREATE OR REPLACE FUNCTION increment_candle(p_memorial_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
    UPDATE memorials SET candle_count = candle_count + 1 WHERE id = p_memorial_id;
$$;

-- RPC: Blume niederlegen (jeder darf, auch anon)
CREATE OR REPLACE FUNCTION increment_flower(p_memorial_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
    UPDATE memorials SET flower_count = flower_count + 1 WHERE id = p_memorial_id;
$$;
