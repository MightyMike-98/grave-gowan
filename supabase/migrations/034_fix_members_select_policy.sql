-- =============================================================================
-- Migration 034: Fix für memorial_members SELECT-Policy
--
-- PROBLEM:
-- Migration 033 hat die SELECT-Policy erweitert, um eigene Pending-Einladungen
-- sichtbar zu machen. Der Email-Check griff dort direkt auf auth.users zu:
--
--     invited_email = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
--
-- Authentifizierte Rollen haben auf auth.users aber keinen SELECT-Grant, was
-- beim Evaluieren der Policy einen Permission-Denied-Fehler wirft. Da die
-- Dashboard-Query auf memorial_members diese Policy triggert, schlägt der
-- komplette SELECT fehl → "Could not load shared memorials" mit leerem Error.
--
-- LÖSUNG:
-- Email über auth.jwt() ->> 'email' auslesen statt über auth.users. Das ist
-- der von Supabase empfohlene Pattern und braucht keine Table-Grants.
-- UPDATE-Policy analog umschreiben.
-- =============================================================================

-- 1. SELECT: Eigene Zeile über user_id oder über JWT-Email
DROP POLICY IF EXISTS "memorial_members_select" ON memorial_members;
CREATE POLICY "memorial_members_select"
    ON memorial_members FOR SELECT
    USING (
        is_memorial_member(memorial_id)
        OR user_id = auth.uid()
        OR invited_email = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
    );

-- 2. UPDATE: Eingeladener darf seine eigene Zeile annehmen
DROP POLICY IF EXISTS "memorial_members_update" ON memorial_members;
CREATE POLICY "memorial_members_update"
    ON memorial_members FOR UPDATE
    USING (
        user_id = auth.uid()
        OR (user_id IS NULL AND invited_email = LOWER(COALESCE(auth.jwt() ->> 'email', '')))
        OR is_memorial_owner(memorial_id)
    )
    WITH CHECK (
        user_id = auth.uid()
        OR is_memorial_owner(memorial_id)
    );
