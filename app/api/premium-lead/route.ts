/**
 * POST /api/premium-lead
 * Tracks when a user hits a free-tier limit (photo, video, size).
 */

import { createSupabaseServerClient } from '@data/server-client';
import { NextRequest, NextResponse } from 'next/server';

const VALID_TRIGGERS = ['photo_limit', 'video_upload', 'size_limit'] as const;

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        }

        const { triggerType, memorialId } = await request.json();

        if (!VALID_TRIGGERS.includes(triggerType)) {
            return NextResponse.json({ error: 'Invalid trigger type.' }, { status: 400 });
        }

        // Only insert if no existing lead for this user + memorial + trigger
        const query = supabase
            .from('premium_leads')
            .select('id')
            .eq('user_id', user.id)
            .eq('trigger_type', triggerType);

        if (memorialId) {
            query.eq('memorial_id', memorialId);
        } else {
            query.is('memorial_id', null);
        }

        const { data: existing } = await query.limit(1);

        if (!existing || existing.length === 0) {
            await supabase.from('premium_leads').insert({
                user_id: user.id,
                memorial_id: memorialId || null,
                trigger_type: triggerType,
            });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[premium-lead] Error:', err);
        return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
    }
}
