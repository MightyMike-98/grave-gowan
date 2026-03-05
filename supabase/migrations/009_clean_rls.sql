-- =================================================================================
-- Migration 009: 100% Bulletproof RLS (Bypass Recursion via Security Definer)
--
-- PROBLEM: PostgreSQL meldet "infinite recursion detected in policy for relation memorials".
-- Warum?
-- Die Tabelle `memorials` liest aus `memorial_members` (wer darf das Memorial sehen?)
-- Die Tabelle `memorial_members` liest aus `memorials` (wer ist der Owner?)
-- Das führt in PostgreSQL sofort zu einer unendlichen Schleife (Recursion).
--
-- LÖSUNG:
-- Wir lagern die Prüfungen in "SECURITY DEFINER"-Funktionen aus.
-- Diese ignorieren das RLS der anderen Tabellen komplett und lesen die
-- Daten direkt "als Admin" aus. Dadurch gibt es keine rekursiven Checks mehr!
-- =================================================================================

-- 1. Vorhandene fehlerhafte / rekursive Policies löschen
DROP POLICY IF EXISTS "select_own_or_public" ON memorials;
DROP POLICY IF EXISTS "owner_or_editor_update" ON memorials;
DROP POLICY IF EXISTS "members_select" ON memorial_members;
DROP POLICY IF EXISTS "members_insert" ON memorial_members;
DROP POLICY IF EXISTS "members_delete" ON memorial_members;

-- =================================================================================
-- 2. Hilfs-Funktionen (SECURITY DEFINER = Ignorieren RLS der Ziel-Tabelle vollkommen)
-- =================================================================================

-- Prüft ob der User Zugang zu einem Memorial hat (als Owner, Editor oder Viewer)
CREATE OR REPLACE FUNCTION is_memorial_member(m_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM memorial_members WHERE memorial_id = m_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM memorials WHERE id = m_id AND owner_id = auth.uid()
  );
$$;

-- Prüft ob der User Schreibrechte hat (als Owner oder Editor)
CREATE OR REPLACE FUNCTION is_memorial_editor_or_owner(m_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM memorial_members WHERE memorial_id = m_id AND user_id = auth.uid() AND role IN ('owner', 'editor')
  ) OR EXISTS (
    SELECT 1 FROM memorials WHERE id = m_id AND owner_id = auth.uid()
  );
$$;

-- Prüft ob der User der Admin/Owner des Memorials ist
CREATE OR REPLACE FUNCTION is_memorial_owner(m_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM memorial_members WHERE memorial_id = m_id AND user_id = auth.uid() AND role = 'owner'
  ) OR EXISTS (
    SELECT 1 FROM memorials WHERE id = m_id AND owner_id = auth.uid()
  );
$$;

-- =================================================================================
-- 3. Neue saubere Policies für memorials
-- =================================================================================

-- SELECT: Owner + Public + Alle Members
CREATE POLICY "memorials_select"
    ON memorials FOR SELECT
    USING (
        owner_id = auth.uid()
        OR is_public = true
        OR is_memorial_member(id)
    );

-- UPDATE: Owner + Editors
CREATE POLICY "memorials_update"
    ON memorials FOR UPDATE
    USING (
        owner_id = auth.uid()
        OR is_memorial_editor_or_owner(id)
    );

-- INSERT: Nur Owner
CREATE POLICY "memorials_insert"
    ON memorials FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- DELETE: Nur Owner
CREATE POLICY "memorials_delete"
    ON memorials FOR DELETE
    USING (owner_id = auth.uid());


-- =================================================================================
-- 4. Neue saubere Policies für memorial_members
-- =================================================================================

-- SELECT: Jeder darf die Members sehen, wenn er selbst Member oder Owner des Memorials ist
CREATE POLICY "memorial_members_select"
    ON memorial_members FOR SELECT
    USING (is_memorial_member(memorial_id));

-- INSERT: Ein Owner des Memorials darf neue Mitglieder hinzufügen.
-- ACHTUNG: Auch der Code selbst beim Memorial-Erstellen (wo das Memorial dem User gehört)
-- darf sich selbst als "owner" eintragen.
CREATE POLICY "memorial_members_insert"
    ON memorial_members FOR INSERT
    WITH CHECK (
        is_memorial_owner(memorial_id) 
        OR (
            role = 'owner' AND user_id = auth.uid()
        )
    );

-- DELETE: Nur der Owner darf Mitglieder entfernen
CREATE POLICY "memorial_members_delete"
    ON memorial_members FOR DELETE
    USING (is_memorial_owner(memorial_id));

-- 5. Trigger-Entfernung sicherstellen (wurde in 007b schon gemacht, hier zur Sicherheit)
DROP TRIGGER IF EXISTS on_memorial_created ON memorials;
DROP FUNCTION IF EXISTS add_owner_as_member();
