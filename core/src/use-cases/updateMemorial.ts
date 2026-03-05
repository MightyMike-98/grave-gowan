/**
 * @file core/src/use-cases/updateMemorial.ts
 * @description Use Case: Eine bestehende Gedenkseite aktualisieren.
 */

import type { MemorialRepository } from '../repositories/MemorialRepository';
import type { Memorial } from '../types/index';
import type { UpdateMemorialInput } from '../types/inputs';

/**
 * Aktualisiert ein bestehendes Memorial.
 * Gibt das aktualisierte Objekt zurück.
 *
 * @param id - ID des zu aktualisierenden Memorials.
 * @param input - Die zu ändernden Felder (alle optional).
 * @param repo - Injiziertes Repository.
 */
export async function updateMemorial(
    id: string,
    input: UpdateMemorialInput,
    repo: MemorialRepository,
): Promise<Memorial> {
    if (!id) throw new Error('Memorial ID is required.');
    return repo.update(id, input);
}
