-- =============================================================================
-- Migration 012: RPC-Funktion für Memorial-Seite (Slug-Lookup ohne RLS)
--
-- Problem: Eingeladene Besucher (Pending Invites) haben kein auth.uid(),
-- deshalb blockiert die RLS-Policy auf memorials den SELECT.
-- Die Memorial-Seite zeigt dann 404.
--
-- Lösung: Eine SECURITY DEFINER Funktion, die ein Memorial per Slug lädt,
-- unabhängig von RLS. Die eigentliche Zugangskontrolle erfolgt auf
-- Anwendungsebene (nur wer den Slug kennt, kommt rein).
-- =============================================================================

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
           candle_count, flower_count,
           created_at, updated_at
    FROM memorials m
    WHERE m.slug = p_slug
    LIMIT 1;
$$;
