-- ==============================================================================
-- MIGRATION: 20261121000003_storage_buckets_and_policies.sql
-- BIO HI TECH LIMS — PRIVATE STORAGE BUCKETS & ISOLATION POLICIES
-- Zero Public Buckets: All files require active owner session or signed URLs
-- ==============================================================================

-- 1. patient-documents (Private: prescriptions, scans, ID copies)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'patient-documents', 
    'patient-documents', 
    FALSE, 
    10485760, -- 10 MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET 
    public = FALSE, 
    file_size_limit = 10485760, 
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png'];

-- 2. issued-reports (Private: finalized patient PDF reports)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'issued-reports', 
    'issued-reports', 
    FALSE, 
    15728640, -- 15 MB
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET 
    public = FALSE, 
    file_size_limit = 15728640, 
    allowed_mime_types = ARRAY['application/pdf'];

-- 3. laboratory-assets (Private: laboratory digital signatures, stamps, letterhead graphics)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'laboratory-assets', 
    'laboratory-assets', 
    FALSE, 
    5242880, -- 5 MB
    ARRAY['image/png', 'image/jpeg', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET 
    public = FALSE, 
    file_size_limit = 5242880, 
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/svg+xml'];

-- ==============================================================================
-- STORAGE RLS POLICIES (Owner-only folder isolation: path starts with auth.uid())
-- ==============================================================================

-- Patient Documents
CREATE POLICY "owner_select_patient_documents" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'patient-documents' 
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND public.is_active_owner()
    );

CREATE POLICY "owner_insert_patient_documents" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'patient-documents' 
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND public.is_active_owner()
    );

CREATE POLICY "owner_delete_patient_documents" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'patient-documents' 
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND public.is_active_owner()
    );

-- Issued Reports (PDFs are immutable medical records; no delete allowed)
CREATE POLICY "owner_select_issued_reports" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'issued-reports' 
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND public.is_active_owner()
    );

CREATE POLICY "owner_insert_issued_reports" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'issued-reports' 
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND public.is_active_owner()
    );

-- Laboratory Assets (Signatures, Stamps, Letterhead)
CREATE POLICY "owner_select_laboratory_assets" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'laboratory-assets' 
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND public.is_active_owner()
    );

CREATE POLICY "owner_insert_laboratory_assets" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'laboratory-assets' 
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND public.is_active_owner()
    );

CREATE POLICY "owner_update_laboratory_assets" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'laboratory-assets' 
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND public.is_active_owner()
    );
