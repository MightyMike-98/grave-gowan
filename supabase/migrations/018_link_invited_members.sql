-- =============================================================================
-- Migration 018: Eingeladene Members automatisch mit ihrem Account verknuepfen
--
-- PROBLEM: Wenn ein User per E-Mail eingeladen wird (invited_email), hat der
-- memorial_members-Eintrag user_id = NULL. Dadurch greift RLS nicht und der
-- User sieht das Memorial nicht im Dashboard.
--
-- LOESUNG: Ein Trigger auf auth.users, der bei neuer Registrierung oder Login
-- alle memorial_members-Eintraege mit passender invited_email aktualisiert.
-- =============================================================================

-- 1. Funktion: Verknuepft invited_email-Eintraege mit dem neuen User
CREATE OR REPLACE FUNCTION link_invited_memberships()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE memorial_members
    SET user_id = NEW.id
    WHERE invited_email = LOWER(NEW.email)
      AND user_id IS NULL;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'link_invited_memberships error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger: Feuert wenn ein neuer User erstellt wird
DROP TRIGGER IF EXISTS on_user_created_link_memberships ON auth.users;
CREATE TRIGGER on_user_created_link_memberships
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION link_invited_memberships();

-- 3. Einmalig: Bestehende Eintraege nachtraeglich verknuepfen
UPDATE memorial_members mm
SET user_id = u.id
FROM auth.users u
WHERE LOWER(u.email) = LOWER(mm.invited_email)
  AND mm.user_id IS NULL;
