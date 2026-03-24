-- =============================================================================
-- Migration 011: RPC-Funktion für Visit-Memorial-Lookup
--
-- Problem: RLS auf memorial_members erlaubt SELECT nur für eingeloggte User.
-- Aber die Visit-Seite muss auch für nicht-eingeloggte Besucher funktionieren,
-- die nur ihre E-Mail und die Memorial-ID kennen.
--
-- Lösung: Eine SECURITY DEFINER Funktion, die RLS umgeht und direkt prüft,
-- ob eine E-Mail zu einem Memorial eingeladen ist ODER der Owner ist.
-- Gibt den Slug zurück.
-- =============================================================================

CREATE OR REPLACE FUNCTION find_memorial_by_email_and_id(
    p_email TEXT,
    p_memorial_id UUID
)
RETURNS TABLE (slug TEXT, name TEXT, is_public BOOLEAN)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    -- 1. Suche in memorial_members (eingeladene Viewer/Editors)
    SELECT m.slug, m.name, m.is_public
    FROM memorial_members mm
    JOIN memorials m ON m.id = mm.memorial_id
    WHERE mm.memorial_id = p_memorial_id
      AND LOWER(mm.invited_email) = LOWER(p_email)

    UNION ALL

    -- 2. Suche ueber Owner (Creator des Memorials)
    SELECT m.slug, m.name, m.is_public
    FROM memorials m
    JOIN auth.users u ON u.id = m.owner_id
    WHERE m.id = p_memorial_id
      AND LOWER(u.email) = LOWER(p_email)

    LIMIT 1;
$$;
