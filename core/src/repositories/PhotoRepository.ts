/**
 * @file core/src/repositories/PhotoRepository.ts
 * @description Abstraktes Repository-Interface für Galerie-Fotos.
 *
 * Definiert WELCHE Datenbankoperationen für Galerie-Fotos möglich sind —
 * aber NICHT WIE sie implementiert werden. Die konkrete Implementierung
 * liegt in data/src/repositories/SupabasePhotoRepository.ts.
 */

import type { GalleryPhoto } from '../types/index';
import type { CreateGalleryPhotoInput } from '../types/inputs';

/** Abstrakte Schnittstelle für alle Datenbankoperationen auf gallery_photos. */
export interface PhotoRepository {
    /**
     * Lädt alle Galerie-Fotos einer Gedenkseite.
     * Sortiert: nach sort_order aufsteigend, dann created_at absteigend.
     */
    findByMemorialId(memorialId: string): Promise<GalleryPhoto[]>;

    /**
     * Lädt nur die favorisierten Fotos einer Gedenkseite.
     * Wird im Highlights-Tab verwendet.
     */
    findFavoritesByMemorialId(memorialId: string): Promise<GalleryPhoto[]>;

    /**
     * Speichert ein neues Galerie-Foto in der Datenbank.
     * @returns Das vollständig gespeicherte GalleryPhoto (inkl. ID und Timestamp).
     */
    create(input: CreateGalleryPhotoInput): Promise<GalleryPhoto>;

    /**
     * Schaltet den Favoriten-Status eines Fotos um (true ↔ false).
     * Favorisierte Fotos erscheinen im Highlights-Tab.
     * @returns Das aktualisierte GalleryPhoto.
     */
    toggleFavorite(photoId: string): Promise<GalleryPhoto>;

    /**
     * Löscht ein Galerie-Foto dauerhaft aus der Datenbank.
     * Nur der Owner darf löschen (via RLS in Supabase).
     */
    delete(photoId: string): Promise<void>;
}
