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
export async function signInWithGoogle(next?: string): Promise<{ error: string | null }> {
    const supabase = createSupabaseBrowserClient();
    const redirectTo = next
        ? `${APP_URL}/auth/callback?next=${encodeURIComponent(next)}`
        : `${APP_URL}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo,
            queryParams: {
                prompt: 'select_account',
            },
        },
    });
    return { error: error?.message ?? null };
}

/**
 * Registriert einen neuen Nutzer mit E-Mail und Passwort.
 * Nach der Registrierung wird eine Bestätigungs-E-Mail gesendet.
 *
 * @param email - Die E-Mail-Adresse des Nutzers.
 * @param password - Das gewählte Passwort (min. 6 Zeichen).
 * @returns Fehler-Objekt oder null bei Erfolg.
 */
export async function signUpWithEmail(email: string, password: string, next?: string, locale?: string): Promise<{ error: string | null }> {
    if (!email || !email.includes('@')) {
        return { error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
        return { error: 'Password must be at least 6 characters.' };
    }

    const supabase = createSupabaseBrowserClient();
    const redirectTo = next
        ? `${APP_URL}/auth/callback?next=${encodeURIComponent(next)}`
        : `${APP_URL}/auth/callback`;
    const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
            emailRedirectTo: redirectTo,
            data: { locale: locale ?? 'de' },
        },
    });
    if (error) return { error: error.message };

    // Supabase returns an empty identities array for already-registered emails
    // (user_repeated_signup) without raising an error.
    if (data.user && data.user.identities?.length === 0) {
        return { error: 'An account with this email already exists. Please sign in instead.' };
    }

    return { error: null };
}

/**
 * Meldet einen bestehenden Nutzer mit E-Mail und Passwort an.
 *
 * @param email - Die E-Mail-Adresse des Nutzers.
 * @param password - Das Passwort.
 * @returns Fehler-Objekt oder null bei Erfolg.
 */
export async function signInWithEmail(email: string, password: string): Promise<{ error: string | null; needsSetup?: boolean }> {
    if (!email || !email.includes('@')) {
        return { error: 'Please enter a valid email address.' };
    }

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
    });
    if (error) return { error: error.message };
    const needsSetup = !data.user?.user_metadata?.setup_complete;
    return { error: null, needsSetup };
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
