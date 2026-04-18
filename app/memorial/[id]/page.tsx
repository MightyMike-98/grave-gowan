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
import type { MemorialView, Photo } from '@/types';
import type { Memorial as DomainMemorial } from '@core/types/index';
import { getGalleryPhotos } from '@core/use-cases/getGalleryPhotos';
import { getMemorialBySlug } from '@core/use-cases/getMemorialBySlug';
import { SupabaseMemberRepository } from '@data/repositories/SupabaseMemberRepository';
import { SupabaseMemorialRepository } from '@data/repositories/SupabaseMemorialRepository';
import { SupabasePhotoRepository } from '@data/repositories/SupabasePhotoRepository';
import { createSupabaseServerClient } from '@data/server-client';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

/** Next.js-Standard-Props für eine dynamische Seiten-Route. */
interface MemorialPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ from?: string }>;
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
    if (slug === 'demo') return { memorial: null, role: 'anonymous', photos: [], isAuthenticated: false, isSaved: false, userName: null };

    try {
        const supabase = await createSupabaseServerClient();
        const repo = new SupabaseMemorialRepository(supabase);
        const domain = await getMemorialBySlug(slug, repo);
        if (!domain) return { memorial: null, role: 'anonymous', photos: [], isAuthenticated: false, isSaved: false, userName: null };

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
                .select('id, author, text, is_favorite, relation, created_at')
                .eq('memorial_id', domain.id)
                .eq('status', 'approved')
                .order('created_at', { ascending: false });
            if (dbStories) {
                stories = dbStories.map((s: { id: string; author: string; text: string; is_favorite: boolean; relation: string | null; created_at: string }) => ({
                    id: s.id,
                    author: s.author,
                    text: s.text,
                    isFavorite: s.is_favorite,
                    relation: s.relation ?? undefined,
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
 * Generiert dynamisch individuelle SEO/Social-Metadaten für jede Gedenkseite.
 * Die OG-Tags sorgen dafür, dass beim Teilen (WhatsApp, iMessage, Slack, …) der
 * Name, die Lebensdaten und das Porträtbild angezeigt werden.
 */
export async function generateMetadata({ params }: MemorialPageProps): Promise<Metadata> {
    const { id } = await params;
    const { memorial } = await loadMemorialWithRole(id);
    if (!memorial) return { title: 'Memorial not found - MemorialYard' };

    const title = `${memorial.name} - MemorialYard`;
    const ogTitle = memorial.dates ? `${memorial.name} (${memorial.dates})` : memorial.name;
    const description =
        memorial.quote?.trim()
        || memorial.bio?.slice(0, 160).trim()
        || `A memorial in honor of ${memorial.name}.`;

    // Portrait bevorzugen: ist fast immer gesetzt, quadratisch/personenzentriert,
    // und wirkt in kleinen Share-Vorschauen (WhatsApp, iMessage) deutlich besser
    // als ein breiter Cover-Hintergrund, der dort zugeschnitten wird.
    const shareImage = memorial.portraitUrl ?? memorial.coverUrl;
    const images = shareImage ? [{ url: shareImage }] : [];

    return {
        title,
        description,
        openGraph: {
            title: ogTitle,
            description,
            siteName: 'MemorialYard',
            type: 'profile',
            images,
        },
        twitter: {
            card: shareImage ? 'summary_large_image' : 'summary',
            title: ogTitle,
            description,
            images,
        },
    };
}

/**
 * Rendert die vollständige Gedenkseiten-Ansicht.
 * Zeigt 404 wenn kein Memorial gefunden (außer "demo").
 */
export default async function MemorialPage({ params, searchParams }: MemorialPageProps) {
    const { id } = await params;
    const { from } = await searchParams;
    const fromDashboard = from === 'dashboard';
    let { memorial, role, photos, isAuthenticated, isSaved, userName } = await loadMemorialWithRole(id);

    if (id === 'demo') {
        const td = await getTranslations('demo');
        const demoPhotos: Photo[] = [
            { id: '1', url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop', caption: td('photo1Caption'), isFavorite: true },
            { id: '2', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop', caption: td('photo2Caption'), isFavorite: true },
            { id: '3', url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&auto=format&fit=crop' },
        ];
        memorial = {
            id: 'demo',
            name: 'Sarah Jenkins',
            dates: '1954 – 2024',
            bio: td('bio'),
            quote: td('quote'),
            coverUrl: 'https://images.unsplash.com/photo-1444930694458-ca65243f7d1a?q=80&w=2066&auto=format&fit=crop',
            portraitUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=688&auto=format&fit=crop',
            theme: 'nature',
            stories: [
                { id: '1', author: td('story1Author'), date: td('story1Date'), text: td('story1Text'), isFavorite: true },
                { id: '2', author: td('story2Author'), date: td('story2Date'), text: td('story2Text') },
            ],
            photos: demoPhotos,
            facts: [],
            timeline: [
                { id: '1', year: '1954', title: td('timeline1Title'), description: td('timeline1Desc') },
                { id: '2', year: '1976', title: td('timeline2Title'), description: td('timeline2Desc') },
                { id: '3', year: '1980', title: td('timeline3Title'), description: td('timeline3Desc') },
                { id: '4', year: '2010', title: td('timeline4Title'), description: td('timeline4Desc') },
            ],
            support: {
                description: td('supportDesc'),
                links: [
                    { title: 'The Nature Conservancy', url: 'https://www.nature.org' },
                    { title: 'World Wildlife Fund', url: 'https://www.worldwildlife.org' },
                ],
            },
            candleCount: 24,
            flowerCount: 17,
        };
        photos = demoPhotos;
    }

    if (!memorial) notFound();

    const canEdit = role === 'owner' || role === 'editor';

    return (
        <div className="min-h-screen relative pb-20">
            <MemorialTabs memorial={memorial} userRole={role} memorialSlug={id} initialPhotos={photos} isAuthenticated={isAuthenticated} initialSaved={isSaved} userName={userName} fromDashboard={fromDashboard} />

            {memorial.id !== 'demo' && !canEdit && <RequestWidget memorialId={memorial.id} memorialSlug={id} isAuthenticated={isAuthenticated} userName={userName} />}
        </div>
    );
}
