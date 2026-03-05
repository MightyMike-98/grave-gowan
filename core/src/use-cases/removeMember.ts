/**
 * @file core/src/use-cases/removeMember.ts
 * @description Use Case: Einen Member aus einem Memorial entfernen.
 *
 * Nur der Owner des Memorials darf Members entfernen.
 * Der Owner selbst kann nicht entfernt werden (Schutz in der Implementierung).
 */

import type { MemberRepository } from '../repositories/MemberRepository';

/**
 * Entfernt einen Member (per memberId) aus dem Memorial.
 * Die Authorization (ist der aufrufende User der Owner?) wird über die
 * RLS Policy in Supabase sichergestellt.
 *
 * @throws {Error} wenn memberId leer ist.
 */
export async function removeMember(
    memberId: string,
    repo: MemberRepository,
): Promise<void> {
    if (!memberId) {
        throw new Error('removeMember: memberId ist ein Pflichtfeld.');
    }

    await repo.remove(memberId);
}
