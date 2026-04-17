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

/** `gowan.mohammed@x.com` → `Gowan Mohammed`. Nur als Fallback, wenn kein echter Name hinterlegt ist. */
function prettifyEmailPrefix(email: string): string {
    const prefix = email.split('@')[0] ?? email;
    return prefix
        .replace(/[._-]+/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

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

        // User-Profil per E-Mail nachschlagen (id + full_name).
        // Gibt es kein Konto, bleiben beide Werte null.
        let targetUserId: string | null = null;
        let targetFullName: string | null = null;
        const { data: foundProfile } = await supabase
            .rpc('get_user_profile_by_email', { lookup_email: cleanEmail });
        if (Array.isArray(foundProfile) && foundProfile.length > 0) {
            targetUserId = foundProfile[0].id ?? null;
            targetFullName = foundProfile[0].full_name ?? null;
        }

        // Check if a membership already exists (e.g. viewer who saved the memorial)
        const { data: existing } = await supabase
            .from('memorial_members')
            .select('id, role, invite_status')
            .eq('memorial_id', memorialId)
            .or(targetUserId
                ? `user_id.eq.${targetUserId},invited_email.eq.${cleanEmail}`
                : `invited_email.eq.${cleanEmail}`)
            .maybeSingle();

        let memberId: string;

        if (existing) {
            if (existing.role === 'editor' || existing.role === 'owner') {
                return NextResponse.json(
                    { error: 'This person already has editor or owner access.' },
                    { status: 409 },
                );
            }
            // Upgrade viewer → editor (pending until accepted)
            const { error: updateError } = await supabase
                .from('memorial_members')
                .update({
                    role,
                    invited_by: invitedBy,
                    invited_email: cleanEmail,
                    invite_status: 'pending',
                })
                .eq('id', existing.id);

            if (updateError) {
                console.error('[invite] Update error:', updateError);
                return NextResponse.json({ error: updateError.message }, { status: 500 });
            }
            memberId = existing.id;
        } else {
            const { data: inserted, error: insertError } = await supabase
                .from('memorial_members')
                .insert({
                    memorial_id: memorialId,
                    user_id: targetUserId,
                    role,
                    invited_by: invitedBy,
                    invited_email: cleanEmail,
                    invite_status: 'pending',
                })
                .select('id')
                .single();

            if (insertError) {
                console.error('[invite] Insert error:', insertError);
                return NextResponse.json({ error: insertError.message }, { status: 500 });
            }
            memberId = inserted.id;
        }

        // Send invitation email
        try {
            // Get memorial name and inviter name
            const { data: memorial } = await supabase
                .from('memorials')
                .select('name')
                .eq('id', memorialId)
                .single();

            const inviterName =
                (user.user_metadata?.full_name as string | undefined)
                ?? (user.user_metadata?.display_name as string | undefined)
                ?? user.email
                ?? 'Jemand';

            // Empfänger-Name: echter Name aus dem Profil (falls Konto existiert),
            // sonst hübsch formatierter E-Mail-Präfix als Fallback
            const recipientName = targetFullName ?? prettifyEmailPrefix(cleanEmail);

            const memorialName = memorial?.name ?? 'ein Memorial';
            const slug = memorialSlug ?? memorialId;

            const en = locale === 'en';
            const acceptUrl = `${APP_URL}/invite/accept?token=${memberId}`;
            const html = editorInviteEmail({
                recipientName,
                memorialName,
                inviterName,
                acceptUrl,
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
