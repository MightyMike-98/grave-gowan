-- =============================================================================
-- Migration 036: Video-MIME-Typen im Storage-Bucket erlauben
--
-- PROBLEM:
-- Der Bucket "memorial-images" hat in allowed_mime_types nur Bild-Formate.
-- Uploads von video/mp4, video/quicktime, video/webm werden daher direkt
-- vom Supabase Storage abgelehnt: "mime type video/mp4 is not supported".
--
-- Auch das 5-MB-Limit (file_size_limit = 5242880) ist für Videos zu klein.
--
-- LÖSUNG:
-- MIME-Whitelist um Video-Typen erweitern und file_size_limit auf 100 MB
-- anheben. Die eigentliche Premium-Prüfung (nur Cofounder dürfen Videos
-- tatsächlich hochladen) passiert weiterhin in /api/photos/upload.
-- =============================================================================

UPDATE storage.buckets
SET
    allowed_mime_types = ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/quicktime',
        'video/webm'
    ],
    file_size_limit = 104857600  -- 100 MB
WHERE id = 'memorial-images';
