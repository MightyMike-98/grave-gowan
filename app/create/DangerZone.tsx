'use client';

import { SupabaseMemorialRepository } from '@data/repositories/SupabaseMemorialRepository';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DangerZoneProps {
    editId: string;
    name: string;
    onError: (msg: string) => void;
}

export function DangerZone({ editId, name, onError }: DangerZoneProps) {
    const t = useTranslations('create');
    const router = useRouter();
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmName, setConfirmName] = useState('');
    const [deleting, setDeleting] = useState(false);

    return (
        <section className="pt-8 mt-4">
            <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: 'hsl(var(--destructive) / 0.05)', border: '1px solid hsl(var(--destructive) / 0.2)' }}>
                <h3 className="text-lg" style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, color: 'hsl(var(--destructive))' }}>{t('dangerZone')}</h3>
                <p className="text-sm font-light" style={{ color: 'hsl(var(--destructive) / 0.7)' }}>
                    This action is permanent and cannot be undone. All memories, photos, and team members will be deleted.
                </p>

                {!showConfirm ? (
                    <button
                        type="button"
                        onClick={() => setShowConfirm(true)}
                        className="rounded-lg px-5 py-2.5 text-sm transition-colors"
                        style={{ color: 'hsl(var(--destructive))', border: '1px solid hsl(var(--destructive) / 0.3)' }}
                    >
                        Delete this Memorial
                    </button>
                ) : (
                    <div className="space-y-3">
                        <p className="text-red-700 text-sm font-medium">{t('deleteConfirmLabel', { name })}</p>
                        <input
                            type="text"
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            placeholder={name}
                            className="field-input border-red-300 focus:ring-red-400"
                        />
                        <div className="flex gap-3">
                            <button
                                type="button"
                                disabled={confirmName !== name || deleting}
                                onClick={async () => {
                                    setDeleting(true);
                                    try {
                                        const repo = new SupabaseMemorialRepository();
                                        await repo.delete(editId);
                                        router.push('/dashboard');
                                    } catch (err) {
                                        onError(err instanceof Error ? err.message : 'Could not delete.');
                                        setDeleting(false);
                                    }
                                }}
                                className="rounded-lg px-5 py-2.5 text-sm font-normal disabled:opacity-40 transition-colors flex items-center gap-2"
                                style={{ backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }}
                            >
                                {deleting ? (
                                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                ) : (
                                    t('deleteButton')
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowConfirm(false); setConfirmName(''); }}
                                className="rounded-lg text-sm px-4 py-2.5 transition-colors"
                                style={{ color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
