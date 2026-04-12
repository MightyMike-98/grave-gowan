-- =============================================================================
-- Migration 033: Eingeladener darf seine eigene Pending-Einladung annehmen
--
-- PROBLEM:
-- Seit Migration 030 läuft der Invite-Flow über invite_status = 'pending'.
-- Wenn der Eingeladene auf "Einladung annehmen" klickt, muss die API:
--   1. die memorial_members-Zeile SELECTen (um zu prüfen, ob sie existiert)
--   2. sie UPDATEn (invite_status → 'accepted', user_id → auth.uid())
--
-- Die bestehenden RLS-Policies blockieren beides:
--   - memorial_members_select nutzt is_memorial_member(), welches
--     invite_status = 'accepted' verlangt. Pending-Zeilen sind damit
--     unsichtbar, selbst für den Eingeladenen selbst.
--   - memorial_members_update aus 029 erlaubt Updates nur wenn
--     user_id IS NULL. Die neue Invite-Route setzt user_id aber bereits
--     beim Insert (wenn das Konto existiert).
--
-- LÖSUNG:
-- Beide Policies erweitern, sodass der Eingeladene seine eigene Zeile
-- sehen und updaten darf — erkannt über user_id ODER invited_email.
-- =============================================================================

-- 1. SELECT: Eigene Einladungs-Zeile ist immer sichtbar
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
        -- Eigene Zeile per user_id (direkt bei Invite verknüpft)
        user_id = auth.uid()
        -- Oder eigene Zeile per invited_email (wenn user_id beim Insert noch null war)
        OR (user_id IS NULL AND invited_email = LOWER(COALESCE(auth.jwt() ->> 'email', '')))
        -- Oder der Owner darf alle Member-Zeilen ändern
        OR is_memorial_owner(memorial_id)
    )
    WITH CHECK (
        -- Nach dem Update muss user_id auf den eingeloggten User zeigen
        -- (gilt für "claim"-Fall; Owner-Updates gehen auch durch, da dort user_id unverändert bleibt)
        user_id = auth.uid()
        OR is_memorial_owner(memorial_id)
    );
