-- =============================================================================
-- Migration 015: RPC zum Laden der Memorial-Daten für Guest-Editoren
--
-- Gibt die Memorial-Daten zurück, wenn die angegebene E-Mail als Editor
-- oder Owner in memorial_members eingetragen ist.
-- SECURITY DEFINER: umgeht RLS damit es auch ohne Login funktioniert.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_memorial_for_editor(
    p_email       TEXT,
    p_memorial_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_role TEXT;
    v_memorial JSONB;
BEGIN
    -- Prüfen ob die E-Mail als Editor oder Owner eingetragen ist
    SELECT role INTO v_role
    FROM memorial_members
    WHERE memorial_id = p_memorial_id
      AND invited_email = p_email
      AND role IN ('editor', 'owner')
    LIMIT 1;

    IF v_role IS NULL THEN
        RETURN NULL; -- Keine Berechtigung
    END IF;

    -- Memorial-Daten als JSONB zurückgeben
    SELECT to_jsonb(m) INTO v_memorial
    FROM memorials m
    WHERE m.id = p_memorial_id;

    RETURN v_memorial;
END;
$$;
