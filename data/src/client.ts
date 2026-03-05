/**
 * @file data/src/client.ts
 * @description Supabase Client Singleton für die Web-App.
 *
 * Erstellt eine einzige Supabase-Instanz für den gesamten data/-Layer.
 * Diese Datei darf NIE direkt von UI-Komponenten importiert werden —
 * nur von Repository-Implementierungen in data/src/repositories/.
 *
 * Credentials kommen aus .env.local (gitignored, nie ins Repo einchecken).
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Supabase environment variables are missing. ' +
        'Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
    );
}

/**
 * Geteilter Supabase Client.
 * Wird von allen Repository-Implementierungen importiert und genutzt.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
