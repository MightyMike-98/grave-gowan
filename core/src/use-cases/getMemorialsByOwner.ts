/**
 * @file core/src/use-cases/getMemorialsByOwner.ts
 * @description Use Case: Alle Gedenkseiten eines Benutzers laden (für Dashboard).
 */

import type { MemorialRepository } from '../repositories/MemorialRepository';
import type { Memorial } from '../types/index';

/**
 * Lädt alle Gedenkseiten, die einem eingeloggten Benutzer gehören.
 * Wird auf der Dashboard-Seite verwendet.
 *
 * @param ownerId - Supabase Auth User-ID des eingeloggten Benutzers.
 * @param repo - Injiziertes Repository.
 * @returns Liste der Memorials; leer wenn keine vorhanden.
 */
export async function getMemorialsByOwner(
    ownerId: string,
    repo: MemorialRepository,
): Promise<Memorial[]> {
    if (!ownerId) return [];
    return repo.findByOwnerId(ownerId);
}
