-- =============================================================================
-- Migration 013: RPC für Visitor-Rolle per E-Mail
--
-- Gibt die Rolle eines Besuchers in einem Memorial zurück,
-- anhand seiner E-Mail-Adresse (z.B. als pending invite gespeichert).
-- SECURITY DEFINER: umgeht RLS damit es auch ohne Login funktioniert.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_visitor_role_by_email(
    p_email TEXT,
    p_memorial_id UUID
)
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    SELECT role FROM memorial_members
    WHERE memorial_id = p_memorial_id
      AND invited_email = p_email
    LIMIT 1;
$$;
