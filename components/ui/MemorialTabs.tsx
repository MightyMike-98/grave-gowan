/**
 * @file components/ui/MemorialTabs.tsx
 * @description Der zentrale State-Manager ("Gehirn") der Gedenkseiten-Ansicht.
 *
 * Diese Client Component ist die einzige Stelle, die weiß, welcher Tab gerade offen ist
 * und wieviele virtuelle Blumen platziert wurden. Sie übergibt diese Informationen
 * als Props an die zuständigen Kinder-Komponenten (HeroSection, TabsNavigation, Inhalt).
 *
 * ROLLEN-SYSTEM:
 * - userRole: 'owner' | 'editor' | 'viewer' | 'anonymous'
 * - Owner: Sieht ⚙️ Settings-Link oben rechts
 * - Editor & Owner: Sehen "Edit"-Button auf der Seite
 * - Viewer & Anonym: Keine Bearbeitungs-Buttons
 *
 * ARCHITEKTUR-HINWEIS:
 * Warum gibt es MemorialTabs UND TabsNavigation als getrennte Dateien?
 * → Damit alle Inhalts-Komponenten (AboutSection, TimelineSection etc.) Server
 *   Components bleiben und nur MemorialTabs 'use client' braucht.
 */

'use client';

import { AboutSection } from '@/components/ui/AboutSection';
import { GalleryGrid } from '@/components/ui/GalleryGrid';
import { HeroSection } from '@/components/ui/HeroSection';
import { HighlightsSection } from '@/components/ui/HighlightsSection';
import { StoriesSection } from '@/components/ui/StoriesSection';
import { SupportSection } from '@/components/ui/SupportSection';
import { TabsNavigation } from '@/components/ui/TabsNavigation';
import { TimelineSection } from '@/components/ui/TimelineSection';
import type { Memorial } from '@/types';
import Link from 'next/link';
import { useState } from 'react';

/** Alle verfügbaren Tab-Namen als Tuple für volle Typsicherheit. */
const TABS = ['About', 'Timeline', 'Gallery', 'Stories', 'Highlights', 'Support'] as const;
type Tab = (typeof TABS)[number];

/** Rollentyp für den aktuellen User auf dieser Gedenkseite. */
type UserRole = 'owner' | 'editor' | 'viewer' | 'anonymous';

/** Props der MemorialTabs-Komponente. */
interface MemorialTabsProps {
    /** Das vollständige Memorial-Objekt, dessen Inhalt angezeigt werden soll. */
    memorial: Memorial;
    /** Rolle des aktuell eingeloggten Users (aus der DB geladen). */
    userRole?: UserRole;
    /** URL-Slug des Memorials für den Settings-Link. */
    memorialSlug?: string;
    /** E-Mail des Gastes (für Pending-Invite-Flow, kein Supabase-Login). */
    visitorEmail?: string;
}

/**
 * Verwaltet den interaktiven Zustand der kompletten Gedenkseiten-Ansicht.
 * Steuert, welcher Tab aktiv ist und zeigt den passenden Inhalts-Bereich an.
 * Blendet rollenbasierte Buttons (Settings, Edit) ein oder aus.
 *
 * @param memorial - Das anzuzeigende Memorial-Objekt.
 * @param userRole - Rolle des eingeloggten Users. Undefined = anonym.
 * @param memorialSlug - Slug für den Settings-Link.
 */
export function MemorialTabs({ memorial, userRole = 'anonymous', memorialSlug, visitorEmail }: MemorialTabsProps) {
    /** Aktuell angezeigter Tab-Bereich. Standard: 'About'. */
    const [activeTab, setActiveTab] = useState<Tab>('About');

    /** Liste der bisher platzierten virtuellen Blumen-Emojis. */
    const [flowers, setFlowers] = useState<string[]>([]);

    const isOwner = userRole === 'owner';
    const canEdit = userRole === 'owner' || userRole === 'editor';

    /**
     * Fügt eine zufällig ausgewählte Blume zur Blumenliste hinzu.
     */
    const addFlower = () => {
        const options = ['🌹', '🌸', '🌼', '🌺', '🌷', '🌻'];
        const flower = options[Math.floor(Math.random() * options.length)];
        setFlowers((prev) => [...prev, flower]);
    };

    return (
        <>
            {/* Settings-Button — nur für den Owner sichtbar */}
            {isOwner && memorialSlug && (
                <div className="absolute top-4 right-4 z-10">
                    <Link
                        href={`/memorial/${memorialSlug}/settings`}
                        title="Team & Access Settings"
                        className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm text-stone-600 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm hover:bg-white hover:text-stone-800 transition-all"
                    >
                        <span>⚙️</span>
                        <span>Team</span>
                    </Link>
                </div>
            )}

            {/* Edit-Button — für Owner und Editoren sichtbar */}
            {canEdit && (
                <div className="fixed bottom-6 right-4 z-10">
                    <Link
                        href={`/create?id=${memorial.id}${visitorEmail ? `&visitor_email=${encodeURIComponent(visitorEmail)}` : ''}`}
                        className="flex items-center gap-2 bg-stone-800 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg hover:bg-stone-900 transition-all"
                    >
                        <span>✏️</span>
                        <span>Edit Memorial</span>
                    </Link>
                </div>
            )}

            {/* Hero-Bereich erhält die aktuellen Blumen als Prop */}
            <HeroSection memorial={memorial} flowers={flowers} visitorEmail={visitorEmail} />

            {/* Sticky Tab-Leiste – delegiert Klick-Events nach oben */}
            <TabsNavigation
                tabs={[...TABS]}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as Tab)}
            />

            {/* Inhalt: Nur die zum aktiven Tab passende Komponente wird gerendert */}
            <div id="tab-content" className="min-h-[600px] pb-20">
                {activeTab === 'About' && (
                    <AboutSection bio={memorial.bio} facts={memorial.facts} />
                )}
                {activeTab === 'Timeline' && (
                    <TimelineSection events={memorial.timeline} />
                )}
                {activeTab === 'Gallery' && (
                    <GalleryGrid photos={memorial.photos} canEdit={canEdit} />
                )}
                {activeTab === 'Stories' && (
                    <StoriesSection stories={memorial.stories} canEdit={canEdit} />
                )}
                {activeTab === 'Highlights' && (
                    <HighlightsSection memorial={memorial} />
                )}
                {activeTab === 'Support' && (
                    <SupportSection support={memorial.support} onDonate={addFlower} />
                )}
            </div>
        </>
    );
}
