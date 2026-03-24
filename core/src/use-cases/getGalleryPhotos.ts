/**
 * @file core/src/use-cases/getGalleryPhotos.ts
 * @description Use Case: Alle Galerie-Fotos einer Gedenkseite laden.
 *
 * Wird von der Server Component `app/memorial/[slug]/page.tsx` aufgerufen.
 * Gibt ein leeres Array zurück wenn keine Fotos vorhanden sind.
 */

import type { PhotoRepository } from '../repositories/PhotoRepository';
import type { GalleryPhoto } from '../types/index';

/**
 * Lädt alle Galerie-Fotos einer Gedenkseite über das Repository.
 * Die Implementierung des Repositories (Supabase, Mock, etc.) ist dem Use Case egal.
 *
 * @param memorialId - UUID der Gedenkseite.
 * @param repo - Injiziertes Repository (Dependency Injection).
 * @returns Array aller Galerie-Fotos, sortiert nach Reihenfolge.
 * @throws Error wenn memorialId fehlt.
 */
export async function getGalleryPhotos(
    memorialId: string,
    repo: PhotoRepository,
): Promise<GalleryPhoto[]> {
    if (!memorialId || memorialId.trim().length === 0) {
        throw new Error('getGalleryPhotos: memorialId ist ein Pflichtfeld.');
    }

    return repo.findByMemorialId(memorialId);
}
