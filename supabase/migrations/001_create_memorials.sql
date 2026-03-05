-- =============================================================================
-- Migration 001: memorials Tabelle mit RLS
-- Ausführen in: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================================

-- -----------------------------------------------------------------------
-- 1. Tabelle erstellen
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memorials (
    id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Wer hat dieses Memorial erstellt? Referenz auf den eingeloggten User.
    -- ON DELETE CASCADE: wenn der User seinen Account löscht, werden seine Memorials auch gelöscht.
    owner_id    UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- URL-freundlicher Identifier, z.B. "sarah-jenkins-1954". Muss einzigartig sein.
    slug        TEXT         NOT NULL UNIQUE,

    name        TEXT         NOT NULL,
    date_of_birth DATE,
    date_of_death DATE,
    bio         TEXT,
    quote       TEXT,
    cover_url   TEXT,
    portrait_url TEXT,

    -- Nur die definierten Themen erlaubt
    theme       TEXT         NOT NULL DEFAULT 'classic'
                             CHECK (theme IN ('classic', 'modern', 'nature')),

    -- Kontrolliert ob Besucher die Seite öffentlich aufrufen können
    is_public   BOOLEAN      NOT NULL DEFAULT false,

    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------
-- 2. Index auf owner_id für schnelle Dashboard-Abfragen
-- -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS memorials_owner_id_idx ON memorials(owner_id);

-- -----------------------------------------------------------------------
-- 3. Trigger: updated_at automatisch setzen bei jedem UPDATE
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER memorials_updated_at
    BEFORE UPDATE ON memorials
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------
-- 4. RLS aktivieren
-- Row Level Security: die DB filtert automatisch nach dem eingeloggten User.
-- Ohne diese Policies würde jede Abfrage 0 Zeilen zurückgeben (secure by default).
-- -----------------------------------------------------------------------
ALTER TABLE memorials ENABLE ROW LEVEL SECURITY;

-- SELECT: Ein User sieht NUR seine eigenen Memorials
CREATE POLICY "owner_select"
    ON memorials FOR SELECT
    USING (owner_id = auth.uid());

-- INSERT: Ein User darf nur Memorials erstellen, bei denen er selbst der owner ist
CREATE POLICY "owner_insert"
    ON memorials FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- UPDATE: Ein User darf nur seine eigenen Memorials bearbeiten
CREATE POLICY "owner_update"
    ON memorials FOR UPDATE
    USING (owner_id = auth.uid());

-- DELETE: Ein User darf nur seine eigenen Memorials löschen
CREATE POLICY "owner_delete"
    ON memorials FOR DELETE
    USING (owner_id = auth.uid());

-- -----------------------------------------------------------------------
-- Fertig! Prüfen mit:
-- SELECT * FROM memorials;         -- sieht nur eigene (wenn eingeloggt)
-- SELECT * FROM memorials LIMIT 5; -- sieht alle als Service Role (Admin)
-- -----------------------------------------------------------------------
