/**
 * @file app/api/memorials/save/route.ts
 * @description Toggle save/unsave a memorial for the logged-in user.
 *
 * Save = insert memorial_members with role 'viewer'
 * Unsave = delete that viewer row
 *
 * POST /api/memorials/save  { memorialId }
 * Returns { saved: true/false }
 */

import { createSupabaseServerClient } from '@data/server-client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { memorialId } = await request.json();
        if (!memorialId) {
            return NextResponse.json({ error: 'memorialId required' }, { status: 400 });
        }

        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Check if already a member
        const { data: existing } = await supabase
            .from('memorial_members')
            .select('id, role')
            .eq('user_id', user.id)
            .eq('memorial_id', memorialId)
            .maybeSingle();

        if (existing) {
            if (existing.role === 'viewer') {
                // Unsave — remove the viewer membership
                await supabase.from('memorial_members').delete().eq('id', existing.id);
                return NextResponse.json({ saved: false });
            }
            // Already owner/editor — don't touch
            return NextResponse.json({ saved: true });
        }

        // Save — add as viewer
        await supabase.from('memorial_members').insert({
            memorial_id: memorialId,
            user_id: user.id,
            role: 'viewer',
            invited_by: user.id,
        });
        return NextResponse.json({ saved: true });
    } catch (err) {
        console.error('[memorials/save]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
