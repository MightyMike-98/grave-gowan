'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

const requestCategories = ['Gallery', 'Highlights', 'Biography', 'Stories', 'Allgemein'] as const;

export function RequestWidget() {
    const [open, setOpen] = useState(false);
    const [category, setCategory] = useState<string>(requestCategories[0]);
    const [message, setMessage] = useState('');
    const [sent, setSent] = useState(false);

    const handleSend = () => {
        if (!message.trim()) return;
        setSent(true);
        setTimeout(() => {
            setSent(false);
            setOpen(false);
            setMessage('');
            setCategory(requestCategories[0]);
        }, 1800);
    };

    return (
        <>
            {/* Floating button */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1, type: 'spring', bounce: 0.4 }}
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
                style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                title="Vorschlag senden"
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </motion.button>

            {/* Dialog */}
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 backdrop-blur-sm"
                            style={{ backgroundColor: 'hsl(var(--background) / 0.8)' }}
                            onClick={() => setOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-1/2 top-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-xl"
                            style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border) / 0.5)' }}
                        >
                            <button
                                onClick={() => setOpen(false)}
                                className="absolute right-4 top-4 transition-colors hover:opacity-70"
                                style={{ color: 'hsl(var(--muted-foreground))' }}
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {sent ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                                    <span className="text-4xl">✅</span>
                                    <h3 className="text-xl tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Gesendet!</h3>
                                    <p className="text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        Vielen Dank für deinen Vorschlag. Der Ersteller wurde benachrichtigt.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-xl tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>Vorschlag senden</h3>
                                    <p className="mt-1.5 text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        Hast du ein schönes Foto, eine Geschichte oder eine Korrektur? Teile es mit dem Ersteller.
                                    </p>

                                    <div className="mt-6 space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-medium uppercase tracking-[0.1em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                Kategorie
                                            </label>
                                            <select
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1"
                                                style={{
                                                    backgroundColor: 'hsl(var(--background))',
                                                    borderColor: 'hsl(var(--border) / 0.6)',
                                                    color: 'hsl(var(--foreground))',
                                                }}
                                            >
                                                {requestCategories.map((c) => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-medium uppercase tracking-[0.1em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                Deine Nachricht
                                            </label>
                                            <textarea
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                placeholder="z.B. Ich habe ein tolles Foto..."
                                                rows={4}
                                                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 resize-none"
                                                style={{
                                                    backgroundColor: 'hsl(var(--background))',
                                                    borderColor: 'hsl(var(--border) / 0.6)',
                                                    color: 'hsl(var(--foreground))',
                                                }}
                                            />
                                        </div>

                                        <button
                                            onClick={handleSend}
                                            disabled={!message.trim()}
                                            className="w-full rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                                            style={{
                                                backgroundColor: 'hsl(var(--primary))',
                                                color: 'hsl(var(--primary-foreground))',
                                            }}
                                        >
                                            Nachricht senden
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
