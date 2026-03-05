-- =============================================================================
-- Migration 007b: FINAL FIX — Trigger als authentifizierter User umgehen
--
-- PROBLEM ERKLÄRT:
-- In Supabase laufen SECURITY DEFINER Funktionen zwar als "postgres"-Rolle,
-- aber RLS ist dennoch aktiv wenn die aufrufende Session die "authenticated"
-- Rolle ist. Der INSERT-Trigger schlägt deshalb fehl, weil die Policy auf
-- memorial_members prüft ob auth.uid() bereits Owner ist — was beim
-- allerersten INSERT noch nicht der Fall ist.
--
-- LÖSUNG:
-- 1. RLS auf memorial_members komplett deaktivieren (für Supabase-interne 
--    Operationen ist das sicher — externe Zugriffe laufen über authenticated role)
--    ODER
-- 2. Den Trigger entfernen und den Owner-Eintrag direkt im Client machen.
--
-- Wir nutzen Lösung 2 (sicherer, einfacher):
-- - Trigger entfernen
-- - INSERT Policy anpassen damit der Owner-Eintrag vom Client kommen kann
-- =============================================================================

-- ── 1. Trigger entfernen (blockiert Memorial-Erstellung) ───────────────────
DROP TRIGGER IF EXISTS on_memorial_created ON memorials;
DROP FUNCTION IF EXISTS add_owner_as_member();

-- ── 2. Memorial-Members INSERT Policy nochmals korrigieren ─────────────────
--    Erlaubt INSERT wenn:
--    a) auth.uid() ist Owner UND fügt members für sein eigenes Memorial ein, ODER
--    b) auth.uid() ist bereits Owner in memorial_members
DROP POLICY IF EXISTS "members_insert" ON memorial_members;
CREATE POLICY "members_insert"
    ON memorial_members FOR INSERT
    WITH CHECK (
        -- Jeder eingeloggte User darf sich selbst als Owner eintragen,
        -- wenn er Owner des Memorials ist (owner_id stimmt überein)
        -- und noch kein Eintrag für dieses Memorial+User existiert
        (
            memorial_members.user_id = auth.uid()
            AND memorial_members.role = 'owner'
            AND EXISTS (
                SELECT 1 FROM memorials m
                WHERE m.id = memorial_members.memorial_id
                  AND m.owner_id = auth.uid()
            )
        )
        OR
        -- Owner darf andere einladen
        EXISTS (
            SELECT 1 FROM memorial_members mm
            WHERE mm.memorial_id = memorial_members.memorial_id
              AND mm.user_id = auth.uid()
              AND mm.role = 'owner'
        )
    );

-- ── 3. RLS Policy für memorials SELECT: auch auth.uid() = owner_id (Backup) ─
-- (Diese Policy aus Migration 003 sollte schon existieren, sicherstellen)
DROP POLICY IF EXISTS "select_own_or_public" ON memorials;
CREATE POLICY "select_own_or_public"
    ON memorials FOR SELECT
    USING (
        owner_id = auth.uid()
        OR is_public = true
        OR EXISTS (
            SELECT 1 FROM memorial_members mm
            WHERE mm.memorial_id = memorials.id
              AND mm.user_id = auth.uid()
        )
    );

-- ── 4. Bestehende Memorials nachtragen ─────────────────────────────────────
INSERT INTO memorial_members (memorial_id, user_id, role, invited_by)
SELECT id, owner_id, 'owner', owner_id
FROM memorials
ON CONFLICT (memorial_id, user_id) DO NOTHING;

-- Fertig!
