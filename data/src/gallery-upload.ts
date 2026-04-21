/**
 * @file data/src/gallery-upload.ts
 * @description Direkter Browser → Supabase Storage Upload für Gallery-Medien.
 *
 * Umgeht das Vercel Serverless-Function Body-Limit (4,5 MB), indem die Datei
 * direkt aus dem Browser zu Supabase Storage hochgeladen wird. Supabase ist
 * durch das Storage-Bucket-Limit (100 MB) und RLS abgesichert — der User darf
 * nur in sein eigenes Verzeichnis hochladen.
 *
 * Nutzt XMLHttpRequest statt fetch, damit wir Upload-Progress-Events bekommen.
 */

import { createSupabaseBrowserClient } from './browser-client';

const BUCKET = 'memorial-images';

const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/quicktime', 'video/webm',
];

interface UploadResult {
    url: string | null;
    error: string | null;
}

interface UploadOptions {
    userId: string;
    onProgress?: (percent: number) => void;
}

export function uploadGalleryFile(file: File, { userId, onProgress }: UploadOptions): Promise<UploadResult> {
    return new Promise(async (resolve) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            resolve({ url: null, error: 'Dateityp nicht unterstützt.' });
            return;
        }

        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            resolve({ url: null, error: 'Nicht authentifiziert.' });
            return;
        }

        const ext = file.name.split('.').pop() ?? 'bin';
        const path = `${userId}/gallery/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`;

        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (ev) => {
            if (ev.lengthComputable && onProgress) {
                onProgress(Math.round((ev.loaded / ev.total) * 100));
            }
        });
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
                resolve({ url: data.publicUrl, error: null });
            } else {
                let message = `Upload fehlgeschlagen (${xhr.status})`;
                try {
                    const body = JSON.parse(xhr.responseText);
                    if (body.message) message = body.message;
                    else if (body.error) message = body.error;
                } catch { /* ignore */ }
                resolve({ url: null, error: message });
            }
        });
        xhr.addEventListener('error', () => {
            resolve({ url: null, error: 'Netzwerkfehler beim Upload.' });
        });

        xhr.open('POST', storageUrl);
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
        xhr.setRequestHeader('apikey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        xhr.setRequestHeader('x-upsert', 'false');
        xhr.setRequestHeader('Cache-Control', '3600');
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
    });
}
