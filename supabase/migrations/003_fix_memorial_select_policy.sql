-- =============================================================================
-- Migration 003: RLS Policy für Memorial-Seiten
-- Ausführen in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- Problem: Die ursprüngliche "owner_select" Policy erlaubt nur dem Owner
-- SELECT-Zugriff wenn auth.uid() gesetzt ist. Auf der serverseitig gerenderten
-- Gedenkseite ist auth.uid() beim ersten Aufruf null.
--
-- Lösung: Policy ersetzen durch eine, die BEIDE Fälle abdeckt:
-- 1. Memorial ist öffentlich (is_public = true) → jeder darf es lesen
-- 2. Memorial ist privat → nur der eigene Owner
-- =============================================================================

-- Alte restriktive Policy entfernen
DROP POLICY IF EXISTS "owner_select" ON memorials;

-- Neue Policy: Owner immer, alle anderen nur wenn is_public = true
CREATE POLICY "select_own_or_public"
    ON memorials FOR SELECT
    USING (
        owner_id = auth.uid()        -- Owner sieht alle seine Memorials (public + private)
        OR is_public = true          -- Jeder sieht öffentliche Memorials
    );
