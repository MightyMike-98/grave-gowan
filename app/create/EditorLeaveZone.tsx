'use client';

import { createSupabaseBrowserClient } from '@data/browser-client';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface EditorLeaveZoneProps {
    memorialId: string;
}

export function EditorLeaveZone({ memorialId }: EditorLeaveZoneProps) {
    const t = useTranslations('create');
    const router = useRouter();
    const [showConfirm, setShowConfirm] = useState(false);
    const [leaving, setLeaving] = useState(false);

    const handleLeave = async () => {
        setLeaving(true);
        try {
            const supabase = createSupabaseBrowserClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('memorial_members')
                .delete()
                .eq('memorial_id', memorialId)
                .eq('user_id', user.id);

            router.push('/dashboard');
        } catch (err) {
            console.error('[EditorLeaveZone] Error:', err);
            setLeaving(false);
        }
    };

    return (
        <section className="pt-8 mt-4">
            <div
                className="rounded-xl p-6 space-y-4"
                style={{
                    backgroundColor: 'hsl(var(--destructive) / 0.05)',
                    border: '1px solid hsl(var(--destructive) / 0.2)',
                }}
            >
                <h3
                    className="text-lg"
                    style={{ fontFamily: 'var(--font-inter)', fontWeight: 600, color: 'hsl(var(--destructive))' }}
                >
                    {t('leaveRole')}
                </h3>
                <p className="text-sm font-light" style={{ color: 'hsl(var(--destructive) / 0.7)' }}>
                    {t('leaveRoleDesc')}
                </p>

                {!showConfirm ? (
                    <button
                        type="button"
                        onClick={() => setShowConfirm(true)}
                        className="rounded-lg px-5 py-2.5 text-sm transition-colors"
                        style={{ color: 'hsl(var(--destructive))', border: '1px solid hsl(var(--destructive) / 0.3)' }}
                    >
                        {t('leaveRoleButton')}
                    </button>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm font-medium" style={{ color: 'hsl(var(--destructive))' }}>
                            {t('leaveRoleConfirm')}
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                disabled={leaving}
                                onClick={handleLeave}
                                className="rounded-lg px-5 py-2.5 text-sm font-normal disabled:opacity-40 transition-colors flex items-center gap-2"
                                style={{ backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }}
                            >
                                {leaving ? (
                                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                ) : (
                                    t('leaveRoleLeave')
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowConfirm(false)}
                                className="rounded-lg text-sm px-4 py-2.5 transition-colors"
                                style={{ color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }}
                            >
                                {t('leaveRoleCancel')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
