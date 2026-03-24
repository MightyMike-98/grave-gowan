/**
 * @file core/src/use-cases/togglePhotoFavorite.ts
 * @description Use Case: Favoriten-Status eines Galerie-Fotos umschalten.
 *
 * Markierte Fotos erscheinen automatisch im Highlights-Tab der Gedenkseite.
 * Die Authorization (ist der aufrufende User Owner oder Editor?) wird über die
 * RLS Policy in Supabase sichergestellt.
 */

import type { PhotoRepository } from '../repositories/PhotoRepository';
import type { GalleryPhoto } from '../types/index';

/**
 * Schaltet den Favoriten-Status eines Fotos um (true ↔ false).
 *
 * @param photoId - UUID des Galerie-Fotos.
 * @param repo - Injiziertes PhotoRepository.
 * @returns Das aktualisierte GalleryPhoto mit neuem Favoriten-Status.
 * @throws Error wenn photoId fehlt.
 */
export async function togglePhotoFavorite(
    photoId: string,
    repo: PhotoRepository,
): Promise<GalleryPhoto> {
    if (!photoId) {
        throw new Error('togglePhotoFavorite: photoId ist ein Pflichtfeld.');
    }

    return repo.toggleFavorite(photoId);
}
