-- =============================================================================
-- Migration 008: Fix Infinite Recursion (42P17)
--
-- PROBLEM:
-- PostgreSQL meldet "infinite recursion detected in policy for relation
-- memorial_members". 
-- Warum?
-- 1. memorials "select_own_or_public" prüft: EXISTS(SELECT 1 FROM memorial_members wo memorial_id = id ...)
-- 2. memorial_members "members_select" prüft: EXISTS(SELECT 1 FROM memorial_members wo memorial_id = id ...)
-- 3. Jemand macht ein SELECT auf memorials -> triggert memorial_members -> triggert
--    wieder memorial_members -> Endlose Rekursion.
--
-- LÖSUNG:
-- Die "members_select" Policy auf memorial_members vereinfachen.
-- Anstatt auf sich selbst zu joinen (ein SUBSELECT auf memorial_members),
-- prüfen wir einfach: Gibt es eine Zeile in memorial_members wo user_id = auth.uid()
-- für die Gedenkseite? Ja, PostgreSQL kann das ohne Subselect prüfen!
-- =============================================================================

-- 1. Die rekursive Policy entfernen
DROP POLICY IF EXISTS "members_select" ON memorial_members;

-- 2. Neue, einfache Policy ohne Subselect auf die gleiche Tabelle:
-- "Ein User darf die Zeile sehen, wenn er selbst in dieser Zeile steht 
-- ODER er ist Owner des Memorials."
CREATE POLICY "members_select"
    ON memorial_members FOR SELECT
    USING (
        user_id = auth.uid()
        OR 
        EXISTS (
            SELECT 1 FROM memorials m 
            WHERE m.id = memorial_members.memorial_id 
              AND m.owner_id = auth.uid()
        )
    );

-- 3. Insert-Policy auch nochmal absichern (nur zur Sicherheit)
DROP POLICY IF EXISTS "members_insert" ON memorial_members;
CREATE POLICY "members_insert"
    ON memorial_members FOR INSERT
    WITH CHECK (
        -- Jeder eingeloggte User darf sich selbst als Owner eintragen (nur bei Erstellung seines eigenen Memorials)
        (
            memorial_members.user_id = auth.uid()
            AND memorial_members.role = 'owner'
            AND EXISTS (
                SELECT 1 FROM memorials m
                WHERE m.id = memorial_members.memorial_id
                  AND m.owner_id = auth.uid()
            )
        )
        OR
        -- Ein existierender Owner darf jemanden einladen
        EXISTS (
            SELECT 1 FROM memorial_members mm
            WHERE mm.memorial_id = memorial_members.memorial_id
              AND mm.user_id = auth.uid()
              AND mm.role = 'owner'
        )
    );
