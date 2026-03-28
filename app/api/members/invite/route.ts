/**
 * @file app/api/members/invite/route.ts
 * @description API Route: Lädt jemanden per E-Mail zu einem Memorial ein.
 *
 * POST /api/members/invite
 * Body: { email, role, memorialId, invitedBy }
 *
 * Ablauf:
 * 1. Prüfen ob der eingeloggte User der Owner ist (RLS macht das automatisch)
 * 2. Prüfen ob die E-Mail bereits einen Supabase-Account hat
 *    - JA → user_id setzen + invited_email speichern
 *    - NEIN → user_id = NULL, nur invited_email setzen (Pending Invite)
 * 3. In memorial_members eintragen
 *
 * So kann man auch Leute einladen, die noch keinen Account haben.
 * Wenn sie sich später registrieren, wird ihr user_id nachgetragen.
 */

import { createSupabaseServerClient } from '@data/server-client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, role, memorialId, invitedBy } = body;

        // Pflichtfelder prüfen
        if (!email || !role || !memorialId || !invitedBy) {
            return NextResponse.json(
                { error: 'Missing required fields: email, role, memorialId, invitedBy.' },
                { status: 400 },
            );
        }

        if (role !== 'editor') {
            return NextResponse.json(
                { error: 'Role must be "editor".' },
                { status: 400 },
            );
        }

        const supabase = await createSupabaseServerClient();

        // Auth Check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        }

        // Sicherheitscheck: invitedBy muss der eingeloggte User sein
        if (user.id !== invitedBy) {
            return NextResponse.json({ error: 'Forbidden: invitedBy does not match authenticated user.' }, { status: 403 });
        }

        const cleanEmail = email.trim().toLowerCase();

        // User-ID per E-Mail nachschlagen (RPC-Funktion, braucht keinen Admin-Zugang)
        let targetUserId: string | null = null;
        const { data: foundUserId } = await supabase.rpc('get_user_id_by_email', {
            lookup_email: cleanEmail,
        });
        if (foundUserId) {
            targetUserId = foundUserId;
        }

        // In memorial_members eintragen
        const { error: insertError } = await supabase
            .from('memorial_members')
            .insert({
                memorial_id: memorialId,
                user_id: targetUserId,  // null wenn kein Account existiert
                role,
                invited_by: invitedBy,
                invited_email: cleanEmail,
            });

        if (insertError) {
            // Duplicate check
            if (insertError.message.includes('unique') || insertError.message.includes('duplicate')) {
                return NextResponse.json(
                    { error: 'This email is already invited to this memorial.' },
                    { status: 409 },
                );
            }
            console.error('[invite] Insert error:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json(
            { success: true, pending: targetUserId === null },
            { status: 201 },
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[invite] Unexpected error:', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
