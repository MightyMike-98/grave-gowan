/**
 * @file data/src/auth.ts
 * @description Auth-Funktionen für die Cloudyard-App.
 *
 * Kapselt alle Supabase-Auth-Operationen. Diese Funktionen werden von
 * Client Components über den Browser-Client aufgerufen.
 *
 * Unterstützte Auth-Methoden:
 * - Google OAuth (Redirect-based)
 * - Magic Link (Passwordless Email)
 * - Sign Out
 *
 * Alle Funktionen geben strukturierte Ergebnisse zurück (Result-Pattern):
 * { data, error } – niemals rohe Exceptions.
 */

import { createSupabaseBrowserClient } from './browser-client';

/** Basis-URL der App — wird für OAuth Redirect-URLs verwendet. */
const APP_URL =
    typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/**
 * Leitet den Nutzer zur Google OAuth-Seite weiter.
 * Nach erfolgreichem Login kommt der Nutzer zurück zu `/auth/callback`,
 * welches dann zur Dashboard-Seite weiterleitet.
 *
 * @returns Fehler-Objekt wenn etwas schief geht, sonst null.
 */
export async function signInWithGoogle(): Promise<{ error: string | null }> {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${APP_URL}/auth/callback`,
            queryParams: {
                prompt: 'select_account',   // Google Account-Auswahl immer anzeigen
            },
        },
    });
    return { error: error?.message ?? null };
}

/**
 * Sendet einen Magic Link (Passwordless Email) an die angegebene E-Mail-Adresse.
 * Der Nutzer klickt den Link und wird direkt eingeloggt — kein Passwort nötig.
 *
 * @param email - Die E-Mail-Adresse des Nutzers.
 * @returns Fehler-Objekt oder null bei Erfolg.
 */
export async function signInWithMagicLink(email: string): Promise<{ error: string | null }> {
    if (!email || !email.includes('@')) {
        return { error: 'Please enter a valid email address.' };
    }

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
            emailRedirectTo: `${APP_URL}/auth/callback`,
        },
    });
    return { error: error?.message ?? null };
}

/**
 * Meldet den aktuell eingeloggten Nutzer ab und leert die Session.
 *
 * @returns Fehler-Objekt oder null bei Erfolg.
 */
export async function signOut(): Promise<{ error: string | null }> {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();
    return { error: error?.message ?? null };
}

/**
 * Lädt den aktuell eingeloggten Nutzer aus der lokalen Session.
 * Gibt null zurück wenn niemand eingeloggt ist.
 *
 * @returns User-Objekt oder null.
 */
export async function getCurrentUser() {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}
