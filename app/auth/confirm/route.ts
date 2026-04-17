/**
 * @file app/auth/confirm/route.ts
 * @description Confirmation Route für Supabase Auth Emails (Signup, Recovery, etc.)
 *
 * Die Supabase Email-Templates linken auf diese Route (statt auf supabase.co),
 * damit alle Email-Links zu memorialyard.com gehen. Dadurch vertrauen E-Mail-Provider
 * (web.de, Hotmail, …) den Links und die Mails landen nicht im Spam.
 *
 * Template-Link-Format:
 *   https://memorialyard.com/auth/confirm?token_hash={{ .TokenHash }}&type=signup&redirect_to=/dashboard
 *
 * Unterstützte `type`-Werte (Supabase EmailOtpType):
 *   signup | invite | magiclink | recovery | email_change | email
 */

import { createSupabaseServerClient } from '@data/server-client';
import type { EmailOtpType } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);

    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;
    const redirect_to = searchParams.get('redirect_to') ?? '/dashboard';

    if (token_hash && type) {
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });

        if (!error) {
            // Recovery: direkt zur Reset-Seite (Setup-Check überspringen)
            if (type === 'recovery') {
                return NextResponse.redirect(`${origin}/reset-password`);
            }

            // Setup noch nicht abgeschlossen → Setup-Seite
            const setupComplete = data.user?.user_metadata?.setup_complete;
            if (!setupComplete) {
                const setupUrl = redirect_to !== '/dashboard'
                    ? `${origin}/setup?next=${encodeURIComponent(redirect_to)}`
                    : `${origin}/setup`;
                return NextResponse.redirect(setupUrl);
            }

            // Nur relative Pfade zulassen (Open-Redirect verhindern)
            const safeTarget = redirect_to.startsWith('/') ? redirect_to : '/dashboard';
            return NextResponse.redirect(`${origin}${safeTarget}`);
        }

        console.error('[Auth Confirm] verifyOtp failed:', error.message);
    }

    return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Confirmation link invalid or expired. Please try again.')}`,
    );
}
