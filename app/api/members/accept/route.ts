/**
 * @file app/api/members/accept/route.ts
 * @description API Route: Bestätigt eine Einladung zu einem Memorial.
 *
 * POST /api/members/accept
 * Body: { token } (token = memorial_members.id)
 *
 * Setzt invite_status von 'pending' auf 'accepted' und verknüpft
 * den eingeloggten User mit dem Mitgliedseintrag.
 */

import { createSupabaseServerClient } from '@data/server-client';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ error: 'Missing token.' }, { status: 400 });
        }

        const supabase = await createSupabaseServerClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated. Please sign in first.' }, { status: 401 });
        }

        // Service-Role-Client: umgeht RLS, damit wir die Einladung auch dann
        // lesen/aktualisieren können, wenn der aktuell eingeloggte User nicht
        // der eingeladene ist (z. B. um "Falscher Account" zu erkennen).
        // Der Token ist eine UUID — nur wer den Link hat, kennt ihn.
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceKey) {
            console.error('[accept] Server config missing');
            return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
        }
        const admin = createClient(supabaseUrl, serviceKey);

        // Einladung laden (bypasst RLS)
        const { data: invite, error: fetchError } = await admin
            .from('memorial_members')
            .select('id, memorial_id, invited_email, invite_status, user_id')
            .eq('id', token)
            .maybeSingle();

        if (fetchError || !invite) {
            return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 });
        }

        if (invite.invite_status === 'accepted') {
            return NextResponse.json({ success: true, alreadyAccepted: true, memorialId: invite.memorial_id });
        }

        // Prüfen ob die E-Mail übereinstimmt
        const userEmail = user.email?.toLowerCase();
        if (invite.invited_email && userEmail !== invite.invited_email) {
            return NextResponse.json(
                {
                    error: `This invitation was sent to ${invite.invited_email}. Please sign in with that email.`,
                    code: 'wrong_account',
                    invitedEmail: invite.invited_email,
                    currentEmail: userEmail ?? null,
                },
                { status: 403 },
            );
        }

        // Einladung annehmen (bypasst RLS)
        const { error: updateError } = await admin
            .from('memorial_members')
            .update({
                invite_status: 'accepted',
                user_id: user.id,
            })
            .eq('id', token);

        if (updateError) {
            console.error('[accept] Update error:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, memorialId: invite.memorial_id });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[accept] Unexpected error:', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
