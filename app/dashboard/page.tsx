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

import { CopyLinkButton } from './CopyLinkButton';
import { DashboardHeader } from '@/components/ui/DashboardHeader';
import type { MembershipWithMemorial } from '@core/repositories/MemberRepository';
import type { Memorial } from '@core/types/index';
import { getTranslations } from 'next-intl/server';
import { getMemorialsByOwner } from '@core/use-cases/getMemorialsByOwner';
import { getSharedMemorials } from '@core/use-cases/getSharedMemorials';
import { SupabaseMemberRepository } from '@data/repositories/SupabaseMemberRepository';
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

    // Backfill: Link pending invites to this user (fallback if DB trigger didn't fire)
    // First delete orphaned invite rows where user already has a proper membership,
    // then claim remaining unclaimed rows.
    if (email) {
        const cleanEmail = email.toLowerCase();

        // Find unclaimed invite rows for this email
        const { data: unclaimed } = await supabase
            .from('memorial_members')
            .select('id, memorial_id')
            .eq('invited_email', cleanEmail)
            .is('user_id', null);

        if (unclaimed && unclaimed.length > 0) {
            // Check which memorials this user already has a membership for
            const { data: existing } = await supabase
                .from('memorial_members')
                .select('memorial_id')
                .eq('user_id', user.id);

            const existingMemorialIds = new Set((existing ?? []).map((e: { memorial_id: string }) => e.memorial_id));

            // Delete orphaned duplicates, claim the rest
            const toDelete = unclaimed.filter(r => existingMemorialIds.has(r.memorial_id));
            const toClaim = unclaimed.filter(r => !existingMemorialIds.has(r.memorial_id));

            if (toDelete.length > 0) {
                await supabase.from('memorial_members').delete().in('id', toDelete.map(r => r.id));
            }
            if (toClaim.length > 0) {
                await supabase.from('memorial_members').update({ user_id: user.id }).in('id', toClaim.map(r => r.id));
            }
        }
    }

    let memorials: Memorial[] = [];
    let sharedMemorials: MembershipWithMemorial[] = [];
    try {
        const repo = new SupabaseMemorialRepository(supabase);
        memorials = await getMemorialsByOwner(user.id, repo);
    } catch (err) {
        console.warn('[Dashboard] Could not load memorials (table may not exist yet):', err);
    }
    try {
        const memberRepo = new SupabaseMemberRepository(supabase);
        sharedMemorials = await getSharedMemorials(user.id, memberRepo, email);
    } catch (err) {
        console.error('[Dashboard] Could not load shared memorials:', err);
    }

    // Pending Stories zaehlen fuer alle Memorials wo User Owner oder Editor ist
    let pendingStoryInfos: { memorialId: string; memorialName: string; count: number }[] = [];
    try {
        const allMemorials = [
            ...memorials.map(m => ({ id: m.id, name: m.name })),
            ...sharedMemorials.filter(s => s.role === 'editor').map(s => ({ id: s.memorial.id, name: s.memorial.name })),
        ];
        if (allMemorials.length > 0) {
            const { data: pending } = await supabase
                .from('memorial_stories')
                .select('memorial_id')
                .in('memorial_id', allMemorials.map(m => m.id))
                .eq('status', 'pending');

            if (pending && pending.length > 0) {
                const countMap = new Map<string, number>();
                pending.forEach((r: { memorial_id: string }) => {
                    countMap.set(r.memorial_id, (countMap.get(r.memorial_id) ?? 0) + 1);
                });
                const nameMap = new Map(allMemorials.map(m => [m.id, m.name]));
                pendingStoryInfos = Array.from(countMap.entries()).map(([mid, count]) => ({
                    memorialId: mid,
                    memorialName: nameMap.get(mid) ?? 'Memorial',
                    count,
                }));
            }
        }
    } catch {
        // status column may not exist yet
    }

    // Requests aus memorial_requests laden
    let requestInfos: { id: string; memorialId: string; memorialName: string; author: string; category: string; message: string; hasImage: boolean; imageUrl?: string; isRead: boolean; createdAt: string }[] = [];
    try {
        const allMemorials = [
            ...memorials.map(m => ({ id: m.id, name: m.name })),
            ...sharedMemorials.filter(s => s.role === 'editor').map(s => ({ id: s.memorial.id, name: s.memorial.name })),
        ];
        if (allMemorials.length > 0) {
            const nameMap = new Map(allMemorials.map(m => [m.id, m.name]));
            const { data: reqs } = await supabase
                .from('memorial_requests')
                .select('id, memorial_id, author, category, message, image_url, is_read, created_at')
                .in('memorial_id', allMemorials.map(m => m.id))
                .order('created_at', { ascending: false });

            if (reqs) {
                requestInfos = reqs.map((r: { id: string; memorial_id: string; author: string; category: string; message: string; image_url: string | null; is_read: boolean; created_at: string }) => ({
                    id: r.id,
                    memorialId: r.memorial_id,
                    memorialName: nameMap.get(r.memorial_id) ?? 'Memorial',
                    author: r.author,
                    category: r.category,
                    message: r.message,
                    hasImage: !!r.image_url,
                    imageUrl: r.image_url ?? undefined,
                    isRead: r.is_read,
                    createdAt: r.created_at,
                }));
            }
        }
    } catch {
        // table may not exist yet
    }

    const t = await getTranslations('dashboard');

    return (
        <main className="min-h-screen px-4 py-16">
            <div className="mx-auto max-w-xl animate-fade-up">
                <div className="mb-6">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-light transition-colors hover:opacity-100" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        <span>{t('backToHome')}</span>
                    </Link>
                </div>
                <DashboardHeader displayName={displayName} email={email} pendingStoryInfos={pendingStoryInfos} requests={requestInfos} />

                <h2 className="mt-10 text-xl tracking-tight">
                    {t('myMemorials')}
                </h2>

                <div className="mt-5 space-y-4">
                    <ul className="space-y-4">
                        {memorials.map((memorial) => (
                            <li key={memorial.id}>
                                <MemorialCard memorial={memorial} labels={{ edit: t('edit'), view: t('view'), public: t('public'), private: t('private'), creator: t('creator') }} />
                            </li>
                        ))}
                    </ul>

                    <Link href="/create" className="flex items-center justify-center gap-2 py-4 rounded-xl border border-dashed transition-colors" style={{ borderColor: 'hsl(var(--border) / 0.7)', color: 'hsl(var(--muted-foreground))' }}>
                        <span className="text-lg font-light">+</span>
                        <span className="text-sm font-light">{t('newMemorial')}</span>
                    </Link>
                </div>

                {sharedMemorials.length > 0 && (
                    <>
                        <h2 className="mt-12 text-xl tracking-tight">
                            {t('sharedWithMe')}
                        </h2>
                        <ul className="mt-5 space-y-4">
                            {sharedMemorials.map(({ memorial, role }) => (
                                <li key={memorial.id}>
                                    <MemorialCard memorial={memorial} role={role} labels={{ edit: t('edit'), view: t('view'), public: t('public'), private: t('private'), creator: t('creator') }} />
                                </li>
                            ))}
                        </ul>
                    </>
                )}

            </div>
        </main>
    );
}

/**
 * Kachel für ein einzelnes Memorial im Dashboard.
 */
interface CardLabels { edit: string; view: string; public: string; private: string; creator: string; }
function MemorialCard({ memorial, role, labels }: { memorial: Memorial; role?: 'owner' | 'editor' | 'viewer'; labels: CardLabels }) {
    const dateRange = [
        memorial.dateOfBirth ? new Date(memorial.dateOfBirth).getFullYear() : null,
        memorial.dateOfDeath ? new Date(memorial.dateOfDeath).getFullYear() : null,
    ]
        .filter(Boolean)
        .join(' – ');

    return (
        <article
            className="relative rounded-xl p-6 shadow-sm transition-shadow duration-300 hover:shadow-md"
            style={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border) / 0.4)',
            }}
        >
            <CopyLinkButton slug={memorial.slug} />
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
                    <div className="flex items-center gap-2 mt-1.5">
                        <span
                            className="inline-block text-[10px] font-normal uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{
                                backgroundColor: 'hsl(var(--secondary))',
                                color: 'hsl(var(--secondary-foreground))',
                            }}
                        >
                            {memorial.isPublic ? labels.public : labels.private}
                        </span>
                        <span
                            className="inline-block text-[10px] font-normal uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{
                                backgroundColor: !role || role === 'owner'
                                    ? 'hsl(var(--primary) / 0.1)'
                                    : role === 'editor'
                                        ? 'hsl(var(--foreground) / 0.06)'
                                        : 'hsl(var(--muted))',
                                color: !role || role === 'owner'
                                    ? 'hsl(var(--primary))'
                                    : role === 'editor'
                                        ? 'hsl(var(--foreground) / 0.5)'
                                        : 'hsl(var(--muted-foreground))',
                            }}
                        >
                            {!role || role === 'owner' ? labels.creator : role}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-5 flex gap-3">
                {(!role || role === 'owner' || role === 'editor') && (
                    <Link
                        href={`/create?id=${memorial.id}`}
                        className="flex-1 text-center py-2.5 rounded-lg font-light text-sm shadow-sm transition-colors"
                        style={{
                            backgroundColor: 'transparent',
                            color: 'hsl(var(--foreground))',
                            border: '1px solid hsl(var(--border) / 0.6)',
                        }}
                    >
                        {labels.edit}
                    </Link>
                )}
                <Link
                    href={`/memorial/${memorial.slug}?from=dashboard`}
                    className="flex-1 text-center py-2.5 rounded-lg font-light text-sm shadow-sm transition-colors"
                    style={{
                        backgroundColor: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                    }}
                >
                    {labels.view}
                </Link>
            </div>
        </article>
    );
}
