-- =============================================================================
-- Migration 028: country Spalte zu memorials hinzufügen
--
-- Speichert das Herkunftsland der verstorbenen Person (z.B. "USA", "Deutschland").
-- Nur der Creator (Owner) kann dieses Feld setzen.
-- =============================================================================

ALTER TABLE memorials
    ADD COLUMN IF NOT EXISTS country TEXT;

COMMENT ON COLUMN memorials.country IS 'Herkunftsland der verstorbenen Person';

-- -----------------------------------------------------------------------
-- RPC aktualisieren: country in get_memorial_by_slug aufnehmen
-- -----------------------------------------------------------------------
DROP FUNCTION IF EXISTS get_memorial_by_slug(TEXT);

CREATE OR REPLACE FUNCTION get_memorial_by_slug(p_slug TEXT)
RETURNS TABLE (
    id UUID,
    slug TEXT,
    owner_id UUID,
    name TEXT,
    date_of_birth TEXT,
    date_of_death TEXT,
    bio TEXT,
    quote TEXT,
    cover_url TEXT,
    portrait_url TEXT,
    theme TEXT,
    is_public BOOLEAN,
    timeline JSONB,
    support_title TEXT,
    support_url TEXT,
    support_desc TEXT,
    country TEXT,
    candle_count INTEGER,
    flower_count INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    SELECT id, slug, owner_id, name,
           date_of_birth, date_of_death, bio, quote,
           cover_url, portrait_url, theme, is_public,
           timeline, support_title, support_url, support_desc,
           country,
           candle_count, flower_count,
           created_at, updated_at
    FROM memorials m
    WHERE m.slug = p_slug
    LIMIT 1;
$$;
