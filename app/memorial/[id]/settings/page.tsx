/**
 * @file app/memorial/[id]/settings/page.tsx
 * @description Member-Verwaltungs-Seite für Memorial Owner.
 *
 * Nur für Owner zugänglich. Zeigt alle aktuellen Mitglieder und erlaubt
 * das Einladen neuer Mitglieder per E-Mail.
 *
 * Server Component: Daten werden serverseitig geladen.
 * Server Actions: Einladen und Entfernen von Members via Form Actions.
 */

import type { Member } from '@core/types/index';
import { SupabaseMemberRepository } from '@data/repositories/SupabaseMemberRepository';
import { SupabaseMemorialRepository } from '@data/repositories/SupabaseMemorialRepository';
import { createSupabaseServerClient } from '@data/server-client';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MemberActions } from './MemberActions';

interface SettingsPageProps {
    params: Promise<{ id: string }>;
}

/** Rendert die Mitglieder-Verwaltungsseite für den Owner eines Memorials. */
export default async function SettingsPage({ params }: SettingsPageProps) {
    const { id: slug } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // Memorial via Slug laden
    const memorialRepo = new SupabaseMemorialRepository(supabase);
    const memorial = await memorialRepo.findBySlug(slug);
    if (!memorial) redirect('/dashboard');

    // Rollenprüfung: nur Owner darf die Settings-Seite sehen
    const memberRepo = new SupabaseMemberRepository(supabase);
    const userRole = await memberRepo.getUserRole(memorial.id, user.id);
    if (userRole !== 'owner') redirect(`/memorial/${slug}`);

    // Alle Members laden (Viewer ausblenden — nur Owner & Editors anzeigen)
    const allMembers: Member[] = await memberRepo.findByMemorialId(memorial.id);
    const members = allMembers.filter(m => m.role !== 'viewer');

    return (
        <main className="min-h-screen bg-stone-100">
            <div className="max-w-lg mx-auto px-6 py-10 space-y-8">

                {/* Header */}
                <header className="space-y-1">
                    <Link
                        href={`/memorial/${slug}`}
                        className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        ← Back to Memorial
                    </Link>
                    <h1 className="text-2xl font-semibold text-stone-800">
                        Team & Access
                    </h1>
                    <p className="text-sm text-stone-500">
                        Manage who has access to <strong>{memorial.name}</strong>.
                    </p>
                </header>

                {/* Mitglieder-Liste */}
                <section className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-stone-100">
                        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
                            Members ({members.length})
                        </h2>
                    </div>
                    <ul className="divide-y divide-stone-100">
                        {members.map((member) => (
                            <MemberRow
                                key={member.id}
                                member={member}
                                currentUserId={user.id}
                                memorialId={memorial.id}
                                memorialSlug={slug}
                            />
                        ))}
                    </ul>
                </section>

                {/* Einladen-Formular (Client Component) */}
                <section className="bg-white rounded-xl shadow-sm p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
                        Invite Someone
                    </h2>
                    <MemberActions
                        memorialId={memorial.id}
                        memorialSlug={slug}
                        invitedBy={user.id}
                    />
                </section>

            </div>
        </main>
    );
}

/** Zeigt einen einzelnen Member als Zeile mit Rolle-Badge und Entfernen-Button. */
function MemberRow({
    member,
    currentUserId,
    memorialId,
    memorialSlug,
}: {
    member: Member;
    currentUserId: string;
    memorialId: string;
    memorialSlug: string;
}) {
    const isCurrentUser = member.userId === currentUserId;
    const isOwner = member.role === 'owner';
    const isPending = !member.userId;

    const roleBadge: Record<string, string> = {
        owner: 'bg-amber-50 text-amber-700',
        editor: 'bg-blue-50 text-blue-700',
        viewer: 'bg-stone-100 text-stone-500',
    };

    // Anzeigename: invitedEmail bevorzugen, dann userId, dann Fallback
    const displayName = member.invitedEmail || member.userId || 'Unknown';
    const initials = displayName.slice(0, 2).toUpperCase();

    return (
        <li className="flex items-center justify-between px-5 py-3 gap-3">
            <div className="flex items-center gap-3 min-w-0">
                {/* Avatar Placeholder */}
                <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-stone-500 text-sm font-medium">
                        {initials}
                    </span>
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">
                        {isCurrentUser ? 'You' : displayName}
                    </p>
                    <p className="text-xs text-stone-400 truncate">
                        {isPending ? 'Pending Invite' : new Date(member.joinedAt).toLocaleDateString('de-DE')}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${roleBadge[member.role]}`}>
                    {member.role}
                </span>

                {/* Owner kann nicht entfernt werden; der Owner kann sich selbst nicht entfernen */}
                {!isOwner && !isCurrentUser && (
                    <form action={`/api/members/${member.id}/remove`} method="POST">
                        <input type="hidden" name="memorialSlug" value={memorialSlug} />
                        <input type="hidden" name="memorialId" value={memorialId} />
                        <button
                            type="submit"
                            className="text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                        >
                            Remove
                        </button>
                    </form>
                )}
            </div>
        </li>
    );
}
