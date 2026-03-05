/**
 * @file components/ui/GalleryGrid.tsx
 * @description Zeigt alle Fotos eines Memorials in einem zweispaltigen Raster-Layout.
 *
 * Fotos werden gleichmäßig in einem 2-Spalten-Grid dargestellt.
 * Beim Hover auf ein Bild gibt es einen leichten Zoom-Effekt.
 * Enthält außerdem einen "+ Add Photo"-Button (aktuell ohne Backend-Anbindung).
 *
 * Reine Server Component – keine Interaktivität, kein State.
 */

import type { Photo } from '@/types';
import Image from 'next/image';

/** Props der GalleryGrid-Komponente. */
interface GalleryGridProps {
    /** Liste der anzuzeigenden Fotos. */
    photos: Photo[];
    /** Ob der User Fotos hinzufügen darf (Owner oder Editor). */
    canEdit?: boolean;
}

/**
 * Rendert die Foto-Galerie als responsives 2-Spalten-Grid.
 * Zeigt einen Leer-Zustand an, wenn keine Fotos vorhanden sind.
 *
 * @param photos - Array von Foto-Objekten mit URL und optionaler Bildunterschrift.
 */
export function GalleryGrid({ photos, canEdit = false }: GalleryGridProps) {
    return (
        <section aria-label="Gallery" className="px-6 py-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-stone-800">Gallery</h2>
                {canEdit && (
                    <button className="text-sm font-semibold text-stone-600 bg-stone-100 border border-stone-200 px-4 py-2 rounded-full hover:bg-stone-200 transition-colors">
                        + Add Photo
                    </button>
                )}
            </div>

            {/* Leer-Zustand */}
            {photos.length === 0 ? (
                <p className="text-stone-500 italic">{canEdit ? 'No photos added yet.' : 'No photos yet.'}</p>
            ) : (
                /* 2-spaltiges Grid, quadratische Fotos mit Hover-Zoom-Effekt */
                <div className="grid grid-cols-2 gap-3">
                    {photos.map((photo) => (
                        <figure
                            key={photo.id}
                            className="relative aspect-square rounded-lg overflow-hidden bg-stone-200 cursor-pointer group"
                        >
                            <Image
                                src={photo.url}
                                alt={photo.caption || 'Memorial photo'}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                sizes="(max-width: 768px) 50vw, 33vw"
                            />
                        </figure>
                    ))}
                </div>
            )}
        </section>
    );
}
