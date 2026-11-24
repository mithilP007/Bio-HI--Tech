-- ==============================================================================
-- MIGRATION: 20261121000002_owner_access_and_rls.sql
-- BIO HI TECH LIMS — ROW LEVEL SECURITY & OWNER ACCESS ARCHITECTURE
-- Enforces single-tenant active owner isolation at the PostgreSQL kernel level
-- ==============================================================================

-- ==============================================================================
-- 1. OWNER VERIFICATION FUNCTIONS (SECURITY DEFINER)
-- ==============================================================================

-- Checks whether the currently executing caller is an authorized active owner
CREATE OR REPLACE FUNCTION public.is_active_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.owner_access 
        WHERE id = auth.uid() 
          AND is_active = TRUE
    );
$$;

-- Returns the UUID of the currently provisioned active owner (if any)
CREATE OR REPLACE FUNCTION public.get_active_owner_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT id 
    FROM public.owner_access 
    WHERE is_active = TRUE 
    LIMIT 1;
$$;

-- Revoke default public execution, grant to authenticated only
REVOKE EXECUTE ON FUNCTION public.is_active_owner() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_active_owner() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_active_owner_id() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_active_owner_id() TO authenticated;

-- Claims unassigned system catalogue tests for the authorized active owner
CREATE OR REPLACE FUNCTION public.claim_system_catalogue_for_owner()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    owner_uuid UUID;
    updated_rows INTEGER;
BEGIN
    -- Strict caller check: Only the active owner can claim catalogue
    IF NOT public.is_active_owner() THEN
        RAISE EXCEPTION 'Access Denied: Only the authorized active laboratory owner can claim catalogue items.';
    END IF;

    SELECT id INTO owner_uuid FROM public.owner_access WHERE is_active = TRUE LIMIT 1;
    IF owner_uuid IS NULL THEN
        RAISE EXCEPTION 'No active owner found in public.owner_access.';
    END IF;
    UPDATE public.test_catalogue SET owner_id = owner_uuid WHERE owner_id IS NULL;
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    RETURN updated_rows;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_system_catalogue_for_owner() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_system_catalogue_for_owner() TO authenticated;

-- ==============================================================================
-- 2. ENABLE ROW LEVEL SECURITY ON ALL BUSINESS TABLES
-- ==============================================================================
ALTER TABLE public.owner_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referring_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_intervals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratory_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_settings ENABLE ROW LEVEL SECURITY;

-- Revoke anon access from all tables completely
REVOKE ALL ON public.owner_access FROM anon;
REVOKE ALL ON public.owner_profile FROM anon;
REVOKE ALL ON public.referring_doctors FROM anon;
REVOKE ALL ON public.patients FROM anon;
REVOKE ALL ON public.test_catalogue FROM anon;
REVOKE ALL ON public.test_parameters FROM anon;
REVOKE ALL ON public.reference_intervals FROM anon;
REVOKE ALL ON public.laboratory_orders FROM anon;
REVOKE ALL ON public.order_tests FROM anon;
REVOKE ALL ON public.reports FROM anon;
REVOKE ALL ON public.report_versions FROM anon;
REVOKE ALL ON public.report_results FROM anon;
REVOKE ALL ON public.payment_transactions FROM anon;
REVOKE ALL ON public.file_metadata FROM anon;
REVOKE ALL ON public.audit_logs FROM anon;
REVOKE ALL ON public.lab_settings FROM anon;
REVOKE ALL ON public.payments_ledger FROM anon;
REVOKE ALL ON public.lab_orders FROM anon;
REVOKE ALL ON public.test_results FROM anon;
REVOKE ALL ON public.file_attachments FROM anon;

-- ==============================================================================
-- 3. OWNER ACCESS ALLOWLIST POLICIES
-- Authenticated users can ONLY inspect their own access status.
-- CANNOT insert, update, or delete their own allowlist row via client API.
-- ==============================================================================
CREATE POLICY "owner_access_select_self" ON public.owner_access
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- ==============================================================================
-- 4. OWNER PROFILE POLICIES
-- ==============================================================================
CREATE POLICY "owner_profile_select" ON public.owner_profile
    FOR SELECT TO authenticated
    USING (auth.uid() = id AND public.is_active_owner());

CREATE POLICY "owner_profile_update" ON public.owner_profile
    FOR UPDATE TO authenticated
    USING (auth.uid() = id AND public.is_active_owner())
    WITH CHECK (auth.uid() = id AND public.is_active_owner());

-- ==============================================================================
-- 5. REFERRING DOCTORS POLICIES
-- ==============================================================================
CREATE POLICY "doctors_select" ON public.referring_doctors
    FOR SELECT TO authenticated
    USING (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "doctors_insert" ON public.referring_doctors
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "doctors_update" ON public.referring_doctors
    FOR UPDATE TO authenticated
    USING (auth.uid() = owner_id AND public.is_active_owner())
    WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "doctors_delete" ON public.referring_doctors
    FOR DELETE TO authenticated
    USING (auth.uid() = owner_id AND public.is_active_owner());

-- ==============================================================================
-- 6. PATIENTS POLICIES
-- Historical preservation: SELECT, INSERT, UPDATE. NO DELETE policy provided.
-- ==============================================================================
CREATE POLICY "patients_select" ON public.patients
    FOR SELECT TO authenticated
    USING (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "patients_insert" ON public.patients
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "patients_update" ON public.patients
    FOR UPDATE TO authenticated
    USING (auth.uid() = owner_id AND public.is_active_owner())
    WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());

-- ==============================================================================
-- 7. TEST CATALOGUE POLICIES
-- Readable if default system catalogue (owner_id IS NULL) or active owner's custom tests
-- ==============================================================================
CREATE POLICY "catalogue_select" ON public.test_catalogue
    FOR SELECT TO authenticated
    USING (owner_id IS NULL OR (auth.uid() = owner_id AND public.is_active_owner()));

CREATE POLICY "catalogue_insert" ON public.test_catalogue
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "catalogue_update" ON public.test_catalogue
    FOR UPDATE TO authenticated
    USING ((owner_id IS NULL OR auth.uid() = owner_id) AND public.is_active_owner())
    WITH CHECK ((owner_id IS NULL OR auth.uid() = owner_id) AND public.is_active_owner());

CREATE POLICY "catalogue_delete" ON public.test_catalogue
    FOR DELETE TO authenticated
    USING (auth.uid() = owner_id AND public.is_active_owner());

-- ==============================================================================
-- 8. TEST PARAMETERS & REFERENCE INTERVALS POLICIES
-- ==============================================================================
CREATE POLICY "parameters_select" ON public.test_parameters
    FOR SELECT TO authenticated
    USING (TRUE);

CREATE POLICY "parameters_insert" ON public.test_parameters
    FOR INSERT TO authenticated
    WITH CHECK (public.is_active_owner());

CREATE POLICY "parameters_update" ON public.test_parameters
    FOR UPDATE TO authenticated
    USING (public.is_active_owner())
    WITH CHECK (public.is_active_owner());

CREATE POLICY "intervals_select" ON public.reference_intervals
    FOR SELECT TO authenticated
    USING (TRUE);

CREATE POLICY "intervals_insert" ON public.reference_intervals
    FOR INSERT TO authenticated
    WITH CHECK (public.is_active_owner());

CREATE POLICY "intervals_update" ON public.reference_intervals
    FOR UPDATE TO authenticated
    USING (public.is_active_owner())
    WITH CHECK (public.is_active_owner());

-- ==============================================================================
-- 9. LABORATORY ORDERS & ORDER TESTS POLICIES
-- ==============================================================================
CREATE POLICY "orders_select" ON public.laboratory_orders
    FOR SELECT TO authenticated
    USING (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "orders_insert" ON public.laboratory_orders
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "orders_update" ON public.laboratory_orders
    FOR UPDATE TO authenticated
    USING (auth.uid() = owner_id AND public.is_active_owner())
    WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "order_tests_select" ON public.order_tests
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.laboratory_orders o 
        WHERE o.id = order_id AND o.owner_id = auth.uid() AND public.is_active_owner()
    ));

CREATE POLICY "order_tests_insert" ON public.order_tests
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.laboratory_orders o 
        WHERE o.id = order_id AND o.owner_id = auth.uid() AND public.is_active_owner()
    ));

CREATE POLICY "order_tests_update" ON public.order_tests
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.laboratory_orders o 
        WHERE o.id = order_id AND o.owner_id = auth.uid() AND public.is_active_owner()
    ));

-- ==============================================================================
-- 10. REPORTS & REPORT RESULTS POLICIES
-- Legal report documents cannot be deleted; cancellation is done via status.
-- ==============================================================================
CREATE POLICY "reports_select" ON public.reports
    FOR SELECT TO authenticated
    USING (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "reports_insert" ON public.reports
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "reports_update" ON public.reports
    FOR UPDATE TO authenticated
    USING (auth.uid() = owner_id AND public.is_active_owner())
    WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "results_select" ON public.report_results
    FOR SELECT TO authenticated
    USING (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "results_insert" ON public.report_results
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "results_update" ON public.report_results
    FOR UPDATE TO authenticated
    USING (auth.uid() = owner_id AND public.is_active_owner())
    WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "results_delete" ON public.report_results
    FOR DELETE TO authenticated
    USING (auth.uid() = owner_id AND public.is_active_owner());

-- ==============================================================================
-- 11. IMMUTABLE TABLES (REPORT VERSIONS, PAYMENTS, AUDIT LOGS)
-- SELECT and INSERT ONLY. ZERO UPDATE or DELETE policies.
-- ==============================================================================
-- Report Versions (Frozen clinical snapshot)
CREATE POLICY "versions_select" ON public.report_versions
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.reports r 
        WHERE r.id = report_id AND r.owner_id = auth.uid() AND public.is_active_owner()
    ));

CREATE POLICY "versions_insert" ON public.report_versions
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = issued_by AND public.is_active_owner());

-- Payment Transactions (Immutable Financial Ledger)
CREATE POLICY "payments_select" ON public.payment_transactions
    FOR SELECT TO authenticated
    USING (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "payments_insert" ON public.payment_transactions
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());

-- Audit Logs (Immutable Security Audit Trail)
CREATE POLICY "audit_select" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "audit_insert" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());

-- ==============================================================================
-- 12. FILE METADATA & SETTINGS POLICIES
-- ==============================================================================
CREATE POLICY "files_select" ON public.file_metadata
    FOR SELECT TO authenticated
    USING (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "files_insert" ON public.file_metadata
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "files_update" ON public.file_metadata
    FOR UPDATE TO authenticated
    USING (auth.uid() = owner_id AND public.is_active_owner())
    WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "files_delete" ON public.file_metadata
    FOR DELETE TO authenticated
    USING (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "settings_select" ON public.lab_settings
    FOR SELECT TO authenticated
    USING (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "settings_insert" ON public.lab_settings
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "settings_update" ON public.lab_settings
    FOR UPDATE TO authenticated
    USING (auth.uid() = owner_id AND public.is_active_owner())
    WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());
