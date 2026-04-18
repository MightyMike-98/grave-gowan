'use server';

import { createClient } from '@supabase/supabase-js';

/**
 * Server Action: Besucher-Story als 'pending' einfügen.
 *
 * Nutzt den Service Role Key um RLS zu umgehen — als ob der Creator
 * die Story selbst eingefügt hätte. Status ist 'pending', damit sie
 * in der Warteschlange landet und vom Owner/Editor genehmigt werden muss.
 */
export async function submitVisitorStory(memorialId: string, author: string, text: string, relation: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        return { error: 'Server configuration missing' };
    }

    const supabase = createClient(url, serviceKey);

    const { data, error } = await supabase
        .from('memorial_stories')
        .insert({ memorial_id: memorialId, author, text, relation, status: 'pending' })
        .select('id')
        .single();

    if (error) {
        console.error('[submitVisitorStory]', error.message);
        return { error: error.message };
    }

    return { id: data.id };
}
