/**
 * @file components/ui/HeroImageUploader.tsx
 * @description Kombinierter Cover + Portrait Upload als Hero-Preview.
 *
 * Zeigt die Bilder genau so wie sie auf der fertigen Gedenkseite erscheinen:
 * - Vollbreites Cover-Banner — Klick öffnet den Datei-Dialog
 * - Runder Portrait-Kreis der unten aus dem Cover herausragt — eigener Klick
 *
 * Das ist gleichzeitig eine Live-Vorschau UND das Upload-Interface.
 * Kein separates "Upload"-Feld nötig — intuitiv und visuell ansprechend.
 */

'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

interface HeroImageUploaderProps {
    /** Aktuelle Cover-URL (kann leer sein). */
    coverUrl: string;
    /** Aktuelle Portrait-URL (kann leer sein). */
    portraitUrl: string;
    /** Wird nach Cover-Upload mit der neuen URL aufgerufen. */
    onCoverUpload: (file: File) => Promise<void>;
    /** Wird nach Portrait-Upload mit der neuen URL aufgerufen. */
    onPortraitUpload: (file: File) => Promise<void>;
}

/**
 * Hero-förmiger Upload-Bereich: Cover-Banner + Portrait-Kreis.
 * Klick auf Cover → Cover-Dateidialog.
 * Klick auf Portrait-Kreis → Portrait-Dateidialog.
 */
export function HeroImageUploader({
    coverUrl,
    portraitUrl,
    onCoverUpload,
    onPortraitUpload,
}: HeroImageUploaderProps) {
    const coverInputRef = useRef<HTMLInputElement>(null);
    const portraitInputRef = useRef<HTMLInputElement>(null);

    const [coverPreview, setCoverPreview] = useState(coverUrl);
    const [portraitPreview, setPortraitPreview] = useState(portraitUrl);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingPortrait, setUploadingPortrait] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError(null);
        setCoverPreview(URL.createObjectURL(file));
        setUploadingCover(true);
        try {
            await onCoverUpload(file);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Cover upload failed.');
            setCoverPreview(coverUrl);
        } finally {
            setUploadingCover(false);
        }
    };

    const handlePortraitFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError(null);
        setPortraitPreview(URL.createObjectURL(file));
        setUploadingPortrait(true);
        try {
            await onPortraitUpload(file);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Portrait upload failed.');
            setPortraitPreview(portraitUrl);
        } finally {
            setUploadingPortrait(false);
        }
    };

    return (
        <div className="w-full">
            {/* ── Cover-Banner ─────────────────────────────────────────── */}
            <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="relative w-full h-44 bg-stone-200 overflow-hidden group focus:outline-none"
                title="Click to change cover photo"
            >
                {coverPreview ? (
                    <Image
                        src={coverPreview}
                        alt="Cover"
                        fill
                        className="object-cover"
                        sizes="100vw"
                        unoptimized={coverPreview.startsWith('blob:')}
                    />
                ) : (
                    /* Kein Cover: Muster + Hinweis */
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-stone-400">
                        <span className="text-3xl">🏔️</span>
                        <span className="text-xs font-medium">Add cover photo</span>
                    </div>
                )}

                {/* Hover-Overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium bg-black/40 px-3 py-1.5 rounded-full">
                        {uploadingCover ? 'Uploading…' : '📷 Change cover'}
                    </span>
                </div>

                {/* Upload-Spinner */}
                {uploadingCover && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                        <span className="w-7 h-7 border-2 border-stone-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </button>

            {/* ── Portrait-Kreis (überlagert den unteren Cover-Rand) ─── */}
            <div className="flex flex-col items-center -mt-12 mb-4 relative z-10">
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); portraitInputRef.current?.click(); }}
                    className="relative w-24 h-24 rounded-full border-4 border-stone-100 bg-stone-300 overflow-hidden group focus:outline-none shadow-md"
                    title="Click to change portrait photo"
                >
                    {portraitPreview ? (
                        <Image
                            src={portraitPreview}
                            alt="Portrait"
                            fill
                            className="object-cover"
                            sizes="96px"
                            unoptimized={portraitPreview.startsWith('blob:')}
                        />
                    ) : (
                        <span className="text-3xl flex items-center justify-center w-full h-full">👤</span>
                    )}

                    {/* Hover-Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                        <span className="text-white text-xs font-medium">
                            {uploadingPortrait ? '…' : '📷'}
                        </span>
                    </div>

                    {/* Spinner */}
                    {uploadingPortrait && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-full">
                            <span className="w-5 h-5 border-2 border-stone-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </button>
                <p className="text-xs text-stone-400 mt-1.5">Cover & Portrait</p>
            </div>

            {/* Fehlermeldung */}
            {error && (
                <p role="alert" className="mx-4 text-xs text-red-600 bg-red-50 rounded px-3 py-2 -mt-2 mb-2">
                    {error}
                </p>
            )}

            {/* Versteckte File-Inputs */}
            <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleCoverFile} className="hidden" />
            <input ref={portraitInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handlePortraitFile} className="hidden" />
        </div>
    );
}
