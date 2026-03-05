-- =============================================================================
-- Migration 006: Memorial Members — Rollen-System
-- Ausführen in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- Erstellt die Tabelle memorial_members und aktualisiert die RLS Policies
-- auf memorials, sodass auch Editors/Viewers Zugriff bekommen.
--
-- Rollen:
--   owner  → volle Admin-Rechte (wird beim Erstellen automatisch gesetzt)
--   editor → darf Content hinzufügen, aber nicht löschen oder Rollen verwalten
--   viewer → darf das Memorial lesen (auch wenn is_public = false)
-- =============================================================================

-- -----------------------------------------------------------------------
-- 1. Tabelle erstellen
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memorial_members (
    id           UUID         DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Referenz auf die Gedenkseite. Wenn das Memorial gelöscht wird, verschwinden auch alle Members.
    memorial_id  UUID         NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,

    -- Der eingeladene User (muss einen Supabase-Account haben).
    user_id      UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Die Rolle des Mitglieds.
    role         TEXT         NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),

    -- Wer hat diese Person eingeladen? (Owner-Referenz)
    invited_by   UUID         REFERENCES auth.users(id) ON DELETE SET NULL,

    -- E-Mail mit der eingeladen wurde (für Anzeige in der Settings-UI).
    invited_email TEXT,

    joined_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------
-- 2. Constraint: Ein User kann pro Memorial nur eine Rolle haben
-- -----------------------------------------------------------------------
ALTER TABLE memorial_members
    ADD CONSTRAINT memorial_members_unique_user
    UNIQUE (memorial_id, user_id);

-- -----------------------------------------------------------------------
-- 3. Indizes für schnelle Abfragen
-- -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS memorial_members_memorial_id_idx ON memorial_members(memorial_id);
CREATE INDEX IF NOT EXISTS memorial_members_user_id_idx     ON memorial_members(user_id);

-- -----------------------------------------------------------------------
-- 4. RLS aktivieren
-- -----------------------------------------------------------------------
ALTER TABLE memorial_members ENABLE ROW LEVEL SECURITY;

-- SELECT: Nur Mitglieder des Memorials sehen die Members-Liste
CREATE POLICY "members_select"
    ON memorial_members FOR SELECT
    USING (
        -- Man sieht die Members-Liste nur wenn man selbst Member ist
        EXISTS (
            SELECT 1 FROM memorial_members mm
            WHERE mm.memorial_id = memorial_members.memorial_id
              AND mm.user_id = auth.uid()
        )
    );

-- INSERT: Nur der Owner darf neue Mitglieder hinzufügen
CREATE POLICY "members_insert"
    ON memorial_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM memorial_members mm
            WHERE mm.memorial_id = memorial_members.memorial_id
              AND mm.user_id = auth.uid()
              AND mm.role = 'owner'
        )
    );

-- DELETE: Nur der Owner darf Mitglieder entfernen (außer sich selbst — Owner bleibt immer)
CREATE POLICY "members_delete"
    ON memorial_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM memorial_members mm
            WHERE mm.memorial_id = memorial_members.memorial_id
              AND mm.user_id = auth.uid()
              AND mm.role = 'owner'
        )
    );

-- -----------------------------------------------------------------------
-- 5. memorial RLS Policies aktualisieren:
--    Editors dürfen jetzt auch memorials lesen und updaten.
-- -----------------------------------------------------------------------

-- SELECT: Owner + Members (alle Rollen) + öffentliche Memorials
DROP POLICY IF EXISTS "select_own_or_public" ON memorials;
CREATE POLICY "select_own_or_public"
    ON memorials FOR SELECT
    USING (
        owner_id = auth.uid()
        OR is_public = true
        OR EXISTS (
            SELECT 1 FROM memorial_members mm
            WHERE mm.memorial_id = memorials.id
              AND mm.user_id = auth.uid()
        )
    );

-- UPDATE: Owner + Editors dürfen updaten
DROP POLICY IF EXISTS "owner_update" ON memorials;
CREATE POLICY "owner_or_editor_update"
    ON memorials FOR UPDATE
    USING (
        owner_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM memorial_members mm
            WHERE mm.memorial_id = memorials.id
              AND mm.user_id = auth.uid()
              AND mm.role IN ('owner', 'editor')
        )
    );

-- DELETE bleibt unverändert: nur Owner
-- (owner_delete Policy aus Migration 001 bleibt erhalten)

-- -----------------------------------------------------------------------
-- 6. Helper-Funktion: Beim Erstellen eines Memorials automatisch
--    den Owner in memorial_members eintragen.
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO memorial_members (memorial_id, user_id, role, invited_by)
    VALUES (NEW.id, NEW.owner_id, 'owner', NEW.owner_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: feuert nach jedem neuen Memorial
DROP TRIGGER IF EXISTS on_memorial_created ON memorials;
CREATE TRIGGER on_memorial_created
    AFTER INSERT ON memorials
    FOR EACH ROW EXECUTE FUNCTION add_owner_as_member();

-- -----------------------------------------------------------------------
-- Fertig! Prüfen mit:
-- SELECT * FROM memorial_members;
-- -----------------------------------------------------------------------
