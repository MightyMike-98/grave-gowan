-- =============================================================================
-- Migration 020: Memorial Stories — Gästebuch-Einträge für Gedenkseiten
-- Ausführen in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- Erstellt die Tabelle memorial_stories, in der alle Gästebuch-Einträge
-- (Stories) einer Gedenkseite gespeichert werden.
-- Favorisierte Stories erscheinen im Highlights-Tab.
--
-- Moderationssystem:
--   Stories von Editoren/Ownern → status 'approved' (sofort sichtbar)
--   Stories von Besuchern (Visit Memorial) → status 'pending' (Server Action)
--
-- Berechtigungen (unveraendert):
--   SELECT → öffentlich (jeder darf Stories lesen)
--   INSERT → jeder authentifizierte Nutzer (Besucher dürfen schreiben)
--   UPDATE → Owner + Editor (Favoriten-Status toggeln)
--   DELETE → nur Owner (darf Stories entfernen)
-- =============================================================================

-- -----------------------------------------------------------------------
-- 0. Falls Tabelle bereits existiert: status-Spalte nachrüsten
--    Bestehende Stories bekommen 'approved' (waren ja schon sichtbar).
-- -----------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memorial_stories')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memorial_stories' AND column_name = 'status')
    THEN
        ALTER TABLE memorial_stories ADD COLUMN status TEXT NOT NULL DEFAULT 'approved'
            CHECK (status IN ('pending', 'approved'));

        CREATE INDEX IF NOT EXISTS idx_memorial_stories_pending
            ON memorial_stories(memorial_id) WHERE status = 'pending';
    END IF;
END $$;

-- -----------------------------------------------------------------------
-- 1. Tabelle erstellen (nur wenn sie noch nicht existiert)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memorial_stories (
    id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Referenz auf die Gedenkseite.
    memorial_id UUID         NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,

    -- Name des Autors (Freitext — auch Gäste ohne Account können schreiben).
    author      TEXT         NOT NULL,

    -- Der eigentliche Erinnerungstext.
    text        TEXT         NOT NULL,

    -- Ob diese Story im Highlights-Tab angezeigt werden soll.
    is_favorite BOOLEAN      NOT NULL DEFAULT false,

    -- Moderationsstatus: Besucher-Stories kommen als 'pending'
    status      TEXT         NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),

    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------
-- 2. Indizes
-- -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_memorial_stories_memorial
    ON memorial_stories(memorial_id);

CREATE INDEX IF NOT EXISTS idx_memorial_stories_favorites
    ON memorial_stories(memorial_id) WHERE is_favorite = true;

CREATE INDEX IF NOT EXISTS idx_memorial_stories_pending
    ON memorial_stories(memorial_id) WHERE status = 'pending';

-- -----------------------------------------------------------------------
-- 3. RLS aktivieren
-- -----------------------------------------------------------------------
ALTER TABLE memorial_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memorial_stories_select" ON memorial_stories;
DROP POLICY IF EXISTS "memorial_stories_insert" ON memorial_stories;
DROP POLICY IF EXISTS "memorial_stories_update" ON memorial_stories;
DROP POLICY IF EXISTS "memorial_stories_delete" ON memorial_stories;

-- SELECT: Jeder darf Stories lesen
CREATE POLICY "memorial_stories_select"
    ON memorial_stories FOR SELECT
    USING (true);

-- INSERT: Jeder eingeloggte Nutzer darf eine Story schreiben
CREATE POLICY "memorial_stories_insert"
    ON memorial_stories FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Owner und Editoren dürfen Favoriten-Status ändern
CREATE POLICY "memorial_stories_update"
    ON memorial_stories FOR UPDATE
    USING (is_memorial_editor_or_owner(memorial_id));

-- DELETE: Nur der Owner darf Stories entfernen
CREATE POLICY "memorial_stories_delete"
    ON memorial_stories FOR DELETE
    USING (is_memorial_owner(memorial_id));

-- -----------------------------------------------------------------------
-- Fertig! Prüfen mit:
-- SELECT * FROM memorial_stories;
-- -----------------------------------------------------------------------
