-- =============================================================================
-- Migration 027: file_size Spalte zu gallery_photos hinzufügen
--
-- Speichert die Dateigröße in Bytes pro Foto, damit das
-- Gesamtspeicher-Limit (30 MB) für Free-Plan-User serverseitig
-- geprüft werden kann.
-- =============================================================================

ALTER TABLE gallery_photos
    ADD COLUMN IF NOT EXISTS file_size BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN gallery_photos.file_size IS 'Dateigröße in Bytes';
