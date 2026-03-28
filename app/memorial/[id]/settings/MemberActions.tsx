/**
 * @file app/memorial/[id]/settings/MemberActions.tsx
 * @description Client Component für das Einladen neuer Mitglieder.
 *
 * Enthält das Formular (E-Mail + Rolle) und ruft die Server Action
 * `/api/members/invite` auf, wenn der Owner jemanden einlädt.
 */

'use client';

import { useState } from 'react';

interface MemberActionsProps {
    memorialId: string;
    memorialSlug: string;
    invitedBy: string;
}

/** Interaktives Einlade-Formular für den Owner eines Memorials. */
export function MemberActions({ memorialId, memorialSlug, invitedBy }: MemberActionsProps) {
    const [email, setEmail] = useState('');
    const [role] = useState<'editor'>('editor');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        if (!email.includes('@')) {
            setErrorMsg('Please enter a valid email address.');
            setStatus('error');
            return;
        }

        setStatus('loading');
        setErrorMsg('');

        try {
            const res = await fetch('/api/members/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role, memorialId, invitedBy, memorialSlug }),
            });

            const json = await res.json();
            if (!res.ok) {
                setErrorMsg(json.error ?? 'Something went wrong.');
                setStatus('error');
                return;
            }

            setStatus('success');
            setEmail('');
            // Seite neu laden um die Members-Liste zu aktualisieren
            setTimeout(() => window.location.reload(), 1200);
        } catch {
            setErrorMsg('Network error. Please try again.');
            setStatus('error');
        }
    }

    return (
        <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="invite-email" className="block text-sm text-stone-600">
                    Email address
                </label>
                <input
                    id="invite-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
                />
            </div>

            <p className="text-xs font-light text-stone-500">
                Invited as <span className="font-medium">Editor</span> — can add content
            </p>

            {/* Feedback */}
            {status === 'error' && (
                <p className="text-sm text-red-500">{errorMsg}</p>
            )}
            {status === 'success' && (
                <p className="text-sm text-green-600">✓ Invitation sent successfully!</p>
            )}

            <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-stone-800 text-white font-medium py-2.5 rounded-lg hover:bg-stone-900 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {status === 'loading' ? 'Sending…' : 'Send Invite'}
            </button>
        </form>
    );
}
