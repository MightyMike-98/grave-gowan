-- =============================================================================
-- Migration 017: Gallery Photos — Galerie-Bilder für Gedenkseiten
-- Ausführen in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- Erstellt die Tabelle gallery_photos, in der alle hochgeladenen Galerie-Fotos
-- einer Gedenkseite gespeichert werden. Jedes Foto kann als Favorit markiert
-- werden — favorisierte Fotos erscheinen automatisch im Highlights-Tab.
--
-- Berechtigungen:
--   SELECT → öffentlich (jeder darf Galerie-Fotos sehen)
--   INSERT → Owner + Editor (dürfen Fotos hochladen)
--   UPDATE → Owner + Editor (dürfen Caption ändern, Favoriten-Status toggeln)
--   DELETE → nur Owner (darf Fotos entfernen)
--
-- RLS-Policies nutzen die SECURITY DEFINER Funktionen aus Migration 009:
--   - is_memorial_editor_or_owner(memorial_id) → für INSERT + UPDATE
--   - is_memorial_owner(memorial_id) → für DELETE
-- =============================================================================

-- -----------------------------------------------------------------------
-- 1. Tabelle erstellen
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gallery_photos (
    id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Referenz auf die Gedenkseite. Wenn das Memorial gelöscht wird, verschwinden auch alle Fotos.
    memorial_id UUID         NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,

    -- Der User, der das Foto hochgeladen hat.
    uploaded_by UUID         NOT NULL REFERENCES auth.users(id),

    -- Öffentliche URL des Bildes (aus Supabase Storage).
    url         TEXT         NOT NULL,

    -- Optionale Bildunterschrift.
    caption     TEXT,

    -- Ob dieses Foto im Highlights-Tab als Favorit angezeigt werden soll.
    is_favorite BOOLEAN      NOT NULL DEFAULT false,

    -- Reihenfolge innerhalb der Galerie (für späteres Drag & Drop Sortieren).
    sort_order  INT          NOT NULL DEFAULT 0,

    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------
-- 2. Indizes für schnelle Abfragen
-- -----------------------------------------------------------------------

-- Alle Fotos eines Memorials laden (Gallery-Tab)
CREATE INDEX IF NOT EXISTS idx_gallery_photos_memorial
    ON gallery_photos(memorial_id);

-- Nur favorisierte Fotos laden (Highlights-Tab)
CREATE INDEX IF NOT EXISTS idx_gallery_photos_favorites
    ON gallery_photos(memorial_id) WHERE is_favorite = true;

-- -----------------------------------------------------------------------
-- 3. RLS aktivieren
-- -----------------------------------------------------------------------
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

-- Bestehende Policies entfernen (idempotentes Re-Run)
DROP POLICY IF EXISTS "gallery_photos_select" ON gallery_photos;
DROP POLICY IF EXISTS "gallery_photos_insert" ON gallery_photos;
DROP POLICY IF EXISTS "gallery_photos_update" ON gallery_photos;
DROP POLICY IF EXISTS "gallery_photos_delete" ON gallery_photos;

-- SELECT: Jeder darf Gallery-Fotos sehen (öffentliche Gedenkseiten)
CREATE POLICY "gallery_photos_select"
    ON gallery_photos FOR SELECT
    USING (true);

-- INSERT: Owner und Editoren dürfen Fotos hochladen
CREATE POLICY "gallery_photos_insert"
    ON gallery_photos FOR INSERT
    WITH CHECK (
        is_memorial_editor_or_owner(memorial_id)
    );

-- UPDATE: Owner und Editoren dürfen Caption ändern und Favoriten-Status toggeln
CREATE POLICY "gallery_photos_update"
    ON gallery_photos FOR UPDATE
    USING (
        is_memorial_editor_or_owner(memorial_id)
    );

-- DELETE: Nur der Owner darf Fotos entfernen
CREATE POLICY "gallery_photos_delete"
    ON gallery_photos FOR DELETE
    USING (
        is_memorial_owner(memorial_id)
    );

-- -----------------------------------------------------------------------
-- Fertig! Prüfen mit:
-- SELECT * FROM gallery_photos;
-- -----------------------------------------------------------------------
