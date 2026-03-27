/**
 * @file core/src/types/index.ts
 * @description Domain-Typen der Cloudyard-Kern-Schicht.
 *
 * Diese Typen definieren die Geschäftsobjekte der App. Sie kennen weder Supabase
 * noch React — reine TypeScript-Definitionen, die von allen Schichten genutzt werden.
 * Supabase-spezifische Datenbankfelder werden im data/-Layer gemappt.
 */

/** Eine vollständige Gedenkseite. Zentrales Objekt der Domain. */
export interface Memorial {
    id: string;
    /** Menschenlesbarer, URL-freundlicher Identifier, z. B. "sarah-jenkins-1954". */
    slug: string;
    /** Supabase Auth User-ID des Erstellers. */
    ownerId: string;
    /** Vollständiger Name der verstorbenen Person. */
    name: string;
    /** ISO-Datumsstring, z. B. "1954-03-12". Optonal falls unbekannt. */
    dateOfBirth?: string;
    /** ISO-Datumsstring, z. B. "2024-01-15". */
    dateOfDeath?: string;
    /** Biographietext. */
    bio?: string;
    /** Lieblingszitat der Person. */
    quote?: string;
    /** Öffentliche URL des Titelbilds (aus Supabase Storage oder extern). */
    coverUrl?: string;
    /** Öffentliche URL des Porträtfotos. */
    portraitUrl?: string;
    /** Farbthema der Gedenkseite. */
    theme: 'classic' | 'modern' | 'nature';
    /** Ob die Gedenkseite öffentlich sichtbar ist. */
    isPublic: boolean;
    /** Timeline-Ereignisse als Array von {year, title, description}. */
    timeline?: { year: string; title: string; description: string }[];
    /** Name der Spendenorganisation. */
    supportTitle?: string;
    /** URL zur Spendenorganisation. */
    supportUrl?: string;
    /** Kurzbeschreibung der Spendenaktion. */
    supportDesc?: string;
    /** Anzahl angezündeter Kerzen. */
    candleCount: number;
    /** Anzahl niedergelegter Blumen. */
    flowerCount: number;
    createdAt: string;
    updatedAt: string;
}

/** Eine Erinnerungsgeschichte, die ein Besucher verfasst hat. */
export interface Memory {
    id: string;
    /** FK zur zugehörigen Gedenkseite. */
    memorialId: string;
    /** Anzeigename des Verfassers. */
    authorName: string;
    /** Optionale E-Mail des Verfassers (nicht öffentlich angezeigt). */
    authorEmail?: string;
    /** Der eigentliche Erinnerungstext. */
    text: string;
    createdAt: string;
}

/** Ein Galerie-Foto, das zu einer Gedenkseite gehört. */
export interface GalleryPhoto {
    id: string;
    /** FK zur zugehörigen Gedenkseite. */
    memorialId: string;
    /** Supabase Auth User-ID des Users, der das Foto hochgeladen hat. */
    uploadedBy: string;
    /** Öffentliche URL des Bildes (aus Supabase Storage). */
    url: string;
    /** Optionale Bildunterschrift. */
    caption?: string;
    /** Ob dieses Foto im Highlights-Tab als Favorit angezeigt werden soll. */
    isFavorite: boolean;
    /** Reihenfolge innerhalb der Galerie (für späteres Drag & Drop Sortieren). */
    sortOrder: number;
    createdAt: string;
}

/** Ein Mitglied, das Zugang zu einer Gedenkseite hat (Owner, Editor, Viewer). */
export interface Member {
    id: string;
    memorialId: string;
    /** Supabase Auth User-ID. Null bei Pending Invites. */
    userId: string | null;
    /** Wenn userId null ist, enthält dies die eingeladene E-Mail. */
    invitedEmail?: string;
    /** Zugriffsrolle; Owner hat vollen Schreibzugriff. */
    role: 'owner' | 'editor' | 'viewer';
    joinedAt: string;
}
