/**
 * @file components/ui/ImageUploader.tsx
 * @description Wiederverwendbare Bild-Upload-Komponente.
 *
 * Zeigt:
 * - Vorschau des aktuell ausgewählten/hochgeladenen Bildes
 * - Klick-/Drag-Zone zum Auswählen einer Datei
 * - Lade-Spinner während des Uploads
 * - Fehlermeldung bei ungültiger Datei oder Upload-Fehler
 *
 * ARCHITEKTUR: Diese Komponente kennt keinen Supabase-Code direkt.
 * Der Upload wird über die `onUpload`-Callback-Prop nach außen delegiert,
 * die vom Create-Formular mit der `uploadMemorialImage`-Funktion belegt wird.
 */

'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

/** Props der ImageUploader-Komponente. */
interface ImageUploaderProps {
    /** Aktuell gespeicherte Bild-URL (aus Supabase Storage oder leer). */
    currentUrl?: string;
    /** Beschriftung über dem Upload-Bereich, z. B. "Cover Photo". */
    label: string;
    /** Callback nach erfolgreichem Upload — übergibt die neue öffentliche URL. */
    onUpload: (file: File) => Promise<void>;
    /** Optionaler Hinweistext unterhalb der Upload-Zone. */
    hint?: string;
}

/**
 * Bild-Upload-Komponente mit Vorschau, Drag-and-Drop-Optik und Fehlerhandling.
 */
export function ImageUploader({ currentUrl, label, onUpload, hint }: ImageUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl ?? null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Synchronisiere prop-Änderungen (z.B. beim asynchronen Laden im Edit-Modus) in den State
    useEffect(() => {
        if (currentUrl !== undefined) {
            setPreviewUrl(currentUrl);
        }
    }, [currentUrl]);

    /**
     * Verarbeitet die ausgewählte Datei:
     * 1. Erstellt lokale Vorschau sofort (ohne auf Server zu warten)
     * 2. Ruft den Upload-Callback auf
     * 3. Zeigt Fehler wenn der Upload fehlschlägt
     */
    const handleFile = async (file: File) => {
        setError(null);

        // Sofortige lokale Vorschau
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        setUploading(true);
        try {
            await onUpload(file);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed.');
            setPreviewUrl(currentUrl ?? null); // Vorschau zurücksetzen
        } finally {
            setUploading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-700">{label}</label>

            {/* Klickbare Upload-Zone */}
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="relative w-full border-2 border-dashed border-stone-300 rounded-xl overflow-hidden bg-stone-50 hover:border-stone-400 hover:bg-stone-100 transition-colors disabled:opacity-60"
                style={{ minHeight: '140px' }}
            >
                {previewUrl ? (
                    /* Bild-Vorschau */
                    <>
                        <Image
                            src={previewUrl}
                            alt={label}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 500px"
                            unoptimized={previewUrl.startsWith('blob:')} // lokale Vorschau nicht optimieren
                        />
                        {/* Hover-Overlay zum Ändern */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-white text-sm font-medium">Change photo</span>
                        </div>
                    </>
                ) : (
                    /* Upload-Placeholder */
                    <div className="flex flex-col items-center justify-center py-8 gap-2 text-stone-400">
                        <span className="text-3xl">📷</span>
                        <span className="text-sm">Click to upload</span>
                        <span className="text-xs">JPG, PNG, WebP · max 5 MB</span>
                    </div>
                )}

                {/* Lade-Spinner */}
                {uploading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <span className="w-8 h-8 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </button>

            {/* Verstecktes File-Input */}
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleInputChange}
                className="hidden"
            />

            {/* Fehlermeldung */}
            {error && (
                <p role="alert" className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">
                    {error}
                </p>
            )}

            {/* Optionaler Hinweis */}
            {hint && <p className="text-xs text-stone-400">{hint}</p>}
        </div>
    );
}
