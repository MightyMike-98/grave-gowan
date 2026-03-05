-- =============================================================================
-- Migration 010: Pending Invites — user_id nullable machen
--
-- Erlaubt es, jemanden per E-Mail einzuladen, auch wenn die Person noch
-- keinen Supabase-Account hat. In dem Fall ist user_id = NULL und
-- invited_email enthält die E-Mail-Adresse.
--
-- Wenn die Person sich später registriert, wird user_id nachgetragen.
-- =============================================================================

-- 1. user_id nullable machen
ALTER TABLE memorial_members ALTER COLUMN user_id DROP NOT NULL;

-- 2. UNIQUE constraint aktualisieren: erlaubt jetzt (memorial_id, invited_email) als Alternative
--    zum bisherigen (memorial_id, user_id)
-- Neuer Partial Index für pending Invites: ein memorial_id + invited_email Paar ist einzigartig
CREATE UNIQUE INDEX IF NOT EXISTS memorial_members_pending_email_idx
    ON memorial_members (memorial_id, invited_email)
    WHERE user_id IS NULL;

-- 3. INSERT Policy aktualisieren: erlaubt auch pending Invites (user_id IS NULL)
DROP POLICY IF EXISTS "memorial_members_insert" ON memorial_members;
CREATE POLICY "memorial_members_insert"
    ON memorial_members FOR INSERT
    WITH CHECK (
        is_memorial_owner(memorial_id) 
        OR (
            role = 'owner' AND user_id = auth.uid()
        )
    );
