/**
 * @file core/src/use-cases/addGalleryPhoto.ts
 * @description Use Case: Ein neues Foto zur Galerie einer Gedenkseite hinzufügen.
 *
 * Wird aufgerufen, nachdem das Bild bereits in Supabase Storage hochgeladen wurde.
 * Validiert die Pflichtfelder und delegiert die Speicherung ans Repository.
 */

import type { PhotoRepository } from '../repositories/PhotoRepository';
import type { GalleryPhoto } from '../types/index';
import type { CreateGalleryPhotoInput } from '../types/inputs';

/**
 * Fügt ein neues Foto zur Galerie einer Gedenkseite hinzu.
 * Validiert dass Memorial-ID, User-ID und URL vorhanden sind.
 *
 * @param input - Fotodaten (nach erfolgreichem Storage-Upload).
 * @param repo - Injiziertes PhotoRepository.
 * @returns Das gespeicherte GalleryPhoto.
 * @throws Error wenn Pflichtfelder fehlen.
 */
export async function addGalleryPhoto(
    input: CreateGalleryPhotoInput,
    repo: PhotoRepository,
): Promise<GalleryPhoto> {
    if (!input.memorialId) {
        throw new Error('addGalleryPhoto: memorialId ist ein Pflichtfeld.');
    }
    if (!input.uploadedBy) {
        throw new Error('addGalleryPhoto: uploadedBy ist ein Pflichtfeld.');
    }
    if (!input.url) {
        throw new Error('addGalleryPhoto: url ist ein Pflichtfeld.');
    }

    return repo.create(input);
}
