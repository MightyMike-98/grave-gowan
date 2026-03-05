/**
 * @file lib/mock-data.ts
 * @description Enthält alle statischen Testdaten (Dummy-Daten) für die Entwicklung.
 *
 * Da noch keine Datenbank angebunden ist, werden alle Seiten mit diesen Daten
 * befüllt. Später wird `DUMMY_MEMORIAL` durch einen echten Supabase-Fetch ersetzt.
 *
 * @see /app/memorial/[id]/page.tsx – hier wird DUMMY_MEMORIAL aktuell geladen.
 */

import type { Memorial } from '@/types';

/**
 * Vollständiges Beispiel-Memorial für "Sarah Jenkins".
 * Dieses Objekt wird auf der Demo-Route `/memorial/demo` angezeigt
 * und dient als Vorlage für die spätere Datenbankstruktur.
 */
export const DUMMY_MEMORIAL: Memorial = {
    id: 'demo',
    name: 'Sarah Jenkins',
    dates: '1954 – 2024',
    bio: 'Sarah was a loving mother, grandmother, and biological researcher who dedicated her life to preserving wetland ecosystems. Her gentleness and wisdom touched everyone she met.',
    quote: 'Nature does not hurry, yet everything is accomplished.',
    coverUrl:
        'https://images.unsplash.com/photo-1444930694458-ca65243f7d1a?q=80&w=2066&auto=format&fit=crop',
    portraitUrl:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=688&auto=format&fit=crop',
    theme: 'nature',
    stories: [
        {
            id: '1',
            author: 'Emily (daughter)',
            date: 'Jan 24, 2024',
            text: 'Mom always loved the rain. She used to say it was the earth taking a deep breath.',
        },
        {
            id: '2',
            author: 'Mark T.',
            date: 'Jan 22, 2024',
            text: 'I worked with Sarah for 20 years. Her patience was unmatched.',
        },
    ],
    photos: [
        {
            id: '1',
            url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop',
            caption: 'Walking in the Olympic National Park, 1985',
        },
        {
            id: '2',
            url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop',
            caption: 'Her favorite view of the valley',
        },
        {
            id: '3',
            url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&auto=format&fit=crop',
        },
    ],
    facts: [
        'Born in Portland, Oregon',
        'PhD in Environmental Science',
        'Published 12 research papers on wetland conservation',
    ],
    timeline: [
        {
            id: '1',
            year: '1954',
            title: 'Born',
            description: 'Born in Portland, Oregon to Robert and Mary Williams.',
        },
        {
            id: '2',
            year: '1976',
            title: 'Graduated University',
            description: 'Earned degree in Biology from University of Washington.',
        },
        {
            id: '3',
            year: '1980',
            title: 'Married David',
            description: 'Met David at a research conference. Married two years later.',
        },
        {
            id: '4',
            year: '2010',
            title: 'Published Key Research',
            description: 'Her work on local wetlands was featured in Nature magazine.',
        },
    ],
    support: {
        description:
            'Sarah dedicated her life to conservation. In lieu of flowers, the family suggests supporting her favorite causes.',
        links: [
            { title: 'The Nature Conservancy', url: 'https://www.nature.org' },
            { title: 'World Wildlife Fund', url: 'https://www.worldwildlife.org' },
        ],
    },
    highlights: ['1', '2'],
};

/**
 * Liste beliebter Spendenorganisationen, die im Create-Formular
 * als Schnellauswahl im Dropdown angeboten werden.
 */
export const POPULAR_CHARITIES = [
    { title: 'Cancer Research', url: 'https://www.cancerresearch.org' },
    { title: 'Red Cross', url: 'https://www.redcross.org' },
    { title: 'WWF', url: 'https://www.worldwildlife.org' },
    { title: 'Doctors Without Borders', url: 'https://www.doctorswithoutborders.org' },
    { title: 'DKMS (Bone Marrow)', url: 'https://www.dkms.org' },
    { title: 'UNICEF', url: 'https://www.unicef.org' },
    { title: 'Amnesty International', url: 'https://www.amnesty.org' },
];
