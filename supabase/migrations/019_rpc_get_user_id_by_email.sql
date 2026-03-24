-- =============================================================================
-- Migration 019: RPC-Funktion um user_id per E-Mail nachzuschlagen
--
-- PROBLEM: Die Admin-API (auth.admin.listUsers) ist vom Server-Client aus
-- nicht verfügbar (braucht Service-Role-Key). Dadurch werden Einladungen
-- immer als Pending Invite (user_id = NULL) erstellt, selbst wenn der
-- eingeladene User bereits einen Account hat.
--
-- LOESUNG: Eine SECURITY DEFINER Funktion, die auth.users per Email
-- durchsucht und die user_id zurueckgibt. Kann per supabase.rpc() aufgerufen
-- werden und braucht keinen Admin-Zugang.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_id_by_email(lookup_email text)
RETURNS uuid AS $$
    SELECT id FROM auth.users WHERE LOWER(email) = LOWER(lookup_email) LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
