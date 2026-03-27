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

import type { MemberRepository, MembershipWithMemorial } from '@core/repositories/MemberRepository';
import type { Member, Memorial } from '@core/types/index';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '../browser-client';

/** Mappt eine rohe Memorial-Datenbankzeile (snake_case) auf das Memorial-Domain-Objekt. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMemorialRow(row: any): Memorial {
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
        candleCount: row.candle_count ?? 0,
        flowerCount: row.flower_count ?? 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

/** Mappt eine rohe Member-Datenbankzeile (snake_case) auf das Member-Domain-Objekt (camelCase). */
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

    async findMembershipsByUserId(userId: string, email?: string): Promise<MembershipWithMemorial[]> {
        // Suche nach user_id ODER invited_email (für Einladungen wo user_id noch NULL ist)
        let query = this.db
            .from('memorial_members')
            .select('role, memorials(*)')
            .in('role', ['editor', 'viewer'])
            .order('joined_at', { ascending: false });

        if (email) {
            query = query.or(`user_id.eq.${userId},invited_email.ilike.${email}`);
        } else {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Deduplizieren falls ein Memorial sowohl per user_id als auch per email matcht
        const seen = new Set<string>();
        return (data ?? [])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((row: any) => {
                if (!row.memorials) return false;
                if (seen.has(row.memorials.id)) return false;
                seen.add(row.memorials.id);
                return true;
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((row: any): MembershipWithMemorial => ({
                role: row.role,
                memorial: mapMemorialRow(row.memorials),
            }));
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
