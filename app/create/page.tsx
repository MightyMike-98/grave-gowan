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
import { createMemorial } from '@core/use-cases/createMemorial';
import { createSupabaseBrowserClient } from '@data/browser-client';
import { SupabaseMemorialRepository } from '@data/repositories/SupabaseMemorialRepository';
import { uploadMemorialImage } from '@data/storage';
import { useTranslations } from 'next-intl';
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
    const [existingSlug, setExistingSlug] = useState('');
    const [isPublic, setIsPublic] = useState(false);

    const [supportTitle, setSupportTitle] = useState('');
    const [supportUrl, setSupportUrl] = useState('');
    const [supportDesc, setSupportDesc] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const [timelineEvents, setTimelineEvents] = useState<TimelineEventDraft[]>([]);

    const [galleryPhotos, setGalleryPhotos] = useState<{ id: string; url: string; favorite: boolean; size?: number }[]>([]);
    const [galleryUploading, setGalleryUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [stories, setStories] = useState<{ id: string; author: string; text: string; date: string; favorite: boolean }[]>([]);
    const [pendingStories, setPendingStories] = useState<{ id: string; author: string; text: string; date: string }[]>([]);

    interface InviteDraft { email: string; role: 'editor' }
    const [invites, setInvites] = useState<InviteDraft[]>([]);
    const [userRole, setUserRole] = useState<'owner' | 'editor' | 'viewer' | null>(null);
    const isOwnerRole = userRole === 'owner' || userRole === null;
    const isEditorRole = userRole === 'editor';

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);

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
        supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));

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

    // ── Handlers ──
    const handleGalleryUpload = (file: File) => {
        if (!userId) return;
        setGalleryUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', file);
        if (editId) formData.append('memorialId', editId);

        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener('load', () => {
            try {
                const data = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300) {
                    if (editId && data.photo) {
                        setGalleryPhotos(prev => [...prev, { id: data.photo.id, url: data.photo.url, favorite: data.photo.isFavorite ?? false, size: file.size }]);
                    } else if (!editId && data.url) {
                        setGalleryPhotos(prev => [...prev, { id: `temp_${Date.now()}`, url: data.url, favorite: false, size: file.size }]);
                    }
                } else {
                    console.error('[Create/Gallery] Upload error:', data.error);
                }
            } catch (err) { console.error('[Create/Gallery] Parse error:', err); }
            finally { setGalleryUploading(false); setUploadProgress(0); }
        });
        xhr.addEventListener('error', () => {
            console.error('[Create/Gallery] Upload failed');
            setGalleryUploading(false);
            setUploadProgress(0);
        });
        xhr.open('POST', '/api/photos/upload');
        xhr.send(formData);
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

    const handleAddStory = async (author: string, text: string) => {
        const newStory = {
            id: `temp_${Date.now()}`, author, text,
            date: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            favorite: false,
        };
        if (editId) {
            const supabase = createSupabaseBrowserClient();
            const { data, error } = await supabase.from('memorial_stories').insert({ memorial_id: editId, author, text, status: 'approved' }).select().single();
            if (!error && data) setStories(prev => [{ ...newStory, id: data.id }, ...prev]);
        } else {
            setStories(prev => [newStory, ...prev]);
        }
    };

    const handleApproveStory = async (storyId: string) => {
        const story = pendingStories.find(s => s.id === storyId);
        if (!story) return;
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.from('memorial_stories').update({ status: 'approved' }).eq('id', storyId);
        if (!error) {
            setPendingStories(prev => prev.filter(s => s.id !== storyId));
            setStories(prev => [{ ...story, favorite: false }, ...prev]);
        }
    };

    const handleRejectStory = async (storyId: string) => {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.from('memorial_stories').delete().eq('id', storyId);
        if (!error) setPendingStories(prev => prev.filter(s => s.id !== storyId));
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

        setErrors([]);
        setLoading(true);
        try {
            const repo = new SupabaseMemorialRepository();
            if (isEditing && editId) {
                const fields = isEditorRole
                    ? { bio: bio.trim(), quote: quote.trim() || undefined, dateOfDeath: dateOfDeath || undefined, timeline: timelineEvents.length > 0 ? timelineEvents : [], supportTitle: supportTitle || undefined, supportUrl: supportUrl || undefined, supportDesc: supportDesc || undefined }
                    : { name: name.trim(), bio: bio.trim(), quote: quote.trim() || undefined, dateOfBirth: dateOfBirth || undefined, dateOfDeath: dateOfDeath || undefined, portraitUrl: portraitUrl || undefined, isPublic, timeline: timelineEvents.length > 0 ? timelineEvents : [], supportTitle: supportTitle || undefined, supportUrl: supportUrl || undefined, supportDesc: supportDesc || undefined, country: country.trim() || undefined };
                await repo.update(editId, fields);
                router.push(`/memorial/${existingSlug}`);
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
                        supabase.from('memorial_stories').insert({ memorial_id: memorial.id, author: story.author, text: story.text, is_favorite: story.favorite })
                    ));
                }
                if (invites.length > 0) {
                    await Promise.allSettled(invites.map((inv) =>
                        fetch('/api/members/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: inv.email, role: inv.role, memorialId: memorial.id, invitedBy: userId, memorialSlug: memorial.slug }) })
                    ));
                }
                router.push(`/memorial/${memorial.slug}`);
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
        <main className="min-h-screen px-4 py-10">
            {/* Portrait */}
            <div className="max-w-xl mx-auto flex justify-center">
                {isOwnerRole ? (
                    <ImageUploader
                        label={t('sectionPortrait')}
                        currentUrl={portraitUrl}
                        onUpload={async (file: File) => {
                            if (!userId) throw new Error('Not logged in.');
                            const { url, error } = await uploadMemorialImage(file, userId, 'portrait');
                            if (error) throw new Error(error);
                            if (url) setPortraitUrl(url);
                        }}
                    />
                ) : portraitUrl ? (
                    <div className="relative">
                        <p className="text-xs font-light tracking-wider text-center mb-2 flex items-center justify-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            <span style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>🔒</span> {t('sectionPortrait')}
                        </p>
                        <div className="w-28 h-28 rounded-full overflow-hidden shadow-sm opacity-80" style={{ border: '2px solid hsl(var(--border))' }}>
                            <img src={portraitUrl} alt="Portrait" className="w-full h-full object-cover" />
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="mx-auto max-w-xl pb-20 space-y-10 mt-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl tracking-tight">{isEditing ? t('titleEdit') : t('titleCreate')}</h1>
                    <Link href="/dashboard" className="text-sm font-light transition-colors hover:opacity-100" style={{ color: 'hsl(var(--muted-foreground))' }}>← Back</Link>
                </div>

                {isEditing && existingSlug && (
                    <div
                        className="flex items-center gap-3 rounded-xl px-4 py-3"
                        style={{ backgroundColor: 'hsl(var(--muted) / 0.15)', border: '1px solid hsl(var(--border) / 0.4)' }}
                    >
                        <span className="text-xs font-medium uppercase tracking-[0.15em] shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {t('linkLabel')}
                        </span>
                        <span className="text-sm font-light truncate" style={{ color: 'hsl(var(--foreground))' }}>
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
                            className="shrink-0 text-xs font-light px-2 py-1 rounded-md transition-colors"
                            style={{
                                color: copied ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                                backgroundColor: copied ? 'hsl(var(--foreground))' : 'hsl(var(--muted) / 0.3)',
                            }}
                            title={t('copyLink')}
                        >
                            {copied ? '✓' : t('copyLink')}
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
                                    {isPublic ? t('visibilityPublic') : t('visibilityPrivate')}
                                </p>
                                <p className="text-xs font-light mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    {isPublic ? t('visibilityPublicDesc') : t('visibilityPrivateDesc')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsPublic(!isPublic)}
                                className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200"
                                style={{ backgroundColor: isPublic ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground) / 0.3)' }}
                                role="switch"
                                aria-checked={isPublic}
                            >
                                <span
                                    className="pointer-events-none inline-block h-5 w-5 rounded-full shadow-sm transform transition-transform duration-200"
                                    style={{
                                        backgroundColor: 'hsl(var(--background))',
                                        transform: isPublic ? 'translateX(1.25rem)' : 'translateX(0.125rem)',
                                        marginTop: '0.125rem',
                                    }}
                                />
                            </button>
                        </div>
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
                    onUpload={handleGalleryUpload} onToggleFavorite={handleToggleGalleryFavorite} onDelete={handleDeletePhoto}
                />

                <StoriesEditor
                    stories={stories} pendingStories={pendingStories}
                    onAddStory={handleAddStory} onApprove={handleApproveStory} onReject={handleRejectStory}
                    onToggleFavorite={handleToggleStoryFavorite} onDelete={handleDeleteStory}
                />

                {isOwnerRole && (
                    <TeamSection
                        isEditing={isEditing} existingSlug={existingSlug}
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
