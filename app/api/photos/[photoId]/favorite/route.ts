/**
 * @file app/api/photos/[photoId]/favorite/route.ts
 * @description API Route: Favoriten-Status eines Galerie-Fotos umschalten.
 *
 * POST /api/photos/[photoId]/favorite
 *
 * Schaltet is_favorite von true auf false und umgekehrt.
 * Favorisierte Fotos erscheinen automatisch im Highlights-Tab.
 *
 * Sicherheit: RLS Policy stellt sicher, dass nur Owner/Editor den Status ändern dürfen.
 */

import { togglePhotoFavorite } from '@core/use-cases/togglePhotoFavorite';
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

        // Favoriten-Status umschalten (via Use Case + Repository)
        const photoRepo = new SupabasePhotoRepository(supabase);
        const photo = await togglePhotoFavorite(photoId, photoRepo);

        return NextResponse.json({ photo });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[photos/favorite] Unexpected error:', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
