/**
 * @file app/api/photos/upload/route.ts
 * @description API Route: Galerie-Foto zu einem Memorial hochladen.
 *
 * POST /api/photos/upload
 * Body (FormData): file, memorialId, caption (optional)
 *
 * Ablauf:
 * 1. Prüfen ob der User eingeloggt ist
 * 2. Bild-Datei in Supabase Storage hochladen (Slot: 'gallery')
 * 3. Datensatz in gallery_photos eintragen (via Use Case)
 * 4. Gespeichertes GalleryPhoto zurückgeben
 *
 * Sicherheit: RLS Policy stellt sicher, dass nur Owner/Editor Fotos hochladen dürfen.
 */

import { addGalleryPhoto } from '@core/use-cases/addGalleryPhoto';
import { SupabasePhotoRepository } from '@data/repositories/SupabasePhotoRepository';
import { createSupabaseServerClient } from '@data/server-client';
import { NextRequest, NextResponse } from 'next/server';

/** Erlaubte Bild-Typen (MIME). */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Maximale Dateigröße pro Bild: 5 MB */
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

/** Maximale Gesamtgröße aller Fotos pro Memorial (Free Plan): 30 MB */
const FREE_TOTAL_SIZE_BYTES = 30 * 1024 * 1024;

/** Name des Supabase Storage Buckets. */
const BUCKET = 'memorial-images';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        // Auth Check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const memorialId = formData.get('memorialId') as string | null;
        const caption = formData.get('caption') as string | null;

        // Pflichtfelder prüfen
        if (!file) {
            return NextResponse.json(
                { error: 'Pflichtfeld fehlt: file.' },
                { status: 400 },
            );
        }

        // Datei validieren
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Nur JPG, PNG, WebP und GIF erlaubt.' },
                { status: 400 },
            );
        }
        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json(
                { error: 'Datei zu groß. Maximal 5 MB.' },
                { status: 400 },
            );
        }

        // Serverseitige Gesamtgröße-Prüfung (Free Plan: 30 MB)
        if (memorialId) {
            const { data: sizeData } = await supabase
                .from('gallery_photos')
                .select('file_size')
                .eq('memorial_id', memorialId);
            const totalUsed = (sizeData ?? []).reduce((sum: number, r: { file_size: number }) => sum + (r.file_size ?? 0), 0);
            if (totalUsed + file.size > FREE_TOTAL_SIZE_BYTES) {
                return NextResponse.json(
                    { error: 'Speicherlimit von 30 MB erreicht. Upgrade auf Premium.' },
                    { status: 400 },
                );
            }
        }

        // Bild in Supabase Storage hochladen (mit Server-Client)
        const ext = file.name.split('.').pop() ?? 'jpg';
        const path = `${user.id}/gallery/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(path, file, { cacheControl: '3600', upsert: false });

        if (uploadError) {
            return NextResponse.json(
                { error: uploadError.message },
                { status: 400 },
            );
        }

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const url = urlData.publicUrl;

        // Wenn keine memorialId: nur URL zurückgeben (Create-Mode, staged)
        if (!memorialId) {
            return NextResponse.json({ url }, { status: 201 });
        }

        // Datensatz in DB anlegen (via Use Case + Repository)
        const photoRepo = new SupabasePhotoRepository(supabase);
        const photo = await addGalleryPhoto(
            { memorialId, uploadedBy: user.id, url, caption: caption ?? undefined, fileSize: file.size },
            photoRepo,
        );

        return NextResponse.json({ photo }, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[photos/upload] Unexpected error:', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
