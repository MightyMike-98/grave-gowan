'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { SignOutButton } from '@/components/ui/SignOutButton';
import type { Suggestion } from '@/types';

interface DashboardHeaderProps {
    displayName: string;
    email: string;
}

const mockMessages: Suggestion[] = [
    {
        id: '1',
        from: 'Sarah K.',
        category: 'Gallery',
        text: 'Ich habe ein tolles Foto von Ali beim Training in den 70ern gefunden. Möchtest du es hinzufügen?',
        hasImage: true,
        time: 'vor 2 Std.',
        read: false,
    },
    {
        id: '2',
        from: 'Ahmed M.',
        category: 'Stories',
        text: 'Mein Großvater hat Ali mal persönlich getroffen. Darf ich die Geschichte teilen?',
        hasImage: false,
        time: 'vor 1 Tag',
        read: false,
    },
    {
        id: '3',
        from: 'Lisa W.',
        category: 'Highlights',
        text: 'Das Zitat in der Bio ist leider falsch geschrieben – es müsste "sting like a bee" heißen.',
        hasImage: false,
        time: 'vor 3 Tagen',
        read: true,
    },
];

const CategoryIcon = ({ category }: { category: string }) => {
    switch (category) {
        case 'Gallery':
            return (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        case 'Stories':
            return (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            );
        case 'Highlights':
            return (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
            );
        default:
            return (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            );
    }
};

export function DashboardHeader({ displayName, email }: DashboardHeaderProps) {
    const [inboxOpen, setInboxOpen] = useState(false);
    const [messages, setMessages] = useState<Suggestion[]>(mockMessages);
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
    const unreadCount = messages.filter((m) => !m.read).length;

    const selectedMsg = messages.find((m) => m.id === selectedMessageId);

    const markRead = (id: string) => {
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
    };

    return (
        <div className="relative z-50">
            <header className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl tracking-tight">
                        Welcome, {displayName.split(' ')[0]}
                    </h1>
                    <p className="mt-1 text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>{email}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setInboxOpen(!inboxOpen);
                            if (inboxOpen) setSelectedMessageId(null);
                        }}
                        className="relative rounded-lg p-2 transition-colors hover:bg-accent"
                        style={{
                            color: 'hsl(var(--foreground))',
                            border: '1px solid hsl(var(--border) / 0.6)',
                            backgroundColor: inboxOpen ? 'hsl(var(--accent))' : 'transparent',
                        }}
                        title="Postfach"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-medium"
                                style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                            >
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    <SignOutButton />
                </div>
            </header>

            {/* Inbox Overlay */}
            <AnimatePresence>
                {inboxOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-4 w-full max-w-sm rounded-xl border shadow-lg overflow-hidden"
                        style={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border) / 0.6)',
                        }}
                    >
                        {selectedMsg ? (
                            <div className="flex flex-col h-[350px]">
                                <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'hsl(var(--border) / 0.4)' }}>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setSelectedMessageId(null)} className="p-1 rounded-md transition-colors hover:bg-accent" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <div>
                                            <p className="text-sm font-medium leading-none" style={{ color: 'hsl(var(--foreground))' }}>{selectedMsg.from}</p>
                                            <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{selectedMsg.category}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setInboxOpen(false); setSelectedMessageId(null); }}
                                        className="transition-colors hover:opacity-70"
                                        style={{ color: 'hsl(var(--muted-foreground))' }}
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: 'hsl(var(--card))' }}>
                                    <div className="flex flex-col items-start gap-1">
                                        <div className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm font-light shadow-sm" style={{ backgroundColor: 'hsl(var(--muted) / 0.5)', color: 'hsl(var(--foreground))' }}>
                                            {selectedMsg.text}
                                            {selectedMsg.hasImage && (
                                                <div className="mt-3 flex items-center justify-center rounded-lg border border-dashed p-4" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}>
                                                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>[Angehängtes Bild]</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }}>{selectedMsg.time}</span>
                                    </div>
                                </div>

                                <div className="p-3 border-t" style={{ borderColor: 'hsl(var(--border) / 0.4)', backgroundColor: 'hsl(var(--card))' }}>
                                    <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); setSelectedMessageId(null); }}>
                                        <input 
                                            type="text" 
                                            placeholder="Antworten..." 
                                            className="flex-1 rounded-full border px-4 py-2 text-sm outline-none transition-colors" 
                                            style={{ borderColor: 'hsl(var(--border) / 0.6)', backgroundColor: 'transparent', color: 'hsl(var(--foreground))' }} 
                                        />
                                        <button 
                                            type="submit"
                                            className="rounded-full px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
                                            style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                                        >
                                            Senden
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: 'hsl(var(--border) / 0.4)' }}>
                                    <h3 className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                                        Postfach{' '}
                                        {unreadCount > 0 && (
                                            <span className="ml-1.5 text-xs font-normal" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                {unreadCount} neu
                                            </span>
                                        )}
                                    </h3>
                                    <button
                                        onClick={() => setInboxOpen(false)}
                                        className="transition-colors hover:opacity-70"
                                        style={{ color: 'hsl(var(--muted-foreground))' }}
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="max-h-[350px] divide-y overflow-y-auto" style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
                                    {messages.length === 0 ? (
                                        <p className="px-5 py-8 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                            Keine Nachrichten
                                        </p>
                                    ) : (
                                        messages.map((msg) => (
                                            <button
                                                key={msg.id}
                                                onClick={() => {
                                                    markRead(msg.id);
                                                    setSelectedMessageId(msg.id);
                                                }}
                                                className="w-full px-5 py-3.5 text-left transition-colors hover:bg-accent/50"
                                                style={{ backgroundColor: msg.read ? 'transparent' : 'hsl(var(--muted) / 0.4)' }}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{msg.from}</span>
                                                            <span
                                                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-normal"
                                                                style={{ backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' }}
                                                            >
                                                                <CategoryIcon category={msg.category} />
                                                                {msg.category}
                                                            </span>
                                                            {msg.hasImage && (
                                                                <span
                                                                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-normal"
                                                                    style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                                                >
                                                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                    Bild
                                                                </span>
                                                            )}
                                                            {!msg.read && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }} />}
                                                        </div>
                                                        <p className="mt-1 truncate text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>{msg.text}</p>
                                                    </div>
                                                    <span className="whitespace-nowrap text-[11px]" style={{ color: 'hsl(var(--muted-foreground) / 0.8)' }}>{msg.time}</span>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
