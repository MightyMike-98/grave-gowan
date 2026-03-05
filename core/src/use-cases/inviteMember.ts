/**
 * @file core/src/use-cases/inviteMember.ts
 * @description Use Case: Einen User als Member zu einem Memorial einladen.
 *
 * Nur der Owner eines Memorials darf andere einladen.
 * Der einzuladende User wird per user_id identifiziert (Supabase-Lookup per E-Mail
 * findet im data/-Layer statt, da auth.users nicht direkt aus core erreichbar ist).
 */

import type { MemberRepository } from '../repositories/MemberRepository';
import type { Member } from '../types/index';

export interface InviteMemberInput {
    memorialId: string;
    /** Supabase Auth User-ID des einzuladenden Users */
    userId: string;
    role: 'editor' | 'viewer';
    /** User-ID des einladenden Owners */
    invitedBy: string;
    /** E-Mail-Adresse (nur für Anzeige) */
    invitedEmail?: string;
}

/**
 * Fügt einen User als Member zu einem Memorial hinzu.
 *
 * @throws {Error} wenn der User bereits Member ist oder die Rolle ungültig ist.
 */
export async function inviteMember(
    input: InviteMemberInput,
    repo: MemberRepository,
): Promise<Member> {
    const { memorialId, userId, role, invitedBy, invitedEmail } = input;

    if (!memorialId || !userId || !invitedBy) {
        throw new Error('inviteMember: memorialId, userId und invitedBy sind Pflichtfelder.');
    }

    if (role !== 'editor' && role !== 'viewer') {
        throw new Error(`inviteMember: Ungültige Rolle "${role}". Erlaubt: editor, viewer.`);
    }

    return await repo.add(memorialId, userId, role, invitedBy, invitedEmail);
}
