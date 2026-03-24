/**
 * @file core/src/repositories/MemberRepository.ts
 * @description Abstraktes Repository-Interface für Memorial Member Operationen.
 *
 * Definiert WELCHE Datenbankoperationen für Mitglieder möglich sind —
 * aber NICHT WIE sie implementiert werden. Die konkrete Implementierung
 * liegt in data/src/repositories/SupabaseMemberRepository.ts.
 */

import type { Member, Memorial } from '../types/index';

/** Membership mit Rolle und zugehörigem Memorial. */
export interface MembershipWithMemorial {
    role: 'editor' | 'viewer';
    memorial: Memorial;
}

/** Abstraktes Interface für alle Datenbankoperationen auf memorial_members. */
export interface MemberRepository {
    /**
     * Lädt alle Memorials, bei denen ein User als Editor oder Viewer eingetragen ist
     * (nicht als Owner — die kommen über MemorialRepository.findByOwnerId).
     * Sucht sowohl nach user_id als auch nach invited_email (für Einladungen ohne Account).
     */
    findMembershipsByUserId(userId: string, email?: string): Promise<MembershipWithMemorial[]>;
    /**
     * Lädt alle Mitglieder eines Memorials (Owner, Editors, Viewer).
     */
    findByMemorialId(memorialId: string): Promise<Member[]>;

    /**
     * Ermittelt die Rolle eines bestimmten Users in einem Memorial.
     * @returns Die Rolle oder null, wenn der User kein Mitglied ist.
     */
    getUserRole(memorialId: string, userId: string): Promise<'owner' | 'editor' | 'viewer' | null>;

    /**
     * Fügt einen User als Member zu einem Memorial hinzu.
     * Schlägt fehl, wenn der User bereits Member ist (UNIQUE-Constraint).
     */
    add(
        memorialId: string,
        userId: string,
        role: 'editor' | 'viewer',
        invitedBy: string,
        invitedEmail?: string,
    ): Promise<Member>;

    /**
     * Entfernt einen Member anhand seiner Member-ID aus dem Memorial.
     */
    remove(memberId: string): Promise<void>;
}
