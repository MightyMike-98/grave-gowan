/**
 * @file data/src/browser-client.ts
 * @description Supabase Browser-Client mit Cookie-basierter Session-Verwaltung.
 *
 * Wird ausschließlich in Client Components ('use client') und Browser-Kontext verwendet.
 * Nutzt @supabase/ssr, damit Sessions als Cookies gespeichert werden – was Next.js
 * Server Components und Middleware korrekt lesen können.
 *
 * NICHT für Server Components oder Route Handlers verwenden → dafür server-client.ts.
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Erstellt einen Supabase-Client für den Browser.
 * Jeder Aufruf gibt dieselbe gecachte Instanz zurück (intern singleton-artig).
 */
export function createSupabaseBrowserClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
}
