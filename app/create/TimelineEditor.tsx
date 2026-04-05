'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export interface TimelineEventDraft {
    year: string;
    title: string;
    description: string;
}

interface TimelineEditorProps {
    events: TimelineEventDraft[];
    onChange: (events: TimelineEventDraft[]) => void;
}

export function TimelineEditor({ events, onChange }: TimelineEditorProps) {
    const t = useTranslations('create');
    const [newEvent, setNewEvent] = useState<TimelineEventDraft>({ year: '', title: '', description: '' });
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editEvent, setEditEvent] = useState<TimelineEventDraft>({ year: '', title: '', description: '' });
    const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

    const sortByYear = (list: TimelineEventDraft[]) =>
        [...list].sort((a, b) => parseInt(a.year) - parseInt(b.year));

    const addEvent = () => {
        if (!newEvent.year || !newEvent.title) return;
        onChange(sortByYear([...events, newEvent]));
        setNewEvent({ year: '', title: '', description: '' });
    };

    const removeEvent = (index: number) => {
        onChange(events.filter((_, i) => i !== index));
        if (editingIndex === index) setEditingIndex(null);
    };

    const startEditing = (index: number) => {
        setEditingIndex(index);
        setEditEvent({ ...events[index] });
        setDeleteConfirmIndex(null);
    };

    const saveEdit = () => {
        if (editingIndex !== null && editEvent.year && editEvent.title) {
            const updated = [...events];
            updated[editingIndex] = editEvent;
            onChange(sortByYear(updated));
            setEditingIndex(null);
        }
    };

    return (
        <section className="pt-12 space-y-5">
            <div className="mb-8 h-px" style={{ backgroundColor: 'hsl(var(--border) / 0.4)' }} />
            <h2 className="text-xl tracking-tight">{t('sectionLifeTimeline')}</h2>

            {/* Add event form */}
            <div className="grid grid-cols-[100px_1fr] gap-3">
                <div className="space-y-1">
                    <label className="block text-[11px] font-medium uppercase tracking-[0.15em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {t('fieldYear')}
                    </label>
                    <input
                        type="text"
                        value={newEvent.year}
                        onChange={(e) => setNewEvent({ ...newEvent, year: e.target.value })}
                        placeholder={t('placeholderYear')}
                        className="field-input"
                    />
                </div>
                <div className="space-y-1">
                    <label className="block text-[11px] font-medium uppercase tracking-[0.15em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {t('fieldTitle')}
                    </label>
                    <input
                        type="text"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        placeholder={t('placeholderEventTitle')}
                        className="field-input"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-light">{t('fieldDescOptional')}</label>
                <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder={t('placeholderDetails')}
                    className="field-input min-h-[60px] resize-none"
                />
            </div>

            <button
                type="button"
                onClick={addEvent}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-light shadow-sm transition-colors"
                style={{ color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border) / 0.6)' }}
            >
                <Plus className="h-4 w-4" strokeWidth={1.5} /> {t('addButton')}
            </button>

            {/* Event list */}
            <div className="space-y-3">
                <AnimatePresence initial={false}>
                    {events.map((event, i) => (
                        <motion.div
                            key={`tl-${i}-${event.year}-${event.title}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="rounded-xl shadow-sm"
                            style={{ border: '1px solid hsl(var(--border) / 0.4)', backgroundColor: 'hsl(var(--card))' }}
                        >
                            <div className="p-4">
                                {editingIndex === i ? (
                                    /* ── Inline Edit Mode ── */
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.15 }}
                                        className="space-y-3"
                                    >
                                        <div className="grid grid-cols-[100px_1fr] gap-3">
                                            <input
                                                value={editEvent.year}
                                                onChange={(e) => setEditEvent({ ...editEvent, year: e.target.value })}
                                                className="field-input text-sm"
                                                placeholder={t('fieldYear')}
                                            />
                                            <input
                                                value={editEvent.title}
                                                onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })}
                                                className="field-input text-sm"
                                                placeholder={t('fieldTitle')}
                                            />
                                        </div>
                                        <textarea
                                            value={editEvent.description}
                                            onChange={(e) => setEditEvent({ ...editEvent, description: e.target.value })}
                                            className="field-input text-sm min-h-[60px] resize-none"
                                            placeholder={t('placeholderDetails')}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={saveEdit}
                                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors"
                                                style={{ backgroundColor: 'hsl(var(--primary))' }}
                                            >
                                                <Check className="h-3 w-3" /> {t('saveButton')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingIndex(null)}
                                                className="px-3 py-1.5 text-xs transition-colors"
                                                style={{ color: 'hsl(var(--muted-foreground))' }}
                                            >
                                                {t('cancelButton')}
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : deleteConfirmIndex === i ? (
                                    /* ── Delete Confirmation ── */
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.15 }}
                                        className="flex items-center justify-between"
                                    >
                                        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                            <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{event.title}</span> {t('timelineDeleteConfirm')}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => { removeEvent(i); setDeleteConfirmIndex(null); }}
                                                className="rounded-lg px-3 py-1.5 text-xs text-white transition-colors"
                                                style={{ backgroundColor: 'hsl(var(--destructive))' }}
                                            >
                                                {t('deleteButton')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteConfirmIndex(null)}
                                                className="px-3 py-1.5 text-xs transition-colors"
                                                style={{ color: 'hsl(var(--muted-foreground))' }}
                                            >
                                                {t('cancelButton')}
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    /* ── Display Mode ── */
                                    <div className="flex items-start gap-3">
                                        <span className="text-sm font-medium pt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{event.year}</span>
                                        <div className="flex-1 pt-1">
                                            <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{event.title}</p>
                                            {event.description && (
                                                <p className="mt-1 text-xs font-light leading-relaxed line-clamp-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{event.description}</p>
                                            )}
                                        </div>

                                        {/* Edit + Delete buttons */}
                                        <div className="flex gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => startEditing(i)}
                                                className="rounded p-1.5 transition-colors"
                                                style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteConfirmIndex(i)}
                                                className="rounded p-1.5 transition-colors"
                                                style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </section>
    );
}
