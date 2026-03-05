/**
 * @file core/src/repositories/MemoryRepository.ts
 * @description Abstraktes Repository-Interface für Erinnerungsbeiträge (Memories).
 *
 * Definiert die Operationen auf der `memories`-Tabelle ohne Implementierungsdetails.
 */

import type { Memory } from '../types/index';
import type { CreateMemoryInput } from '../types/inputs';

/** Abstrakte Schnittstelle für alle Datenbankoperationen auf Memories. */
export interface MemoryRepository {
    /**
     * Lädt alle Erinnerungsbeiträge zu einer bestimmten Gedenkseite.
     * Sortiert: neueste zuerst.
     */
    findByMemorialId(memorialId: string): Promise<Memory[]>;

    /**
     * Speichert eine neue Erinnerung in der Datenbank.
     * @returns Die vollständig gespeicherte Memory (inkl. ID und Timestamp).
     */
    create(input: CreateMemoryInput): Promise<Memory>;

    /**
     * Löscht eine einzelne Erinnerung.
     * Nur Owner oder der ursprüngliche Autor dürfen löschen (via RLS in Supabase).
     */
    delete(id: string): Promise<void>;
}
