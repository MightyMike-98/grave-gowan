/**
 * @file app/create/page.tsx
 * @description Formular zum Erstellen oder Bearbeiten einer Gedenkseite.
 *
 * State und Geschäftslogik (Submit, Laden, API-Calls) bleiben hier.
 * Die einzelnen Formular-Sektionen sind in eigene Komponenten ausgelagert:
 * - CoreInfoSection, SupportEditor, TimelineEditor
 * - GalleryEditor, StoriesEditor, TeamSection, DangerZone
 */

'use client';

import { ImageUploader } from '@/components/ui/ImageUploader';
import { isCofounder } from '@/lib/cofounders';
import { createMemorial } from '@core/use-cases/createMemorial';
import { createSupabaseBrowserClient } from '@data/browser-client';
import { SupabaseMemorialRepository } from '@data/repositories/SupabaseMemorialRepository';
import { uploadGalleryFile } from '@data/gallery-upload';
import { uploadMemorialImage } from '@data/storage';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Copy, Link as LinkIcon } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

import { CoreInfoSection } from './CoreInfoSection';
import { DangerZone } from './DangerZone';
import { EditorLeaveZone } from './EditorLeaveZone';
import { GalleryEditor } from './GalleryEditor';
import { StoriesEditor } from './StoriesEditor';
import { SupportEditor } from './SupportEditor';
import { TeamSection } from './TeamSection';
import { TimelineEditor, type TimelineEventDraft } from './TimelineEditor';

function CreateMemorialForm() {
    const t = useTranslations('create');
    const locale = useLocale();
    const router = useRouter();
    const params = useSearchParams();
    const editId = params.get('id');
    const isEditing = !!editId;

    // ── State ──
    const [name, setName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [dateOfDeath, setDateOfDeath] = useState('');
    const [bio, setBio] = useState('');
    const [quote, setQuote] = useState('');
    const [country, setCountry] = useState('');
    const [portraitUrl, setPortraitUrl] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [existingSlug, setExistingSlug] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [visibilityPopup, setVisibilityPopup] = useState<'private' | 'public' | null>(null);

    const [supportTitle, setSupportTitle] = useState('');
    const [supportUrl, setSupportUrl] = useState('');
    const [supportDesc, setSupportDesc] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const [timelineEvents, setTimelineEvents] = useState<TimelineEventDraft[]>([]);

    const [galleryPhotos, setGalleryPhotos] = useState<{ id: string; url: string; favorite: boolean; size?: number }[]>([]);
    const [galleryUploading, setGalleryUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [stories, setStories] = useState<{ id: string; author: string; text: string; date: string; favorite: boolean; relation?: string }[]>([]);
    const [pendingStories, setPendingStories] = useState<{ id: string; author: string; text: string; date: string }[]>([]);

    interface InviteDraft { email: string; role: 'editor' }
    const [invites, setInvites] = useState<InviteDraft[]>([]);
    const [userRole, setUserRole] = useState<'owner' | 'editor' | 'viewer' | null>(null);
    const isOwnerRole = userRole === 'owner' || userRole === null;
    const isEditorRole = userRole === 'editor';

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmChecked, setConfirmChecked] = useState(false);
    const [showDiscardWarning, setShowDiscardWarning] = useState(false);

    // ── Data Loading ──
    const applyMemorialData = (data: Record<string, unknown>) => {
        setName((data.name as string) ?? '');
        setDateOfBirth((data.date_of_birth as string) ?? '');
        setDateOfDeath((data.date_of_death as string) ?? '');
        setBio((data.bio as string) ?? '');
        setPortraitUrl((data.portrait_url as string) ?? '');
        setExistingSlug((data.slug as string) ?? '');
        setSupportTitle((data.support_title as string) ?? '');
        setSupportUrl((data.support_url as string) ?? '');
        setSupportDesc((data.support_desc as string) ?? '');
        setQuote((data.quote as string) ?? '');
        setCountry((data.country as string) ?? '');
        setIsPublic(!!(data.is_public));
        const tl = data.timeline;
        if (Array.isArray(tl)) {
            setTimelineEvents(tl.map((e: { year: string; title: string; description: string }) => ({
                year: e.year ?? '', title: e.title ?? '', description: e.description ?? '',
            })));
        }
    };

    useEffect(() => {
        const supabase = createSupabaseBrowserClient();
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id ?? null);
            setUserName((data.user?.user_metadata?.full_name as string) ?? null);
        });

        if (editId) {
            supabase.from('memorials').select('*').eq('id', editId).single()
                .then(({ data }) => { if (data) applyMemorialData(data as Record<string, unknown>); });

            supabase.auth.getUser().then(async ({ data: { user } }) => {
                if (!user) return;
                const { data: member } = await supabase.from('memorial_members').select('role').eq('memorial_id', editId).eq('user_id', user.id).maybeSingle();
                if (member) setUserRole(member.role as 'owner' | 'editor' | 'viewer');
            });

            supabase.from('gallery_photos').select('*').eq('memorial_id', editId).order('sort_order', { ascending: true }).order('created_at', { ascending: false })
                .then(({ data: photos }) => {
                    if (photos) setGalleryPhotos(photos.map((p: { id: string; url: string; is_favorite: boolean; file_size?: number }) => ({ id: p.id, url: p.url, favorite: p.is_favorite ?? false, size: p.file_size ?? 0 })));
                });

            supabase.from('memorial_stories').select('*').eq('memorial_id', editId).eq('status', 'approved').order('created_at', { ascending: false })
                .then(({ data: dbStories }) => {
                    if (dbStories) setStories(dbStories.map((s: { id: string; author: string; text: string; is_favorite: boolean; created_at: string }) => ({
                        id: s.id, author: s.author, text: s.text,
                        date: new Date(s.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                        favorite: s.is_favorite ?? false,
                    })));
                });

            supabase.from('memorial_stories').select('*').eq('memorial_id', editId).eq('status', 'pending').order('created_at', { ascending: false })
                .then(({ data: dbPending }) => {
                    if (dbPending) setPendingStories(dbPending.map((s: { id: string; author: string; text: string; created_at: string }) => ({
                        id: s.id, author: s.author, text: s.text,
                        date: new Date(s.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                    })));
                });
        }
    }, [editId]);

    // Scroll to hash anchor (e.g. #stories from inbox notification)
    useEffect(() => {
        if (window.location.hash) {
            const timer = setTimeout(() => {
                const el = document.querySelector(window.location.hash);
                el?.scrollIntoView({ behavior: 'smooth' });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, []);

    // ── Handlers ──
    const handleGalleryUpload = async (file: File): Promise<void> => {
        if (!userId) return;
        setGalleryUploading(true);
        setUploadProgress(0);

        try {
            const { url, error: uploadError } = await uploadGalleryFile(file, {
                userId,
                onProgress: (pct) => setUploadProgress(pct),
            });
            if (!url || uploadError) {
                console.error('[Create/Gallery] Upload error:', uploadError);
                return;
            }

            if (editId) {
                const supabase = createSupabaseBrowserClient();
                const { data, error: insertError } = await supabase
                    .from('gallery_photos')
                    .insert({ memorial_id: editId, uploaded_by: userId, url, file_size: file.size, is_favorite: false })
                    .select('id, url, is_favorite')
                    .single();
                if (insertError || !data) {
                    console.error('[Create/Gallery] DB insert error:', insertError);
                    return;
                }
                setGalleryPhotos(prev => [...prev, { id: data.id, url: data.url, favorite: data.is_favorite ?? false, size: file.size }]);
            } else {
                setGalleryPhotos(prev => [...prev, { id: `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, url, favorite: false, size: file.size }]);
            }
        } finally {
            setGalleryUploading(false);
            setUploadProgress(0);
        }
    };

    const handleToggleGalleryFavorite = async (photoId: string) => {
        setGalleryPhotos(prev => prev.map(p => p.id === photoId ? { ...p, favorite: !p.favorite } : p));
        if (photoId.startsWith('temp_')) return;
        try {
            const res = await fetch(`/api/photos/${photoId}/favorite`, { method: 'POST' });
            if (!res.ok) setGalleryPhotos(prev => prev.map(p => p.id === photoId ? { ...p, favorite: !p.favorite } : p));
        } catch { setGalleryPhotos(prev => prev.map(p => p.id === photoId ? { ...p, favorite: !p.favorite } : p)); }
    };

    const handleDeletePhoto = useCallback((photoId: string) => {
        if (!photoId.startsWith('temp_')) fetch(`/api/photos/${photoId}/delete`, { method: 'POST' });
        setGalleryPhotos(prev => prev.filter(p => p.id !== photoId));
    }, []);

    const handleAddStory = async (author: string, text: string, relation: string) => {
        if (!author.trim()) return;
        const newStory = {
            id: `temp_${Date.now()}`, author, text, relation,
            date: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            favorite: false,
        };
        if (editId) {
            const supabase = createSupabaseBrowserClient();
            const { data, error } = await supabase.from('memorial_stories').insert({ memorial_id: editId, author, text, relation, status: 'approved' }).select().single();
            if (!error && data) setStories(prev => [{ ...newStory, id: data.id }, ...prev]);
        } else {
            setStories(prev => [newStory, ...prev]);
        }
    };

    const handleApproveStory = async (storyId: string) => {
        const story = pendingStories.find(s => s.id === storyId);
        if (!story) return;
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
            .from('memorial_stories')
            .update({ status: 'approved' })
            .eq('id', storyId)
            .select('id');
        if (error) {
            console.error('[approveStory]', error);
            setErrors([error.message]);
            return;
        }
        if (!data || data.length === 0) {
            console.warn('[approveStory] RLS blocked update for story', storyId);
            setErrors([t('errorSaveFailed')]);
            return;
        }
        setPendingStories(prev => prev.filter(s => s.id !== storyId));
        setStories(prev => [{ ...story, favorite: false }, ...prev]);
    };

    const handleRejectStory = async (storyId: string) => {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
            .from('memorial_stories')
            .delete()
            .eq('id', storyId)
            .select('id');
        if (error) {
            console.error('[rejectStory]', error);
            setErrors([error.message]);
            return;
        }
        if (!data || data.length === 0) {
            console.warn('[rejectStory] RLS blocked delete for story', storyId);
            setErrors([t('errorSaveFailed')]);
            return;
        }
        setPendingStories(prev => prev.filter(s => s.id !== storyId));
    };

    const handleToggleStoryFavorite = async (storyId: string) => {
        const story = stories.find(s => s.id === storyId);
        if (!story) return;
        setStories(prev => prev.map(s => s.id === storyId ? { ...s, favorite: !s.favorite } : s));
        if (storyId.startsWith('temp_')) return;
        const supabase = createSupabaseBrowserClient();
        await supabase.from('memorial_stories').update({ is_favorite: !story.favorite }).eq('id', storyId);
    };

    const handleDeleteStory = async (storyId: string) => {
        setStories(prev => prev.filter(s => s.id !== storyId));
        if (storyId.startsWith('temp_')) return;
        const supabase = createSupabaseBrowserClient();
        await supabase.from('memorial_stories').delete().eq('id', storyId);
    };

    // ── Submit ──
    const handleSubmit = async () => {
        const fieldErrors: string[] = [];
        if (!bio.trim()) fieldErrors.push(t('errorBioRequired'));
        if (!name.trim()) fieldErrors.push(t('errorNameRequired'));
        if (!userId) fieldErrors.push(t('errorLoginRequired'));
        if (fieldErrors.length > 0) { setErrors(fieldErrors); return; }

        // Show confirmation dialog only on first-time creation
        if (!isEditing) {
            setShowConfirm(true);
            return;
        }

        await performSubmit();
    };

    const performSubmit = async () => {
        setShowConfirm(false);
        setErrors([]);
        setLoading(true);
        try {
            const repo = new SupabaseMemorialRepository();
            if (isEditing && editId) {
                const fields = isEditorRole
                    ? { bio: bio.trim(), quote: quote.trim() || undefined, dateOfDeath: dateOfDeath || undefined, timeline: timelineEvents.length > 0 ? timelineEvents : [], supportTitle: supportTitle || undefined, supportUrl: supportUrl || undefined, supportDesc: supportDesc || undefined }
                    : { name: name.trim(), bio: bio.trim(), quote: quote.trim() || undefined, dateOfBirth: dateOfBirth || undefined, dateOfDeath: dateOfDeath || undefined, portraitUrl: portraitUrl || undefined, isPublic, timeline: timelineEvents.length > 0 ? timelineEvents : [], supportTitle: supportTitle || undefined, supportUrl: supportUrl || undefined, supportDesc: supportDesc || undefined, country: country.trim() || undefined };
                await repo.update(editId, fields);
                // Send any new invites
                if (invites.length > 0) {
                    await Promise.allSettled(invites.map((inv) =>
                        fetch('/api/members/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: inv.email, role: inv.role, memorialId: editId, invitedBy: userId, memorialSlug: existingSlug, locale }) })
                    ));
                    setInvites([]);
                }
                router.replace('/dashboard');
                router.refresh();
            } else {
                const memorial = await createMemorial({
                    name: name.trim(), bio: bio.trim(), quote: quote.trim() || undefined,
                    dateOfBirth: dateOfBirth || undefined, dateOfDeath: dateOfDeath || undefined,
                    portraitUrl: portraitUrl || undefined, ownerId: userId!, slug: '', theme: 'classic', isPublic,
                    timeline: timelineEvents.length > 0 ? timelineEvents : undefined,
                    supportTitle: supportTitle || undefined, supportUrl: supportUrl || undefined, supportDesc: supportDesc || undefined,
                    country: country.trim() || undefined,
                }, repo);

                const supabase = createSupabaseBrowserClient();
                await supabase.from('memorial_members').insert({ memorial_id: memorial.id, user_id: userId!, role: 'owner', invited_by: userId! })
                    .then(({ error }) => { if (error && !error.message.includes('duplicate') && !error.message.includes('unique')) console.warn('[Create] Could not insert owner:', error); });

                if (galleryPhotos.length > 0) {
                    await Promise.allSettled(galleryPhotos.map((photo) =>
                        supabase.from('gallery_photos').insert({ memorial_id: memorial.id, uploaded_by: userId!, url: photo.url, is_favorite: photo.favorite })
                    ));
                }
                if (stories.length > 0) {
                    await Promise.allSettled(stories.map((story) =>
                        supabase.from('memorial_stories').insert({ memorial_id: memorial.id, author: story.author, text: story.text, relation: story.relation, is_favorite: story.favorite, status: 'approved' })
                    ));
                }
                if (invites.length > 0) {
                    await Promise.allSettled(invites.map((inv) =>
                        fetch('/api/members/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: inv.email, role: inv.role, memorialId: memorial.id, invitedBy: userId, memorialSlug: memorial.slug, locale }) })
                    ));
                }
                router.replace(`/memorial/${memorial.slug}`);
                router.refresh();
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : '';
            const isDuplicate = msg.includes('duplicate') || msg.includes('unique') || msg.includes('slug');
            setErrors([isDuplicate ? t('errorNameExists') : (msg || t('errorSaveFailed'))]);
            setLoading(false);
        }
    };

    // ── Render ──
    return (
        <main className="relative min-h-screen px-4 py-10">
            {/* Back Navigation — fixed top-left */}
            {(() => {
                const hasUnsavedChanges =
                    !isEditing &&
                    (name.trim() !== '' ||
                        dateOfBirth !== '' ||
                        dateOfDeath !== '' ||
                        bio.trim() !== '' ||
                        quote.trim() !== '' ||
                        country.trim() !== '' ||
                        portraitUrl !== '' ||
                        supportTitle.trim() !== '' ||
                        supportUrl.trim() !== '' ||
                        supportDesc.trim() !== '' ||
                        timelineEvents.length > 0 ||
                        galleryPhotos.length > 0 ||
                        stories.length > 0);
                const backClasses =
                    'fixed left-6 top-6 z-50 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-light backdrop-blur-sm transition-colors';
                const backStyle = {
                    backgroundColor: 'hsl(var(--foreground) / 0.05)',
                    color: 'hsl(var(--foreground) / 0.6)',
                };
                if (hasUnsavedChanges) {
                    return (
                        <button
                            type="button"
                            onClick={() => setShowDiscardWarning(true)}
                            className={backClasses}
                            style={backStyle}
                        >
                            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
                            <span>{t('back')}</span>
                        </button>
                    );
                }
                return (
                    <Link href="/dashboard" className={backClasses} style={backStyle}>
                        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
                        <span>{t('back')}</span>
                    </Link>
                );
            })()}

            {/* Spacer for fixed back button */}
            <div className="h-4" />

            {/* Portrait */}
            <div className="max-w-xl mx-auto flex justify-center">
                {isOwnerRole ? (
                    <ImageUploader
                        currentUrl={portraitUrl}
                        onUpload={async (file: File) => {
                            if (!userId) throw new Error('Not logged in.');
                            const { url, error } = await uploadMemorialImage(file, userId, 'portrait');
                            if (error) throw new Error(error);
                            if (url) setPortraitUrl(url);
                        }}
                    />
                ) : portraitUrl ? (
                    <div className="w-28 h-28 rounded-full overflow-hidden shadow-sm opacity-80" style={{ border: '2px solid hsl(var(--border))' }}>
                        <img src={portraitUrl} alt="Portrait" className="w-full h-full object-cover" />
                    </div>
                ) : null}
            </div>

            <div className="mx-auto max-w-xl pb-20 space-y-10 mt-8">
                <h1 className="text-3xl tracking-tight">{isEditing ? t('titleEdit') : t('titleCreate')}</h1>

                {isEditing && existingSlug && (
                    <div
                        className="flex items-center gap-3 rounded-xl px-4 py-3"
                        style={{ border: '1px solid hsl(var(--border) / 0.4)', backgroundColor: 'hsl(var(--card))' }}
                    >
                        <LinkIcon className="h-4 w-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground) / 0.6)' }} strokeWidth={1.5} />
                        <span className="flex-1 text-sm font-light truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {typeof window !== 'undefined' ? `${window.location.origin}/memorial/${existingSlug}` : `/memorial/${existingSlug}`}
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                const url = `${window.location.origin}/memorial/${existingSlug}`;
                                navigator.clipboard.writeText(url);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            }}
                            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-light transition-all"
                            style={{ border: '1px solid hsl(var(--border) / 0.4)', color: 'hsl(var(--muted-foreground))' }}
                        >
                            {copied ? (
                                <span className="flex items-center gap-1"><Check className="h-3 w-3" /> {t('copied')}</span>
                            ) : (
                                <span className="flex items-center gap-1"><Copy className="h-3 w-3" /> {t('copyLink')}</span>
                            )}
                        </button>
                    </div>
                )}

                {errors.length > 0 && (
                    <div role="alert" className="rounded-xl p-4 space-y-1" style={{ backgroundColor: 'hsl(var(--destructive) / 0.05)', border: '1px solid hsl(var(--destructive) / 0.2)' }}>
                        {errors.map((err, i) => <p key={i} className="text-sm" style={{ color: 'hsl(var(--destructive))' }}>{err}</p>)}
                    </div>
                )}

                <CoreInfoSection
                    isOwnerRole={isOwnerRole} isEditorRole={isEditorRole} isEditing={isEditing}
                    name={name} setName={setName} dateOfBirth={dateOfBirth} setDateOfBirth={setDateOfBirth}
                    dateOfDeath={dateOfDeath} setDateOfDeath={setDateOfDeath} bio={bio} setBio={setBio} quote={quote} setQuote={setQuote}
                    country={country} setCountry={setCountry}
                />

                {/* Visibility Toggle — nur für Owner */}
                {isOwnerRole && (
                    <section className="space-y-3">
                        <div className="flex items-center justify-between rounded-xl p-4" style={{ backgroundColor: 'hsl(var(--muted) / 0.15)', border: '1px solid hsl(var(--border) / 0.4)' }}>
                            <div>
                                <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                                    {t('visibilityPrivate')}
                                </p>
                                <p className="text-xs font-light mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    {t('visibilityPrivateDesc')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setVisibilityPopup(isPublic ? 'private' : 'public')}
                                className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
                                style={{ backgroundColor: !isPublic ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground) / 0.3)' }}
                                role="switch"
                                aria-checked={!isPublic}
                            >
                                <span
                                    className="pointer-events-none inline-block h-5 w-5 rounded-full shadow-sm transform transition-transform duration-200"
                                    style={{
                                        backgroundColor: 'hsl(var(--background))',
                                        transform: !isPublic ? 'translateX(1.25rem)' : 'translateX(0.125rem)',
                                        marginTop: '0.125rem',
                                    }}
                                />
                            </button>
                        </div>

                        {/* Visibility confirmation popup */}
                        <AnimatePresence>
                            {visibilityPopup && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                                    style={{ backgroundColor: 'hsl(var(--background) / 0.7)' }}
                                    onClick={() => setVisibilityPopup(null)}
                                >
                                    <motion.div
                                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                                        transition={{ duration: 0.3, ease: 'easeOut' }}
                                        className="w-full max-w-sm rounded-2xl p-8 shadow-xl text-center space-y-4"
                                        style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.4)' }}
                                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                    >
                                        <div
                                            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
                                            style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}
                                        >
                                            {visibilityPopup === 'private' ? (
                                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'hsl(var(--primary))' }}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                                </svg>
                                            ) : (
                                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'hsl(var(--primary))' }}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 0 1-1.652.928l-.679-.906a1.125 1.125 0 0 0-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 0 1 6.69 14.036m0 0-.177-.529A2.25 2.25 0 0 0 17.128 15H16.5l-.324-.324a1.453 1.453 0 0 0-2.328.377l-.036.073a1.586 1.586 0 0 1-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 0 1-5.276 3.67m0 0a9 9 0 0 1-10.275-4.835M15.75 9c0 .896-.393 1.7-1.016 2.25" />
                                                </svg>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-medium tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                                            {visibilityPopup === 'private' ? t('privateConfirmTitle') : t('publicConfirmTitle')}
                                        </h3>
                                        <p className="text-sm font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                            {visibilityPopup === 'private' ? t('privateConfirmDesc') : t('publicConfirmDesc')}
                                        </p>

                                        <div className="flex flex-col gap-2 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => { setIsPublic(visibilityPopup === 'public'); setVisibilityPopup(null); }}
                                                className="w-full rounded-full py-3 text-xs font-normal uppercase tracking-[0.2em] text-center shadow-sm transition-shadow duration-300 hover:shadow-md"
                                                style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                                            >
                                                {visibilityPopup === 'private' ? t('privateConfirmYes') : t('publicConfirmYes')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setVisibilityPopup(null)}
                                                className="text-xs font-light transition-colors"
                                                style={{ color: 'hsl(var(--muted-foreground))' }}
                                            >
                                                {t('cancelButton')}
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>
                )}

                <SupportEditor
                    supportTitle={supportTitle} setSupportTitle={setSupportTitle}
                    supportUrl={supportUrl} setSupportUrl={setSupportUrl}
                    supportDesc={supportDesc} setSupportDesc={setSupportDesc}
                    showDropdown={showDropdown} setShowDropdown={setShowDropdown}
                />

                <TimelineEditor events={timelineEvents} onChange={setTimelineEvents} />

                <GalleryEditor
                    photos={galleryPhotos} uploading={galleryUploading} uploadProgress={uploadProgress}
                    memorialId={editId ?? undefined}
                    isPremium={isCofounder(userId)}
                    onUpload={handleGalleryUpload} onToggleFavorite={handleToggleGalleryFavorite} onDelete={handleDeletePhoto}
                />

                <StoriesEditor
                    stories={stories} pendingStories={pendingStories} userName={userName}
                    onAddStory={handleAddStory} onApprove={handleApproveStory} onReject={handleRejectStory}
                    onToggleFavorite={handleToggleStoryFavorite} onDelete={handleDeleteStory}
                />

                {isOwnerRole && (
                    <TeamSection
                        isEditing={isEditing} existingSlug={existingSlug} editId={editId ?? undefined} userId={userId ?? undefined}
                        invites={invites} setInvites={setInvites}
                    />
                )}

                {isEditing && editId && isOwnerRole && (
                    <DangerZone editId={editId} name={name} onError={(msg) => setErrors([msg])} />
                )}

                {isEditing && editId && isEditorRole && (
                    <EditorLeaveZone memorialId={editId} />
                )}

                {/* Spacer for sticky button */}
                <div className="h-20" />
            </div>

            {/* Sticky Submit */}
            <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-5 pt-3" style={{ background: 'linear-gradient(to top, hsl(var(--background)) 60%, transparent)' }}>
                <div className="mx-auto max-w-xl">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full rounded-full py-4 text-xs font-normal uppercase tracking-[0.25em] shadow-lg transition-shadow duration-300 hover:shadow-xl disabled:opacity-50 flex items-center justify-center"
                        style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                    >
                        {loading ? (
                            <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                        ) : isEditing ? t('saveUpdate') : t('saveCreate')}
                    </button>
                </div>
            </div>

            {/* Confirmation popup before creating a memorial */}
            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        key="confirm-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center px-4"
                        style={{ backgroundColor: 'hsl(var(--background) / 0.7)', backdropFilter: 'blur(4px)' }}
                        onClick={() => { setShowConfirm(false); setConfirmChecked(false); }}
                    >
                        <motion.div
                            key="confirm-card"
                            initial={{ opacity: 0, y: 16, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.97 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl sm:p-8"
                            style={{
                                backgroundColor: 'hsl(var(--card))',
                                borderColor: 'hsl(var(--border) / 0.4)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="mb-4 text-xl tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                                {t('confirmTitle')}
                            </h2>

                            <div className="space-y-3 text-sm font-light leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                <p>{t('confirmIntro')}</p>
                                <p>{t('confirmFamily')}</p>
                                <p>{t('confirmRespect')}</p>
                                <p>{t('confirmSensitive')}</p>
                                <p style={{ color: 'hsl(var(--foreground) / 0.8)' }}>{t('confirmClosing')}</p>
                            </div>

                            <label className="mt-6 flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={confirmChecked}
                                    onChange={(e) => setConfirmChecked(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer"
                                />
                                <span className="text-sm font-light" style={{ color: 'hsl(var(--foreground))' }}>
                                    {t('confirmCheckbox')}
                                </span>
                            </label>

                            <div className="mt-6 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setShowConfirm(false); setConfirmChecked(false); }}
                                    className="rounded-full px-5 py-2 text-xs font-light uppercase tracking-[0.2em] transition-colors"
                                    style={{ color: 'hsl(var(--muted-foreground))' }}
                                >
                                    {t('confirmCancel')}
                                </button>
                                <button
                                    type="button"
                                    onClick={performSubmit}
                                    disabled={!confirmChecked}
                                    className="rounded-full px-5 py-2 text-xs font-normal uppercase tracking-[0.2em] shadow-sm transition-all disabled:opacity-40"
                                    style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                                >
                                    {t('confirmProceed')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Discard warning when leaving with unsaved changes */}
            <AnimatePresence>
                {showDiscardWarning && (
                    <motion.div
                        key="discard-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 z-[80] flex items-center justify-center px-4"
                        style={{ backgroundColor: 'hsl(var(--background) / 0.7)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setShowDiscardWarning(false)}
                    >
                        <motion.div
                            key="discard-card"
                            initial={{ opacity: 0, y: 16, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.97 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl sm:p-8"
                            style={{
                                backgroundColor: 'hsl(var(--card))',
                                borderColor: 'hsl(var(--border) / 0.4)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="mb-4 text-xl tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                                {t('discardTitle')}
                            </h2>
                            <p className="text-sm font-light leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                {t('discardMessage')}
                            </p>
                            <div className="mt-6 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDiscardWarning(false)}
                                    className="rounded-full px-5 py-2 text-xs font-light uppercase tracking-[0.2em] transition-colors"
                                    style={{ color: 'hsl(var(--muted-foreground))' }}
                                >
                                    {t('discardStay')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push('/dashboard')}
                                    className="rounded-full px-5 py-2 text-xs font-normal uppercase tracking-[0.2em] shadow-sm transition-all"
                                    style={{ backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }}
                                >
                                    {t('discardLeave')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

export default function CreatePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</span></div>}>
            <CreateMemorialForm />
        </Suspense>
    );
}
