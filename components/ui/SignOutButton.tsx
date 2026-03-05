/**
 * @file components/ui/SignOutButton.tsx
 * @description Client Component für den Sign-Out-Button.
 *
 * Nutzt window.location.href statt router.push/refresh für einen zuverlässigen
 * vollständigen Seiten-Reload nach dem Abmelden. Das löscht den Next.js
 * Router-Cache vollständig und verhindert Race-Conditions mit Server Components.
 */

'use client';

import { signOut } from '@data/auth';
import { useState } from 'react';

/**
 * Rendert einen kleinen "Sign out"-Button.
 * Nach dem Abmelden wird die Seite komplett neu geladen (window.location.href).
 */
export function SignOutButton() {
    const [loading, setLoading] = useState(false);

    /**
     * Meldet den Nutzer bei Supabase ab und lädt die App neu.
     * window.location.href ist zuverlässiger als router.refresh() bei Auth-Flows.
     */
    const handleSignOut = async () => {
        setLoading(true);
        await signOut();
        window.location.href = '/';
    };

    return (
        <button
            onClick={handleSignOut}
            disabled={loading}
            className="text-stone-400 text-sm hover:text-stone-700 disabled:opacity-50 transition-colors"
        >
            {loading ? 'Signing out…' : 'Sign out'}
        </button>
    );
}
