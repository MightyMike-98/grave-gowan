/**
 * @file lib/auth-errors.ts
 * @description Übersetzt rohe Supabase-Auth-Fehlermeldungen (Englisch) in
 * lokalisierte Strings. Supabase gibt Fehler immer auf Englisch zurück,
 * weshalb wir sie clientseitig in die aktuelle App-Sprache mappen.
 */

type Translator = (key: string) => string;

/**
 * Nimmt eine rohe Fehlermeldung von Supabase und gibt eine übersetzte zurück.
 * Unbekannte Fehler werden unverändert durchgereicht, damit nichts verloren geht.
 *
 * @param raw - Die Original-Fehlermeldung (z. B. "Invalid login credentials").
 * @param t - next-intl Translator für den Namespace `authErrors`.
 */
export function translateAuthError(raw: string | null | undefined, t: Translator): string {
    if (!raw) return '';
    const msg = raw.toLowerCase();

    if (msg.includes('invalid login credentials')) return t('invalidCredentials');
    if (msg.includes('email not confirmed')) return t('emailNotConfirmed');
    if (msg.includes('user already registered') || msg.includes('already exists')) return t('userExists');
    if (msg.includes('password should be at least')) return t('passwordTooShort');
    if (msg.includes('password is too weak') || msg.includes('weak password')) return t('passwordWeak');
    if (msg.includes('new password should be different')) return t('passwordSame');
    if (msg.includes('rate limit') || msg.includes('too many requests')) return t('rateLimit');
    if (msg.includes('email link is invalid') || msg.includes('otp_expired') || msg.includes('expired')) return t('linkExpired');
    if (msg.includes('user not found')) return t('userNotFound');
    if (msg.includes('invalid email')) return t('invalidEmail');
    if (msg.includes('signup') && msg.includes('disabled')) return t('signupDisabled');
    if (msg.includes('network') || msg.includes('failed to fetch')) return t('network');

    return raw;
}
