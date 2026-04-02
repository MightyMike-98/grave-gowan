/**
 * @file data/src/repositories/SupabaseMemorialRepository.ts
 * @description Konkrete Supabase-Implementierung des MemorialRepository-Interfaces.
 *
 * Akzeptiert einen optionalen Supabase-Client im Konstruktor (Dependency Injection):
 * - Browser (Client Components): kein Argument → verwendet createSupabaseBrowserClient()
 * - Server (Server Components):  Server-Client übergeben → verwendet Cookie-Session
 *
 * Mappt Supabase-Zeilen (snake_case) auf Domain-Typen (camelCase).
 */

import type { MemorialRepository } from '@core/repositories/MemorialRepository';
import type { Memorial } from '@core/types/index';
import type { CreateMemorialInput, UpdateMemorialInput } from '@core/types/inputs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '../browser-client';

/**
 * Mappt eine rohe Datenbankzeile (snake_case) auf das Memorial-Domain-Objekt (camelCase).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Memorial {
    return {
        id: row.id,
        slug: row.slug,
        ownerId: row.owner_id,
        name: row.name,
        dateOfBirth: row.date_of_birth ?? undefined,
        dateOfDeath: row.date_of_death ?? undefined,
        bio: row.bio ?? undefined,
        quote: row.quote ?? undefined,
        coverUrl: row.cover_url ?? undefined,
        portraitUrl: row.portrait_url ?? undefined,
        theme: row.theme ?? 'classic',
        isPublic: row.is_public ?? false,
        timeline: row.timeline ?? [],
        supportTitle: row.support_title ?? undefined,
        supportUrl: row.support_url ?? undefined,
        supportDesc: row.support_desc ?? undefined,
        country: row.country ?? undefined,
        candleCount: row.candle_count ?? 0,
        flowerCount: row.flower_count ?? 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

/** Supabase-Implementierung des MemorialRepository mit optionalem Client-Injection. */
export class SupabaseMemorialRepository implements MemorialRepository {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly db: SupabaseClient<any, any, any>;

    /**
     * @param client - Optionaler Supabase-Client.
     *   - Nicht angegeben → Browser-Client (mit Cookie-Session, für Client Components).
     *   - Server-Client übergeben → für Server Components (createSupabaseServerClient()).
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(client?: SupabaseClient<any, any, any>) {
        this.db = client ?? createSupabaseBrowserClient();
    }

    async findById(id: string): Promise<Memorial | null> {
        const { data, error } = await this.db
            .from('memorials').select('*').eq('id', id).single();
        if (error) { if (error.code === 'PGRST116') return null; throw error; }
        return mapRow(data);
    }

    async findBySlug(slug: string): Promise<Memorial | null> {
        // Versuche zuerst die RPC-Funktion (SECURITY DEFINER, umgeht RLS)
        // damit auch eingeladene Besucher ohne Login das Memorial sehen können.
        const { data: rpcData, error: rpcError } = await this.db
            .rpc('get_memorial_by_slug', { p_slug: slug });

        if (!rpcError && rpcData && rpcData.length > 0) {
            return mapRow(rpcData[0]);
        }

        // Fallback: normale Query (für den Fall dass Migration 012 noch nicht ausgeführt wurde)
        const { data, error } = await this.db
            .from('memorials').select('*').eq('slug', slug).single();
        if (error) { if (error.code === 'PGRST116') return null; throw error; }
        return mapRow(data);
    }

    async findByOwnerId(ownerId: string): Promise<Memorial[]> {
        const { data, error } = await this.db
            .from('memorials').select('*')
            .eq('owner_id', ownerId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return (data ?? []).map(mapRow);
    }

    async create(input: CreateMemorialInput): Promise<Memorial> {
        const { data, error } = await this.db
            .from('memorials')
            .insert({
                slug: input.slug,
                owner_id: input.ownerId,
                name: input.name,
                date_of_birth: input.dateOfBirth ?? null,
                date_of_death: input.dateOfDeath ?? null,
                bio: input.bio ?? null,
                quote: input.quote ?? null,
                cover_url: input.coverUrl ?? null,
                portrait_url: input.portraitUrl ?? null,
                theme: input.theme,
                is_public: input.isPublic,
                timeline: input.timeline ?? [],
                support_title: input.supportTitle ?? null,
                support_url: input.supportUrl ?? null,
                support_desc: input.supportDesc ?? null,
                country: input.country ?? null,
            })
            .select()
            .single();
        if (error) throw error;
        return mapRow(data);
    }

    async update(id: string, input: UpdateMemorialInput): Promise<Memorial> {
        const { data, error } = await this.db
            .from('memorials')
            .update({
                ...(input.name !== undefined && { name: input.name }),
                ...(input.slug !== undefined && { slug: input.slug }),
                ...(input.bio !== undefined && { bio: input.bio }),
                ...(input.quote !== undefined && { quote: input.quote }),
                ...(input.coverUrl !== undefined && { cover_url: input.coverUrl }),
                ...(input.portraitUrl !== undefined && { portrait_url: input.portraitUrl }),
                ...(input.dateOfBirth !== undefined && { date_of_birth: input.dateOfBirth }),
                ...(input.dateOfDeath !== undefined && { date_of_death: input.dateOfDeath }),
                ...(input.theme !== undefined && { theme: input.theme }),
                ...(input.isPublic !== undefined && { is_public: input.isPublic }),
                ...(input.timeline !== undefined && { timeline: input.timeline }),
                ...(input.supportTitle !== undefined && { support_title: input.supportTitle }),
                ...(input.supportUrl !== undefined && { support_url: input.supportUrl }),
                ...(input.supportDesc !== undefined && { support_desc: input.supportDesc }),
                ...(input.country !== undefined && { country: input.country }),
            })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return mapRow(data);
    }

    async delete(id: string): Promise<void> {
        const { error } = await this.db.from('memorials').delete().eq('id', id);
        if (error) throw error;
    }
}
