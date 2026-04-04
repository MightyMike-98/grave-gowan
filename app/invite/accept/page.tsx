'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AcceptInvitePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'login'>('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const [memorialId, setMemorialId] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMsg('Invalid invitation link.');
            return;
        }

        const accept = async () => {
            const res = await fetch('/api/members/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            const data = await res.json();

            if (res.status === 401) {
                setStatus('login');
                return;
            }

            if (!res.ok) {
                setStatus('error');
                setErrorMsg(data.error || 'Something went wrong.');
                return;
            }

            setMemorialId(data.memorialId);
            setStatus('success');
        };

        accept();
    }, [token]);

    return (
        <main className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center space-y-6">
                {status === 'loading' && (
                    <div className="space-y-4">
                        <div className="mx-auto w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'hsl(var(--border))', borderTopColor: 'hsl(var(--foreground))' }} />
                        <p className="text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            Accepting invitation...
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
                            <svg className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl tracking-tight">Invitation Accepted</h1>
                        <p className="text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            You now have editor access to this memorial.
                        </p>
                        <div className="flex gap-3 justify-center pt-2">
                            <button
                                onClick={() => router.push(`/create?id=${memorialId}`)}
                                className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                                style={{ backgroundColor: 'hsl(var(--primary))' }}
                            >
                                Edit Memorial
                            </button>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="px-6 py-2.5 rounded-lg text-sm font-light transition-colors"
                                style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                            >
                                Dashboard
                            </button>
                        </div>
                    </div>
                )}

                {status === 'login' && (
                    <div className="space-y-4">
                        <h1 className="text-2xl tracking-tight">Sign in required</h1>
                        <p className="text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            Please sign in or create an account to accept this invitation.
                        </p>
                        <button
                            onClick={() => router.push(`/login?redirect=/invite/accept?token=${token}`)}
                            className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                            style={{ backgroundColor: 'hsl(var(--primary))' }}
                        >
                            Sign In
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--destructive) / 0.1)' }}>
                            <svg className="w-8 h-8" style={{ color: 'hsl(var(--destructive))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-2xl tracking-tight">Something went wrong</h1>
                        <p className="text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {errorMsg}
                        </p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-6 py-2.5 rounded-lg text-sm font-light transition-colors"
                            style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                        >
                            Go to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
