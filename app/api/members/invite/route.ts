/**
 * @file app/api/members/invite/route.ts
 * @description API Route: Lädt jemanden per E-Mail zu einem Memorial ein
 * und sendet eine Einladungs-Email über Zoho SMTP.
 *
 * POST /api/members/invite
 * Body: { email, role, memorialId, invitedBy, memorialSlug }
 */

import { createSupabaseServerClient } from '@data/server-client';
import { editorInviteEmail } from '@/lib/email-templates';
import { sendEmail } from '@/lib/mailer';
import { NextRequest, NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://memorialyard.com';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, role, memorialId, invitedBy, memorialSlug, locale } = body;

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

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        }

        if (user.id !== invitedBy) {
            return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
        }

        const cleanEmail = email.trim().toLowerCase();

        // User-ID per E-Mail nachschlagen
        let targetUserId: string | null = null;
        const { data: foundUserId } = await supabase.rpc('get_user_id_by_email', {
            lookup_email: cleanEmail,
        });
        if (foundUserId) {
            targetUserId = foundUserId;
        }

        // In memorial_members eintragen (direkt als accepted)
        const { error: insertError } = await supabase
            .from('memorial_members')
            .insert({
                memorial_id: memorialId,
                user_id: targetUserId,
                role,
                invited_by: invitedBy,
                invited_email: cleanEmail,
                invite_status: 'accepted',
            });

        if (insertError) {
            if (insertError.message.includes('unique') || insertError.message.includes('duplicate')) {
                return NextResponse.json(
                    { error: 'This email is already invited to this memorial.' },
                    { status: 409 },
                );
            }
            console.error('[invite] Insert error:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        // Send invitation email
        try {
            // Get memorial name and inviter name
            const { data: memorial } = await supabase
                .from('memorials')
                .select('name')
                .eq('id', memorialId)
                .single();

            const inviterName = user.user_metadata?.display_name ?? user.email ?? 'Jemand';
            const recipientName = cleanEmail.split('@')[0];
            const memorialName = memorial?.name ?? 'ein Memorial';
            const slug = memorialSlug ?? memorialId;

            const en = locale === 'en';
            const html = editorInviteEmail({
                recipientName,
                memorialName,
                inviterName,
                registerUrl: `${APP_URL}/login`,
                memorialUrl: `${APP_URL}/memorial/${slug}`,
                locale,
            });

            await sendEmail({
                to: cleanEmail,
                subject: en
                    ? `You've been invited as an editor – ${memorialName}`
                    : `Du wurdest als Editor eingeladen – ${memorialName}`,
                html,
            });
        } catch (emailErr) {
            // Don't fail the invite if email sending fails
            console.error('[invite] Email sending failed:', emailErr);
        }

        return NextResponse.json(
            { success: true },
            { status: 201 },
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[invite] Unexpected error:', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
