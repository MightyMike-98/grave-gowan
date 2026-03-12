/**
 * @file components/ui/TabsNavigation.tsx
 * @description Die horizontale Tab-Leiste mit animated indicator via layoutId.
 *
 * Nutzt Framer Motion's layoutId="tab-indicator" für den animierten
 * Unterstrich — gleitet sanft zum aktiven Tab (spring bounce 0.15, duration 0.5).
 * Exakt wie gentle-code-mover.
 */

'use client';

import { motion } from 'framer-motion';
import { useRef } from 'react';

interface TabsNavigationProps {
    tabs: string[];
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function TabsNavigation({ tabs, activeTab, onTabChange }: TabsNavigationProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleTabClick = (tab: string) => {
        onTabChange(tab);
        window.scrollTo({ top: document.getElementById('tab-content')?.offsetTop ?? 0, behavior: 'smooth' });
    };

    return (
        <nav
            aria-label="Memorial sections"
            className="sticky top-0 z-10 backdrop-blur-md"
            style={{
                backgroundColor: 'hsl(var(--background) / 0.8)',
                borderBottom: '1px solid hsl(var(--border) / 0.5)',
            }}
        >
            <div
                ref={scrollRef}
                className="flex gap-0 overflow-x-auto px-6"
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
                            className="relative whitespace-nowrap px-4 py-3.5 text-[12px] font-medium tracking-[0.1em] transition-colors"
                            style={{
                                color: isActive
                                    ? 'hsl(var(--foreground))'
                                    : 'hsl(var(--muted-foreground) / 0.6)',
                            }}
                        >
                            {tab.toUpperCase()}
                            {/* Animated indicator — layoutId makes it glide between tabs */}
                            {isActive && (
                                <motion.div
                                    layoutId="tab-indicator"
                                    className="absolute bottom-0 left-0 right-0 h-[1.5px]"
                                    style={{ backgroundColor: 'hsl(var(--foreground))' }}
                                    transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
