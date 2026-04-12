-- =============================================================================
-- Migration 032: RPC get_user_profile_by_email
--
-- Erweitert 019: Gibt zusätzlich zum User-ID auch den im Setup gesetzten
-- Namen (raw_user_meta_data ->> 'full_name') zurück. Wird in der Invite-
-- Route genutzt, um Einladungs-Mails mit echten Namen zu personalisieren
-- statt mit dem E-Mail-Präfix.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_profile_by_email(lookup_email text)
RETURNS TABLE (id uuid, full_name text)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    SELECT
        u.id,
        NULLIF(u.raw_user_meta_data ->> 'full_name', '') AS full_name
    FROM auth.users u
    WHERE LOWER(u.email) = LOWER(lookup_email)
    LIMIT 1;
$$;
