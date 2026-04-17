/**
 * @file components/ui/MemorialTabs.tsx
 * @description Der zentrale State-Manager der Gedenkseiten-Ansicht.
 *
 * Verwaltet den Photo-State (Upload, Favoriten-Toggle) und reicht
 * die Daten an GalleryGrid und HighlightsSection weiter.
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
import type { MemorialView, Photo, Story } from '@/types';
import { createSupabaseBrowserClient } from '@data/browser-client';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';

const ALL_TABS = ['Highlights', 'About', 'Timeline', 'Gallery', 'Stories', 'Support'] as const;
type Tab = (typeof ALL_TABS)[number];
type UserRole = 'owner' | 'editor' | 'viewer' | 'anonymous';

const fadeIn = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

interface MemorialTabsProps {
    memorial: MemorialView;
    userRole?: UserRole;
    memorialSlug?: string;
    initialPhotos?: Photo[];
    isAuthenticated?: boolean;
    initialSaved?: boolean;
    userName?: string | null;
    fromDashboard?: boolean;
}

export function MemorialTabs({ memorial, userRole = 'anonymous', memorialSlug, initialPhotos = [], isAuthenticated = false, initialSaved = false, userName, fromDashboard = false }: MemorialTabsProps) {
    const t = useTranslations('tabs');
    const tHero = useTranslations('hero');

    const hasSupport = !!(memorial.support && memorial.support.links.length > 0);
    const tabs = hasSupport ? ALL_TABS : ALL_TABS.filter(tab => tab !== 'Support');

    const [activeTab, setActiveTab] = useState<Tab>('Highlights');
    const [flowers, setFlowers] = useState<string[]>([]);
    const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
    const [stories, setStories] = useState<Story[]>(memorial.stories ?? []);

    const isOwner = userRole === 'owner';
    const canEdit = isAuthenticated && (userRole === 'owner' || userRole === 'editor');

    const tabLabel = (tab: Tab): string => ({
        Highlights: t('highlights'),
        About: t('about'),
        Timeline: t('timeline'),
        Gallery: t('gallery'),
        Stories: t('stories'),
        Support: t('support'),
    }[tab]);

    const favoriteIds = useMemo(() => photos.filter(p => p.isFavorite).map(p => p.id), [photos]);

    const handleToggleFavorite = useCallback(async (photoId: string) => {
        setPhotos(prev => prev.map(p =>
            p.id === photoId ? { ...p, isFavorite: !p.isFavorite } : p
        ));
        try {
            const res = await fetch(`/api/photos/${photoId}/favorite`, { method: 'POST' });
            if (!res.ok) {
                setPhotos(prev => prev.map(p =>
                    p.id === photoId ? { ...p, isFavorite: !p.isFavorite } : p
                ));
            }
        } catch {
            setPhotos(prev => prev.map(p =>
                p.id === photoId ? { ...p, isFavorite: !p.isFavorite } : p
            ));
        }
    }, []);

    const handleDeletePhoto = useCallback(async (photoId: string) => {
        setPhotos(prev => prev.filter(p => p.id !== photoId));
        try {
            const res = await fetch(`/api/photos/${photoId}/delete`, { method: 'POST' });
            if (!res.ok) {
                console.error('[MemorialTabs] Delete photo failed');
            }
        } catch {
            console.error('[MemorialTabs] Delete photo error');
        }
    }, []);

    const handleToggleStoryFavorite = useCallback(async (storyId: string) => {
        const story = stories.find(s => s.id === storyId);
        if (!story) return;
        setStories(prev => prev.map(s => s.id === storyId ? { ...s, isFavorite: !s.isFavorite } : s));
        try {
            const supabase = createSupabaseBrowserClient();
            await supabase.from('memorial_stories').update({ is_favorite: !story.isFavorite }).eq('id', storyId);
        } catch {
            setStories(prev => prev.map(s => s.id === storyId ? { ...s, isFavorite: !s.isFavorite } : s));
        }
    }, [stories]);

    const handleDeleteStory = useCallback(async (storyId: string) => {
        setStories(prev => prev.filter(s => s.id !== storyId));
        try {
            const supabase = createSupabaseBrowserClient();
            await supabase.from('memorial_stories').delete().eq('id', storyId);
        } catch {
            console.error('[MemorialTabs] Delete story error');
        }
    }, []);

    const handlePhotoUploaded = useCallback((photo: Photo) => {
        setPhotos(prev => [...prev, photo]);
    }, []);

    const addFlower = () => {
        const options = ['🌹', '🌸', '🌼', '🌺', '🌷', '🌻'];
        const flower = options[Math.floor(Math.random() * options.length)];
        setFlowers((prev) => [...prev, flower]);
    };

    // Memorial mit aktuellen Photos für HighlightsSection zusammenbauen
    const memorialWithPhotos = useMemo(() => ({
        ...memorial,
        photos,
        stories,
    }), [memorial, photos, stories]);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'About':
                return <AboutSection bio={memorial.bio} heading={tabLabel('About')} />;
            case 'Timeline':
                return <TimelineSection events={memorial.timeline} heading={tabLabel('Timeline')} />;
            case 'Gallery':
                return (
                    <GalleryGrid
                        photos={photos}
                        canEdit={canEdit}
                        memorialId={memorial.id}
                        memorialSlug={memorialSlug}
                        isPremium={false}
                        favoriteIds={favoriteIds}
                        onToggleFavorite={handleToggleFavorite}
                        onPhotoUploaded={handlePhotoUploaded}
                        onDeletePhoto={handleDeletePhoto}
                        heading={tabLabel('Gallery')}
                    />
                );
            case 'Stories':
                return (
                    <StoriesSection
                        stories={stories}
                        canEdit={canEdit}
                        canWrite={memorialSlug !== 'demo'}
                        memorialId={memorial.id}
                        memorialSlug={memorialSlug}
                        isAuthenticated={isAuthenticated}
                        userName={userName}
                        onToggleFavorite={handleToggleStoryFavorite}
                        onStoryAdded={(story) => setStories(prev => [story, ...prev])}
                        heading={tabLabel('Stories')}
                    />
                );
            case 'Highlights':
                return <HighlightsSection memorial={memorialWithPhotos} canEdit={canEdit} onTabChange={(tab) => setActiveTab(tab as Tab)} />;
            case 'Support':
                return <SupportSection support={memorial.support} onDonate={addFlower} memorialId={memorial.id} initialFlowerCount={memorial.flowerCount} />;
        }
    };

    return (
        <>

            {/* Edit – für Owner und Editoren */}
            {canEdit && (
                <div className="fixed bottom-6 right-4 z-10">
                    <Link
                        href={`/create?id=${memorial.id}`}
                        className="flex items-center gap-2 rounded-full px-5 py-3 text-sm font-light shadow-lg transition-all"
                        style={{
                            backgroundColor: 'hsl(var(--primary))',
                            color: 'hsl(var(--primary-foreground))',
                        }}
                    >
                        {tHero('editMemorial')}
                    </Link>
                </div>
            )}

            {/* Hero */}
            <HeroSection memorial={memorial} flowers={flowers} isAuthenticated={isAuthenticated} candleCount={memorial.candleCount} initialSaved={initialSaved} canEdit={canEdit} memorialSlug={memorialSlug} fromDashboard={fromDashboard} />

            {/* Tabs */}
            <TabsNavigation
                tabs={[...tabs]}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as Tab)}
                tabLabels={tabs.map(tabLabel)}
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
