/**
 * @file core/src/types/inputs.ts
 * @description Input-Typen für schreibende Use Cases (Create, Update).
 *
 * Getrennt von den Domain-Typen, weil Eingaben keine IDs oder Timestamps haben —
 * diese werden vom Backend (Supabase) automatisch vergeben.
 */

import type { Memorial, Memory } from './index';

/** Felder, die beim Erstellen eines neuen Memorials angegeben werden müssen/können. */
export type CreateMemorialInput = Pick<Memorial, 'name' | 'ownerId' | 'slug' | 'theme' | 'isPublic'> &
    Partial<Pick<Memorial, 'bio' | 'quote' | 'coverUrl' | 'portraitUrl' | 'dateOfBirth' | 'dateOfDeath' | 'timeline' | 'supportTitle' | 'supportUrl' | 'supportDesc'>>;

/** Felder, die beim Aktualisieren eines Memorials geändert werden können. Alle optional. */
export type UpdateMemorialInput = Partial<
    Pick<Memorial, 'name' | 'slug' | 'bio' | 'quote' | 'coverUrl' | 'portraitUrl' | 'dateOfBirth' | 'dateOfDeath' | 'theme' | 'isPublic' | 'timeline' | 'supportTitle' | 'supportUrl' | 'supportDesc'>
>;

/** Felder, die beim Erstellen einer Erinnerung angegeben werden müssen/können. */
export type CreateMemoryInput = Pick<Memory, 'memorialId' | 'authorName' | 'text'> &
    Partial<Pick<Memory, 'authorEmail'>>;
