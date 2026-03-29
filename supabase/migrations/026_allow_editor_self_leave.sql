-- =============================================================================
-- Migration 026: Allow Editor Self-Leave
--
-- Editors können sich selbst aus einem Memorial entfernen (Rolle verlassen).
-- Erweitert die DELETE-Policy um editor self-delete.
-- =============================================================================

DROP POLICY IF EXISTS "memorial_members_delete" ON memorial_members;

CREATE POLICY "memorial_members_delete"
    ON memorial_members FOR DELETE
    USING (
        -- Owner darf alle Members entfernen
        is_memorial_owner(memorial_id)
        OR (
            -- User darf seine eigene Viewer- oder Editor-Mitgliedschaft entfernen
            user_id = auth.uid()
            AND role IN ('viewer', 'editor')
        )
    );
