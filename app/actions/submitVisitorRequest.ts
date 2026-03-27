'use server';

import { createClient } from '@supabase/supabase-js';

/**
 * Server Action: Besucher-Request (Vorschlag) einfügen.
 *
 * Nutzt den Service Role Key um RLS zu umgehen — Besucher
 * können ohne Login Vorschläge an den Creator/Editor senden.
 * Optionaler Bild-Upload zu Supabase Storage (Bucket: request-images).
 */
export async function submitVisitorRequest(
    memorialId: string,
    author: string,
    category: string,
    message: string,
    imageFile?: File,
) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        return { error: 'Server configuration missing' };
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Upload image if provided
    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
        const ext = imageFile.name.split('.').pop() ?? 'jpg';
        const path = `${memorialId}/${Date.now()}.${ext}`;

        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { error: uploadError } = await supabase.storage
            .from('request-images')
            .upload(path, buffer, { contentType: imageFile.type, upsert: false });

        if (uploadError) {
            console.error('[submitVisitorRequest] Image upload failed:', uploadError.message);
            // Continue without image rather than blocking the whole request
        } else {
            const { data: { publicUrl } } = supabase.storage
                .from('request-images')
                .getPublicUrl(path);
            imageUrl = publicUrl;
        }
    }

    const { data, error } = await supabase
        .from('memorial_requests')
        .insert({
            memorial_id: memorialId,
            author,
            category,
            message,
            image_url: imageUrl,
        })
        .select('id')
        .single();

    if (error) {
        console.error('[submitVisitorRequest]', error.message);
        return { error: error.message };
    }

    return { id: data.id };
}
