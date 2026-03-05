/**
 * @file app/auth/callback/route.ts
 * @description OAuth Callback Route Handler.
 *
 * Supabase leitet nach einem erfolgreichen Google-Login hierher weiter.
 * Dieser Handler tauscht den temporären "code" (aus der URL) gegen eine
 * echte Supabase-Session aus und setzt die Session-Cookies.
 *
 * Nach erfolgreichem Austausch → Weiterleitung zum Dashboard.
 * Bei Fehler → Weiterleitung zur Login-Seite mit Fehlermeldung.
 *
 * URL-Parameter:
 * - code: Der von Supabase generierte einmalige Auth-Code
 * - next: Optionale Ziel-URL nach dem Login (Standard: /dashboard)
 */

import { createSupabaseServerClient } from '@data/server-client';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Verarbeitet den OAuth-Callback von Supabase.
 * Tauscht auth code gegen Session aus und leitet weiter.
 *
 * @param request - Der eingehende GET-Request von Supabase.
 */
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);

    // Der einmalige Auth-Code, den Supabase als URL-Parameter mitschickt
    const code = searchParams.get('code');

    // Optionale Ziel-URL (z. B. wenn Nutzer auf eine geschützte Route zugegriffen hat)
    const next = searchParams.get('next') ?? '/dashboard';

    if (code) {
        const supabase = await createSupabaseServerClient();

        // Tauscht den Code gegen eine echte Session aus (setzt Cookies)
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Erfolg: Weiterleitung zur Ziel-URL
            return NextResponse.redirect(`${origin}${next}`);
        }

        // Fehler beim Code-Austausch
        console.error('[Auth Callback] Code exchange failed:', error.message);
    }

    // Kein Code vorhanden oder Fehler: zurück zur Login-Seite
    return NextResponse.redirect(
        `${origin}/login?error=Authentication failed. Please try again.`,
    );
}
