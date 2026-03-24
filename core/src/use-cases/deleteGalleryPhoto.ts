/**
 * @file core/src/use-cases/deleteGalleryPhoto.ts
 * @description Use Case: Ein Galerie-Foto dauerhaft löschen.
 *
 * Nur der Owner des Memorials darf Fotos entfernen.
 * Die Authorization wird über die RLS Policy in Supabase sichergestellt.
 */

import type { PhotoRepository } from '../repositories/PhotoRepository';

/**
 * Löscht ein Galerie-Foto anhand seiner ID.
 *
 * @param photoId - UUID des zu löschenden Fotos.
 * @param repo - Injiziertes PhotoRepository.
 * @throws Error wenn photoId fehlt.
 */
export async function deleteGalleryPhoto(
    photoId: string,
    repo: PhotoRepository,
): Promise<void> {
    if (!photoId) {
        throw new Error('deleteGalleryPhoto: photoId ist ein Pflichtfeld.');
    }

    await repo.delete(photoId);
}
