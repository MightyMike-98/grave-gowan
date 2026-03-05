/**
 * @file data/src/repositories/SupabaseMemberRepository.ts
 * @description Konkrete Supabase-Implementierung des MemberRepository-Interfaces.
 *
 * Akzeptiert einen optionalen Supabase-Client im Konstruktor (Dependency Injection):
 * - Browser (Client Components): kein Argument → verwendet createSupabaseBrowserClient()
 * - Server (Server Components):  Server-Client übergeben → Cookie-basierte Session
 *
 * Mappt Supabase-Zeilen (snake_case) auf Domain-Typen (camelCase).
 *
 * Hinweis: Die getUserByEmail-Methode nutzt die Supabase Admin-API nicht direkt,
 * sondern einen eigenen RPC-Aufruf oder die auth.users-Ansicht, die wir über
 * eine SQL-Funktion freischalten.
 */

import type { MemberRepository } from '@core/repositories/MemberRepository';
import type { Member } from '@core/types/index';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '../browser-client';

/** Mappt eine rohe Datenbankzeile (snake_case) auf das Member-Domain-Objekt (camelCase). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Member {
    return {
        id: row.id,
        memorialId: row.memorial_id,
        userId: row.user_id,
        role: row.role,
        joinedAt: row.joined_at,
        invitedEmail: row.invited_email,
    };
}

/** Supabase-Implementierung des MemberRepository mit optionalem Client-Injection. */
export class SupabaseMemberRepository implements MemberRepository {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly db: SupabaseClient<any, any, any>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(client?: SupabaseClient<any, any, any>) {
        this.db = client ?? createSupabaseBrowserClient();
    }

    async findByMemorialId(memorialId: string): Promise<Member[]> {
        const { data, error } = await this.db
            .from('memorial_members')
            .select('*')
            .eq('memorial_id', memorialId)
            .order('joined_at', { ascending: true });
        if (error) throw error;
        return (data ?? []).map(mapRow);
    }

    async getUserRole(
        memorialId: string,
        userId: string,
    ): Promise<'owner' | 'editor' | 'viewer' | null> {
        const { data, error } = await this.db
            .from('memorial_members')
            .select('role')
            .eq('memorial_id', memorialId)
            .eq('user_id', userId)
            .single();
        if (error) {
            // PGRST116: Kein Ergebnis — User ist kein Member
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data?.role ?? null;
    }

    async add(
        memorialId: string,
        userId: string,
        role: 'editor' | 'viewer',
        invitedBy: string,
        invitedEmail?: string,
    ): Promise<Member> {
        const { data, error } = await this.db
            .from('memorial_members')
            .insert({
                memorial_id: memorialId,
                user_id: userId,
                role,
                invited_by: invitedBy,
                invited_email: invitedEmail ?? null,
            })
            .select()
            .single();
        if (error) throw error;
        return mapRow(data);
    }

    async remove(memberId: string): Promise<void> {
        const { error } = await this.db
            .from('memorial_members')
            .delete()
            .eq('id', memberId);
        if (error) throw error;
    }
}
