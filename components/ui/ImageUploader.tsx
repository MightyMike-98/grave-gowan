/**
 * @file components/ui/ImageUploader.tsx
 * @description Wiederverwendbare Bild-Upload-Komponente mit Crop-Dialog.
 *
 * Zeigt:
 * - Vorschau des aktuell ausgewählten/hochgeladenen Bildes
 * - Klick-/Drag-Zone zum Auswählen einer Datei
 * - Instagram-ähnlicher Crop-Dialog (Zoom + Pan)
 * - Lade-Spinner während des Uploads
 * - Fehlermeldung bei ungültiger Datei oder Upload-Fehler
 */

'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

/** Props der ImageUploader-Komponente. */
interface ImageUploaderProps {
    currentUrl?: string;
    label: string;
    onUpload: (file: File) => Promise<void>;
    hint?: string;
    /** Aspect ratio for cropping. Default 1 (square, like profile pics). */
    cropAspect?: number;
    /** Shape of the crop area. Default 'round' for profile pics. */
    cropShape?: 'rect' | 'round';
}

/**
 * Creates a cropped image file from the source image and crop area.
 */
async function getCroppedImage(imageSrc: string, cropArea: Area): Promise<File> {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageSrc;
    });

    const canvas = document.createElement('canvas');
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;
    const ctx = canvas.getContext('2d')!;

    ctx.drawImage(
        image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height,
    );

    return new Promise<File>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) return reject(new Error('Canvas is empty'));
                resolve(new File([blob], 'portrait.jpg', { type: 'image/jpeg' }));
            },
            'image/jpeg',
            0.92,
        );
    });
}

export function ImageUploader({
    currentUrl,
    label,
    onUpload,
    hint,
    cropAspect = 1,
    cropShape = 'round',
}: ImageUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl ?? null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Crop state
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    useEffect(() => {
        if (currentUrl !== undefined) {
            setPreviewUrl(currentUrl);
        }
    }, [currentUrl]);

    const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleFile = (file: File) => {
        setError(null);
        const objectUrl = URL.createObjectURL(file);
        // Open crop dialog instead of uploading directly
        setCropSrc(objectUrl);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    };

    const handleCropConfirm = async () => {
        if (!cropSrc || !croppedAreaPixels) return;

        try {
            const croppedFile = await getCroppedImage(cropSrc, croppedAreaPixels);
            URL.revokeObjectURL(cropSrc);
            setCropSrc(null);

            const objectUrl = URL.createObjectURL(croppedFile);
            setPreviewUrl(objectUrl);

            setUploading(true);
            await onUpload(croppedFile);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed.');
            setPreviewUrl(currentUrl ?? null);
        } finally {
            setUploading(false);
        }
    };

    const handleCropCancel = () => {
        if (cropSrc) URL.revokeObjectURL(cropSrc);
        setCropSrc(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        // Reset input so re-selecting the same file works
        e.target.value = '';
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-stone-700">{label}</label>

            {/* Klickbare Upload-Zone (kreisförmig wie das Ergebnis) */}
            <div className="flex justify-center">
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    className="relative w-32 h-32 border-2 border-dashed border-stone-300 rounded-full overflow-hidden bg-stone-50 hover:border-stone-400 hover:bg-stone-100 transition-colors disabled:opacity-60"
                >
                    {previewUrl ? (
                        <>
                            <Image
                                src={previewUrl}
                                alt={label}
                                fill
                                className="object-cover"
                                sizes="128px"
                                unoptimized={previewUrl.startsWith('blob:')}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-white text-xs font-medium">Change</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-stone-300">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </div>
                    )}

                    {uploading && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                            <span className="w-6 h-6 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </button>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleInputChange}
                className="hidden"
            />

            {error && (
                <p role="alert" className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">
                    {error}
                </p>
            )}

            {hint && <p className="text-xs text-stone-400">{hint}</p>}

            {/* ── Crop Dialog (Instagram-style) ── */}
            {cropSrc && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-black/90">
                    {/* Crop area */}
                    <div className="relative flex-1">
                        <Cropper
                            image={cropSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={cropAspect}
                            cropShape={cropShape}
                            showGrid={false}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                        />
                    </div>

                    {/* Zoom slider */}
                    <div className="flex items-center justify-center gap-4 px-6 py-3">
                        <span className="text-white/60 text-xs">−</span>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.01}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-48 accent-white"
                        />
                        <span className="text-white/60 text-xs">+</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between px-6 py-4 pb-8">
                        <button
                            type="button"
                            onClick={handleCropCancel}
                            className="px-6 py-2.5 rounded-full text-sm font-medium text-white/80 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleCropConfirm}
                            className="px-8 py-2.5 rounded-full text-sm font-semibold bg-white text-black hover:bg-white/90 transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
