/**
 * @file types/index.ts
 * @description UI-View-Model-Typen für die Darstellungsschicht.
 *
 * Diese Typen beschreiben die Datenstruktur, wie sie von den UI-Komponenten
 * konsumiert wird — mit zusammengesetzten Feldern (stories[], photos[], dates-String).
 *
 * Für die Domain-/Persistenz-Typen siehe @core/types/index.ts
 * (Memorial, Memory, GalleryPhoto, Member).
 */

/** Eine einzelne Erinnerungsgeschichte, die ein Hinterbliebener verfasst hat. */
export interface Story {
    id: string;
    /** Name der Person, die die Erinnerung geschrieben hat. */
    author: string;
    /** Datum des Beitrags (z. B. "Jan 24, 2024"). */
    date: string;
    /** Der eigentliche Erinnerungstext. */
    text: string;
    /** Ob diese Story im Highlights-Feed (Lieblings-Stories) angezeigt werden soll. */
    isFavorite?: boolean;
}

/** Ein einzelnes Galeriefoto. */
export interface Photo {
    id: string;
    /** Öffentliche Bild-URL (z. B. von Unsplash oder Supabase Storage). */
    url: string;
    /** Optionaler Bildunterschrift-Text. */
    caption?: string;
    /** Ob dieses Foto im Highlights-Feed (Favorisierte Bilder) angezeigt werden soll. */
    isFavorite?: boolean;
}

/** Ein einzelnes Ereignis in der Lebens-Chronik (Timeline). */
export interface TimelineEvent {
    id: string;
    /** Das Jahreszahl des Ereignisses, z. B. "1980". */
    year: string;
    /** Kurztitel des Ereignisses, z. B. "Verheiratet". */
    title: string;
    /** Längere Beschreibung des Ereignisses. */
    description: string;
}

/** Ein einzelner Spendenlink für die Support-Sektion. */
export interface SupportLink {
    /** Anzeigename der Organisation, z. B. „WWF". */
    title: string;
    /** Externe URL zur Spendenwebsite. */
    url: string;
}

/** Der gesamte Support/Spenden-Bereich eines Memorials. */
export interface SupportSection {
    /** Erklärender Text, warum diese Spendenorganisationen empfohlen werden. */
    description: string;
    /** Liste der empfohlenen Spendenlinks. */
    links: SupportLink[];
}

// Highlight interface removed - Highlights now a feed of favorites
/**
 * Ein Vorschlag (Suggestion) eines Besuchers aus dem Floating-Widget.
 * Wird im Dashboard-Postfach des Creators/Editors angezeigt.
 */
export interface Suggestion {
    id: string;
    /** Name oder Absender der Nachricht. */
    from: string;
    /** Kategorie des Vorschlags: "Gallery" | "Stories" | "Highlights" | "Allgemein" */
    category: "Gallery" | "Stories" | "Highlights" | "Allgemein" | string;
    /** Text/Nachricht des Vorschlags. */
    text: string;
    /** Ob ein Bild angehängt ist. */
    hasImage: boolean;
    /** Öffentliche URL des angehängten Bildes (falls vorhanden). */
    imageUrl?: string;
    /** Name des Memorials, auf das sich der Vorschlag bezieht. */
    memorialName?: string;
    /** Zeitstempel oder relative Zeitangabe (z.B. "vor 2 Std."). */
    time: string;
    /** Ob die Nachricht bereits gelesen wurde. */
    read: boolean;
}

/**
 * UI-View-Model einer Gedenkseite.
 * Enthält alle bereits aufbereiteten Daten für die Darstellung —
 * inklusive Stories, Fotos und der Spenden-Sektion.
 *
 * Nicht zu verwechseln mit dem Domain-Typ `Memorial` aus @core/types,
 * der die Persistenz-Felder (slug, ownerId, isPublic, …) abbildet.
 */
export interface MemorialView {
    id: string;
    /** Vollständiger Name der verstorbenen Person. */
    name: string;
    /** Lebensdaten als formatierbarer String, z. B. „1954 – 2024". */
    dates: string;
    /** Biographietext (kurze Beschreibung der Person). */
    bio: string;
    /** Optionales Lieblingszitat der Person. */
    quote?: string;
    /** Optionale URL zum Titelbild (Hintergrund des Hero-Bereichs). */
    coverUrl?: string;
    /** Optionale URL zum Porträtfoto (runder Kreis im Hero-Bereich). */
    portraitUrl?: string;
    /** Visuelles Design-Thema der Gedenkseite. */
    theme: 'classic' | 'modern' | 'nature';
    stories: Story[];
    photos: Photo[];
    /** Liste kurzer Fakten über die Person (z. B. Ausbildung, Herkunft). */
    facts: string[];
    timeline: TimelineEvent[];
    support?: SupportSection;
    /** Herkunftsland der verstorbenen Person. */
    country?: string;
    candleCount: number;
    flowerCount: number;
}
