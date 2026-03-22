/**
 * @file types/index.ts
 * @description Zentrale TypeScript-Typdefinitionen für das gesamte Projekt.
 * Alle Datenstrukturen, die in der App vorkommen – von einem einzelnen Erinnerungsbeitrag
 * bis hin zum vollständigen Memorial-Objekt – sind hier typisiert.
 * Das stellt sicher, dass überall in der App die gleichen Datenfelder verwendet werden.
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
    /** Zeitstempel oder relative Zeitangabe (z.B. "vor 2 Std."). */
    time: string;
    /** Ob die Nachricht bereits gelesen wurde. */
    read: boolean;
}

/**
 * Das vollständige Memorial-Objekt.
 * Enthält alle Informationen einer Gedenkseite – von den Basisdaten
 * bis hin zu Stories, Fotos und der Spenden-Sektion.
 */
export interface Memorial {
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
}
