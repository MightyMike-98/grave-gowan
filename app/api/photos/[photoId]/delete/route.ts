/**
 * @file app/api/photos/[photoId]/delete/route.ts
 * @description API Route: Galerie-Foto dauerhaft löschen.
 *
 * POST /api/photos/[photoId]/delete
 *
 * Sicherheit: RLS Policy stellt sicher, dass nur der Owner Fotos entfernen darf.
 */

import { deleteGalleryPhoto } from '@core/use-cases/deleteGalleryPhoto';
import { SupabasePhotoRepository } from '@data/repositories/SupabasePhotoRepository';
import { createSupabaseServerClient } from '@data/server-client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ photoId: string }> },
) {
    try {
        const { photoId } = await params;

        // Pflichtfeld prüfen
        if (!photoId) {
            return NextResponse.json({ error: 'photoId is required.' }, { status: 400 });
        }

        // Auth Check
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        }

        // Foto-URL aus DB holen, um Storage-Datei zu löschen
        const { data: photo } = await supabase
            .from('gallery_photos')
            .select('url')
            .eq('id', photoId)
            .single();

        // DB-Eintrag löschen (via Use Case + Repository)
        const photoRepo = new SupabasePhotoRepository(supabase);
        await deleteGalleryPhoto(photoId, photoRepo);

        // Storage-Datei löschen
        if (photo?.url) {
            const match = photo.url.split('/memorial-images/');
            if (match[1]) {
                await supabase.storage.from('memorial-images').remove([match[1]]);
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[photos/delete] Unexpected error:', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
