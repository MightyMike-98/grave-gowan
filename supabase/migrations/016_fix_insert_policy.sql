-- =============================================================================
-- Migration 016: Fix memorial_members INSERT Policy (Self-Escalation Bug)
--
-- PROBLEM: Die bisherige INSERT Policy erlaubt jedem eingeloggten User,
-- sich selbst als "owner" in JEDES Memorial einzutragen — ohne zu prüfen,
-- ob das Memorial ihm wirklich gehört (owner_id = auth.uid()).
--
-- FIX: Die zweite Bedingung prüft jetzt zusätzlich, ob memorials.owner_id
-- mit auth.uid() übereinstimmt. Damit kann man sich nur noch als Owner
-- eintragen, wenn man tatsächlich der Owner des Memorials ist.
-- =============================================================================

DROP POLICY IF EXISTS "memorial_members_insert" ON memorial_members;

CREATE POLICY "memorial_members_insert"
    ON memorial_members FOR INSERT
    WITH CHECK (
        -- Weg 1: Ein existierender Owner darf neue Mitglieder hinzufügen
        is_memorial_owner(memorial_id) 
        OR (
            -- Weg 2: Beim Erstellen eines neuen Memorials darf sich der Owner
            -- selbst eintragen — aber NUR wenn er wirklich der Owner ist.
            role = 'owner' 
            AND user_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM memorials WHERE id = memorial_id AND owner_id = auth.uid()
            )
        )
    );
