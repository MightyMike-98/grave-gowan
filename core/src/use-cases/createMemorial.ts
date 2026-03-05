/**
 * @file core/src/use-cases/createMemorial.ts
 * @description Use Case: Eine neue Gedenkseite erstellen.
 *
 * Enthält die Validierungsregeln (z. B. Name darf nicht leer sein, Slug-Generierung)
 * bevor die Daten an das Repository weitergegeben werden.
 */

import type { MemorialRepository } from '../repositories/MemorialRepository';
import type { Memorial } from '../types/index';
import type { CreateMemorialInput } from '../types/inputs';

/**
 * Generiert einen URL-freundlichen Slug aus einem Namen und einer Jahreszahl.
 * Beispiel: "Sarah Jenkins", "1954" → "sarah-jenkins-1954"
 *
 * @param name - Name der Person.
 * @param year - Optionales Jahr (z. B. Geburtsjahr).
 */
export function generateSlug(name: string, year?: string): string {
    const base = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')   // Sonderzeichen entfernen
        .replace(/\s+/g, '-');             // Leerzeichen durch Bindestriche ersetzen
    return year ? `${base}-${year}` : base;
}

/**
 * Erstellt eine neue Gedenkseite.
 * Validiert die Eingabe und delegiert die Speicherung ans Repository.
 *
 * @param input - Eingabedaten vom Formular.
 * @param repo - Injiziertes Repository.
 * @returns Das vollständig gespeicherte Memorial.
 * @throws Error wenn Pflichtfelder fehlen.
 */
export async function createMemorial(
    input: CreateMemorialInput,
    repo: MemorialRepository,
): Promise<Memorial> {
    if (!input.name || input.name.trim().length === 0) {
        throw new Error('Name is required.');
    }
    if (!input.ownerId) {
        throw new Error('Owner (authenticated user) is required.');
    }

    // Slug aus dem Namen generieren falls nicht übergeben
    const slug = input.slug || generateSlug(input.name, input.dateOfBirth?.slice(0, 4));

    return repo.create({ ...input, slug });
}
