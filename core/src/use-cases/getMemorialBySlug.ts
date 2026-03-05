/**
 * @file core/src/use-cases/getMemorialBySlug.ts
 * @description Use Case: Eine Gedenkseite anhand ihres URL-Slugs laden.
 *
 * Wird von der Server Component `app/memorial/[slug]/page.tsx` aufgerufen.
 * Gibt null zurück wenn nicht gefunden (die UI zeigt dann eine 404-Seite).
 */

import type { MemorialRepository } from '../repositories/MemorialRepository';
import type { Memorial } from '../types/index';

/**
 * Lädt eine Gedenkseite anhand ihres Slugs über das Repository.
 * Die Implementierung des Repositories (Supabase, Mock, etc.) ist dem Use Case egal.
 *
 * @param slug - URL-freundlicher Identifier, z. B. "sarah-jenkins-1954".
 * @param repo - Injiziertes Repository (Dependency Injection).
 * @returns Das Memorial oder null, wenn nicht gefunden.
 */
export async function getMemorialBySlug(
    slug: string,
    repo: MemorialRepository,
): Promise<Memorial | null> {
    if (!slug || slug.trim().length === 0) return null;
    return repo.findBySlug(slug.trim().toLowerCase());
}
