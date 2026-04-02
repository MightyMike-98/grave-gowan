/**
 * @file data/src/repositories/SupabasePhotoRepository.ts
 * @description Konkrete Supabase-Implementierung des PhotoRepository-Interfaces.
 *
 * Akzeptiert einen optionalen Supabase-Client im Konstruktor (Dependency Injection):
 * - Browser (Client Components): kein Argument → verwendet createSupabaseBrowserClient()
 * - Server (Server Components):  Server-Client übergeben → Cookie-basierte Session
 *
 * Mappt Supabase-Zeilen (snake_case) auf Domain-Typen (camelCase).
 */

import type { PhotoRepository } from '@core/repositories/PhotoRepository';
import type { GalleryPhoto } from '@core/types/index';
import type { CreateGalleryPhotoInput } from '@core/types/inputs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '../browser-client';

/** Mappt eine rohe `gallery_photos`-Datenbankzeile auf das GalleryPhoto-Domain-Objekt. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): GalleryPhoto {
    return {
        id: row.id,
        memorialId: row.memorial_id,
        uploadedBy: row.uploaded_by,
        url: row.url,
        caption: row.caption ?? undefined,
        isFavorite: row.is_favorite ?? false,
        sortOrder: row.sort_order ?? 0,
        createdAt: row.created_at,
    };
}

/** Supabase-Implementierung des PhotoRepository mit optionalem Client-Injection. */
export class SupabasePhotoRepository implements PhotoRepository {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly db: SupabaseClient<any, any, any>;

    /**
     * @param client - Optionaler Supabase-Client.
     *   - Nicht angegeben → Browser-Client (mit Cookie-Session, für Client Components).
     *   - Server-Client übergeben → für Server Components (createSupabaseServerClient()).
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(client?: SupabaseClient<any, any, any>) {
        this.db = client ?? createSupabaseBrowserClient();
    }

    /** Lädt alle Galerie-Fotos eines Memorials, sortiert nach Reihenfolge. */
    async findByMemorialId(memorialId: string): Promise<GalleryPhoto[]> {
        const { data, error } = await this.db
            .from('gallery_photos')
            .select('*')
            .eq('memorial_id', memorialId)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });
        if (error) throw error;
        return (data ?? []).map(mapRow);
    }

    /** Lädt nur die favorisierten Fotos eines Memorials (für den Highlights-Tab). */
    async findFavoritesByMemorialId(memorialId: string): Promise<GalleryPhoto[]> {
        const { data, error } = await this.db
            .from('gallery_photos')
            .select('*')
            .eq('memorial_id', memorialId)
            .eq('is_favorite', true)
            .order('sort_order', { ascending: true });
        if (error) throw error;
        return (data ?? []).map(mapRow);
    }

    /** Speichert ein neues Galerie-Foto. */
    async create(input: CreateGalleryPhotoInput): Promise<GalleryPhoto> {
        const { data, error } = await this.db
            .from('gallery_photos')
            .insert({
                memorial_id: input.memorialId,
                uploaded_by: input.uploadedBy,
                url: input.url,
                caption: input.caption ?? null,
                file_size: input.fileSize ?? 0,
            })
            .select()
            .single();
        if (error) throw error;
        return mapRow(data);
    }

    /** Schaltet den Favoriten-Status eines Fotos um (true ↔ false). */
    async toggleFavorite(photoId: string): Promise<GalleryPhoto> {
        // Aktuellen Status lesen
        const { data: current, error: readErr } = await this.db
            .from('gallery_photos')
            .select('is_favorite')
            .eq('id', photoId)
            .single();
        if (readErr) throw readErr;

        // Umschalten und zurückgeben
        const { data, error } = await this.db
            .from('gallery_photos')
            .update({ is_favorite: !current.is_favorite })
            .eq('id', photoId)
            .select()
            .single();
        if (error) throw error;
        return mapRow(data);
    }

    /** Löscht ein einzelnes Galerie-Foto. */
    async delete(photoId: string): Promise<void> {
        const { error } = await this.db
            .from('gallery_photos')
            .delete()
            .eq('id', photoId);
        if (error) throw error;
    }
}
