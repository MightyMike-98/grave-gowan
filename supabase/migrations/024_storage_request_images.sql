-- =============================================================================
-- Migration 024: Storage Bucket Policy für Besucher-Bild-Uploads
-- Ausführen in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- VORAUSSETZUNG: Zuerst im Supabase Dashboard unter Storage einen neuen
-- Bucket mit dem Namen "request-images" anlegen und "Public" aktivieren.
--
-- Danach diese Datei ausführen.
-- =============================================================================

-- Anonyme und eingeloggte Nutzer dürfen Bilder hochladen
CREATE POLICY "anon_upload_request_images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'request-images');

-- Jeder darf die Bilder lesen (Public Bucket)
CREATE POLICY "public_read_request_images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'request-images');

-- Owner/Editor dürfen Bilder löschen
CREATE POLICY "auth_delete_request_images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'request-images');
