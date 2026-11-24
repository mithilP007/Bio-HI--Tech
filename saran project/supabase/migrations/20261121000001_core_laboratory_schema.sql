-- ==============================================================================
-- MIGRATION: 20261121000001_core_laboratory_schema.sql
-- BIO HI TECH LIMS — CORE LABORATORY SCHEMA
-- Single-tenant Owner Architecture, Concurrency Controls, Clinical Governance
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. OWNER ACCESS ALLOWLIST TABLE (MILESTONE C)
-- At most ONE active owner UUID provisioned in the system.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.owner_access (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    role TEXT NOT NULL DEFAULT 'OWNER' CHECK (role = 'OWNER'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Mathematically guarantee at most ONE active owner identity in PostgreSQL
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
-- Optimistic concurrency versioning (version column)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.patients (
    id TEXT PRIMARY KEY, -- Format: 'BHT-02486'
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER CHECK (age >= 0 AND age <= 130),
    gender TEXT CHECK (gender IN ('Female', 'Male', 'Other', 'Prefer not to say', 'Not specified')),
    phone TEXT NOT NULL, -- Non-unique intentionally
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
-- 6. TEST CATALOGUE TABLE (120 Laboratory Tests)
-- owner_id IS NULL for default system catalogue, or owner UUID for customizations
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.test_catalogue (
    code TEXT PRIMARY KEY, -- e.g. 'LEG-001', 'CBC', 'GLU'
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'Biochemistry', 
        'Haematology', 
        'Clinical Pathology', 
        'Microbiology', 
        'Serology', 
        'Immunology & Endocrinology', 
        'Serology / Immunology', 
        'Other'
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
CREATE INDEX IF NOT EXISTS idx_catalogue_active ON public.test_catalogue(active);

-- ==============================================================================
-- 7. TEST PARAMETERS TABLE (124 Parameter Specifications)
-- Unverified clinical banner flag by default
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
    is_verified BOOLEAN NOT NULL DEFAULT FALSE -- Clinical governance approval flag
);

CREATE INDEX IF NOT EXISTS idx_params_test ON public.test_parameters(test_code);
CREATE INDEX IF NOT EXISTS idx_params_sort ON public.test_parameters(test_code, sort_order);

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
-- Supports one patient with multiple orders
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.laboratory_orders (
    id TEXT PRIMARY KEY, -- Format: 'ORD-261121-001'
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
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.laboratory_orders(status);

-- ==============================================================================
-- 10. ORDER TESTS TABLE (Multiple tests per order with price snapshots)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES public.laboratory_orders(id) ON DELETE CASCADE,
    test_code TEXT NOT NULL REFERENCES public.test_catalogue(code) ON DELETE RESTRICT,
    test_name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- Historical price snapshot
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed'))
);

CREATE INDEX IF NOT EXISTS idx_order_tests_order ON public.order_tests(order_id);

-- ==============================================================================
-- 11. REPORTS TABLE
-- Financial tracking: subtotal, discount, final_amount, paid_amount, payment_status
-- Status progression: Draft -> Issued -> Amended -> Cancelled
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY, -- Format: 'RPT-261121-032'
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
    storage_path TEXT, -- Private Supabase Storage object path
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_reports_owner ON public.reports(owner_id);
CREATE INDEX IF NOT EXISTS idx_reports_patient ON public.reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_date ON public.reports(report_date DESC);

-- ==============================================================================
-- 12. REPORT VERSIONS TABLE (Immutable historical audit versions)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.report_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    issued_by UUID NOT NULL REFERENCES auth.users(id),
    reason_for_amendment TEXT,
    snapshot_data JSONB NOT NULL, -- Complete frozen copy of patient, results, parameters, and signatures
    storage_path TEXT
);

CREATE INDEX IF NOT EXISTS idx_report_versions_report ON public.report_versions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_versions_version ON public.report_versions(report_id, version_number);

-- ==============================================================================
-- 13. REPORT TEST RESULTS TABLE (Results per parameter)
-- Supports Numeric, Qualitative, and Text results
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
CREATE INDEX IF NOT EXISTS idx_results_owner ON public.report_results(owner_id);

-- ==============================================================================
-- 14. PAYMENT TRANSACTIONS TABLE (Immutable Financial Ledger)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id TEXT PRIMARY KEY, -- Format: 'RCP-261121-001' or 'TXN-00001'
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
CREATE INDEX IF NOT EXISTS idx_payments_patient ON public.payment_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_owner ON public.payment_transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payment_transactions(payment_date DESC);

-- ==============================================================================
-- 15. FILE METADATA TABLE (Secure metadata for private storage files)
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
-- 16. AUDIT LOGS TABLE (Immutable Event Audit Trail)
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
-- 17. LABORATORY SETTINGS TABLE (Key-Value Configuration)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.lab_settings (
    key TEXT PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 18. COMPATIBILITY VIEWS
-- Provides seamless compatibility for alternative naming in services
-- ==============================================================================
CREATE OR REPLACE VIEW public.payments_ledger WITH (security_invoker = true) AS SELECT * FROM public.payment_transactions;
CREATE OR REPLACE VIEW public.lab_orders WITH (security_invoker = true) AS SELECT * FROM public.laboratory_orders;
CREATE OR REPLACE VIEW public.test_results WITH (security_invoker = true) AS SELECT * FROM public.report_results;
CREATE OR REPLACE VIEW public.file_attachments WITH (security_invoker = true) AS SELECT * FROM public.file_metadata;

-- ==============================================================================
-- 19. AUTOMATIC TIMESTAMPS & CONCURRENCY TRIGGERS
-- ==============================================================================
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
