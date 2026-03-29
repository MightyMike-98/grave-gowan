-- =============================================================================
-- Migration 025: Allow Self-Save/Unsave (Viewer-Rolle selbst verwalten)
--
-- PROBLEM: Die INSERT-Policy erlaubt nur Owners, neue Members hinzuzufügen.
-- Ein eingeloggter User kann sich daher NICHT selbst als Viewer speichern
-- (Save-Button auf der Gedenkseite).
-- Die DELETE-Policy erlaubt nur Owners das Löschen — Unsave funktioniert nicht.
--
-- FIX: Zusätzliche Bedingungen in den Policies:
-- INSERT: User darf sich selbst als 'viewer' eintragen
-- DELETE: User darf seine eigene 'viewer'-Mitgliedschaft entfernen
-- =============================================================================

-- 1. INSERT Policy ersetzen: Owner ODER Self-Save als Viewer
DROP POLICY IF EXISTS "memorial_members_insert" ON memorial_members;

CREATE POLICY "memorial_members_insert"
    ON memorial_members FOR INSERT
    WITH CHECK (
        -- Weg 1: Ein existierender Owner darf neue Mitglieder hinzufügen
        is_memorial_owner(memorial_id)
        OR (
            -- Weg 2: Beim Erstellen eines neuen Memorials darf sich der Owner
            -- selbst eintragen — aber NUR wenn er wirklich der Owner ist.
            role = 'owner'
            AND user_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM memorials WHERE id = memorial_id AND owner_id = auth.uid()
            )
        )
        OR (
            -- Weg 3: Jeder eingeloggte User darf sich selbst als Viewer speichern
            role = 'viewer'
            AND user_id = auth.uid()
        )
    );

-- 2. DELETE Policy ersetzen: Owner ODER eigene Viewer-Mitgliedschaft entfernen
DROP POLICY IF EXISTS "memorial_members_delete" ON memorial_members;

CREATE POLICY "memorial_members_delete"
    ON memorial_members FOR DELETE
    USING (
        -- Owner darf alle Members entfernen
        is_memorial_owner(memorial_id)
        OR (
            -- User darf seine eigene Viewer-Mitgliedschaft entfernen (Unsave)
            user_id = auth.uid()
            AND role = 'viewer'
        )
    );

-- 3. SELECT Policy: User muss auch eigene Viewer-Einträge lesen können
--    (is_memorial_member prüft schon auf memorial_members, funktioniert also
--     sobald der Viewer-Eintrag existiert — kein Update nötig)
