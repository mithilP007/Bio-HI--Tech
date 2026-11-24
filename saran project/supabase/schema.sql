-- ==============================================================================
-- BIO HI TECH LIMS — PRODUCTION POSTGRESQL REFERENCE SCHEMA (SNAPSHOT)
-- ==============================================================================
-- Single-tenant Owner Architecture, Row Level Security, Realtime & Private Storage
-- Region: South Asia (Mumbai, ap-south-1)
-- Consolidated Snapshot of Migrations 20261121000001 through 20261121000005
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. OWNER ACCESS ALLOWLIST TABLE
-- Exactly ONE active owner UUID provisioned in the system.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.owner_access (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    role TEXT NOT NULL DEFAULT 'OWNER' CHECK (role = 'OWNER'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_single_active_owner 
    ON public.owner_access(is_active) 
    WHERE is_active = TRUE;

-- ==============================================================================
-- 3. OWNER PROFILE & LABORATORY BRANDING
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.owner_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT 'Laboratory Owner',
    designation TEXT NOT NULL DEFAULT 'Laboratory Director / Owner',
    phone TEXT,
    lab_name TEXT NOT NULL DEFAULT 'BIO HI TECH',
    lab_address TEXT NOT NULL DEFAULT 'Ground Floor, Health Plaza, Mumbai, Maharashtra',
    lab_registration_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_owner_email ON public.owner_profile(email);

-- ==============================================================================
-- 4. REFERRING DOCTORS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.referring_doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    qualification TEXT,
    clinic_hospital TEXT,
    phone TEXT,
    email TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ref_doc_owner ON public.referring_doctors(owner_id);
CREATE INDEX IF NOT EXISTS idx_ref_doc_name ON public.referring_doctors(name);

-- ==============================================================================
-- 5. PATIENTS TABLE
-- Non-unique phone numbers intentionally (family members share contact numbers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.patients (
    id TEXT PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER CHECK (age >= 0 AND age <= 130),
    gender TEXT CHECK (gender IN ('Female', 'Male', 'Other', 'Prefer not to say', 'Not specified')),
    phone TEXT NOT NULL,
    referring_doctor_id UUID REFERENCES public.referring_doctors(id) ON DELETE SET NULL,
    doctor TEXT DEFAULT 'Self / Direct',
    date_of_birth DATE,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_patients_owner ON public.patients(owner_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON public.patients(created_at DESC);

-- ==============================================================================
-- 6. TEST CATALOGUE TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.test_catalogue (
    code TEXT PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'Biochemistry', 'Haematology', 'Clinical Pathology', 'Microbiology', 
        'Serology', 'Immunology & Endocrinology', 'Serology / Immunology', 'Other'
    )),
    normal_price NUMERIC(10, 2) NOT NULL CHECK (normal_price >= 0),
    discount_price NUMERIC(10, 2) NOT NULL CHECK (discount_price >= 0),
    parameters_count INTEGER NOT NULL DEFAULT 1,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    is_panel BOOLEAN NOT NULL DEFAULT FALSE,
    notes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_catalogue_owner ON public.test_catalogue(owner_id);
CREATE INDEX IF NOT EXISTS idx_catalogue_category ON public.test_catalogue(category);

-- ==============================================================================
-- 7. TEST PARAMETERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.test_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_code TEXT NOT NULL REFERENCES public.test_catalogue(code) ON DELETE CASCADE,
    name TEXT NOT NULL,
    data_type TEXT NOT NULL CHECK (data_type IN ('Numeric', 'Qualitative', 'Text', 'Unconfigured')),
    unit TEXT DEFAULT '',
    precision INTEGER DEFAULT 2 CHECK (precision >= 0 AND precision <= 6),
    male_low NUMERIC(12, 4),
    male_high NUMERIC(12, 4),
    female_low NUMERIC(12, 4),
    female_high NUMERIC(12, 4),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_params_test ON public.test_parameters(test_code);

-- ==============================================================================
-- 8. REFERENCE INTERVALS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reference_intervals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parameter_id UUID NOT NULL REFERENCES public.test_parameters(id) ON DELETE CASCADE,
    test_code TEXT NOT NULL REFERENCES public.test_catalogue(code) ON DELETE CASCADE,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Both', 'Children')),
    age_min_years NUMERIC(5, 2) DEFAULT 0,
    age_max_years NUMERIC(5, 2) DEFAULT 130,
    low_value NUMERIC(12, 4),
    high_value NUMERIC(12, 4),
    qualitative_normal TEXT,
    clinical_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_intervals_param ON public.reference_intervals(parameter_id);

-- ==============================================================================
-- 9. LABORATORY ORDERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.laboratory_orders (
    id TEXT PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
    referring_doctor_id UUID REFERENCES public.referring_doctors(id) ON DELETE SET NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Completed', 'Cancelled')),
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_orders_owner ON public.laboratory_orders(owner_id);
CREATE INDEX IF NOT EXISTS idx_orders_patient ON public.laboratory_orders(patient_id);

-- ==============================================================================
-- 10. ORDER TESTS TABLE (Price snapshots at order time)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES public.laboratory_orders(id) ON DELETE CASCADE,
    test_code TEXT NOT NULL REFERENCES public.test_catalogue(code) ON DELETE RESTRICT,
    test_name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed'))
);

CREATE INDEX IF NOT EXISTS idx_order_tests_order ON public.order_tests(order_id);

-- ==============================================================================
-- 11. REPORTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
    order_id TEXT REFERENCES public.laboratory_orders(id) ON DELETE SET NULL,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subtotal_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    final_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Paid', 'Pending', 'Partial')),
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Issued', 'Amended', 'Cancelled')),
    amends_report_id TEXT REFERENCES public.reports(id) ON DELETE SET NULL,
    current_version INTEGER NOT NULL DEFAULT 1,
    storage_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_reports_owner ON public.reports(owner_id);
CREATE INDEX IF NOT EXISTS idx_reports_patient ON public.reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- ==============================================================================
-- 12. REPORT VERSIONS TABLE (Immutable Snapshots)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.report_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    issued_by UUID NOT NULL REFERENCES auth.users(id),
    reason_for_amendment TEXT,
    snapshot_data JSONB NOT NULL,
    storage_path TEXT
);

CREATE INDEX IF NOT EXISTS idx_report_versions_report ON public.report_versions(report_id);

-- ==============================================================================
-- 13. REPORT RESULTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.report_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    test_code TEXT,
    test_name TEXT NOT NULL,
    parameter_name TEXT NOT NULL,
    result_value TEXT NOT NULL DEFAULT '',
    unit TEXT DEFAULT '',
    reference_interval TEXT DEFAULT 'Range not verified',
    is_abnormal BOOLEAN DEFAULT FALSE,
    flag TEXT DEFAULT 'Normal' CHECK (flag IN ('Normal', 'High', 'Low', 'Critical', 'Abnormal', 'Pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_report_test_param UNIQUE (report_id, test_name, parameter_name)
);

CREATE INDEX IF NOT EXISTS idx_results_report ON public.report_results(report_id);

-- ==============================================================================
-- 14. PAYMENT TRANSACTIONS TABLE (Immutable Financial Ledger)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id TEXT PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Card', 'Bank transfer', 'Cheque')),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payments_report ON public.payment_transactions(report_id);
CREATE INDEX IF NOT EXISTS idx_payments_owner ON public.payment_transactions(owner_id);

-- ==============================================================================
-- 15. FILE METADATA TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.file_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bucket_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('patient_document', 'issued_report', 'laboratory_asset')),
    entity_id TEXT NOT NULL,
    sha256_checksum TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_file_meta_owner ON public.file_metadata(owner_id);
CREATE INDEX IF NOT EXISTS idx_file_meta_entity ON public.file_metadata(entity_type, entity_id);

-- ==============================================================================
-- 16. AUDIT LOGS TABLE (Immutable Audit Trail)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL CHECK (action IN (
        'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 
        'VIEW_REPORT', 'PRINT_REPORT', 'EXPORT_DATA'
    )),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    details JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_owner ON public.audit_logs(owner_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.audit_logs(timestamp DESC);

-- ==============================================================================
-- 17. LABORATORY SETTINGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.lab_settings (
    key TEXT PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Compatibility Views
CREATE OR REPLACE VIEW public.payments_ledger AS SELECT * FROM public.payment_transactions;
CREATE OR REPLACE VIEW public.lab_orders AS SELECT * FROM public.laboratory_orders;
CREATE OR REPLACE VIEW public.test_results AS SELECT * FROM public.report_results;
CREATE OR REPLACE VIEW public.file_attachments AS SELECT * FROM public.file_metadata;

-- ==============================================================================
-- 18. FUNCTIONS & TRIGGERS
-- ==============================================================================
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

CREATE OR REPLACE FUNCTION public.handle_row_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    IF TG_TABLE_NAME IN ('patients', 'laboratory_orders', 'reports') THEN
        NEW.version = OLD.version + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_patients_update ON public.patients;
CREATE TRIGGER trg_patients_update
    BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.handle_row_update();

DROP TRIGGER IF EXISTS trg_orders_update ON public.laboratory_orders;
CREATE TRIGGER trg_orders_update
    BEFORE UPDATE ON public.laboratory_orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_row_update();

DROP TRIGGER IF EXISTS trg_reports_update ON public.reports;
CREATE TRIGGER trg_reports_update
    BEFORE UPDATE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.handle_row_update();

-- ==============================================================================
-- 19. ROW LEVEL SECURITY (RLS) POLICIES
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

CREATE POLICY "owner_access_select_self" ON public.owner_access
    FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "owner_profile_select" ON public.owner_profile
    FOR SELECT TO authenticated USING (auth.uid() = id AND public.is_active_owner());
CREATE POLICY "owner_profile_update" ON public.owner_profile
    FOR UPDATE TO authenticated USING (auth.uid() = id AND public.is_active_owner());

CREATE POLICY "doctors_select" ON public.referring_doctors
    FOR SELECT TO authenticated USING (auth.uid() = owner_id AND public.is_active_owner());
CREATE POLICY "doctors_insert" ON public.referring_doctors
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());
CREATE POLICY "doctors_update" ON public.referring_doctors
    FOR UPDATE TO authenticated USING (auth.uid() = owner_id AND public.is_active_owner());
CREATE POLICY "doctors_delete" ON public.referring_doctors
    FOR DELETE TO authenticated USING (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "patients_select" ON public.patients
    FOR SELECT TO authenticated USING (auth.uid() = owner_id AND public.is_active_owner());
CREATE POLICY "patients_insert" ON public.patients
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());
CREATE POLICY "patients_update" ON public.patients
    FOR UPDATE TO authenticated USING (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "catalogue_select" ON public.test_catalogue
    FOR SELECT TO authenticated USING (owner_id IS NULL OR (auth.uid() = owner_id AND public.is_active_owner()));
CREATE POLICY "catalogue_insert" ON public.test_catalogue
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());
CREATE POLICY "catalogue_update" ON public.test_catalogue
    FOR UPDATE TO authenticated USING ((owner_id IS NULL OR auth.uid() = owner_id) AND public.is_active_owner())
    WITH CHECK ((owner_id IS NULL OR auth.uid() = owner_id) AND public.is_active_owner());

CREATE POLICY "parameters_select" ON public.test_parameters
    FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "parameters_insert" ON public.test_parameters
    FOR INSERT TO authenticated WITH CHECK (public.is_active_owner());
CREATE POLICY "parameters_update" ON public.test_parameters
    FOR UPDATE TO authenticated USING (public.is_active_owner());

CREATE POLICY "intervals_select" ON public.reference_intervals
    FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "intervals_insert" ON public.reference_intervals
    FOR INSERT TO authenticated WITH CHECK (public.is_active_owner());
CREATE POLICY "intervals_update" ON public.reference_intervals
    FOR UPDATE TO authenticated USING (public.is_active_owner());

CREATE POLICY "orders_select" ON public.laboratory_orders
    FOR SELECT TO authenticated USING (auth.uid() = owner_id AND public.is_active_owner());
CREATE POLICY "orders_insert" ON public.laboratory_orders
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());
CREATE POLICY "orders_update" ON public.laboratory_orders
    FOR UPDATE TO authenticated USING (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "order_tests_select" ON public.order_tests
    FOR SELECT TO authenticated USING (EXISTS (
        SELECT 1 FROM public.laboratory_orders o WHERE o.id = order_id AND o.owner_id = auth.uid() AND public.is_active_owner()
    ));
CREATE POLICY "order_tests_insert" ON public.order_tests
    FOR INSERT TO authenticated WITH CHECK (EXISTS (
        SELECT 1 FROM public.laboratory_orders o WHERE o.id = order_id AND o.owner_id = auth.uid() AND public.is_active_owner()
    ));
CREATE POLICY "order_tests_update" ON public.order_tests
    FOR UPDATE TO authenticated USING (EXISTS (
        SELECT 1 FROM public.laboratory_orders o WHERE o.id = order_id AND o.owner_id = auth.uid() AND public.is_active_owner()
    ));

CREATE POLICY "reports_select" ON public.reports
    FOR SELECT TO authenticated USING (auth.uid() = owner_id AND public.is_active_owner());
CREATE POLICY "reports_insert" ON public.reports
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());
CREATE POLICY "reports_update" ON public.reports
    FOR UPDATE TO authenticated USING (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "results_select" ON public.report_results
    FOR SELECT TO authenticated USING (auth.uid() = owner_id AND public.is_active_owner());
CREATE POLICY "results_insert" ON public.report_results
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());
CREATE POLICY "results_update" ON public.report_results
    FOR UPDATE TO authenticated USING (auth.uid() = owner_id AND public.is_active_owner());
CREATE POLICY "results_delete" ON public.report_results
    FOR DELETE TO authenticated USING (auth.uid() = owner_id AND public.is_active_owner());

-- IMMUTABLE: NO DELETE, NO UPDATE
CREATE POLICY "versions_select" ON public.report_versions
    FOR SELECT TO authenticated USING (EXISTS (
        SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.owner_id = auth.uid() AND public.is_active_owner()
    ));
CREATE POLICY "versions_insert" ON public.report_versions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = issued_by AND public.is_active_owner());

CREATE POLICY "payments_select" ON public.payment_transactions
    FOR SELECT TO authenticated USING (auth.uid() = owner_id AND public.is_active_owner());
CREATE POLICY "payments_insert" ON public.payment_transactions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "audit_select" ON public.audit_logs
    FOR SELECT TO authenticated USING (auth.uid() = owner_id AND public.is_active_owner());
CREATE POLICY "audit_insert" ON public.audit_logs
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "files_select" ON public.file_metadata
    FOR SELECT TO authenticated USING (auth.uid() = owner_id AND public.is_active_owner());
CREATE POLICY "files_insert" ON public.file_metadata
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());
CREATE POLICY "files_update" ON public.file_metadata
    FOR UPDATE TO authenticated USING (auth.uid() = owner_id AND public.is_active_owner());
CREATE POLICY "files_delete" ON public.file_metadata
    FOR DELETE TO authenticated USING (auth.uid() = owner_id AND public.is_active_owner());

CREATE POLICY "settings_select" ON public.lab_settings
    FOR SELECT TO authenticated USING (auth.uid() = owner_id AND public.is_active_owner());
CREATE POLICY "settings_insert" ON public.lab_settings
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND public.is_active_owner());
CREATE POLICY "settings_update" ON public.lab_settings
    FOR UPDATE TO authenticated USING (auth.uid() = owner_id AND public.is_active_owner());

-- ==============================================================================
-- 20. PRIVATE STORAGE BUCKETS
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('patient-documents', 'patient-documents', FALSE, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('issued-reports', 'issued-reports', FALSE, 15728640, ARRAY['application/pdf']),
    ('laboratory-assets', 'laboratory-assets', FALSE, 5242880, ARRAY['image/png', 'image/jpeg', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET public = FALSE;

CREATE POLICY "owner_select_patient_documents" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'patient-documents' AND (storage.foldername(name))[1] = auth.uid()::text AND public.is_active_owner());
CREATE POLICY "owner_insert_patient_documents" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'patient-documents' AND (storage.foldername(name))[1] = auth.uid()::text AND public.is_active_owner());

CREATE POLICY "owner_select_issued_reports" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'issued-reports' AND (storage.foldername(name))[1] = auth.uid()::text AND public.is_active_owner());
CREATE POLICY "owner_insert_issued_reports" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'issued-reports' AND (storage.foldername(name))[1] = auth.uid()::text AND public.is_active_owner());

CREATE POLICY "owner_select_laboratory_assets" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'laboratory-assets' AND (storage.foldername(name))[1] = auth.uid()::text AND public.is_active_owner());
CREATE POLICY "owner_insert_laboratory_assets" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'laboratory-assets' AND (storage.foldername(name))[1] = auth.uid()::text AND public.is_active_owner());
