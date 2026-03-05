-- =============================================================================
-- Migration 014: RPC für Editor-Update ohne Auth-Session
--
-- Erlaubt einem eingeladenen Editor (identifiziert per E-Mail) bestimmte
-- Memorial-Felder zu aktualisieren, ohne dass er eingeloggt sein muss.
-- SECURITY DEFINER umgeht RLS. Die Editor-Berechtigung wird vorab geprüft.
-- =============================================================================

-- Alte TEXT-Version droppen (falls vorhanden) um Overload-Konflikte zu vermeiden
DROP FUNCTION IF EXISTS editor_update_memorial(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION editor_update_memorial(
    p_email       TEXT,
    p_memorial_id UUID,
    p_bio         TEXT DEFAULT NULL,
    p_date_of_birth DATE DEFAULT NULL,
    p_date_of_death DATE DEFAULT NULL,
    p_quote       TEXT DEFAULT NULL,
    p_timeline    JSONB DEFAULT NULL,
    p_support_title TEXT DEFAULT NULL,
    p_support_url   TEXT DEFAULT NULL,
    p_support_desc  TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Prüfen ob die E-Mail als Editor oder Owner in diesem Memorial eingetragen ist
    SELECT role INTO v_role
    FROM memorial_members
    WHERE memorial_id = p_memorial_id
      AND invited_email = p_email
      AND role IN ('editor', 'owner')
    LIMIT 1;

    IF v_role IS NULL THEN
        RETURN FALSE; -- Keine Berechtigung
    END IF;

    -- Nur editierbare Felder aktualisieren (Name und portrait_url sind Owner-only)
    UPDATE memorials SET
        bio             = COALESCE(p_bio, bio),
        date_of_birth   = COALESCE(p_date_of_birth, date_of_birth),
        date_of_death   = COALESCE(p_date_of_death, date_of_death),
        quote           = COALESCE(p_quote, quote),
        timeline        = COALESCE(p_timeline, timeline),
        support_title   = COALESCE(p_support_title, support_title),
        support_url     = COALESCE(p_support_url, support_url),
        support_desc    = COALESCE(p_support_desc, support_desc),
        updated_at      = NOW()
    WHERE id = p_memorial_id;

    RETURN TRUE;
END;
$$;
