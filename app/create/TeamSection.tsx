'use client';

import { createSupabaseBrowserClient } from '@data/browser-client';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

interface InviteDraft {
    email: string;
    role: 'editor';
}

interface ExistingMember {
    id: string;
    email: string;
    role: string;
}

interface TeamSectionProps {
    isEditing: boolean;
    existingSlug: string;
    editId?: string;
    userId?: string;
    invites: InviteDraft[];
    setInvites: (invites: InviteDraft[]) => void;
}

export function TeamSection({ isEditing, existingSlug, editId, userId, invites, setInvites }: TeamSectionProps) {
    const t = useTranslations('create');
    const [tempEmail, setTempEmail] = useState('');
    const [existingMembers, setExistingMembers] = useState<ExistingMember[]>([]);
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);

    // Load existing members when editing
    const loadMembers = useCallback(async () => {
        if (!editId) return;
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
            .from('memorial_members')
            .select('id, invited_email, role')
            .eq('memorial_id', editId)
            .neq('role', 'owner')
            .order('joined_at', { ascending: false });

        if (error) {
            console.warn('[TeamSection] Could not load members:', error);
            return;
        }

        if (data) {
            setExistingMembers(data.map((m: { id: string; invited_email: string; role: string }) => ({
                id: m.id,
                email: m.invited_email ?? '',
                role: m.role,
            })));
        }
    }, [editId]);

    useEffect(() => {
        if (isEditing && editId) loadMembers();
    }, [isEditing, editId, loadMembers]);

    const removeMember = async (memberId: string) => {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.from('memorial_members').delete().eq('id', memberId);
        if (!error) {
            setExistingMembers(prev => prev.filter(m => m.id !== memberId));
        }
    };

    const sendInviteNow = async () => {
        const email = tempEmail.trim().toLowerCase();
        if (!email.includes('@')) return;
        if (existingMembers.find(m => m.email === email)) {
            setSendError('This email is already invited.');
            return;
        }

        // In editing mode with an editId: send invite immediately via API
        if (isEditing && editId && userId) {
            setSending(true);
            setSendError(null);
            try {
                const res = await fetch('/api/members/invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, role: 'editor', memorialId: editId, invitedBy: userId, memorialSlug: existingSlug }),
                });
                const data = await res.json();
                if (!res.ok) {
                    setSendError(data.error || 'Failed to send invite.');
                } else {
                    setTempEmail('');
                    await loadMembers(); // Reload to show new pending member
                }
            } catch {
                setSendError('Network error. Please try again.');
            } finally {
                setSending(false);
            }
            return;
        }

        // In creation mode: just add to local array (sent on form submit)
        if (invites.find(i => i.email === email)) return;
        setInvites([...invites, { email, role: 'editor' }]);
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

            <div className="rounded-xl p-6 space-y-5 shadow-sm" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.4)' }}>
                {/* Existing members (editing mode) */}
                {existingMembers.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-[11px] font-medium uppercase tracking-[0.15em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            Team Members ({existingMembers.length})
                        </h4>
                        <ul className="space-y-2">
                            {existingMembers.map(member => (
                                <li key={member.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 shadow-sm" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)', border: '1px solid hsl(var(--border) / 0.4)' }}>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-sm font-light truncate">{member.email}</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-normal capitalize shrink-0" style={{ backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' }}>
                                            {member.role}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeMember(member.id)}
                                        className="p-1.5 rounded transition-colors shrink-0"
                                        style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Invite form */}
                <div className="space-y-4">
                    {(existingMembers.length > 0 || invites.length > 0) && (
                        <div className="h-px" style={{ backgroundColor: 'hsl(var(--border) / 0.4)' }} />
                    )}
                    <h3 className="text-[11px] font-medium uppercase tracking-[0.15em]" style={{ fontFamily: 'var(--font-inter)', color: 'hsl(var(--muted-foreground))' }}>
                        INVITE SOMEONE
                    </h3>

                    <div className="space-y-2">
                        <label htmlFor="invite-email" className="block text-sm font-light">Email address</label>
                        <input
                            id="invite-email"
                            type="email"
                            value={tempEmail}
                            onChange={(e) => { setTempEmail(e.target.value); setSendError(null); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendInviteNow(); } }}
                            placeholder={t('placeholderEmail')}
                            className="field-input"
                        />
                    </div>

                    {sendError && (
                        <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">{sendError}</p>
                    )}

                    <button
                        type="button"
                        onClick={sendInviteNow}
                        disabled={sending}
                        className="w-full rounded-full py-3 text-xs font-normal uppercase tracking-[0.25em] shadow-sm transition-shadow duration-300 hover:shadow-md disabled:opacity-60"
                        style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                    >
                        {sending ? 'Sending...' : 'Send Invite'}
                    </button>
                </div>

                {/* New invites (creation mode - not yet saved) */}
                {invites.length > 0 && (
                    <div className="pt-2">
                        <h4 className="text-[11px] font-medium uppercase tracking-[0.15em] mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            New Invites ({invites.length})
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
                                    >
                                        ×
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Settings link for advanced management */}
            {isEditing && existingSlug && (
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
            )}
        </section>
    );
}
