/**
 * @file data/src/storage.ts
 * @description Supabase Storage Hilfsfunktionen für Bild-Uploads.
 *
 * Lädt Bild-Dateien in den Supabase Storage-Bucket "memorial-images" hoch
 * und gibt die öffentliche URL zurück, die in memorial.cover_url / portrait_url gespeichert wird.
 *
 * Bucket-Struktur:
 *   memorial-images/
 *     {userId}/cover/{timestamp}.{ext}
 *     {userId}/portrait/{timestamp}.{ext}
 */

import { createSupabaseBrowserClient } from './browser-client';

/** Name des Supabase Storage Buckets. Muss im Dashboard erstellt werden. */
const BUCKET = 'memorial-images';

/** Erlaubte Bild-Typen (MIME). */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Maximale Dateigröße: 5 MB */
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Lädt eine Bild-Datei in Supabase Storage hoch.
 *
 * @param file - Die Datei vom <input type="file">
 * @param userId - Supabase Auth User-ID (für saubere Ordner-Struktur)
 * @param slot - Entweder 'cover' oder 'portrait' (bestimmt den Unterordner)
 * @returns Die öffentliche URL des hochgeladenen Bildes, oder null bei Fehler.
 */
export async function uploadMemorialImage(
    file: File,
    userId: string,
    slot: 'cover' | 'portrait',
): Promise<{ url: string | null; error: string | null }> {
    // Validierung
    if (!ALLOWED_TYPES.includes(file.type)) {
        return { url: null, error: 'Nur JPG, PNG, WebP und GIF erlaubt.' };
    }
    if (file.size > MAX_SIZE_BYTES) {
        return { url: null, error: 'Datei zu groß. Maximal 5 MB.' };
    }

    const ext = file.name.split('.').pop() ?? 'jpg';
    const timestamp = Date.now();
    // Pfad: userId/cover/1234567890.png
    const path = `${userId}/${slot}/${timestamp}.${ext}`;

    const supabase = createSupabaseBrowserClient();

    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (uploadError) {
        return { url: null, error: uploadError.message };
    }

    // Öffentliche URL abrufen
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { url: data.publicUrl, error: null };
}
