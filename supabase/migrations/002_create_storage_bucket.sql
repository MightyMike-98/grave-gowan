/**
 * @file supabase/migrations/002_create_storage_bucket.sql
 * @description Storage Bucket für Memorial-Bilder anlegen.
 *
 * Ausführen in: Supabase Dashboard → SQL Editor → New Query → Run
 * NACH Migration 001.
 */

-- ---------------------------------------------------------------
-- Storage Bucket erstellen (öffentlich lesbar für Besucher)
-- ---------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'memorial-images',
    'memorial-images',
    true,                          -- öffentlich: Besucher der Gedenkseite können Bilder sehen
    5242880,                       -- 5 MB Limit pro Datei
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------
-- RLS für Storage: NUR eingeloggte User dürfen in ihr eigenes
-- Verzeichnis ({user_id}/cover/... und {user_id}/portrait/...) hochladen
-- ---------------------------------------------------------------

-- Lesen: Jeder darf Bilder ansehen (Gedenkseiten sind öffentlich)
CREATE POLICY "public_read_memorial_images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'memorial-images');

-- Hochladen: Nur eingeloggte User, nur in ihr eigenes Verzeichnis
CREATE POLICY "owner_upload_memorial_images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'memorial-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Löschen: Nur der eigene User darf sein Bild löschen
CREATE POLICY "owner_delete_memorial_images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'memorial-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
