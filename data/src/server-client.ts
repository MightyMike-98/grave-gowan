/**
 * @file data/src/server-client.ts
 * @description Supabase Server-Client für Server Components und Route Handlers.
 *
 * Liest/schreibt Sessions aus Next.js Cookies via @supabase/ssr.
 * Muss async/await sein (cookies() ist in Next.js 15+ async).
 *
 * Verwendung:
 * - Server Components: `const supabase = await createSupabaseServerClient()`
 * - Route Handlers: gleiche Vorgehensweise
 *
 * NICHT im Browser verwenden → dafür browser-client.ts.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Erstellt einen serverseitigen Supabase-Client, der die Session
 * aus den Next.js Request-Cookies liest und aktualisiert.
 *
 * @returns Fertiger Server-Supabase-Client.
 */
export async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options),
                        );
                    } catch {
                        // setAll kann in Server Components nicht aufgerufen werden.
                        // Wird ignoriert, da die Middleware die Session-Aktualisierung übernimmt.
                    }
                },
            },
        },
    );
}
