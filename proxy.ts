/**
 * @file proxy.ts
 * @description Next.js Proxy (ehemals Middleware) — läuft vor jedem Request auf dem Server.
 *
 * In Next.js 16 wurde middleware.ts zu proxy.ts umbenannt/umgestellt.
 *
 * Aufgaben:
 * 1. Supabase-Session aus Cookies aktualisieren (Access Token Refresh)
 * 2. Geschützte Routen absichern: /dashboard und /create erfordern Login
 *
 * @see https://nextjs.org/docs/messages/middleware-to-proxy
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Routen, für die ein eingeloggter Nutzer erforderlich ist. */
const PROTECTED_ROUTES = ['/dashboard', '/create'];

/**
 * Next.js Proxy-Funktion (Next.js 16+).
 * Wird bei jedem Request ausgeführt (entsprechend dem `config.matcher`).
 *
 * @param request - Der eingehende HTTP-Request.
 */
export async function proxy(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    // Supabase-Client: liest und schreibt Session-Cookies direkt auf dem Request
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value),
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options),
                    );
                },
            },
        },
    );

    // getUser() triggert intern den Token-Refresh wenn nötig
    const { data: { user } } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Geschützte Routen: umleiten wenn nicht eingeloggt
    // Ausnahme: /create mit visitor_email (Guest-Editor braucht keinen Login)
    const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
    const hasVisitorEmail = request.nextUrl.searchParams.has('visitor_email');
    if (isProtected && !user && !hasVisitorEmail) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Eingeloggte Nutzer von der Login-Seite direkt zum Dashboard leiten
    if (pathname === '/login' && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return supabaseResponse;
}

/** Welche Routen sollen durch den Proxy laufen? */
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
