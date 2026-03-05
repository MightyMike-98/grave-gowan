/**
 * @file core/src/use-cases/addMemory.ts
 * @description Use Case: Eine neue Erinnerung zu einer Gedenkseite hinzufügen.
 */

import type { MemoryRepository } from '../repositories/MemoryRepository';
import type { Memory } from '../types/index';
import type { CreateMemoryInput } from '../types/inputs';

/**
 * Fügt eine neue Erinnerung zu einer Gedenkseite hinzu.
 * Validiert dass Text und Autorenname nicht leer sind.
 *
 * @param input - Erinnerungsdaten vom Formular.
 * @param repo - Injiziertes MemoryRepository.
 * @returns Die gespeicherte Memory.
 * @throws Error wenn Pflichtfelder fehlen.
 */
export async function addMemory(
    input: CreateMemoryInput,
    repo: MemoryRepository,
): Promise<Memory> {
    if (!input.text || input.text.trim().length === 0) {
        throw new Error('Memory text is required.');
    }
    if (!input.authorName || input.authorName.trim().length === 0) {
        throw new Error('Author name is required.');
    }
    if (!input.memorialId) {
        throw new Error('Memorial ID is required.');
    }
    return repo.create(input);
}
