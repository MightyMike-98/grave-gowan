/**
 * @file app/dashboard/page.tsx
 * @description Owner-Dashboard — lädt echte Memorials des eingeloggten Nutzers.
 *
 * Server Component: Die Session wird serverseitig aus Cookies gelesen.
 * Nicht eingeloggte Nutzer werden durch proxy.ts zu /login weitergeleitet.
 *
 * Datenfluss:
 *   Supabase Auth (Session) → getMemorialsByOwner (Use Case) → SupabaseMemorialRepository → DB
 */

import { SignOutButton } from '@/components/ui/SignOutButton';
import type { Memorial } from '@core/types/index';
import { getMemorialsByOwner } from '@core/use-cases/getMemorialsByOwner';
import { SupabaseMemorialRepository } from '@data/repositories/SupabaseMemorialRepository';
import { createSupabaseServerClient } from '@data/server-client';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

/**
 * Rendert das Owner-Dashboard mit echten Memorials aus Supabase.
 * Zeigt Leer-Zustand wenn noch keine Memorials vorhanden.
 */
export default async function DashboardPage() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const email = user.email ?? '';
    const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
    const displayName =
        (user.user_metadata?.full_name as string | undefined) ??
        email.split('@')[0];

    /**
     * Lädt die Memorials des eingeloggten Users via Use Case.
     * Gibt [] zurück wenn die Tabelle noch nicht existiert oder leer ist.
     */
    let memorials: Memorial[] = [];
    try {
        // Server-Client übergeben damit RLS die Cookie-Session korrekt liest
        const repo = new SupabaseMemorialRepository(supabase);
        memorials = await getMemorialsByOwner(user.id, repo);
    } catch (err) {
        // Tabelle existiert noch nicht → leeres Array, kein Crash
        console.warn('[Dashboard] Could not load memorials (table may not exist yet):', err);
    }

    return (
        <main className="min-h-screen bg-stone-100">
            <div className="max-w-lg mx-auto px-6 py-10 space-y-6">

                {/* Header: Begrüßung + Sign-Out */}
                <header className="flex items-start justify-between mb-2">
                    <div>
                        <h2 className="text-xl font-semibold text-stone-800">
                            Welcome, {displayName.split(' ')[0]}
                        </h2>
                        <p className="text-stone-400 text-sm mt-0.5">{email}</p>
                    </div>
                    <SignOutButton />
                </header>

                <h1 className="text-2xl font-semibold text-stone-800">My Memorials</h1>

                {/* + New Memorial */}
                <Link
                    href="/create"
                    className="block w-full border-2 border-dashed border-stone-300 rounded-xl py-8 flex flex-col items-center gap-2 text-stone-400 hover:border-stone-400 hover:text-stone-500 transition-colors bg-white/50 text-center"
                >
                    <span className="text-3xl">+</span>
                    <span className="text-lg font-medium">New Memorial</span>
                </Link>

                {/* Echte Memorials aus der DB */}
                {memorials.length === 0 ? (
                    <div className="text-center py-10 text-stone-400">
                        <p className="text-4xl mb-3">🕊️</p>
                        <p className="text-sm">No memorials yet. Create your first one above.</p>
                        {/* Demo-Link zum Anschauen */}
                        <Link
                            href="/memorial/demo"
                            className="mt-4 inline-block text-xs text-stone-400 underline hover:text-stone-600"
                        >
                            View demo memorial →
                        </Link>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {memorials.map((memorial) => (
                            <li key={memorial.id}>
                                <MemorialCard memorial={memorial} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
}

/**
 * Kachel für ein einzelnes Memorial im Dashboard.
 * Zeigt Name, Daten und Edit/View-Buttons.
 */
function MemorialCard({ memorial }: { memorial: Memorial }) {
    const dateRange = [
        memorial.dateOfBirth ? new Date(memorial.dateOfBirth).getFullYear() : null,
        memorial.dateOfDeath ? new Date(memorial.dateOfDeath).getFullYear() : null,
    ]
        .filter(Boolean)
        .join(' – ');

    return (
        <article className="bg-white rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
                {/* Porträt oder Initialen */}
                {memorial.portraitUrl ? (
                    <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-stone-200">
                        <Image
                            src={memorial.portraitUrl}
                            alt={memorial.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                        />
                    </div>
                ) : (
                    <div className="w-14 h-14 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-stone-500 text-xl font-light">
                            {memorial.name.charAt(0)}
                        </span>
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-stone-800 truncate">{memorial.name}</h2>
                    {dateRange && <p className="text-sm text-stone-500">{dateRange}</p>}
                    {/* Öffentlich / Privat Badge */}
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full uppercase tracking-wide font-medium ${memorial.isPublic
                        ? 'bg-green-50 text-green-600'
                        : 'bg-stone-100 text-stone-400'
                        }`}>
                        {memorial.isPublic ? 'Public' : 'Private'}
                    </span>
                </div>
            </div>

            <div className="flex gap-3">
                <Link
                    href={`/create?id=${memorial.id}`}
                    className="flex-1 text-center bg-stone-100 text-stone-700 font-medium py-3 rounded-lg hover:bg-stone-200 transition-colors text-sm"
                >
                    Edit
                </Link>
                <Link
                    href={`/memorial/${memorial.slug}`}
                    className="flex-1 text-center bg-stone-800 text-stone-100 font-medium py-3 rounded-lg hover:bg-stone-900 transition-colors text-sm"
                >
                    View
                </Link>
            </div>
        </article>
    );
}
