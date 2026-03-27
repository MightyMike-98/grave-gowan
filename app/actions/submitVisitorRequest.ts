'use server';

import { createClient } from '@supabase/supabase-js';

/**
 * Server Action: Besucher-Request (Vorschlag) einfügen.
 *
 * Nutzt den Service Role Key um RLS zu umgehen — Besucher
 * können ohne Login Vorschläge an den Creator/Editor senden.
 */
export async function submitVisitorRequest(
    memorialId: string,
    author: string,
    category: string,
    message: string,
    imageUrl?: string,
) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        return { error: 'Server configuration missing' };
    }

    const supabase = createClient(url, serviceKey);

    const { data, error } = await supabase
        .from('memorial_requests')
        .insert({
            memorial_id: memorialId,
            author,
            category,
            message,
            image_url: imageUrl ?? null,
        })
        .select('id')
        .single();

    if (error) {
        console.error('[submitVisitorRequest]', error.message);
        return { error: error.message };
    }

    return { id: data.id };
}
