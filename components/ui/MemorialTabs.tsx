/**
 * @file components/ui/MemorialTabs.tsx
 * @description Der zentrale State-Manager der Gedenkseiten-Ansicht.
 *
 * Jetzt MIT Framer Motion AnimatePresence mode="wait":
 * - Alter Tab-Content faded OUT (opacity 0, y -8)
 * - Neuer Tab-Content faded IN (opacity 0→1, y 12→0)
 * => Exakt wie gentle-code-mover
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
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';

const TABS = ['Highlights', 'About', 'Timeline', 'Gallery', 'Stories', 'Support'] as const;
type Tab = (typeof TABS)[number];
type UserRole = 'owner' | 'editor' | 'viewer' | 'anonymous';

/** Shared animation variants — identical to gentle-code-mover */
const fadeIn = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

interface MemorialTabsProps {
    memorial: Memorial;
    userRole?: UserRole;
    memorialSlug?: string;
    visitorEmail?: string;
}

export function MemorialTabs({ memorial, userRole = 'anonymous', memorialSlug, visitorEmail }: MemorialTabsProps) {
    const [activeTab, setActiveTab] = useState<Tab>('Highlights');
    const [flowers, setFlowers] = useState<string[]>([]);

    const isOwner = userRole === 'owner';
    const canEdit = userRole === 'owner' || userRole === 'editor';

    const addFlower = () => {
        const options = ['🌹', '🌸', '🌼', '🌺', '🌷', '🌻'];
        const flower = options[Math.floor(Math.random() * options.length)];
        setFlowers((prev) => [...prev, flower]);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'About':
                return <AboutSection bio={memorial.bio} />;
            case 'Timeline':
                return <TimelineSection events={memorial.timeline} />;
            case 'Gallery':
                return <GalleryGrid photos={memorial.photos} canEdit={canEdit} />;
            case 'Stories':
                return <StoriesSection stories={memorial.stories} canEdit={canEdit} />;
            case 'Highlights':
                return <HighlightsSection memorial={memorial} canEdit={canEdit} onTabChange={(tab) => setActiveTab(tab as Tab)} />;
            case 'Support':
                return <SupportSection support={memorial.support} onDonate={addFlower} />;
        }
    };

    return (
        <>
            {/* Settings – nur für Owner */}
            {isOwner && memorialSlug && (
                <div className="absolute top-4 right-4 z-10">
                    <Link
                        href={`/memorial/${memorialSlug}/settings`}
                        title="Team & Access Settings"
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-light backdrop-blur-sm shadow-sm transition-all"
                        style={{
                            backgroundColor: 'hsl(var(--foreground) / 0.05)',
                            color: 'hsl(var(--foreground) / 0.6)',
                        }}
                    >
                        <span>⚙️</span>
                        <span>Team</span>
                    </Link>
                </div>
            )}

            {/* Edit – für Owner und Editoren */}
            {canEdit && (
                <div className="fixed bottom-6 right-4 z-10">
                    <Link
                        href={`/create?id=${memorial.id}${visitorEmail ? `&visitor_email=${encodeURIComponent(visitorEmail)}` : ''}`}
                        className="flex items-center gap-2 rounded-full px-5 py-3 text-sm font-light shadow-lg transition-all"
                        style={{
                            backgroundColor: 'hsl(var(--primary))',
                            color: 'hsl(var(--primary-foreground))',
                        }}
                    >
                        <span>✏️</span>
                        <span>Edit Memorial</span>
                    </Link>
                </div>
            )}

            {/* Hero */}
            <HeroSection memorial={memorial} flowers={flowers} visitorEmail={visitorEmail} />

            {/* Tabs */}
            <TabsNavigation
                tabs={[...TABS]}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as Tab)}
            />

            {/* Content — AnimatePresence mode="wait" for smooth exit→enter */}
            <div id="tab-content" className="mx-auto max-w-3xl min-h-[600px] px-6 pb-20">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={fadeIn}
                    >
                        {renderTabContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </>
    );
}
