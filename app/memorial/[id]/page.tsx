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
import type { Memorial as UIMemorial, Photo } from '@/types';
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
    searchParams: Promise<{ visitor_email?: string }>;
}

/** Rollentyp für den aktuellen User auf dieser Gedenkseite. */
type UserRole = 'owner' | 'editor' | 'viewer' | 'anonymous';

/**
 * Mappt ein Domain-Memorial (aus der DB) auf das UI-Memorial-Format.
 * Füllt fehlende Felder (stories, photos, timeline) mit leeren Arrays.
 */
function toUIMemorial(d: DomainMemorial): UIMemorial {
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
        stories: [],
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
    };
}

/**
 * Lädt das Memorial und die Rolle des aktuell eingeloggten Users.
 */
async function loadMemorialWithRole(slug: string, visitorEmail?: string): Promise<{
    memorial: UIMemorial | null;
    role: UserRole;
    photos: Photo[];
    isAuthenticated: boolean;
}> {
    if (slug === 'demo') return { memorial: DUMMY_MEMORIAL, role: 'anonymous', photos: DUMMY_MEMORIAL.photos, isAuthenticated: false };

    try {
        const supabase = await createSupabaseServerClient();
        const repo = new SupabaseMemorialRepository(supabase);
        const domain = await getMemorialBySlug(slug, repo);
        if (!domain) return { memorial: null, role: 'anonymous', photos: [], isAuthenticated: false };

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

        const { data: { user } } = await supabase.auth.getUser();
        let role: UserRole = 'anonymous';

        if (user) {
            // Eingeloggter User → Rolle aus DB lesen
            try {
                const memberRepo = new SupabaseMemberRepository(supabase);
                const dbRole = await memberRepo.getUserRole(domain.id, user.id);
                role = dbRole ?? 'anonymous';
            } catch (roleErr) {
                console.warn('[MemorialPage] Could not load member role:', roleErr);
            }
        } else if (visitorEmail) {
            // Nicht eingeloggter Besucher → Rolle per E-Mail nachschlagen (RPC, umgeht RLS)
            try {
                const { data: rpcRole } = await supabase.rpc('get_visitor_role_by_email', {
                    p_email: visitorEmail.toLowerCase(),
                    p_memorial_id: domain.id,
                });
                if (rpcRole) role = rpcRole as UserRole;
            } catch (err) {
                console.warn('[MemorialPage] Could not look up visitor role by email:', err);
            }
        }

        return { memorial: toUIMemorial(domain), role, photos, isAuthenticated: !!user };
    } catch (err) {
        console.error('[MemorialPage] Supabase error:', err);
        return { memorial: null, role: 'anonymous', photos: [], isAuthenticated: false };
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
export default async function MemorialPage({ params, searchParams }: MemorialPageProps) {
    const { id } = await params;
    const { visitor_email: visitorEmail } = await searchParams;
    const { memorial, role, photos, isAuthenticated } = await loadMemorialWithRole(id, visitorEmail);

    if (!memorial) notFound();

    const canEdit = role === 'owner' || role === 'editor';

    return (
        <div className="min-h-screen relative pb-20">
            <MemorialTabs memorial={memorial} userRole={role} memorialSlug={id} visitorEmail={visitorEmail} initialPhotos={photos} isAuthenticated={isAuthenticated} />

            <footer className="pb-10 pt-10 flex flex-col items-center gap-2">
                <p className="text-xs uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }}>Created by Family</p>
                <Link href="/" className="text-xs transition-colors" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
                    Powered by Cloudyard
                </Link>
            </footer>

            {!canEdit && <RequestWidget />}
        </div>
    );
}
