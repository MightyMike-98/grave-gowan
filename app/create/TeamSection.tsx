'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface InviteDraft {
    email: string;
    role: 'editor';
}

interface TeamSectionProps {
    isEditing: boolean;
    existingSlug: string;
    invites: InviteDraft[];
    setInvites: (invites: InviteDraft[]) => void;
}

export function TeamSection({ isEditing, existingSlug, invites, setInvites }: TeamSectionProps) {
    const t = useTranslations('create');
    const [tempEmail, setTempEmail] = useState('');

    const addInvite = () => {
        if (!tempEmail.includes('@')) return;
        if (invites.find(i => i.email === tempEmail)) return;
        setInvites([...invites, { email: tempEmail, role: 'editor' }]);
        setTempEmail('');
    };

    return (
        <section className="pt-8 space-y-5">
            <div className="-mt-8 mb-5 h-px" style={{ backgroundColor: 'hsl(var(--border) / 0.4)' }} />
            <div>
                <h2 className="text-xl tracking-tight">
                    {t('sectionTeam')} <span className="text-base font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('sectionOptional')}</span>
                </h2>
                <p className="text-sm font-light mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {t('teamDescription')}
                </p>
            </div>

            {isEditing && existingSlug ? (
                <a
                    href={`/memorial/${existingSlug}/settings`}
                    className="flex w-full items-center justify-between rounded-xl p-4 text-left shadow-sm transition-colors"
                    style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.4)' }}
                >
                    <div className="flex items-center gap-2.5">
                        <span>⚙️</span>
                        <span className="text-sm font-light">{t('manageTeam')}</span>
                    </div>
                    <span style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>→</span>
                </a>
            ) : (
                <div className="rounded-xl p-6 space-y-5 shadow-sm" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.4)' }}>
                    <h3 className="text-[11px] font-medium uppercase tracking-[0.15em]" style={{ fontFamily: 'var(--font-inter)', color: 'hsl(var(--muted-foreground))' }}>INVITE SOMEONE</h3>

                    <div className="space-y-2">
                        <label htmlFor="invite-email" className="block text-sm font-light">Email address</label>
                        <input
                            id="invite-email"
                            type="email"
                            value={tempEmail}
                            onChange={(e) => setTempEmail(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInvite(); } }}
                            placeholder={t('placeholderEmail')}
                            className="field-input"
                        />
                    </div>

<button
                        type="button"
                        onClick={addInvite}
                        className="w-full rounded-full py-3 text-xs font-normal uppercase tracking-[0.25em] shadow-sm transition-shadow duration-300 hover:shadow-md"
                        style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                    >
                        Send Invite
                    </button>

                    {invites.length > 0 && (
                        <div className="pt-4 mt-2" style={{ borderTop: '1px solid hsl(var(--border) / 0.4)' }}>
                            <h4 className="text-[11px] font-medium uppercase tracking-[0.15em] mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                Pending Invites ({invites.length})
                            </h4>
                            <ul className="space-y-2">
                                {invites.map((inv, i) => (
                                    <li key={i} className="flex items-center justify-between rounded-lg px-3 py-2 shadow-sm" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)', border: '1px solid hsl(var(--border) / 0.4)' }}>
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-sm font-light truncate">{inv.email}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-normal capitalize shrink-0" style={{ backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' }}>{inv.role}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setInvites(invites.filter((_, j) => j !== i))}
                                            className="text-lg leading-none shrink-0 px-2 transition-colors"
                                            style={{ color: 'hsl(var(--destructive) / 0.7)' }}
                                            title={t('removeInvite')}
                                        >
                                            ×
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
