/**
 * @file app/memorial/[id]/page.tsx
 * @description Die Kern-Gedenkseiten-Route der App.
 *
 * Lädt das Memorial via Use Case aus core/ und mappt es auf den UI-Typ.
 * Ermittelt die Rolle des eingeloggten Users und gibt sie an MemorialTabs weiter
 * damit rollenbasierte UI-Elemente korrekt angezeigt werden.
 *
 * ARCHITEKTUR:
 * - Domain-Typ (core/): Memorial aus der DB (dateOfBirth, dateOfDeath, etc.)
 * - UI-Typ (types/):    Memorial für die UI-Komponenten (dates, stories, photos, etc.)
 * - Diese Seite enthält den Adapter zwischen beiden Typen.
 *
 * ARCHITEKTUR: Diese Seite importiert NUR aus @core und @data — niemals direkt Supabase.
 */

import { MemorialTabs } from '@/components/ui/MemorialTabs';
import { RequestWidget } from '@/components/ui/RequestWidget';
import { DUMMY_MEMORIAL } from '@/lib/mock-data';
import type { MemorialView, Photo } from '@/types';
import type { Memorial as DomainMemorial } from '@core/types/index';
import { getGalleryPhotos } from '@core/use-cases/getGalleryPhotos';
import { getMemorialBySlug } from '@core/use-cases/getMemorialBySlug';
import { SupabaseMemberRepository } from '@data/repositories/SupabaseMemberRepository';
import { SupabaseMemorialRepository } from '@data/repositories/SupabaseMemorialRepository';
import { SupabasePhotoRepository } from '@data/repositories/SupabasePhotoRepository';
import { createSupabaseServerClient } from '@data/server-client';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

/** Next.js-Standard-Props für eine dynamische Seiten-Route. */
interface MemorialPageProps {
    params: Promise<{ id: string }>;
}

/** Rollentyp für den aktuellen User auf dieser Gedenkseite. */
type UserRole = 'owner' | 'editor' | 'viewer' | 'anonymous';

/**
 * Mappt ein Domain-Memorial (aus der DB) auf das UI-Memorial-Format.
 * Füllt fehlende Felder (stories, photos, timeline) mit leeren Arrays.
 */
function toMemorialView(d: DomainMemorial, stories: MemorialView['stories'] = []): MemorialView {
    return {
        id: d.id,
        name: d.name,
        dates: [
            d.dateOfBirth ? new Date(d.dateOfBirth).getFullYear() : '?',
            d.dateOfDeath ? new Date(d.dateOfDeath).getFullYear() : '?',
        ].join(' – '),
        bio: d.bio ?? '',
        quote: d.quote,
        coverUrl: d.coverUrl,
        portraitUrl: d.portraitUrl,
        theme: d.theme,
        stories,
        photos: [],
        facts: [],
        timeline: (d.timeline ?? []).map((e, i) => ({
            id: `tl-${i}`,
            year: e.year,
            title: e.title,
            description: e.description,
        })),
        support: d.supportTitle ? {
            description: d.supportDesc ?? '',
            links: [{ title: d.supportTitle, url: d.supportUrl ?? '' }]
        } : undefined,
        country: d.country,
        candleCount: d.candleCount ?? 0,
        flowerCount: d.flowerCount ?? 0,
    };
}

/**
 * Lädt das Memorial und die Rolle des aktuell eingeloggten Users.
 */
async function loadMemorialWithRole(slug: string): Promise<{
    memorial: MemorialView | null;
    role: UserRole;
    photos: Photo[];
    isAuthenticated: boolean;
    isSaved: boolean;
    userName: string | null;
}> {
    if (slug === 'demo') return { memorial: DUMMY_MEMORIAL, role: 'anonymous', photos: DUMMY_MEMORIAL.photos, isAuthenticated: false, isSaved: false, userName: null };

    try {
        const supabase = await createSupabaseServerClient();
        const repo = new SupabaseMemorialRepository(supabase);
        const domain = await getMemorialBySlug(slug, repo);
        if (!domain) return { memorial: null, role: 'anonymous', photos: [], isAuthenticated: false, isSaved: false };

        // Galerie-Fotos laden
        let photos: Photo[] = [];
        try {
            const photoRepo = new SupabasePhotoRepository(supabase);
            const dbPhotos = await getGalleryPhotos(domain.id, photoRepo);
            photos = dbPhotos.map(p => ({
                id: p.id,
                url: p.url,
                caption: p.caption,
                isFavorite: p.isFavorite,
            }));
        } catch (photoErr) {
            console.warn('[MemorialPage] Could not load gallery photos:', photoErr);
        }

        // Stories laden
        let stories: MemorialView['stories'] = [];
        try {
            const { data: dbStories } = await supabase
                .from('memorial_stories')
                .select('id, author, text, is_favorite, created_at')
                .eq('memorial_id', domain.id)
                .eq('status', 'approved')
                .order('created_at', { ascending: false });
            if (dbStories) {
                stories = dbStories.map((s: { id: string; author: string; text: string; is_favorite: boolean; created_at: string }) => ({
                    id: s.id,
                    author: s.author,
                    text: s.text,
                    isFavorite: s.is_favorite,
                    date: new Date(s.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                }));
            }
        } catch (storyErr) {
            console.warn('[MemorialPage] Could not load stories:', storyErr);
        }

        const { data: { user } } = await supabase.auth.getUser();
        let role: UserRole = 'anonymous';
        let isSaved = false;
        const userName = (user?.user_metadata?.full_name as string) ?? null;

        if (user) {
            // Owner direkt über memorials.owner_id erkennen (zuverlässiger als memorial_members)
            if (domain.ownerId === user.id) {
                role = 'owner';
            } else {
                // Eingeloggter User → Rolle aus memorial_members lesen
                try {
                    const memberRepo = new SupabaseMemberRepository(supabase);
                    const dbRole = await memberRepo.getUserRole(domain.id, user.id);
                    role = dbRole ?? 'anonymous';
                } catch (roleErr) {
                    console.warn('[MemorialPage] Could not load member role:', roleErr);
                }

                // Viewer-Rolle = Memorial ist gespeichert
                if (role === 'viewer') {
                    isSaved = true;
                }
            }
        }

        return { memorial: toMemorialView(domain, stories), role, photos, isAuthenticated: !!user, isSaved, userName };
    } catch (err) {
        console.error('[MemorialPage] Supabase error:', err);
        return { memorial: null, role: 'anonymous', photos: [], isAuthenticated: false, isSaved: false, userName: null };
    }
}


/**
 * Generiert dynamisch individuelle SEO-Metadaten für jede Gedenkseite.
 */
export async function generateMetadata({ params }: MemorialPageProps): Promise<Metadata> {
    const { id } = await params;
    const { memorial } = await loadMemorialWithRole(id);
    if (!memorial) return { title: 'Memorial not found — Cloudyard' };
    return {
        title: `${memorial.name} — Cloudyard`,
        description: memorial.bio?.slice(0, 160) ?? 'A memorial on Cloudyard.',
        openGraph: {
            title: memorial.name,
            description: memorial.bio?.slice(0, 160) ?? '',
            images: memorial.coverUrl ? [{ url: memorial.coverUrl }] : [],
        },
    };
}

/**
 * Rendert die vollständige Gedenkseiten-Ansicht.
 * Zeigt 404 wenn kein Memorial gefunden (außer "demo").
 */
export default async function MemorialPage({ params }: MemorialPageProps) {
    const { id } = await params;
    const { memorial, role, photos, isAuthenticated, isSaved, userName } = await loadMemorialWithRole(id);

    if (!memorial) notFound();

    const canEdit = role === 'owner' || role === 'editor';

    return (
        <div className="min-h-screen relative pb-20">
            <MemorialTabs memorial={memorial} userRole={role} memorialSlug={id} initialPhotos={photos} isAuthenticated={isAuthenticated} initialSaved={isSaved} userName={userName} />

            <footer className="pb-10 pt-10 flex flex-col items-center gap-2">
                <p className="text-xs uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }}>Created by Family</p>
                <Link href="/" className="text-xs transition-colors" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
                    Powered by Cloudyard
                </Link>
            </footer>

            {!canEdit && memorial.id !== 'demo' && <RequestWidget memorialId={memorial.id} memorialSlug={id} isAuthenticated={isAuthenticated} userName={userName} />}
        </div>
    );
}
