/**
 * @file app/api/memorials/find/route.ts
 * @description API Route: Sucht ein Memorial per Slug, UUID, E-Mail oder Kombination.
 *
 * GET /api/memorials/find?q=<slug-or-uuid>
 * GET /api/memorials/find?email=<email>
 * GET /api/memorials/find?email=<email>&memorialId=<uuid>
 *
 * Bei ?q= wird per Slug und dann per UUID gesucht (Owner-Zugriff nötig).
 * Bei ?email= + ?memorialId= wird geprüft, ob die E-Mail als Member
 *   zu genau diesem Memorial eingeladen ist → gibt den Slug zurück.
 * Bei nur ?email= wird das erste Memorial zurückgegeben, zu dem die E-Mail gehört.
 */

import { createSupabaseServerClient } from '@data/server-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const q = request.nextUrl.searchParams.get('q')?.trim();
    const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase();
    const memorialId = request.nextUrl.searchParams.get('memorialId')?.trim();

    if (!q && !email) {
        return NextResponse.json(
            { error: 'Provide either query parameter "q" (slug/id) or "email".' },
            { status: 400 },
        );
    }

    try {
        const supabase = await createSupabaseServerClient();

        // ── Suchpfad A: E-Mail + Memorial-ID (Visit-Seite) ──────────────────
        // Prüft direkt in memorial_members ob diese E-Mail zu diesem Memorial eingeladen ist.
        // Nutzt keinen RLS-geschützten SELECT auf memorials, sondern geht über die members-Tabelle.
        if (email && memorialId) {
            const { data, error: rpcErr } = await supabase
                .rpc('find_memorial_by_email_and_id', {
                    p_email: email,
                    p_memorial_id: memorialId,
                });

            if (rpcErr) {
                console.error('[memorials/find] RPC error:', rpcErr);
            }

            if (data && data.length > 0) {
                return NextResponse.json({
                    slug: data[0].slug,
                    name: data[0].name,
                    isPublic: data[0].is_public,
                });
            }

            return NextResponse.json(
                { error: 'No memorial found. Please check both the Memorial ID and your email address.' },
                { status: 404 },
            );
        }

        // ── Suchpfad B: Namenssuche über öffentliche Memorials ─────────────
        if (q) {
            const { data: publicResults } = await supabase
                .from('memorials')
                .select('slug, name, portrait_url, date_of_birth, date_of_death, country')
                .eq('is_public', true)
                .ilike('name', `%${q}%`)
                .limit(10);

            if (publicResults && publicResults.length > 0) {
                return NextResponse.json({
                    results: publicResults.map(m => ({
                        slug: m.slug,
                        name: m.name,
                        portraitUrl: m.portrait_url,
                        dateOfBirth: m.date_of_birth,
                        dateOfDeath: m.date_of_death,
                        country: m.country,
                    })),
                });
            }

            return NextResponse.json({ error: 'Memorial not found.' }, { status: 404 });
        }

        // ── Suchpfad C: nur E-Mail ──────────────────────────────────────────
        if (email) {
            const { data: members, error: memberError } = await supabase
                .from('memorial_members')
                .select('memorial_id, memorials(slug, name, is_public)')
                .eq('invited_email', email)
                .limit(10);

            if (memberError) {
                console.warn('[memorials/find] member lookup error:', memberError);
                return NextResponse.json(
                    { error: 'No memorial found for this email address.' },
                    { status: 404 },
                );
            }

            if (!members || members.length === 0) {
                return NextResponse.json(
                    { error: 'No memorial found for this email address.' },
                    { status: 404 },
                );
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const first = members[0].memorials as any;
            return NextResponse.json({
                slug: first?.slug,
                name: first?.name,
                isPublic: first?.is_public,
                total: members.length,
            });
        }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[memorials/find]', err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
