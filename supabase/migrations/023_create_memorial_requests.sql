-- =============================================================================
-- Migration 023: Besucher-Requests (Vorschläge über Visit Memorial)
-- Ausführen in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- Speichert Vorschläge/Anfragen, die Besucher über das RequestWidget senden.
-- Werden im Postfach des Creators/Editors angezeigt (read-only).
--
-- Berechtigungen:
--   INSERT → jeder (auch anonym, via Server Action mit Service Role)
--   SELECT → Owner + Editor (sehen ihre Requests im Postfach)
--   UPDATE → Owner + Editor (als gelesen markieren)
--   DELETE → Owner + Editor (entfernen)
-- =============================================================================

CREATE TABLE IF NOT EXISTS memorial_requests (
    id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    memorial_id UUID         NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
    author      TEXT         NOT NULL,
    category    TEXT         NOT NULL CHECK (category IN ('Gallery', 'Highlights', 'Biography', 'Stories', 'Allgemein')),
    message     TEXT         NOT NULL,
    image_url   TEXT,
    is_read     BOOLEAN      NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memorial_requests_memorial
    ON memorial_requests(memorial_id);

CREATE INDEX IF NOT EXISTS idx_memorial_requests_unread
    ON memorial_requests(memorial_id) WHERE is_read = false;

-- RLS
ALTER TABLE memorial_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memorial_requests_select" ON memorial_requests;
DROP POLICY IF EXISTS "memorial_requests_insert" ON memorial_requests;
DROP POLICY IF EXISTS "memorial_requests_update" ON memorial_requests;
DROP POLICY IF EXISTS "memorial_requests_delete" ON memorial_requests;

-- SELECT: Nur Owner/Editor sehen Requests
CREATE POLICY "memorial_requests_select"
    ON memorial_requests FOR SELECT
    USING (is_memorial_editor_or_owner(memorial_id));

-- INSERT: Nur via Service Role (Server Action)
CREATE POLICY "memorial_requests_insert"
    ON memorial_requests FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Owner/Editor können als gelesen markieren
CREATE POLICY "memorial_requests_update"
    ON memorial_requests FOR UPDATE
    USING (is_memorial_editor_or_owner(memorial_id));

-- DELETE: Owner/Editor können Requests löschen
CREATE POLICY "memorial_requests_delete"
    ON memorial_requests FOR DELETE
    USING (is_memorial_editor_or_owner(memorial_id));
