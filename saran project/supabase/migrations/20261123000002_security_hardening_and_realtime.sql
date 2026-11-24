-- ==============================================================================
-- MIGRATION: 20261123000002_security_hardening_and_realtime.sql
-- BIO HI TECH LIMS — SECURITY DEFINER HARDENING & COMPLETE REALTIME COVERAGE
-- Enforces search_path = '', fully qualified references, and adds missing tables
-- ==============================================================================

-- 1. HARDEN PUBLIC SCHEMA PRIVILEGES (PREVENT OBJECT INJECTION / SHADOWING)
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM anon;
REVOKE CREATE ON SCHEMA public FROM authenticated;

-- ==============================================================================
-- 2. HARDEN ALL SECURITY DEFINER FUNCTIONS (search_path = '', FULL QUALIFICATION)
-- ==============================================================================

-- Function 1: is_active_owner()
CREATE OR REPLACE FUNCTION public.is_active_owner()
RETURNS pg_catalog.bool
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.owner_access 
        WHERE id = auth.uid() 
          AND is_active = TRUE
    );
$$;

REVOKE ALL ON FUNCTION public.is_active_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_owner() TO authenticated;

-- Function 2: get_active_owner_id()
CREATE OR REPLACE FUNCTION public.get_active_owner_id()
RETURNS pg_catalog.uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
    SELECT id 
    FROM public.owner_access 
    WHERE is_active = TRUE 
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_active_owner_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_active_owner_id() TO authenticated;

-- Function 3: claim_system_catalogue_for_owner()
CREATE OR REPLACE FUNCTION public.claim_system_catalogue_for_owner()
RETURNS pg_catalog.int4
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    owner_uuid pg_catalog.uuid;
    updated_rows pg_catalog.int4;
BEGIN
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

REVOKE ALL ON FUNCTION public.claim_system_catalogue_for_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_system_catalogue_for_owner() TO authenticated;

-- Function 4: archive_patient(p_id)
CREATE OR REPLACE FUNCTION public.archive_patient(p_id pg_catalog.text)
RETURNS pg_catalog.bool
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_active_owner() THEN
    RAISE EXCEPTION 'Access Denied: Only the authorized active owner can archive patients.';
  END IF;

  UPDATE public.patients
  SET is_archived = TRUE,
      updated_at = pg_catalog.timezone('utc'::pg_catalog.text, pg_catalog.now())
  WHERE id = p_id AND owner_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Patient record % not found or not owned by caller.', p_id;
  END IF;

  INSERT INTO public.audit_logs (owner_id, actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(), 
    auth.uid(), 
    'UPDATE', 
    'patient', 
    p_id, 
    pg_catalog.jsonb_build_object('event', 'PATIENT_ARCHIVED', 'archived_at', pg_catalog.now())
  );

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.archive_patient(pg_catalog.text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.archive_patient(pg_catalog.text) TO authenticated;

-- Function 5: restore_patient(p_id)
CREATE OR REPLACE FUNCTION public.restore_patient(p_id pg_catalog.text)
RETURNS pg_catalog.bool
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_active_owner() THEN
    RAISE EXCEPTION 'Access Denied: Only the authorized active owner can restore patients.';
  END IF;

  UPDATE public.patients
  SET is_archived = FALSE,
      updated_at = pg_catalog.timezone('utc'::pg_catalog.text, pg_catalog.now())
  WHERE id = p_id AND owner_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Patient record % not found or not owned by caller.', p_id;
  END IF;

  INSERT INTO public.audit_logs (owner_id, actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(), 
    auth.uid(), 
    'UPDATE', 
    'patient', 
    p_id, 
    pg_catalog.jsonb_build_object('event', 'PATIENT_RESTORED', 'restored_at', pg_catalog.now())
  );

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.restore_patient(pg_catalog.text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_patient(pg_catalog.text) TO authenticated;

-- Function 6: delete_eligible_patient(p_id)
CREATE OR REPLACE FUNCTION public.delete_eligible_patient(p_id pg_catalog.text)
RETURNS pg_catalog.jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  order_cnt pg_catalog.int4;
  report_cnt pg_catalog.int4;
  txn_cnt pg_catalog.int4;
BEGIN
  IF NOT public.is_active_owner() THEN
    RAISE EXCEPTION 'Access Denied: Only the authorized active owner can delete patient records.';
  END IF;

  -- Verify existence and ownership
  IF NOT EXISTS (SELECT 1 FROM public.patients WHERE id = p_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'Patient % not found or not owned by caller.', p_id;
  END IF;

  -- Count protected linked records
  SELECT pg_catalog.count(*) INTO order_cnt FROM public.laboratory_orders WHERE patient_id = p_id AND owner_id = auth.uid();
  SELECT pg_catalog.count(*) INTO report_cnt FROM public.reports WHERE patient_id = p_id AND owner_id = auth.uid();
  SELECT pg_catalog.count(*) INTO txn_cnt FROM public.payment_transactions WHERE patient_id = p_id AND owner_id = auth.uid();

  IF (order_cnt > 0 OR report_cnt > 0 OR txn_cnt > 0) THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', FALSE,
      'blocked', TRUE,
      'message', pg_catalog.format('Permanent deletion blocked: Patient has %s orders, %s reports, and %s payment records. Historical medical and financial records must be preserved. Use archive instead.', order_cnt, report_cnt, txn_cnt),
      'linked_records', pg_catalog.jsonb_build_object('orders', order_cnt, 'reports', report_cnt, 'payments', txn_cnt)
    );
  END IF;

  -- Safe deletion of eligible unlinked patient
  DELETE FROM public.patients WHERE id = p_id AND owner_id = auth.uid();

  INSERT INTO public.audit_logs (owner_id, actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(), 
    auth.uid(), 
    'DELETE', 
    'patient', 
    p_id, 
    pg_catalog.jsonb_build_object('event', 'PATIENT_DELETED', 'deleted_at', pg_catalog.now(), 'eligible', true)
  );

  RETURN pg_catalog.jsonb_build_object(
    'success', TRUE,
    'blocked', FALSE,
    'message', pg_catalog.format('Patient %s was permanently deleted successfully.', p_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.delete_eligible_patient(pg_catalog.text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_eligible_patient(pg_catalog.text) TO authenticated;

-- ==============================================================================
-- 3. COMPLETE REALTIME PUBLICATION COVERAGE
-- Add all remaining clinical and metadata tables driving operational state
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.test_parameters;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reference_intervals;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.report_versions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.file_metadata;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.owner_profile;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.referring_doctors;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
