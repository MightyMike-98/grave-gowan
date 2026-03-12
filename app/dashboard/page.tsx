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
 */
export default async function DashboardPage() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const email = user.email ?? '';
    const displayName =
        (user.user_metadata?.full_name as string | undefined) ??
        email.split('@')[0];

    let memorials: Memorial[] = [];
    try {
        const repo = new SupabaseMemorialRepository(supabase);
        memorials = await getMemorialsByOwner(user.id, repo);
    } catch (err) {
        console.warn('[Dashboard] Could not load memorials (table may not exist yet):', err);
    }

    return (
        <main className="min-h-screen px-4 py-16">
            <div className="mx-auto max-w-xl animate-fade-up">
                {/* Header: Begrüßung + Sign-Out */}
                <header className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl tracking-tight">
                            Welcome, {displayName.split(' ')[0]}
                        </h1>
                        <p className="mt-1 text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>{email}</p>
                    </div>
                    <SignOutButton />
                </header>

                <h2 className="mt-10 text-xl tracking-tight">
                    My Memorials
                </h2>

                <div className="mt-5 space-y-4">
                    {/* + New Memorial */}
                    <div className="rounded-xl border border-dashed p-0 shadow-none" style={{ borderColor: 'hsl(var(--border) / 0.7)', backgroundColor: 'transparent' }}>
                        <Link href="/create" className="flex flex-col items-center justify-center py-12 gap-2 transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            <span className="text-3xl font-light">+</span>
                            <span className="text-sm font-light">New Memorial</span>
                        </Link>
                    </div>

                    {/* Echte Memorials aus der DB */}
                    {memorials.length === 0 ? (
                        <div className="text-center py-10" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            <p className="text-4xl mb-3">🕊️</p>
                            <p className="text-sm">No memorials yet. Create your first one above.</p>
                            <Link
                                href="/memorial/demo"
                                className="mt-4 inline-block text-xs underline transition-colors hover:opacity-100"
                                style={{ color: 'hsl(var(--muted-foreground))' }}
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
            </div>
        </main>
    );
}

/**
 * Kachel für ein einzelnes Memorial im Dashboard.
 */
function MemorialCard({ memorial }: { memorial: Memorial }) {
    const dateRange = [
        memorial.dateOfBirth ? new Date(memorial.dateOfBirth).getFullYear() : null,
        memorial.dateOfDeath ? new Date(memorial.dateOfDeath).getFullYear() : null,
    ]
        .filter(Boolean)
        .join(' – ');

    return (
        <article
            className="rounded-xl p-6 shadow-sm transition-shadow duration-300 hover:shadow-md"
            style={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border) / 0.4)',
            }}
        >
            <div className="flex items-center gap-4">
                {/* Porträt oder Initialen */}
                {memorial.portraitUrl ? (
                    <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 shadow-sm">
                        <Image
                            src={memorial.portraitUrl}
                            alt={memorial.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                        />
                    </div>
                ) : (
                    <div
                        className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: 'hsl(var(--muted))' }}
                    >
                        <span className="text-xl font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {memorial.name.charAt(0)}
                        </span>
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium truncate" style={{ fontFamily: 'var(--font-inter)', color: 'hsl(var(--foreground))' }}>
                        {memorial.name}
                    </h3>
                    {dateRange && (
                        <p className="text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {dateRange}
                        </p>
                    )}
                    <span
                        className="inline-block mt-1.5 text-[10px] font-normal uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                            backgroundColor: 'hsl(var(--secondary))',
                            color: 'hsl(var(--secondary-foreground))',
                        }}
                    >
                        {memorial.isPublic ? 'Public' : 'Private'}
                    </span>
                </div>
            </div>

            <div className="mt-5 flex gap-3">
                <Link
                    href={`/create?id=${memorial.id}`}
                    className="flex-1 text-center py-2.5 rounded-lg font-light text-sm shadow-sm transition-colors"
                    style={{
                        backgroundColor: 'transparent',
                        color: 'hsl(var(--foreground))',
                        border: '1px solid hsl(var(--border) / 0.6)',
                    }}
                >
                    Edit
                </Link>
                <Link
                    href={`/memorial/${memorial.slug}`}
                    className="flex-1 text-center py-2.5 rounded-lg font-light text-sm shadow-sm transition-colors"
                    style={{
                        backgroundColor: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                    }}
                >
                    View
                </Link>
            </div>
        </article>
    );
}
