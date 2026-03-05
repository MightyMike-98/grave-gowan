/**
 * @file core/src/repositories/MemorialRepository.ts
 * @description Abstraktes Repository-Interface für Gedenkseiten.
 *
 * Dieses Interface definiert, WELCHE Datenbankoperationen möglich sind —
 * aber NICHT WIE sie implementiert werden. Die konkrete Implementierung
 * (z. B. mit Supabase) liegt in data/src/repositories/.
 *
 * So ist die Business-Logik in core/ vollständig von Supabase entkoppelt.
 * Das Interface könnte genauso gut mit einer anderen DB implementiert werden.
 */

import type { Memorial } from '../types/index';
import type { CreateMemorialInput, UpdateMemorialInput } from '../types/inputs';

/** Abstrakte Schnittstelle für alle Datenbankoperationen auf Memorials. */
export interface MemorialRepository {
    /**
     * Lädt ein einzelnes Memorial anhand seiner eindeutigen ID.
     * @returns Das Memorial oder null, wenn nicht gefunden.
     */
    findById(id: string): Promise<Memorial | null>;

    /**
     * Lädt ein Memorial anhand seines URL-freundlichen Slugs.
     * Wird auf der öffentlichen Gedenkseite (`/memorial/[slug]`) verwendet.
     * @returns Das Memorial oder null, wenn nicht gefunden.
     */
    findBySlug(slug: string): Promise<Memorial | null>;

    /**
     * Lädt alle Memorials, die einem bestimmten Benutzer (Owner) gehören.
     * Wird auf dem Dashboard angezeigt.
     */
    findByOwnerId(ownerId: string): Promise<Memorial[]>;

    /**
     * Erstellt ein neues Memorial in der Datenbank.
     * @returns Das vollständig gespeicherte Memorial (inkl. ID und Timestamps).
     */
    create(input: CreateMemorialInput): Promise<Memorial>;

    /**
     * Aktualisiert felder eines bestehenden Memorials.
     * @returns Das aktualisierte Memorial.
     */
    update(id: string, input: UpdateMemorialInput): Promise<Memorial>;

    /**
     * Löscht ein Memorial dauerhaft aus der Datenbank.
     */
    delete(id: string): Promise<void>;
}
