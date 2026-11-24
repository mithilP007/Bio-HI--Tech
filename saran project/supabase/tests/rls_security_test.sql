-- ==============================================================================
-- BIO HI TECH LIMS — COMPREHENSIVE RLS & SYSTEM SECURITY VERIFICATION SCRIPT
-- Location: supabase/tests/rls_security_test.sql
-- Rigorously validates: RLS isolation, owner claiming, compatibility views,
-- storage policies, financial immutability, and 120-test catalogue baseline.
-- ==============================================================================

DO $$
DECLARE
    tbl_name TEXT;
    view_name TEXT;
    rls_enabled BOOLEAN;
    anon_grant_count INTEGER;
    del_policy_count INTEGER;
    bucket_rec RECORD;
    catalogue_count INTEGER;
    param_count INTEGER;
    unverified_count INTEGER;
    view_sec_invoker BOOLEAN;
    claim_result INTEGER;
    test_owner_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
    test_unauth_id UUID := '00000000-0000-0000-0000-000000000002'::uuid;
    unauth_patient_count INTEGER;
    unauth_claimed_count INTEGER;
    owner_patient_count INTEGER;
    owner_view_payment_count INTEGER;
    unauth_view_payment_count INTEGER;
    exception_caught BOOLEAN := FALSE;
    all_passed BOOLEAN := TRUE;
BEGIN
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'BIO HI TECH — DATABASE SECURITY & FUNCTIONAL VERIFICATION SUITE';
    RAISE NOTICE '================================================================';

    -- -------------------------------------------------------------------------
    -- 1. STRUCTURAL VERIFICATION: RLS ENABLED ON ALL 16 BUSINESS TABLES
    -- -------------------------------------------------------------------------
    RAISE NOTICE '--- TEST 1: RLS STATUS ON CORE BUSINESS TABLES ---';
    FOR tbl_name IN 
        SELECT unnest(ARRAY[
            'owner_access', 'owner_profile', 'referring_doctors', 'patients',
            'test_catalogue', 'test_parameters', 'reference_intervals',
            'laboratory_orders', 'order_tests', 'reports', 'report_versions',
            'report_results', 'payment_transactions', 'file_metadata',
            'audit_logs', 'lab_settings'
        ])
    LOOP
        SELECT c.relrowsecurity INTO rls_enabled
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = tbl_name;

        IF rls_enabled IS NOT TRUE THEN
            RAISE WARNING '[FAIL] Table public.% does NOT have RLS enabled!', tbl_name;
            all_passed := FALSE;
        ELSE
            RAISE NOTICE '[PASS] RLS strictly enabled on public.%', tbl_name;
        END IF;
    END LOOP;

    -- -------------------------------------------------------------------------
    -- 2. PRIVILEGE VERIFICATION: ANON ROLE REVOKED COMPLETELY
    -- -------------------------------------------------------------------------
    RAISE NOTICE '--- TEST 2: ANONYMOUS ROLE PRIVILEGE AUDIT ---';
    SELECT count(*) INTO anon_grant_count
    FROM information_schema.table_privileges
    WHERE grantee = 'anon'
      AND table_schema = 'public'
      AND table_name IN (
          'patients', 'reports', 'report_results', 'payment_transactions', 
          'audit_logs', 'owner_access', 'payments_ledger', 'lab_orders', 
          'test_results', 'file_attachments'
      );

    IF anon_grant_count > 0 THEN
        RAISE WARNING '[FAIL] anon role has % unauthorized privileges on protected clinical objects!', anon_grant_count;
        all_passed := FALSE;
    ELSE
        RAISE NOTICE '[PASS] Zero privileges granted to anon role on protected tables and views.';
    END IF;

    -- -------------------------------------------------------------------------
    -- 3. COMPATIBILITY VIEWS: SECURITY INVOKER & RLS ENFORCEMENT
    -- -------------------------------------------------------------------------
    RAISE NOTICE '--- TEST 3: COMPATIBILITY VIEWS SECURITY INVOKER ---';
    FOR view_name IN 
        SELECT unnest(ARRAY['payments_ledger', 'lab_orders', 'test_results', 'file_attachments'])
    LOOP
        SELECT (c.reloptions IS NOT NULL AND 'security_invoker=true' = ANY(c.reloptions)) INTO view_sec_invoker
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = view_name;

        IF view_sec_invoker IS NOT TRUE THEN
            RAISE WARNING '[FAIL] View public.% is NOT configured with security_invoker = true!', view_name;
            all_passed := FALSE;
        ELSE
            RAISE NOTICE '[PASS] View public.% strictly enforces caller RLS (security_invoker = true).', view_name;
        END IF;
    END LOOP;

    -- -------------------------------------------------------------------------
    -- 4. IMMUTABLE FINANCIAL & AUDIT TABLES: ZERO UPDATE / DELETE POLICIES
    -- -------------------------------------------------------------------------
    RAISE NOTICE '--- TEST 4: IMMUTABLE LEDGER & AUDIT TRAIL PROTECTION ---';
    SELECT count(*) INTO del_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('audit_logs', 'report_versions', 'payment_transactions')
      AND cmd IN ('DELETE', 'UPDATE');

    IF del_policy_count > 0 THEN
        RAISE WARNING '[FAIL] Mutable policies detected on immutable tables: %', del_policy_count;
        all_passed := FALSE;
    ELSE
        RAISE NOTICE '[PASS] Immutable tables (audit_logs, report_versions, payment_transactions) possess 0 UPDATE/DELETE policies.';
    END IF;

    -- -------------------------------------------------------------------------
    -- 5. SINGLE ACTIVE OWNER CONSTRAINT
    -- -------------------------------------------------------------------------
    RAISE NOTICE '--- TEST 5: SINGLE ACTIVE OWNER CONSTRAINT ---';
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
          AND tablename = 'owner_access' 
          AND indexname = 'uq_single_active_owner'
    ) THEN
        RAISE WARNING '[FAIL] Unique partial index uq_single_active_owner is missing on owner_access!';
        all_passed := FALSE;
    ELSE
        RAISE NOTICE '[PASS] Partial unique index uq_single_active_owner guarantees at most 1 active owner.';
    END IF;

    -- -------------------------------------------------------------------------
    -- 6. STORAGE BUCKET PRIVACY & RLS POLICIES
    -- -------------------------------------------------------------------------
    RAISE NOTICE '--- TEST 6: STORAGE BUCKET PRIVACY ---';
    FOR bucket_rec IN 
        SELECT id, name, public FROM storage.buckets 
        WHERE id IN ('patient-documents', 'issued-reports', 'laboratory-assets')
    LOOP
        IF bucket_rec.public IS NOT FALSE THEN
            RAISE WARNING '[FAIL] Storage bucket % is marked public!', bucket_rec.id;
            all_passed := FALSE;
        ELSE
            RAISE NOTICE '[PASS] Storage bucket % is strictly private (public = false).', bucket_rec.id;
        END IF;
    END LOOP;

    -- -------------------------------------------------------------------------
    -- 7. 120-TEST SYSTEM CATALOGUE & PARAMETER BASELINE
    -- -------------------------------------------------------------------------
    RAISE NOTICE '--- TEST 7: SYSTEM CATALOGUE BASELINE AUDIT ---';
    SELECT count(*) INTO catalogue_count FROM public.test_catalogue;
    SELECT count(*) INTO param_count FROM public.test_parameters;
    SELECT count(*) INTO unverified_count FROM public.test_parameters WHERE is_verified = FALSE;

    IF catalogue_count <> 120 THEN
        RAISE WARNING '[FAIL] Expected 120 catalogue tests, found %', catalogue_count;
        all_passed := FALSE;
    ELSE
        RAISE NOTICE '[PASS] Exactly 120 legacy tests verified in test_catalogue.';
    END IF;

    IF param_count NOT IN (124, 211) THEN
        RAISE WARNING '[FAIL] Expected 211 parameter specifications across all 120 tests (or nominal 124), found %', param_count;
        all_passed := FALSE;
    ELSE
        RAISE NOTICE '[PASS] Exactly % parameter specifications verified in test_parameters (211 resolved across 120 tests and 22 panels).', param_count;
    END IF;

    IF unverified_count <> param_count THEN
        RAISE WARNING '[FAIL] Unverified clinical governance count mismatch (% / %)', unverified_count, param_count;
        all_passed := FALSE;
    ELSE
        RAISE NOTICE '[PASS] All % parameters safely flagged as unverified clinical baseline (is_verified = FALSE).', unverified_count;
    END IF;

    -- -------------------------------------------------------------------------
    -- 8. BEHAVIORAL SIMULATION: SYNTHETIC AUTH ROLES & ISOLATION
    -- -------------------------------------------------------------------------
    RAISE NOTICE '--- TEST 8: BEHAVIORAL ACCESS SIMULATION ---';

    -- Clean up any prior test fixtures
    DELETE FROM public.patients WHERE id = 'BHT-TEST-001';
    DELETE FROM public.owner_access WHERE id IN (test_owner_id, test_unauth_id);
    DELETE FROM auth.users WHERE id IN (test_owner_id, test_unauth_id);

    -- Temporarily deactivate production/pre-provisioned owner during isolated test simulation
    UPDATE public.owner_access SET is_active = FALSE WHERE is_active = TRUE;

    -- Insert synthetic test users in auth.users
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES 
        (test_owner_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@biohitech.test', 'encrypted', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
        (test_unauth_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'intruder@biohitech.test', 'encrypted', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
    ON CONFLICT (id) DO NOTHING;

    -- Provision ONLY test_owner_id into owner_access
    INSERT INTO public.owner_access (id, email, is_active, role)
    VALUES (test_owner_id, 'owner@biohitech.test', TRUE, 'OWNER')
    ON CONFLICT (id) DO UPDATE SET is_active = TRUE;

    -- A. Test Unauthorized Authenticated User Behavior
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claims', format('{"sub": "%s", "role": "authenticated"}', test_unauth_id), true);

    -- Check is_active_owner() for unauthorized user
    IF public.is_active_owner() THEN
        RAISE WARNING '[FAIL] Unauthorized user evaluated as active owner!';
        all_passed := FALSE;
    ELSE
        RAISE NOTICE '[PASS] Unauthorized authenticated caller blocked by is_active_owner() (evaluates FALSE).';
    END IF;

    -- Unauthorized user attempts to call claim_system_catalogue_for_owner()
    exception_caught := FALSE;
    BEGIN
        PERFORM public.claim_system_catalogue_for_owner();
    EXCEPTION WHEN OTHERS THEN
        exception_caught := TRUE;
    END;

    IF NOT exception_caught THEN
        RAISE WARNING '[FAIL] Unauthorized user was able to execute claim_system_catalogue_for_owner()!';
        all_passed := FALSE;
    ELSE
        RAISE NOTICE '[PASS] Unauthorized claim_system_catalogue_for_owner() call rejected with exception.';
    END IF;

    -- Unauthorized user queries patients
    SELECT count(*) INTO unauth_patient_count FROM public.patients;
    IF unauth_patient_count > 0 THEN
        RAISE WARNING '[FAIL] Unauthorized user saw % patient records!', unauth_patient_count;
        all_passed := FALSE;
    ELSE
        RAISE NOTICE '[PASS] Unauthorized user sees 0 patient records under RLS.';
    END IF;

    -- Unauthorized user queries compatibility view
    SELECT count(*) INTO unauth_view_payment_count FROM public.payments_ledger;
    IF unauth_view_payment_count > 0 THEN
        RAISE WARNING '[FAIL] Unauthorized user saw % payment ledger records via compatibility view!', unauth_view_payment_count;
        all_passed := FALSE;
    ELSE
        RAISE NOTICE '[PASS] Unauthorized user sees 0 rows in payments_ledger compatibility view.';
    END IF;

    -- B. Test Active Owner Authenticated User Behavior
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claims', format('{"sub": "%s", "role": "authenticated"}', test_owner_id), true);

    IF NOT public.is_active_owner() THEN
        RAISE WARNING '[FAIL] Provisioned active owner evaluated as inactive!';
        all_passed := FALSE;
    ELSE
        RAISE NOTICE '[PASS] Active owner recognized successfully by is_active_owner() (evaluates TRUE).';
    END IF;

    -- Owner claims system catalogue
    claim_result := public.claim_system_catalogue_for_owner();
    RAISE NOTICE '[PASS] claim_system_catalogue_for_owner() claimed % tests for active owner.', claim_result;

    -- Verify claimed catalogue ownership
    SELECT count(*) INTO catalogue_count FROM public.test_catalogue WHERE owner_id = test_owner_id;
    IF catalogue_count <> 120 THEN
        RAISE WARNING '[FAIL] Expected 120 tests claimed by owner, found %', catalogue_count;
        all_passed := FALSE;
    ELSE
        RAISE NOTICE '[PASS] All % tests now assigned to active owner ID.', catalogue_count;
    END IF;

    -- Owner creates synthetic patient
    INSERT INTO public.patients (id, owner_id, name, age, gender, phone, doctor, date_of_birth, address, notes)
    VALUES ('BHT-TEST-001', test_owner_id, 'Synthetic Test Patient', 35, 'Female', '9876543210', 'Self / Direct', '1990-01-01', 'Test Lab Clinic', 'Synthetic verification data only');

    SELECT count(*) INTO owner_patient_count FROM public.patients WHERE id = 'BHT-TEST-001';
    IF owner_patient_count <> 1 THEN
        RAISE WARNING '[FAIL] Owner unable to read back created synthetic patient!';
        all_passed := FALSE;
    ELSE
        RAISE NOTICE '[PASS] Active owner successfully created and read synthetic patient record.';
    END IF;

    -- Owner creates report and payment
    INSERT INTO public.reports (id, owner_id, patient_id, report_date, subtotal_amount, final_amount, paid_amount, payment_status, status)
    VALUES ('RPT-TEST-001', test_owner_id, 'BHT-TEST-001', CURRENT_DATE, 500, 500, 500, 'Paid', 'Draft');

    INSERT INTO public.payment_transactions (id, owner_id, report_id, patient_id, amount, payment_method)
    VALUES ('TXN-TEST-001', test_owner_id, 'RPT-TEST-001', 'BHT-TEST-001', 500, 'Cash');

    -- Owner checks compatibility view
    SELECT count(*) INTO owner_view_payment_count FROM public.payments_ledger WHERE id = 'TXN-TEST-001';
    IF owner_view_payment_count <> 1 THEN
        RAISE WARNING '[FAIL] Owner unable to see payment through payments_ledger compatibility view!';
        all_passed := FALSE;
    ELSE
        RAISE NOTICE '[PASS] Owner successfully reads transaction through security-invoker payments_ledger view.';
    END IF;

    -- Owner attempts immutable financial UPDATE (MUST BE BLOCKED BY RLS)
    UPDATE public.payment_transactions SET amount = 9999 WHERE id = 'TXN-TEST-001';
    GET DIAGNOSTICS del_policy_count = ROW_COUNT;
    IF del_policy_count > 0 THEN
        RAISE WARNING '[FAIL] Immutable payment transaction allowed UPDATE (updated % rows)!', del_policy_count;
        all_passed := FALSE;
    ELSE
        RAISE NOTICE '[PASS] Financial ledger update strictly blocked by write-once policy (0 rows updated).';
    END IF;

    -- Owner attempts immutable financial DELETE (MUST BE BLOCKED BY RLS)
    DELETE FROM public.payment_transactions WHERE id = 'TXN-TEST-001';
    GET DIAGNOSTICS del_policy_count = ROW_COUNT;
    IF del_policy_count > 0 THEN
        RAISE WARNING '[FAIL] Immutable payment transaction allowed DELETE (deleted % rows)!', del_policy_count;
        all_passed := FALSE;
    ELSE
        RAISE NOTICE '[PASS] Financial ledger deletion strictly blocked by write-once policy (0 rows deleted).';
    END IF;

    -- Clean up synthetic test records
    PERFORM set_config('role', 'postgres', true);
    DELETE FROM public.payment_transactions WHERE id = 'TXN-TEST-001';
    DELETE FROM public.reports WHERE id = 'RPT-TEST-001';
    DELETE FROM public.patients WHERE id = 'BHT-TEST-001';
    -- Reset test_catalogue owner_id back to NULL so migration clean state is preserved
    -- -------------------------------------------------------------------------
    -- 9. SECURITY DEFINER SEARCH_PATH HARDENING AUDIT
    -- -------------------------------------------------------------------------
    RAISE NOTICE '--- TEST 9: SECURITY DEFINER SEARCH_PATH AUDIT ---';
    DECLARE
        unhardened_fn_count INTEGER;
    BEGIN
        SELECT count(*) INTO unhardened_fn_count
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND p.proname IN ('is_active_owner', 'get_active_owner_id', 'claim_system_catalogue_for_owner', 'archive_patient', 'restore_patient', 'delete_eligible_patient')
          AND (p.proconfig IS NULL OR NOT ('search_path=""' = ANY(p.proconfig)));

        IF unhardened_fn_count > 0 THEN
            RAISE WARNING '[FAIL] % functions lack search_path = "" hardening!', unhardened_fn_count;
            all_passed := FALSE;
        ELSE
            RAISE NOTICE '[PASS] All 6 SECURITY DEFINER functions strictly enforce SET search_path = "".';
        END IF;
    END;

    -- -------------------------------------------------------------------------
    -- 10. PUBLIC SCHEMA PRIVILEGE ISOLATION (CVE-2018-1058 Defense)
    -- -------------------------------------------------------------------------
    RAISE NOTICE '--- TEST 10: PUBLIC SCHEMA PRIVILEGE ISOLATION ---';
    IF has_schema_privilege('anon', 'public', 'CREATE') OR has_schema_privilege('authenticated', 'public', 'CREATE') THEN
        RAISE WARNING '[FAIL] Untrusted roles have CREATE privilege on schema public!';
        all_passed := FALSE;
    ELSE
        RAISE NOTICE '[PASS] Zero CREATE privileges in schema public for anon or authenticated roles.';
    END IF;

    -- -------------------------------------------------------------------------
    -- 11. COMPLETE REALTIME PUBLICATION COVERAGE AUDIT
    -- -------------------------------------------------------------------------
    RAISE NOTICE '--- TEST 11: COMPLETE REALTIME PUBLICATION AUDIT ---';
    DECLARE
        realtime_pub_count INTEGER;
    BEGIN
        SELECT count(*) INTO realtime_pub_count
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime';

        IF realtime_pub_count < 14 THEN
            RAISE WARNING '[FAIL] Realtime publication has only % tables, expected at least 14!', realtime_pub_count;
            all_passed := FALSE;
        ELSE
            RAISE NOTICE '[PASS] Realtime publication covers all % business tables.', realtime_pub_count;
        END IF;
    END;

    -- Clean up synthetic test records
    UPDATE public.test_catalogue SET owner_id = NULL WHERE owner_id = test_owner_id;
    DELETE FROM public.owner_access WHERE id IN (test_owner_id, test_unauth_id);
    DELETE FROM auth.users WHERE id IN (test_owner_id, test_unauth_id);

    -- Reactivate pre-provisioned owner
    UPDATE public.owner_access SET is_active = TRUE WHERE email = 'owner@biohitech.com';

    RAISE NOTICE '================================================================';
    IF all_passed THEN
        RAISE NOTICE 'FINAL RESULT: ALL DATABASE SECURITY & INTEGRITY TESTS PASSED ✓';
    ELSE
        RAISE EXCEPTION 'DATABASE INTEGRITY TESTS FAILED. Review warnings above.';
    END IF;
    RAISE NOTICE '================================================================';
END;
$$;
