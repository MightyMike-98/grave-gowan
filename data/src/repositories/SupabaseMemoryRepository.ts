/**
 * @file data/src/repositories/SupabaseMemoryRepository.ts
 * @description Konkrete Supabase-Implementierung des MemoryRepository-Interfaces.
 *
 * Enthält alle Queries für die `memories`-Tabelle. Mappt snake_case DB-Felder
 * auf camelCase Domain-Typen.
 */

import type { MemoryRepository } from '@core/repositories/MemoryRepository';
import type { Memory } from '@core/types/index';
import type { CreateMemoryInput } from '@core/types/inputs';
import { supabase } from '../client';

/**
 * Mappt eine rohe `memories`-Datenbankzeile auf das Memory-Domain-Objekt.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Memory {
    return {
        id: row.id,
        memorialId: row.memorial_id,
        authorName: row.author_name,
        authorEmail: row.author_email ?? undefined,
        text: row.text,
        createdAt: row.created_at,
    };
}

/** Supabase-Implementierung des MemoryRepository. */
export class SupabaseMemoryRepository implements MemoryRepository {
    /** Lädt alle Erinnerungen zu einem Memorial, neueste zuerst. */
    async findByMemorialId(memorialId: string): Promise<Memory[]> {
        const { data, error } = await supabase
            .from('memories')
            .select('*')
            .eq('memorial_id', memorialId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return (data ?? []).map(mapRow);
    }

    /** Speichert eine neue Erinnerung. */
    async create(input: CreateMemoryInput): Promise<Memory> {
        const { data, error } = await supabase
            .from('memories')
            .insert({
                memorial_id: input.memorialId,
                author_name: input.authorName,
                author_email: input.authorEmail ?? null,
                text: input.text,
            })
            .select()
            .single();
        if (error) throw error;
        return mapRow(data);
    }

    /** Löscht eine einzelne Erinnerung. */
    async delete(id: string): Promise<void> {
        const { error } = await supabase.from('memories').delete().eq('id', id);
        if (error) throw error;
    }
}
