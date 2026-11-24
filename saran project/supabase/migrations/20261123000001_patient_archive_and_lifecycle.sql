-- ==============================================================================
-- MIGRATION: 20261123000001_patient_archive_and_lifecycle.sql
-- BIO HI TECH LIMS — PATIENT ARCHIVAL, LIFECYCLE & REALTIME ENHANCEMENTS
-- ==============================================================================

-- 1. ADD ARCHIVE COLUMN & INDEX TO PATIENTS
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_patients_archived 
ON public.patients (owner_id, is_archived);

-- 2. ADD CATALOGUE & ORDER TESTS TO REALTIME PUBLICATION
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.test_catalogue;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_tests;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. RLS DELETION POLICIES FOR ELIGIBLE DRAFT & UNLINKED RECORDS
-- Note: Foreign keys ON DELETE RESTRICT on reports, laboratory_orders, and
-- payment_transactions guarantee that clinical/financial history cannot be dropped.

-- Allow active owner to delete an eligible patient (restricted if foreign keys exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'patients' AND policyname = 'patients_delete'
  ) THEN
    CREATE POLICY "patients_delete" ON public.patients
      FOR DELETE TO authenticated
      USING (auth.uid() = owner_id AND public.is_active_owner());
  END IF;
END $$;

-- Allow active owner to delete unissued draft orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'laboratory_orders' AND policyname = 'orders_delete'
  ) THEN
    CREATE POLICY "orders_delete" ON public.laboratory_orders
      FOR DELETE TO authenticated
      USING (auth.uid() = owner_id AND status = 'Draft' AND public.is_active_owner());
  END IF;
END $$;

-- Allow active owner to delete unissued draft reports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'reports' AND policyname = 'reports_delete'
  ) THEN
    CREATE POLICY "reports_delete" ON public.reports
      FOR DELETE TO authenticated
      USING (auth.uid() = owner_id AND status = 'Draft' AND public.is_active_owner());
  END IF;
END $$;

-- 4. CONTROLLED SECURE RPC FUNCTIONS FOR PATIENT LIFECYCLE
CREATE OR REPLACE FUNCTION public.archive_patient(p_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_active_owner() THEN
    RAISE EXCEPTION 'Access Denied: Only the authorized active owner can archive patients.';
  END IF;

  UPDATE public.patients
  SET is_archived = TRUE,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_id AND owner_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Patient record % not found or not owned by caller.', p_id;
  END IF;

  INSERT INTO public.audit_logs (owner_id, actor_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), auth.uid(), 'UPDATE', 'patient', p_id, jsonb_build_object('event', 'PATIENT_ARCHIVED', 'archived_at', now()));

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_patient(p_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_active_owner() THEN
    RAISE EXCEPTION 'Access Denied: Only the authorized active owner can restore patients.';
  END IF;

  UPDATE public.patients
  SET is_archived = FALSE,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_id AND owner_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Patient record % not found or not owned by caller.', p_id;
  END IF;

  INSERT INTO public.audit_logs (owner_id, actor_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), auth.uid(), 'UPDATE', 'patient', p_id, jsonb_build_object('event', 'PATIENT_RESTORED', 'restored_at', now()));

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_eligible_patient(p_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_cnt INTEGER;
  report_cnt INTEGER;
  txn_cnt INTEGER;
BEGIN
  IF NOT public.is_active_owner() THEN
    RAISE EXCEPTION 'Access Denied: Only the authorized active owner can delete patient records.';
  END IF;

  -- Verify existence and ownership
  IF NOT EXISTS (SELECT 1 FROM public.patients WHERE id = p_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'Patient % not found or not owned by caller.', p_id;
  END IF;

  -- Count protected linked records
  SELECT count(*) INTO order_cnt FROM public.laboratory_orders WHERE patient_id = p_id AND owner_id = auth.uid();
  SELECT count(*) INTO report_cnt FROM public.reports WHERE patient_id = p_id AND owner_id = auth.uid();
  SELECT count(*) INTO txn_cnt FROM public.payment_transactions WHERE patient_id = p_id AND owner_id = auth.uid();

  IF (order_cnt > 0 OR report_cnt > 0 OR txn_cnt > 0) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'blocked', TRUE,
      'message', format('Permanent deletion blocked: Patient has %s orders, %s reports, and %s payment records. Historical medical and financial records must be preserved. Use archive instead.', order_cnt, report_cnt, txn_cnt),
      'linked_records', jsonb_build_object('orders', order_cnt, 'reports', report_cnt, 'payments', txn_cnt)
    );
  END IF;

  -- Safe deletion of eligible unlinked patient
  DELETE FROM public.patients WHERE id = p_id AND owner_id = auth.uid();

  INSERT INTO public.audit_logs (owner_id, actor_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), auth.uid(), 'DELETE', 'patient', p_id, jsonb_build_object('event', 'PATIENT_DELETED', 'deleted_at', now(), 'eligible', true));

  RETURN jsonb_build_object(
    'success', TRUE,
    'blocked', FALSE,
    'message', format('Patient %s was permanently deleted successfully.', p_id)
  );
END;
$$;

-- Grant execution to authenticated only
REVOKE EXECUTE ON FUNCTION public.archive_patient(TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.archive_patient(TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.restore_patient(TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.restore_patient(TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.delete_eligible_patient(TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.delete_eligible_patient(TEXT) TO authenticated;
