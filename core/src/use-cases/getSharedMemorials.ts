/**
 * @file core/src/use-cases/getSharedMemorials.ts
 * @description Use Case: Alle Memorials laden, bei denen der User Editor oder Viewer ist.
 */

import type { MemberRepository, MembershipWithMemorial } from '../repositories/MemberRepository';

/**
 * Lädt alle Memorials, bei denen ein User als Editor oder Viewer eingetragen ist.
 * Wird auf dem Dashboard neben den eigenen Memorials angezeigt.
 */
export async function getSharedMemorials(
    userId: string,
    memberRepo: MemberRepository,
    email?: string,
): Promise<MembershipWithMemorial[]> {
    if (!userId) return [];
    return memberRepo.findMembershipsByUserId(userId, email);
}
