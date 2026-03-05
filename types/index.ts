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
}

/** Ein einzelnes Galeriefoto. */
export interface Photo {
    id: string;
    /** Öffentliche Bild-URL (z. B. von Unsplash oder Supabase Storage). */
    url: string;
    /** Optionaler Bildunterschrift-Text. */
    caption?: string;
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
    /** Anzeigename der Organisation, z. B. "WWF". */
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

/**
 * Das vollständige Memorial-Objekt.
 * Enthält alle Informationen einer Gedenkseite – von den Basisdaten
 * bis hin zu Stories, Fotos und der Spenden-Sektion.
 */
export interface Memorial {
    id: string;
    /** Vollständiger Name der verstorbenen Person. */
    name: string;
    /** Lebensdaten als formatierbarer String, z. B. "1954 – 2024". */
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
    /** Liste von IDs (aus stories & photos), die als "Highlights" hervorgehoben werden. */
    highlights: string[];
}
