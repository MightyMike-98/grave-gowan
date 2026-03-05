-- =============================================================================
-- Migration 011: RPC-Funktion für Visit-Memorial-Lookup
--
-- Problem: RLS auf memorial_members erlaubt SELECT nur für eingeloggte User.
-- Aber die Visit-Seite muss auch für nicht-eingeloggte Besucher funktionieren,
-- die nur ihre E-Mail und die Memorial-ID kennen.
--
-- Lösung: Eine SECURITY DEFINER Funktion, die RLS umgeht und direkt prüft,
-- ob eine E-Mail zu einem Memorial eingeladen ist. Gibt den Slug zurück.
-- =============================================================================

CREATE OR REPLACE FUNCTION find_memorial_by_email_and_id(
    p_email TEXT,
    p_memorial_id UUID
)
RETURNS TABLE (slug TEXT, name TEXT, is_public BOOLEAN)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    SELECT m.slug, m.name, m.is_public
    FROM memorial_members mm
    JOIN memorials m ON m.id = mm.memorial_id
    WHERE mm.memorial_id = p_memorial_id
      AND mm.invited_email = p_email
    LIMIT 1;
$$;
