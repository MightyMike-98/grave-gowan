/**
 * @file app/api/members/[memberId]/remove/route.ts
 * @description API Route Handler: Entfernt einen Member aus einem Memorial.
 *
 * POST /api/members/[memberId]/remove
 *
 * Body: { memorialId, memorialSlug }
 *
 * Sicherheit: RLS Policy stellt sicher, dass nur der Owner Members entfernen kann.
 */

import { removeMember } from '@core/use-cases/removeMember';
import { SupabaseMemberRepository } from '@data/repositories/SupabaseMemberRepository';
import { createSupabaseServerClient } from '@data/server-client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ memberId: string }> },
) {
    let memorialSlug = '';
    try {
        const { memberId } = await params;

        // Native <form method="POST"> sends URL-encoded data, not JSON
        const formData = await request.formData();
        memorialSlug = (formData.get('memorialSlug') as string) || '';

        if (!memberId) {
            return NextResponse.redirect(
                new URL(`/memorial/${memorialSlug}/settings?error=memberId+is+required`, request.url),
            );
        }

        // Server-Client für cookie-basierte Auth
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.redirect(
                new URL(`/memorial/${memorialSlug}/settings?error=Not+authenticated`, request.url),
            );
        }

        // Member entfernen via Use Case (RLS schützt vor unbefugtem Zugriff)
        const memberRepo = new SupabaseMemberRepository(supabase);
        await removeMember(memberId, memberRepo);

        // Redirect zurück zur Settings-Seite (native Form POST kann kein JSON lesen)
        return NextResponse.redirect(
            new URL(`/memorial/${memorialSlug}/settings`, request.url),
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[remove-member] Unexpected error:', err);
        return NextResponse.redirect(
            new URL(`/memorial/${memorialSlug || 'error'}/settings?error=${encodeURIComponent(message)}`, request.url),
        );
    }
}
