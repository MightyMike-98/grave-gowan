-- =============================================================================
-- Migration 029: Fix access for invited members who registered after invite
--
-- PROBLEM: When a user is invited by email before they have an account,
-- the memorial_members row has user_id = NULL and invited_email set.
-- The DB trigger (018) should set user_id on registration, but:
-- 1. RLS SELECT policy only checks user_id, so the row is invisible
-- 2. No UPDATE policy exists, so the app can't backfill user_id either
--
-- SOLUTION:
-- 1. Update is_memorial_member() to also check invited_email
-- 2. Add UPDATE policy so users can claim their own invited rows
-- 3. Backfill any existing unclaimed invites
-- =============================================================================

-- 1. Update is_memorial_member to also match by invited_email
CREATE OR REPLACE FUNCTION is_memorial_member(m_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM memorial_members WHERE memorial_id = m_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM memorials WHERE id = m_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM memorial_members
    WHERE memorial_id = m_id
      AND user_id IS NULL
      AND invited_email = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  );
$$;

-- 2. Add UPDATE policy: users can claim their own invited rows
DROP POLICY IF EXISTS "memorial_members_update" ON memorial_members;
CREATE POLICY "memorial_members_update"
    ON memorial_members FOR UPDATE
    USING (
        -- User can update rows where their email matches the invite
        (user_id IS NULL AND invited_email = LOWER((SELECT email FROM auth.users WHERE id = auth.uid())))
        -- Or owner can update any member row
        OR is_memorial_owner(memorial_id)
    )
    WITH CHECK (
        -- When claiming, user_id must be set to the authenticated user
        user_id = auth.uid()
    );

-- 3. Delete orphaned invite rows where user already has a proper membership
DELETE FROM memorial_members orphan
USING auth.users u, memorial_members existing
WHERE LOWER(u.email) = LOWER(orphan.invited_email)
  AND orphan.user_id IS NULL
  AND existing.memorial_id = orphan.memorial_id
  AND existing.user_id = u.id
  AND existing.id != orphan.id;

-- 4. Backfill remaining unclaimed invites (no conflict possible now)
UPDATE memorial_members mm
SET user_id = u.id
FROM auth.users u
WHERE LOWER(u.email) = LOWER(mm.invited_email)
  AND mm.user_id IS NULL;
