/**
 * @file components/ui/TabsNavigation.tsx
 * @description Die horizontale, klebende (sticky) Tab-Leiste auf der Gedenkseite.
 *
 * Zeigt alle verfügbaren Abschnitte (About, Timeline, Gallery, etc.) als anklickbare
 * Tabs an. Ist auf kleinen Bildschirmen horizontal scrollbar.
 *
 * Diese Komponente ist bewusst "dumm" (presentational): Sie verwaltet keinen eigenen
 * State, sondern meldet nur Klicks nach oben an die übergeordnete `MemorialTabs`-Komponente.
 *
 * Benötigt 'use client', da onClick-Handler und useRef im Browser laufen müssen.
 */

'use client';

import { useRef } from 'react';

/** Props der TabsNavigation-Komponente. */
interface TabsNavigationProps {
    /** Vollständige Liste aller anzuzeigenden Tab-Namen. */
    tabs: string[];
    /** Name des aktuell aktiven Tabs (wird von außen gesteuert). */
    activeTab: string;
    /** Callback, der aufgerufen wird, wenn der Nutzer einen Tab anklickt. */
    onTabChange: (tab: string) => void;
}

/**
 * Rendert die sticky horizontale Tab-Leiste.
 * Scrollt beim Klick auf einen Tab automatisch zum Inhalt (`#tab-content`).
 *
 * @param tabs - Array aller Tab-Namen, die angezeigt werden sollen.
 * @param activeTab - Der Tab, der gerade als aktiv markiert ist.
 * @param onTabChange - Funktion, die beim Klick auf einen anderen Tab aufgerufen wird.
 */
export function TabsNavigation({ tabs, activeTab, onTabChange }: TabsNavigationProps) {
    /** Referenz auf das scrollbare Tab-Container-Element. */
    const scrollRef = useRef<HTMLDivElement>(null);

    /**
     * Wird aufgerufen, wenn der Nutzer auf einen Tab klickt.
     * Informiert den Parent über den neuen aktiven Tab und scrollt zum Inhalt.
     *
     * @param tab - Name des angeklickten Tabs.
     */
    const handleTabClick = (tab: string) => {
        onTabChange(tab);
        window.scrollTo({ top: document.getElementById('tab-content')?.offsetTop ?? 0, behavior: 'smooth' });
    };

    return (
        <nav
            aria-label="Memorial sections"
            className="sticky top-0 z-10 bg-stone-100 border-b border-stone-300"
        >
            <div
                ref={scrollRef}
                className="flex overflow-x-auto scrollbar-hide px-5 py-2 gap-8"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {tabs.map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            id={`tab-${tab.toLowerCase()}`}
                            onClick={() => handleTabClick(tab)}
                            aria-selected={isActive}
                            role="tab"
                            className={[
                                'flex-shrink-0 pb-2 text-sm uppercase tracking-widest transition-colors duration-150 border-b-2',
                                isActive
                                    ? 'border-stone-800 text-stone-800 font-semibold'
                                    : 'border-transparent text-stone-500 font-normal hover:text-stone-700',
                            ].join(' ')}
                        >
                            {tab}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
