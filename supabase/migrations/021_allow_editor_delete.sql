-- =============================================================================
-- Migration 021: Editoren dürfen Fotos und Stories löschen
-- Vorher: nur Owner. Jetzt: Owner + Editor.
-- =============================================================================

-- Gallery Photos: Editor darf auch löschen
DROP POLICY IF EXISTS "gallery_photos_delete" ON gallery_photos;
CREATE POLICY "gallery_photos_delete"
    ON gallery_photos FOR DELETE
    USING (is_memorial_editor_or_owner(memorial_id));

-- Memorial Stories: Editor darf auch löschen
DROP POLICY IF EXISTS "memorial_stories_delete" ON memorial_stories;
CREATE POLICY "memorial_stories_delete"
    ON memorial_stories FOR DELETE
    USING (is_memorial_editor_or_owner(memorial_id));
