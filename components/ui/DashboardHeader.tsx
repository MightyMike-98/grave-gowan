'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { SignOutButton } from '@/components/ui/SignOutButton';
import type { Suggestion } from '@/types';
import { createSupabaseBrowserClient } from '@data/browser-client';

export interface PendingStoryInfo {
    memorialId: string;
    memorialName: string;
    count: number;
}

export interface RequestInfo {
    id: string;
    memorialId: string;
    memorialName: string;
    author: string;
    category: string;
    message: string;
    hasImage: boolean;
    imageUrl?: string;
    isRead: boolean;
    createdAt: string;
}

interface DashboardHeaderProps {
    displayName: string;
    email: string;
    pendingStoryInfos?: PendingStoryInfo[];
    requests?: RequestInfo[];
}

function getInitials(name: string): string {
    return name.split(/[\s()]+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

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
        case 'Moderation':
            return (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'gerade eben';
    if (mins < 60) return `vor ${mins} Min.`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `vor ${hours} Std.`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'vor 1 Tag';
    return `vor ${days} Tagen`;
}

function MessageRow({
    msg,
    onClick,
    onDelete,
}: {
    msg: Suggestion;
    onClick: () => void;
    onDelete: (id: string) => void;
}) {
    return (
        <div
            className="group px-5 py-3.5 cursor-pointer transition-colors hover:bg-[hsl(var(--muted)/0.15)]"
            style={{ backgroundColor: msg.read ? 'hsl(var(--card))' : 'hsl(var(--muted) / 0.2)' }}
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{msg.from}</span>
                        <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-normal"
                            style={{ backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' }}
                        >
                            <CategoryIcon category={msg.category} />
                            {msg.category}
                        </span>
                        {msg.memorialName && (
                            <span
                                className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-normal truncate max-w-[110px]"
                                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                            >
                                {msg.memorialName}
                            </span>
                        )}
                        {!msg.read && <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: 'hsl(var(--foreground))' }} />}
                    </div>
                    <p className="mt-1 truncate text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>{msg.text}</p>
                </div>

                {/* Right column: timestamp + trash */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="whitespace-nowrap text-[11px]" style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>{msg.time}</span>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(msg.id); }}
                        className="opacity-30 transition-opacity group-hover:opacity-70 hover:!opacity-100"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export function DashboardHeader({ displayName, email, pendingStoryInfos = [], requests = [] }: DashboardHeaderProps) {
    const router = useRouter();
    const [inboxOpen, setInboxOpen] = useState(false);
    const [readIds, setReadIds] = useState<Set<string>>(new Set());
    const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

    const totalPending = pendingStoryInfos.reduce((sum, s) => sum + s.count, 0);
    const systemMessages: Suggestion[] = useMemo(() => {
        if (totalPending === 0) return [];
        return pendingStoryInfos.map((info) => ({
            id: `moderation_${info.memorialId}`,
            from: 'System',
            category: 'Moderation',
            text: `${info.count} neue ${info.count === 1 ? 'Story wartet' : 'Stories warten'} auf deine Freigabe. Prüfe sie im Edit-Modus.`,
            hasImage: false,
            memorialName: info.memorialName,
            time: '',
            read: false,
        }));
    }, [pendingStoryInfos, totalPending]);

    const requestMessages: Suggestion[] = useMemo(() => {
        return requests.filter(r => !deletedIds.has(r.id)).map((r) => ({
            id: r.id,
            from: r.author,
            category: r.category,
            text: r.message,
            hasImage: r.hasImage,
            imageUrl: r.imageUrl,
            memorialName: r.memorialName,
            time: timeAgo(r.createdAt),
            read: r.isRead || readIds.has(r.id),
        }));
    }, [requests, readIds, deletedIds]);

    const allMessages = useMemo(() => [...systemMessages, ...requestMessages], [systemMessages, requestMessages]);
    const unreadCount = allMessages.filter((m) => !m.read).length;
    const selectedMsg = allMessages.find((m) => m.id === selectedMessageId);

    // id → imageUrl, used to clean up Storage on delete
    const imageUrlMap = useMemo(() => {
        const map = new Map<string, string>();
        requests.forEach(r => { if (r.imageUrl) map.set(r.id, r.imageUrl); });
        return map;
    }, [requests]);

    const closeInbox = useCallback(() => {
        setInboxOpen(false);
        setSelectedMessageId(null);
    }, []);

    const markRead = async (id: string) => {
        setReadIds((prev) => new Set(prev).add(id));
        if (!id.startsWith('moderation_')) {
            const supabase = createSupabaseBrowserClient();
            await supabase.from('memorial_requests').update({ is_read: true }).eq('id', id);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletedIds((prev) => new Set(prev).add(id));
        if (selectedMessageId === id) setSelectedMessageId(null);
        if (!id.startsWith('moderation_')) {
            const supabase = createSupabaseBrowserClient();
            // Delete image from Storage if one exists
            const imgUrl = imageUrlMap.get(id);
            if (imgUrl) {
                const storagePath = imgUrl.split('/request-images/')[1];
                if (storagePath) {
                    await supabase.storage.from('request-images').remove([storagePath]);
                }
            }
            await supabase.from('memorial_requests').delete().eq('id', id);
        }
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
                                style={{ backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}
                            >
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    <SignOutButton />
                </div>
            </header>

            {/* ── Inbox backdrop (dims page when open, but not blurred) ── */}
            <AnimatePresence>
                {inboxOpen && (
                    <motion.div
                        key="inbox-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40"
                        style={{ backgroundColor: 'hsl(var(--background) / 0.4)' }}
                        onClick={closeInbox}
                    />
                )}
            </AnimatePresence>

            {/* ── Inbox dropdown panel ── */}
            <AnimatePresence>
                {inboxOpen && (
                    <motion.div
                        key="inbox-panel"
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.98 }}
                        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="absolute right-0 top-full mt-4 w-full max-w-sm rounded-xl border shadow-xl overflow-hidden z-50"
                        style={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border) / 0.5)',
                        }}
                    >
                        <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: 'hsl(var(--border) / 0.3)' }}>
                            <h3 className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                                Postfach{' '}
                                {unreadCount > 0 && (
                                    <span className="ml-1.5 text-xs font-normal" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        {unreadCount} neu
                                    </span>
                                )}
                            </h3>
                            <button
                                onClick={closeInbox}
                                className="transition-opacity hover:opacity-60"
                                style={{ color: 'hsl(var(--muted-foreground))' }}
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="max-h-[360px] divide-y overflow-y-auto" style={{ borderColor: 'hsl(var(--border) / 0.2)' }}>
                            {allMessages.length === 0 ? (
                                <p className="px-5 py-8 text-center text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    Keine Nachrichten
                                </p>
                            ) : (
                                allMessages.map((msg) => (
                                    <MessageRow
                                        key={msg.id}
                                        msg={msg}
                                        onDelete={handleDelete}
                                        onClick={() => {
                                            if (msg.id.startsWith('moderation_')) {
                                                const memId = msg.id.replace('moderation_', '');
                                                router.push(`/create?id=${memId}`);
                                                closeInbox();
                                                return;
                                            }
                                            markRead(msg.id);
                                            setSelectedMessageId(msg.id);
                                        }}
                                    />
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Detail modal — floats centered over blurred backdrop ── */}
            <AnimatePresence>
                {selectedMsg && (
                    <>
                        {/* Blur backdrop — covers everything including the inbox panel */}
                        <motion.div
                            key="detail-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="fixed inset-0 z-[60] backdrop-blur-sm"
                            style={{ backgroundColor: 'hsl(var(--background) / 0.5)' }}
                            onClick={() => setSelectedMessageId(null)}
                        />

                        {/* Detail card — centered, scale-up animation */}
                        <motion.div
                            key="detail-card"
                            initial={{ opacity: 0, scale: 0.94, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 16 }}
                            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="fixed left-1/2 top-1/2 z-[61] w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border shadow-2xl overflow-hidden"
                            style={{
                                backgroundColor: 'hsl(var(--card))',
                                borderColor: 'hsl(var(--border) / 0.4)',
                            }}
                        >
                            {/* Header: Avatar + Name + Time + Close */}
                            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border) / 0.25)' }}>
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium shrink-0"
                                    style={{
                                        backgroundColor: 'hsl(var(--muted) / 0.6)',
                                        color: 'hsl(var(--muted-foreground))',
                                    }}
                                >
                                    {getInitials(selectedMsg.from)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{selectedMsg.from}</p>
                                    {selectedMsg.time && (
                                        <p className="text-[11px] font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>{selectedMsg.time}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setSelectedMessageId(null)}
                                    className="transition-opacity hover:opacity-60 shrink-0"
                                    style={{ color: 'hsl(var(--muted-foreground))' }}
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Message bubble */}
                            <div className="px-5 py-4 space-y-4">
                                <div
                                    className="rounded-2xl p-4"
                                    style={{
                                        backgroundColor: 'hsl(var(--muted) / 0.2)',
                                        border: '1px solid hsl(var(--border) / 0.15)',
                                    }}
                                >
                                    <p className="text-sm font-light leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>
                                        {selectedMsg.text}
                                    </p>
                                    {selectedMsg.hasImage && selectedMsg.imageUrl && (
                                        <div className="mt-3 space-y-2">
                                            {/* Preview */}
                                            <div className="overflow-hidden rounded-lg" style={{ border: '1px solid hsl(var(--border) / 0.2)' }}>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={selectedMsg.imageUrl}
                                                    alt="Angehängtes Bild"
                                                    className="w-full object-cover max-h-48"
                                                />
                                            </div>
                                            {/* Download — fetch as blob to force download on cross-origin URLs */}
                                            <button
                                                className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-xs font-light transition-opacity hover:opacity-70"
                                                style={{
                                                    backgroundColor: 'hsl(var(--muted) / 0.3)',
                                                    border: '1px solid hsl(var(--border) / 0.2)',
                                                    color: 'hsl(var(--foreground))',
                                                }}
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        const res = await fetch(selectedMsg.imageUrl!);
                                                        const blob = await res.blob();
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `bild_${selectedMsg.id}.${blob.type.split('/')[1] ?? 'jpg'}`;
                                                        a.click();
                                                        URL.revokeObjectURL(url);
                                                    } catch {
                                                        window.open(selectedMsg.imageUrl, '_blank');
                                                    }
                                                }}
                                            >
                                                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                </svg>
                                                Bild herunterladen
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Category badge */}
                                <div className="pb-1">
                                    <span
                                        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-light"
                                        style={{
                                            borderColor: 'hsl(var(--border) / 0.4)',
                                            color: 'hsl(var(--muted-foreground))',
                                        }}
                                    >
                                        <CategoryIcon category={selectedMsg.category} />
                                        {selectedMsg.category}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
