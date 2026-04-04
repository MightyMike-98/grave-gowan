-- =============================================================================
-- Migration 030: Add invite_status to memorial_members
--
-- Invitations now start as 'pending' and become 'accepted' only after
-- the invited user clicks the confirmation link in their email.
-- Owner rows are always 'accepted'.
-- =============================================================================

-- 1. Add invite_status column
ALTER TABLE memorial_members
ADD COLUMN IF NOT EXISTS invite_status TEXT NOT NULL DEFAULT 'accepted';

-- 2. Set all existing non-owner rows with invited_email to 'accepted'
--    (they were added before this flow existed, so treat them as accepted)
-- No action needed — default is 'accepted' which covers existing rows.

-- 3. Update is_memorial_member to require accepted status for invited members
CREATE OR REPLACE FUNCTION is_memorial_member(m_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM memorial_members
    WHERE memorial_id = m_id AND user_id = auth.uid() AND invite_status = 'accepted'
  ) OR EXISTS (
    SELECT 1 FROM memorials WHERE id = m_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM memorial_members
    WHERE memorial_id = m_id
      AND user_id IS NULL
      AND invite_status = 'accepted'
      AND invited_email = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  );
$$;

-- 4. Update is_memorial_editor_or_owner to require accepted status
CREATE OR REPLACE FUNCTION is_memorial_editor_or_owner(m_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM memorial_members
    WHERE memorial_id = m_id AND user_id = auth.uid()
      AND role IN ('owner', 'editor') AND invite_status = 'accepted'
  ) OR EXISTS (
    SELECT 1 FROM memorials WHERE id = m_id AND owner_id = auth.uid()
  );
$$;
