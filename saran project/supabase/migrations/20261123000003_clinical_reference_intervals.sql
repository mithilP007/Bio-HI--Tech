-- ==============================================================================
-- BIO HI TECH CLINICAL REFERENCE INTERVALS & INTERPRETATION SCHEMA UPGRADE
-- Migration: 20261123000003_clinical_reference_intervals.sql
-- Additive migration for canonical clinical reference intervals, versioning,
-- audit capabilities, and broadened report_results interpretation flags.
-- ==============================================================================

-- 1. ADD ADDITIVE COLUMNS TO public.reference_intervals
ALTER TABLE public.reference_intervals
    ADD COLUMN IF NOT EXISTS test_name TEXT,
    ADD COLUMN IF NOT EXISTS parameter_name TEXT,
    ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS age_unit TEXT DEFAULT 'years',
    ADD COLUMN IF NOT EXISTS pregnancy_applicability TEXT DEFAULT 'Any',
    ADD COLUMN IF NOT EXISTS specimen_type TEXT DEFAULT 'Clinical Specimen',
    ADD COLUMN IF NOT EXISTS method_instrument TEXT,
    ADD COLUMN IF NOT EXISTS fasting_requirement TEXT,
    ADD COLUMN IF NOT EXISTS borderline_low NUMERIC(12, 4),
    ADD COLUMN IF NOT EXISTS borderline_high NUMERIC(12, 4),
    ADD COLUMN IF NOT EXISTS critical_low NUMERIC(12, 4),
    ADD COLUMN IF NOT EXISTS critical_high NUMERIC(12, 4),
    ADD COLUMN IF NOT EXISTS source_file TEXT DEFAULT 'legacy_reference/BIO_HI_TECH_Lab_App/index.html',
    ADD COLUMN IF NOT EXISTS source_location TEXT,
    ADD COLUMN IF NOT EXISTS original_source_wording TEXT,
    ADD COLUMN IF NOT EXISTS reference_version INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS extraction_date DATE DEFAULT '2026-11-23',
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS governance_state TEXT DEFAULT 'OWNER_REVIEW_REQUIRED';

-- 2. BROADEN report_results.flag CHECK CONSTRAINT TO ALLOW BORDERLINE, WITHIN RANGE, UNAVAILABLE
ALTER TABLE public.report_results
    DROP CONSTRAINT IF EXISTS report_results_flag_check;

ALTER TABLE public.report_results
    ADD CONSTRAINT report_results_flag_check
    CHECK (flag IN ('Normal', 'Within Range', 'High', 'Low', 'Borderline', 'Critical', 'Abnormal', 'Pending', 'Unavailable', 'Unverified'));

ALTER TABLE public.report_results
    ADD COLUMN IF NOT EXISTS applied_reference_interval TEXT,
    ADD COLUMN IF NOT EXISTS reference_interval_version INTEGER DEFAULT 1;

-- 3. CREATE REFERENCE AUDIT TABLE FOR OWNER APPROVALS AND CORRECTIONS
CREATE TABLE IF NOT EXISTS public.reference_interval_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_interval_id UUID REFERENCES public.reference_intervals(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL CHECK (action IN ('APPROVED', 'REJECTED', 'CORRECTED', 'SUPERSEDED', 'VERSION_CREATED')),
    previous_data JSONB,
    new_data JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.reference_interval_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reference_interval_audit FROM anon;

CREATE POLICY "audit_owner_select" ON public.reference_interval_audit
    FOR SELECT TO authenticated USING (public.is_active_owner());

CREATE POLICY "audit_owner_insert" ON public.reference_interval_audit
    FOR INSERT TO authenticated WITH CHECK (public.is_active_owner());

-- 4. POPULATE CANONICAL REFERENCE INTERVALS (234 records covering 211 parameter instances)
DO $$
DECLARE
    v_param_id UUID;
BEGIN

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-001' AND name = 'AMH' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-001', 'AMH', 'AMH',
            'Both', 0, 130, 'years',
            1, 3.5, NULL, 'ng/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'AMH=ng/mL|1|3.5',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-002' AND name = 'ANA' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-002', 'ANA', 'ANA',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'ANA=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-003' AND name = 'ANA (IFA)' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-003', 'ANA (IFA)', 'ANA (IFA)',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'ANA (IFA)=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-004' AND name = 'Result' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-004', 'ANC Profile', 'Result',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'Result=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-005' AND name = 'APTT' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-005', 'APTT', 'APTT',
            'Both', 0, 130, 'years',
            25, 35, NULL, 'sec',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'APTT=sec|25|35',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-006' AND name = 'ASO' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-006', 'ASO', 'ASO',
            'Both', 0, 130, 'years',
            0, 200, NULL, 'IU/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'ASO=IU/mL|0|200',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-007' AND name = 'Anti-CCP' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-007', 'Anti-CCP', 'Anti-CCP',
            'Both', 0, 130, 'years',
            0, 17, NULL, 'U/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Anti-CCP=U/mL|0|17',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-008' AND name = 'Anti-Phospholipid Antibody' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-008', 'Anti-Phospholipid Antibody', 'Anti-Phospholipid Antibody',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'Anti-Phospholipid Antibody=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-009' AND name = 'Anti-TPO' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-009', 'Anti-TPO', 'Anti-TPO',
            'Both', 0, 130, 'years',
            0, 35, NULL, 'IU/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Anti-TPO=IU/mL|0|35',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-010' AND name = 'Anti-Thyroglobulin Antibody' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-010', 'Anti-Thyroglobulin Antibody', 'Anti-Thyroglobulin Antibody',
            'Both', 0, 130, 'years',
            0, 40, NULL, 'IU/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Anti-Thyroglobulin Antibody=IU/mL|0|40',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-011' AND name = 'Anti-Thyroid Microsomal Antibody' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-011', 'Anti-Thyroid Microsomal Antibody', 'Anti-Thyroid Microsomal Antibody',
            'Both', 0, 130, 'years',
            0, 35, NULL, 'IU/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Anti-Thyroid Microsomal Antibody=IU/mL|0|35',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-012' AND name = 'Bicarbonate' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-012', 'Bicarbonate', 'Bicarbonate',
            'Both', 0, 130, 'years',
            22, 29, NULL, 'mmol/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Bicarbonate=mmol/L|22|29',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-013' AND name = 'Total Bilirubin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-013', 'Bilirubin', 'Total Bilirubin',
            'Both', 0, 130, 'years',
            0.3, 1.2, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Total Bilirubin=mg/dL|0.3|1.2',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-013' AND name = 'Direct Bilirubin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-013', 'Bilirubin', 'Direct Bilirubin',
            'Both', 0, 130, 'years',
            0, 0.3, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Direct Bilirubin=mg/dL|0|0.3',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-014' AND name = 'Bleeding Time' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-014', 'Bleeding / Clotting Time', 'Bleeding Time',
            'Both', 0, 130, 'years',
            2, 7, NULL, 'min',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Bleeding Time=min|2|7',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-014' AND name = 'Clotting Time' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-014', 'Bleeding / Clotting Time', 'Clotting Time',
            'Both', 0, 130, 'years',
            5, 10, NULL, 'min',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Clotting Time=min|5|10',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-015' AND name = 'Result' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-015', 'Blood Culture', 'Result',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'Result=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-016' AND name = 'Result' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-016', 'Blood Group', 'Result',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'Result=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-017' AND name = 'Blood Sugar (unspecified)' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-017', 'Blood Sugar (unspecified)', 'Blood Sugar (unspecified)',
            'Both', 0, 130, 'years',
            70, 140, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Blood Sugar (unspecified)=mg/dL|70|140',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-018' AND name = 'Blood Urea Nitrogen (BUN)' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-018', 'Blood Urea Nitrogen (BUN)', 'Blood Urea Nitrogen (BUN)',
            'Both', 0, 130, 'years',
            7, 20, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Blood Urea Nitrogen (BUN)=mg/dL|7|20',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-019' AND name = 'CA 15-3' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-019', 'CA 15-3', 'CA 15-3',
            'Both', 0, 130, 'years',
            0, 30, NULL, 'U/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'CA 15-3=U/mL|0|30',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-020' AND name = 'CA 19-9' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-020', 'CA 19-9', 'CA 19-9',
            'Both', 0, 130, 'years',
            0, 37, NULL, 'U/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'CA 19-9=U/mL|0|37',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-021' AND name = 'CA-125' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-021', 'CA-125', 'CA-125',
            'Both', 0, 130, 'years',
            0, 35, NULL, 'U/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'CA-125=U/mL|0|35',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-022' AND name = 'Hemoglobin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-022', 'CBC / Hemogram', 'Hemoglobin',
            'Male', 0, 130, 'years',
            13, 17, NULL, 'g/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Hemoglobin=g/dL|13|17|12|15',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-022' AND name = 'Hemoglobin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-022', 'CBC / Hemogram', 'Hemoglobin',
            'Female', 0, 130, 'years',
            12, 15, NULL, 'g/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Hemoglobin=g/dL|13|17|12|15',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-022' AND name = 'Total WBC Count' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-022', 'CBC / Hemogram', 'Total WBC Count',
            'Both', 0, 130, 'years',
            4000, 11000, NULL, '/cumm',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Total WBC Count=/cumm|4000|11000',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-022' AND name = 'RBC Count' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-022', 'CBC / Hemogram', 'RBC Count',
            'Male', 0, 130, 'years',
            4.5, 5.5, NULL, 'million/cumm',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'RBC Count=million/cumm|4.5|5.5|3.8|4.8',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-022' AND name = 'RBC Count' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-022', 'CBC / Hemogram', 'RBC Count',
            'Female', 0, 130, 'years',
            3.8, 4.8, NULL, 'million/cumm',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'RBC Count=million/cumm|4.5|5.5|3.8|4.8',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-022' AND name = 'PCV' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-022', 'CBC / Hemogram', 'PCV',
            'Male', 0, 130, 'years',
            40, 50, NULL, '%',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'PCV=%|40|50|36|46',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-022' AND name = 'PCV' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-022', 'CBC / Hemogram', 'PCV',
            'Female', 0, 130, 'years',
            36, 46, NULL, '%',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'PCV=%|40|50|36|46',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-022' AND name = 'MCV' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-022', 'CBC / Hemogram', 'MCV',
            'Both', 0, 130, 'years',
            83, 101, NULL, 'fL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'MCV=fL|83|101',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-022' AND name = 'MCH' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-022', 'CBC / Hemogram', 'MCH',
            'Both', 0, 130, 'years',
            27, 32, NULL, 'pg',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'MCH=pg|27|32',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-022' AND name = 'MCHC' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-022', 'CBC / Hemogram', 'MCHC',
            'Both', 0, 130, 'years',
            31.5, 34.5, NULL, 'g/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'MCHC=g/dL|31.5|34.5',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-022' AND name = 'Platelet Count' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-022', 'CBC / Hemogram', 'Platelet Count',
            'Both', 0, 130, 'years',
            1.5, 4.1, NULL, 'lakh/cumm',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Platelet Count=lakh/cumm|1.5|4.1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-022' AND name = 'Neutrophils' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-022', 'CBC / Hemogram', 'Neutrophils',
            'Both', 0, 130, 'years',
            40, 80, NULL, '%',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Neutrophils=%|40|80',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-022' AND name = 'Lymphocytes' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-022', 'CBC / Hemogram', 'Lymphocytes',
            'Both', 0, 130, 'years',
            20, 40, NULL, '%',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Lymphocytes=%|20|40',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-022' AND name = 'Eosinophils' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-022', 'CBC / Hemogram', 'Eosinophils',
            'Both', 0, 130, 'years',
            1, 6, NULL, '%',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Eosinophils=%|1|6',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-022' AND name = 'Monocytes' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-022', 'CBC / Hemogram', 'Monocytes',
            'Both', 0, 130, 'years',
            2, 10, NULL, '%',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Monocytes=%|2|10',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-022' AND name = 'Basophils' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-022', 'CBC / Hemogram', 'Basophils',
            'Both', 0, 130, 'years',
            0, 1, NULL, '%',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Basophils=%|0|1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-023' AND name = 'Hemoglobin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-023', 'CBC with Peripheral Smear and ESR', 'Hemoglobin',
            'Male', 0, 130, 'years',
            13, 17, NULL, 'g/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Hemoglobin=g/dL|13|17|12|15',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-023' AND name = 'Hemoglobin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-023', 'CBC with Peripheral Smear and ESR', 'Hemoglobin',
            'Female', 0, 130, 'years',
            12, 15, NULL, 'g/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Hemoglobin=g/dL|13|17|12|15',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-023' AND name = 'Total WBC Count' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-023', 'CBC with Peripheral Smear and ESR', 'Total WBC Count',
            'Both', 0, 130, 'years',
            4000, 11000, NULL, '/cumm',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Total WBC Count=/cumm|4000|11000',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-023' AND name = 'RBC Count' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-023', 'CBC with Peripheral Smear and ESR', 'RBC Count',
            'Male', 0, 130, 'years',
            4.5, 5.5, NULL, 'million/cumm',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'RBC Count=million/cumm|4.5|5.5|3.8|4.8',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-023' AND name = 'RBC Count' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-023', 'CBC with Peripheral Smear and ESR', 'RBC Count',
            'Female', 0, 130, 'years',
            3.8, 4.8, NULL, 'million/cumm',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'RBC Count=million/cumm|4.5|5.5|3.8|4.8',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-023' AND name = 'PCV' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-023', 'CBC with Peripheral Smear and ESR', 'PCV',
            'Male', 0, 130, 'years',
            40, 50, NULL, '%',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'PCV=%|40|50|36|46',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-023' AND name = 'PCV' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-023', 'CBC with Peripheral Smear and ESR', 'PCV',
            'Female', 0, 130, 'years',
            36, 46, NULL, '%',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'PCV=%|40|50|36|46',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-023' AND name = 'MCV' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-023', 'CBC with Peripheral Smear and ESR', 'MCV',
            'Both', 0, 130, 'years',
            83, 101, NULL, 'fL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'MCV=fL|83|101',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-023' AND name = 'MCH' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-023', 'CBC with Peripheral Smear and ESR', 'MCH',
            'Both', 0, 130, 'years',
            27, 32, NULL, 'pg',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'MCH=pg|27|32',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-023' AND name = 'MCHC' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-023', 'CBC with Peripheral Smear and ESR', 'MCHC',
            'Both', 0, 130, 'years',
            31.5, 34.5, NULL, 'g/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'MCHC=g/dL|31.5|34.5',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-023' AND name = 'Platelet Count' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-023', 'CBC with Peripheral Smear and ESR', 'Platelet Count',
            'Both', 0, 130, 'years',
            1.5, 4.1, NULL, 'lakh/cumm',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Platelet Count=lakh/cumm|1.5|4.1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-023' AND name = 'Neutrophils' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-023', 'CBC with Peripheral Smear and ESR', 'Neutrophils',
            'Both', 0, 130, 'years',
            40, 80, NULL, '%',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Neutrophils=%|40|80',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-023' AND name = 'Lymphocytes' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-023', 'CBC with Peripheral Smear and ESR', 'Lymphocytes',
            'Both', 0, 130, 'years',
            20, 40, NULL, '%',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Lymphocytes=%|20|40',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-023' AND name = 'Eosinophils' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-023', 'CBC with Peripheral Smear and ESR', 'Eosinophils',
            'Both', 0, 130, 'years',
            1, 6, NULL, '%',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Eosinophils=%|1|6',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-023' AND name = 'Monocytes' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-023', 'CBC with Peripheral Smear and ESR', 'Monocytes',
            'Both', 0, 130, 'years',
            2, 10, NULL, '%',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Monocytes=%|2|10',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-023' AND name = 'Basophils' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-023', 'CBC with Peripheral Smear and ESR', 'Basophils',
            'Both', 0, 130, 'years',
            0, 1, NULL, '%',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Basophils=%|0|1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-023' AND name = 'ESR' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-023', 'CBC with Peripheral Smear and ESR', 'ESR',
            'Male', 0, 130, 'years',
            0, 15, NULL, 'mm/hr',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'ESR=mm/hr|0|15|0|20',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-023' AND name = 'ESR' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-023', 'CBC with Peripheral Smear and ESR', 'ESR',
            'Female', 0, 130, 'years',
            0, 20, NULL, 'mm/hr',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'ESR=mm/hr|0|15|0|20',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-023' AND name = 'Peripheral Smear' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-023', 'CBC with Peripheral Smear and ESR', 'Peripheral Smear',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'Peripheral Smear=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-024' AND name = 'CK-MB' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-024', 'CK-MB', 'CK-MB',
            'Both', 0, 130, 'years',
            0, 25, NULL, 'U/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'CK-MB=U/L|0|25',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-025' AND name = 'CPK' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-025', 'CPK', 'CPK',
            'Both', 0, 130, 'years',
            30, 200, NULL, 'U/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'CPK=U/L|30|200',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-026' AND name = 'CRP' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-026', 'CRP', 'CRP',
            'Both', 0, 130, 'years',
            0, 6, NULL, 'mg/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'CRP=mg/L|0|6',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-027' AND name = 'Result' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-027', 'CSF Analysis', 'Result',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'Result=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-028' AND name = 'Calcium' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-028', 'Calcium', 'Calcium',
            'Both', 0, 130, 'years',
            8.5, 10.5, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Calcium=mg/dL|8.5|10.5',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-029' AND name = 'Chloride' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-029', 'Chloride', 'Chloride',
            'Both', 0, 130, 'years',
            98, 107, NULL, 'mmol/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Chloride=mmol/L|98|107',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-030' AND name = 'Cholesterol' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-030', 'Cholesterol', 'Cholesterol',
            'Both', 0, 130, 'years',
            0, 200, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Cholesterol=mg/dL|0|200',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-031' AND name = 'Cortisol' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-031', 'Cortisol', 'Cortisol',
            'Both', 0, 130, 'years',
            6, 23, NULL, 'µg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Cortisol=µg/dL|6|23',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-032' AND name = 'Creatinine' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-032', 'Creatinine', 'Creatinine',
            'Male', 0, 130, 'years',
            0.7, 1.3, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Creatinine=mg/dL|0.7|1.3|0.6|1.1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-032' AND name = 'Creatinine' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-032', 'Creatinine', 'Creatinine',
            'Female', 0, 130, 'years',
            0.6, 1.1, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Creatinine=mg/dL|0.7|1.3|0.6|1.1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-033' AND name = 'Cryptococcal Antigen' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-033', 'Cryptococcal Antigen', 'Cryptococcal Antigen',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'Cryptococcal Antigen=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-034' AND name = 'DHEA' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-034', 'DHEA', 'DHEA',
            'Both', 0, 130, 'years',
            35, 430, NULL, 'µg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'DHEA=µg/dL|35|430',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-035' AND name = 'Dengue IgG' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-035', 'Dengue IgG', 'Dengue IgG',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'Dengue IgG=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-036' AND name = 'Dengue IgM' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-036', 'Dengue IgM', 'Dengue IgM',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'Dengue IgM=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-037' AND name = 'Dengue NS1 Antigen' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-037', 'Dengue NS1 Antigen', 'Dengue NS1 Antigen',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'Dengue NS1 Antigen=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-038' AND name = 'ESR' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-038', 'ESR', 'ESR',
            'Male', 0, 130, 'years',
            0, 15, NULL, 'mm/hr',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'ESR=mm/hr|0|15|0|20',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-038' AND name = 'ESR' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-038', 'ESR', 'ESR',
            'Female', 0, 130, 'years',
            0, 20, NULL, 'mm/hr',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'ESR=mm/hr|0|15|0|20',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-039' AND name = 'Sodium' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-039', 'Electrolytes', 'Sodium',
            'Both', 0, 130, 'years',
            135, 145, NULL, 'mmol/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Sodium=mmol/L|135|145',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-039' AND name = 'Potassium' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-039', 'Electrolytes', 'Potassium',
            'Both', 0, 130, 'years',
            3.5, 5.1, NULL, 'mmol/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Potassium=mmol/L|3.5|5.1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-039' AND name = 'Chloride' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-039', 'Electrolytes', 'Chloride',
            'Both', 0, 130, 'years',
            98, 107, NULL, 'mmol/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Chloride=mmol/L|98|107',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-040' AND name = 'Sodium' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-040', 'Electrolytes (Na/K/Cl)', 'Sodium',
            'Both', 0, 130, 'years',
            135, 145, NULL, 'mmol/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Sodium=mmol/L|135|145',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-040' AND name = 'Potassium' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-040', 'Electrolytes (Na/K/Cl)', 'Potassium',
            'Both', 0, 130, 'years',
            3.5, 5.1, NULL, 'mmol/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Potassium=mmol/L|3.5|5.1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-040' AND name = 'Chloride' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-040', 'Electrolytes (Na/K/Cl)', 'Chloride',
            'Both', 0, 130, 'years',
            98, 107, NULL, 'mmol/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Chloride=mmol/L|98|107',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-041' AND name = 'Estradiol (E2)' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-041', 'Estradiol (E2)', 'Estradiol (E2)',
            'Both', 0, 130, 'years',
            10, 40, NULL, 'pg/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Estradiol (E2)=pg/mL|10|40',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-042' AND name = 'FSH' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-042', 'FSH', 'FSH',
            'Both', 0, 130, 'years',
            1.5, 12.4, NULL, 'mIU/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'FSH=mIU/mL|1.5|12.4',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-043' AND name = 'Ferritin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-043', 'Ferritin', 'Ferritin',
            'Male', 0, 130, 'years',
            30, 400, NULL, 'ng/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Ferritin=ng/mL|30|400|13|150',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-043' AND name = 'Ferritin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-043', 'Ferritin', 'Ferritin',
            'Female', 0, 130, 'years',
            13, 150, NULL, 'ng/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Ferritin=ng/mL|30|400|13|150',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-044' AND name = 'Malaria Parasite' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-044', 'Fever Panel Comprehensive', 'Malaria Parasite',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'Malaria Parasite=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-044' AND name = 'Dengue NS1 Antigen' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-044', 'Fever Panel Comprehensive', 'Dengue NS1 Antigen',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'Dengue NS1 Antigen=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-044' AND name = 'Dengue IgM' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-044', 'Fever Panel Comprehensive', 'Dengue IgM',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'Dengue IgM=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-044' AND name = 'S.Typhi O' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-044', 'Fever Panel Comprehensive', 'S.Typhi O',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'S.Typhi O=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-044' AND name = 'S.Typhi H' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-044', 'Fever Panel Comprehensive', 'S.Typhi H',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'S.Typhi H=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-045' AND name = 'Folic Acid' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-045', 'Folic Acid', 'Folic Acid',
            'Both', 0, 130, 'years',
            3, 17, NULL, 'ng/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Folic Acid=ng/mL|3|17',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-046' AND name = 'FT3' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-046', 'Free Thyroid Panel (FT3, FT4, TSH)', 'FT3',
            'Both', 0, 130, 'years',
            2, 4.4, NULL, 'pg/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'FT3=pg/mL|2|4.4',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-046' AND name = 'FT4' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-046', 'Free Thyroid Panel (FT3, FT4, TSH)', 'FT4',
            'Both', 0, 130, 'years',
            0.8, 1.8, NULL, 'ng/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'FT4=ng/dL|0.8|1.8',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-046' AND name = 'TSH' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-046', 'Free Thyroid Panel (FT3, FT4, TSH)', 'TSH',
            'Both', 0, 130, 'years',
            0.4, 4.2, NULL, 'µIU/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'TSH=µIU/mL|0.4|4.2',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-047' AND name = 'G6PD' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-047', 'G6PD', 'G6PD',
            'Both', 0, 130, 'years',
            4.6, 13.5, NULL, 'U/g Hb',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'G6PD=U/g Hb|4.6|13.5',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-048' AND name = 'Fasting Glucose' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-048', 'GTT', 'Fasting Glucose',
            'Both', 0, 130, 'years',
            70, 100, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Fasting 10-12 hrs required',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Fasting Glucose=mg/dL|70|100',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-048' AND name = 'Glucose 2 hr (PP)' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-048', 'GTT', 'Glucose 2 hr (PP)',
            'Both', 0, 130, 'years',
            70, 140, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Fasting 10-12 hrs required',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Glucose 2 hr (PP)=mg/dL|70|140',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-049' AND name = 'Gamma GT' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-049', 'Gamma GT', 'Gamma GT',
            'Both', 0, 130, 'years',
            8, 61, NULL, 'U/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Gamma GT=U/L|8|61',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-050' AND name = 'Globulin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-050', 'Globulin', 'Globulin',
            'Both', 0, 130, 'years',
            2, 3.5, NULL, 'g/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Globulin=g/dL|2|3.5',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-051' AND name = 'HBsAg' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-051', 'HBsAg', 'HBsAg',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'HBsAg=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-052' AND name = 'HCV Antibody' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-052', 'HCV Antibody', 'HCV Antibody',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'HCV Antibody=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-053' AND name = 'HDL Cholesterol' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-053', 'HDL Cholesterol', 'HDL Cholesterol',
            'Male', 0, 130, 'years',
            40, 100, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'HDL Cholesterol=mg/dL|40|100|50|100',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-053' AND name = 'HDL Cholesterol' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-053', 'HDL Cholesterol', 'HDL Cholesterol',
            'Female', 0, 130, 'years',
            50, 100, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'HDL Cholesterol=mg/dL|40|100|50|100',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-054' AND name = 'HGH' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-054', 'HGH', 'HGH',
            'Both', 0, 130, 'years',
            0, 5, NULL, 'ng/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'HGH=ng/mL|0|5',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-055' AND name = 'HIV' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-055', 'HIV', 'HIV',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'HIV=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-056' AND name = 'Result' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-056', 'Hb Variant Analysis', 'Result',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'Result=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-057' AND name = 'HbA1c' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-057', 'HbA1c', 'HbA1c',
            'Both', 0, 130, 'years',
            4, 5.6, NULL, '%',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'HbA1c=%|4|5.6',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-058' AND name = 'Hemoglobin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-058', 'Hemoglobin', 'Hemoglobin',
            'Male', 0, 130, 'years',
            13, 17, NULL, 'g/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Hemoglobin=g/dL|13|17|12|15',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-058' AND name = 'Hemoglobin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-058', 'Hemoglobin', 'Hemoglobin',
            'Female', 0, 130, 'years',
            12, 15, NULL, 'g/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Hemoglobin=g/dL|13|17|12|15',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-059' AND name = 'Insulin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-059', 'Insulin', 'Insulin',
            'Both', 0, 130, 'years',
            2.6, 24.9, NULL, 'µIU/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Insulin=µIU/mL|2.6|24.9',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-060' AND name = 'Iron' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-060', 'Iron', 'Iron',
            'Male', 0, 130, 'years',
            65, 175, NULL, 'µg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Iron=µg/dL|65|175|50|170',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-060' AND name = 'Iron' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-060', 'Iron', 'Iron',
            'Female', 0, 130, 'years',
            50, 170, NULL, 'µg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Iron=µg/dL|65|175|50|170',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-061' AND name = 'Urea' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-061', 'Kidney / Renal Function Profile', 'Urea',
            'Both', 0, 130, 'years',
            15, 40, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Urea=mg/dL|15|40',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-061' AND name = 'Creatinine' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-061', 'Kidney / Renal Function Profile', 'Creatinine',
            'Male', 0, 130, 'years',
            0.7, 1.3, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Creatinine=mg/dL|0.7|1.3|0.6|1.1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-061' AND name = 'Creatinine' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-061', 'Kidney / Renal Function Profile', 'Creatinine',
            'Female', 0, 130, 'years',
            0.6, 1.1, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Creatinine=mg/dL|0.7|1.3|0.6|1.1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-061' AND name = 'Uric Acid' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-061', 'Kidney / Renal Function Profile', 'Uric Acid',
            'Male', 0, 130, 'years',
            3.5, 7.2, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Uric Acid=mg/dL|3.5|7.2|2.6|6',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-061' AND name = 'Uric Acid' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-061', 'Kidney / Renal Function Profile', 'Uric Acid',
            'Female', 0, 130, 'years',
            2.6, 6, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Uric Acid=mg/dL|3.5|7.2|2.6|6',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-061' AND name = 'Blood Urea Nitrogen (BUN)' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-061', 'Kidney / Renal Function Profile', 'Blood Urea Nitrogen (BUN)',
            'Both', 0, 130, 'years',
            7, 20, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Blood Urea Nitrogen (BUN)=mg/dL|7|20',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-061' AND name = 'Sodium' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-061', 'Kidney / Renal Function Profile', 'Sodium',
            'Both', 0, 130, 'years',
            135, 145, NULL, 'mmol/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Sodium=mmol/L|135|145',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-061' AND name = 'Potassium' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-061', 'Kidney / Renal Function Profile', 'Potassium',
            'Both', 0, 130, 'years',
            3.5, 5.1, NULL, 'mmol/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Potassium=mmol/L|3.5|5.1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-062' AND name = 'Urea' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-062', 'Kidney Profile', 'Urea',
            'Both', 0, 130, 'years',
            15, 40, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Urea=mg/dL|15|40',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-062' AND name = 'Creatinine' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-062', 'Kidney Profile', 'Creatinine',
            'Male', 0, 130, 'years',
            0.7, 1.3, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Creatinine=mg/dL|0.7|1.3|0.6|1.1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-062' AND name = 'Creatinine' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-062', 'Kidney Profile', 'Creatinine',
            'Female', 0, 130, 'years',
            0.6, 1.1, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Creatinine=mg/dL|0.7|1.3|0.6|1.1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-062' AND name = 'Uric Acid' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-062', 'Kidney Profile', 'Uric Acid',
            'Male', 0, 130, 'years',
            3.5, 7.2, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Uric Acid=mg/dL|3.5|7.2|2.6|6',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-062' AND name = 'Uric Acid' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-062', 'Kidney Profile', 'Uric Acid',
            'Female', 0, 130, 'years',
            2.6, 6, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Uric Acid=mg/dL|3.5|7.2|2.6|6',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-062' AND name = 'Blood Urea Nitrogen (BUN)' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-062', 'Kidney Profile', 'Blood Urea Nitrogen (BUN)',
            'Both', 0, 130, 'years',
            7, 20, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Blood Urea Nitrogen (BUN)=mg/dL|7|20',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-062' AND name = 'Sodium' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-062', 'Kidney Profile', 'Sodium',
            'Both', 0, 130, 'years',
            135, 145, NULL, 'mmol/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Sodium=mmol/L|135|145',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-062' AND name = 'Potassium' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-062', 'Kidney Profile', 'Potassium',
            'Both', 0, 130, 'years',
            3.5, 5.1, NULL, 'mmol/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Potassium=mmol/L|3.5|5.1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-063' AND name = 'LDH' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-063', 'LDH', 'LDH',
            'Both', 0, 130, 'years',
            140, 280, NULL, 'U/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'LDH=U/L|140|280',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-064' AND name = 'LE Cells' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-064', 'LE Cells', 'LE Cells',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'LE Cells=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-065' AND name = 'LH' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-065', 'LH', 'LH',
            'Both', 0, 130, 'years',
            1.7, 8.6, NULL, 'mIU/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'LH=mIU/mL|1.7|8.6',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-066' AND name = 'Cholesterol' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-066', 'Lipid Profile', 'Cholesterol',
            'Both', 0, 130, 'years',
            0, 200, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Fasting 10-12 hrs required',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Cholesterol=mg/dL|0|200',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-066' AND name = 'Triglycerides' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-066', 'Lipid Profile', 'Triglycerides',
            'Both', 0, 130, 'years',
            0, 150, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Fasting 10-12 hrs required',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Triglycerides=mg/dL|0|150',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-066' AND name = 'HDL Cholesterol' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-066', 'Lipid Profile', 'HDL Cholesterol',
            'Male', 0, 130, 'years',
            40, 100, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Fasting 10-12 hrs required',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'HDL Cholesterol=mg/dL|40|100|50|100',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-066' AND name = 'HDL Cholesterol' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-066', 'Lipid Profile', 'HDL Cholesterol',
            'Female', 0, 130, 'years',
            50, 100, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Fasting 10-12 hrs required',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'HDL Cholesterol=mg/dL|40|100|50|100',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-066' AND name = 'LDL Cholesterol' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-066', 'Lipid Profile', 'LDL Cholesterol',
            'Both', 0, 130, 'years',
            0, 100, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Fasting 10-12 hrs required',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'LDL Cholesterol=mg/dL|0|100',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-066' AND name = 'VLDL' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-066', 'Lipid Profile', 'VLDL',
            'Both', 0, 130, 'years',
            5, 40, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Fasting 10-12 hrs required',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'VLDL=mg/dL|5|40',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-066' AND name = 'Chol/HDL Ratio' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-066', 'Lipid Profile', 'Chol/HDL Ratio',
            'Both', 0, 130, 'years',
            0, 5, NULL, '',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Fasting 10-12 hrs required',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Chol/HDL Ratio=|0|5',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-067' AND name = 'Lipoprotein(a)' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-067', 'Lipoprotein(a)', 'Lipoprotein(a)',
            'Both', 0, 130, 'years',
            0, 30, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Lipoprotein(a)=mg/dL|0|30',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-068' AND name = 'Lithium' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-068', 'Lithium', 'Lithium',
            'Both', 0, 130, 'years',
            0.6, 1.2, NULL, 'mmol/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Lithium=mmol/L|0.6|1.2',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-069' AND name = 'Total Bilirubin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-069', 'Liver Function Test (LFT)', 'Total Bilirubin',
            'Both', 0, 130, 'years',
            0.3, 1.2, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Total Bilirubin=mg/dL|0.3|1.2',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-069' AND name = 'Direct Bilirubin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-069', 'Liver Function Test (LFT)', 'Direct Bilirubin',
            'Both', 0, 130, 'years',
            0, 0.3, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Direct Bilirubin=mg/dL|0|0.3',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-069' AND name = 'Indirect Bilirubin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-069', 'Liver Function Test (LFT)', 'Indirect Bilirubin',
            'Both', 0, 130, 'years',
            0.1, 1, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Indirect Bilirubin=mg/dL|0.1|1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-069' AND name = 'SGOT / AST' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-069', 'Liver Function Test (LFT)', 'SGOT / AST',
            'Both', 0, 130, 'years',
            5, 40, NULL, 'U/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'SGOT / AST=U/L|5|40',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-069' AND name = 'SGPT / ALT' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-069', 'Liver Function Test (LFT)', 'SGPT / ALT',
            'Both', 0, 130, 'years',
            5, 40, NULL, 'U/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'SGPT / ALT=U/L|5|40',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-069' AND name = 'Alkaline Phosphatase' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-069', 'Liver Function Test (LFT)', 'Alkaline Phosphatase',
            'Both', 0, 130, 'years',
            44, 147, NULL, 'U/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Alkaline Phosphatase=U/L|44|147',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-069' AND name = 'Protein' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-069', 'Liver Function Test (LFT)', 'Protein',
            'Both', 0, 130, 'years',
            6, 8.3, NULL, 'g/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Protein=g/dL|6|8.3',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-069' AND name = 'Albumin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-069', 'Liver Function Test (LFT)', 'Albumin',
            'Both', 0, 130, 'years',
            3.5, 5.2, NULL, 'g/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Albumin=g/dL|3.5|5.2',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-069' AND name = 'Globulin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-069', 'Liver Function Test (LFT)', 'Globulin',
            'Both', 0, 130, 'years',
            2, 3.5, NULL, 'g/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Globulin=g/dL|2|3.5',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-069' AND name = 'A/G Ratio' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-069', 'Liver Function Test (LFT)', 'A/G Ratio',
            'Both', 0, 130, 'years',
            1, 2.2, NULL, '',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'A/G Ratio=|1|2.2',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-070' AND name = 'Lupus Anticoagulant' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-070', 'Lupus Anticoagulant', 'Lupus Anticoagulant',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'Lupus Anticoagulant=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-071' AND name = 'Magnesium' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-071', 'Magnesium', 'Magnesium',
            'Both', 0, 130, 'years',
            1.7, 2.2, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Magnesium=mg/dL|1.7|2.2',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-072' AND name = 'Malaria Parasite' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-072', 'Malaria Parasite', 'Malaria Parasite',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'Malaria Parasite=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-073' AND name = 'Microalbumin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-073', 'Microalbumin', 'Microalbumin',
            'Both', 0, 130, 'years',
            0, 30, NULL, 'mg/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Microalbumin=mg/L|0|30',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-074' AND name = 'Microfilaria' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-074', 'Microfilaria', 'Microfilaria',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'Microfilaria=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-075' AND name = 'PCV' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-075', 'PCV', 'PCV',
            'Male', 0, 130, 'years',
            40, 50, NULL, '%',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'PCV=%|40|50|36|46',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-075' AND name = 'PCV' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-075', 'PCV', 'PCV',
            'Female', 0, 130, 'years',
            36, 46, NULL, '%',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'PCV=%|40|50|36|46',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-076' AND name = 'PSA' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-076', 'PSA', 'PSA',
            'Both', 0, 130, 'years',
            0, 4, NULL, 'ng/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'PSA=ng/mL|0|4',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-077' AND name = 'PT' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-077', 'PT / Prothrombin Time', 'PT',
            'Both', 0, 130, 'years',
            11, 13.5, NULL, 'sec',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'PT=sec|11|13.5',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-077' AND name = 'INR' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-077', 'PT / Prothrombin Time', 'INR',
            'Both', 0, 130, 'years',
            0.8, 1.1, NULL, '',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'INR=|0.8|1.1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-078' AND name = 'Phosphorus' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-078', 'Phosphorus', 'Phosphorus',
            'Both', 0, 130, 'years',
            2.5, 4.5, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Phosphorus=mg/dL|2.5|4.5',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-079' AND name = 'Platelet Count' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-079', 'Platelet Count', 'Platelet Count',
            'Both', 0, 130, 'years',
            1.5, 4.1, NULL, 'lakh/cumm',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Platelet Count=lakh/cumm|1.5|4.1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-080' AND name = 'Potassium' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-080', 'Potassium', 'Potassium',
            'Both', 0, 130, 'years',
            3.5, 5.1, NULL, 'mmol/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Potassium=mmol/L|3.5|5.1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-081' AND name = 'Pregnancy Test' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-081', 'Pregnancy Test', 'Pregnancy Test',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'Pregnancy Test=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-082' AND name = 'Progesterone' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-082', 'Progesterone', 'Progesterone',
            'Both', 0, 130, 'years',
            0.2, 1.4, NULL, 'ng/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Progesterone=ng/mL|0.2|1.4',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-083' AND name = 'Prolactin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-083', 'Prolactin', 'Prolactin',
            'Male', 0, 130, 'years',
            4, 15, NULL, 'ng/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Prolactin=ng/mL|4|15|4|23',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-083' AND name = 'Prolactin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-083', 'Prolactin', 'Prolactin',
            'Female', 0, 130, 'years',
            4, 23, NULL, 'ng/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Prolactin=ng/mL|4|15|4|23',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-084' AND name = 'Protein' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-084', 'Protein', 'Protein',
            'Both', 0, 130, 'years',
            6, 8.3, NULL, 'g/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Protein=g/dL|6|8.3',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-085' AND name = 'Protein / Creatinine Ratio' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-085', 'Protein / Creatinine Ratio', 'Protein / Creatinine Ratio',
            'Both', 0, 130, 'years',
            0, 0.2, NULL, '',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Protein / Creatinine Ratio=|0|0.2',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-086' AND name = 'Urea' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-086', 'Renal Profile', 'Urea',
            'Both', 0, 130, 'years',
            15, 40, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Urea=mg/dL|15|40',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-086' AND name = 'Creatinine' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-086', 'Renal Profile', 'Creatinine',
            'Male', 0, 130, 'years',
            0.7, 1.3, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Creatinine=mg/dL|0.7|1.3|0.6|1.1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-086' AND name = 'Creatinine' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-086', 'Renal Profile', 'Creatinine',
            'Female', 0, 130, 'years',
            0.6, 1.1, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Creatinine=mg/dL|0.7|1.3|0.6|1.1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-086' AND name = 'Uric Acid' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-086', 'Renal Profile', 'Uric Acid',
            'Male', 0, 130, 'years',
            3.5, 7.2, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Uric Acid=mg/dL|3.5|7.2|2.6|6',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-086' AND name = 'Uric Acid' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-086', 'Renal Profile', 'Uric Acid',
            'Female', 0, 130, 'years',
            2.6, 6, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Uric Acid=mg/dL|3.5|7.2|2.6|6',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-086' AND name = 'Blood Urea Nitrogen (BUN)' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-086', 'Renal Profile', 'Blood Urea Nitrogen (BUN)',
            'Both', 0, 130, 'years',
            7, 20, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Blood Urea Nitrogen (BUN)=mg/dL|7|20',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-086' AND name = 'Sodium' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-086', 'Renal Profile', 'Sodium',
            'Both', 0, 130, 'years',
            135, 145, NULL, 'mmol/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Sodium=mmol/L|135|145',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-086' AND name = 'Potassium' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-086', 'Renal Profile', 'Potassium',
            'Both', 0, 130, 'years',
            3.5, 5.1, NULL, 'mmol/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Potassium=mmol/L|3.5|5.1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-087' AND name = 'Reticulocyte Count' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-087', 'Reticulocyte Count', 'Reticulocyte Count',
            'Both', 0, 130, 'years',
            0.5, 2.5, NULL, '%',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Reticulocyte Count=%|0.5|2.5',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-088' AND name = 'Rheumatoid Factor (RF)' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-088', 'Rheumatoid Factor (RF)', 'Rheumatoid Factor (RF)',
            'Both', 0, 130, 'years',
            0, 14, NULL, 'IU/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Rheumatoid Factor (RF)=IU/mL|0|14',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-089' AND name = 'Rubella' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-089', 'Rubella', 'Rubella',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'Rubella=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-090' AND name = 'SGOT / AST' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-090', 'SGOT / AST', 'SGOT / AST',
            'Both', 0, 130, 'years',
            5, 40, NULL, 'U/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'SGOT / AST=U/L|5|40',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-091' AND name = 'SGPT / ALT' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-091', 'SGPT / ALT', 'SGPT / ALT',
            'Both', 0, 130, 'years',
            5, 40, NULL, 'U/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'SGPT / ALT=U/L|5|40',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-092' AND name = 'Semen Volume' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-092', 'Semen Analysis', 'Semen Volume',
            'Both', 0, 130, 'years',
            1.5, 5, NULL, 'mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Semen Volume=mL|1.5|5',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-092' AND name = 'Sperm Count' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-092', 'Semen Analysis', 'Sperm Count',
            'Both', 0, 130, 'years',
            15, 200, NULL, 'million/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Sperm Count=million/mL|15|200',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-092' AND name = 'Total Motility' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-092', 'Semen Analysis', 'Total Motility',
            'Both', 0, 130, 'years',
            40, 100, NULL, '%',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Total Motility=%|40|100',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-092' AND name = 'Normal Morphology' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-092', 'Semen Analysis', 'Normal Morphology',
            'Both', 0, 130, 'years',
            4, 100, NULL, '%',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Normal Morphology=%|4|100',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-093' AND name = 'Sickling Test' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-093', 'Sickling Test', 'Sickling Test',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'Sickling Test=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-094' AND name = 'Sodium' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-094', 'Sodium', 'Sodium',
            'Both', 0, 130, 'years',
            135, 145, NULL, 'mmol/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Sodium=mmol/L|135|145',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-095' AND name = 'Result' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-095', 'Sputum Culture', 'Result',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'Result=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-096' AND name = 'Result' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-096', 'Sputum Routine', 'Result',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'Result=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-097' AND name = 'Result' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-097', 'Stool Culture', 'Result',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'Result=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-098' AND name = 'Colour' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-098', 'Stool Routine', 'Colour',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'Colour=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-098' AND name = 'Consistency' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-098', 'Stool Routine', 'Consistency',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'Consistency=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-098' AND name = 'Mucus' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-098', 'Stool Routine', 'Mucus',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'Mucus=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-098' AND name = 'Ova / Cyst' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-098', 'Stool Routine', 'Ova / Cyst',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'Ova / Cyst=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-098' AND name = 'Occult Blood' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-098', 'Stool Routine', 'Occult Blood',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'Occult Blood=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-099' AND name = 'T3' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-099', 'T3', 'T3',
            'Both', 0, 130, 'years',
            80, 200, NULL, 'ng/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'T3=ng/dL|80|200',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-100' AND name = 'T4' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-100', 'T4', 'T4',
            'Both', 0, 130, 'years',
            5.1, 14.1, NULL, 'µg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'T4=µg/dL|5.1|14.1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-101' AND name = 'TSH' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-101', 'TSH', 'TSH',
            'Both', 0, 130, 'years',
            0.4, 4.2, NULL, 'µIU/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'TSH=µIU/mL|0.4|4.2',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-102' AND name = 'Thyroglobulin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-102', 'Thyroglobulin', 'Thyroglobulin',
            'Both', 0, 130, 'years',
            3.5, 77, NULL, 'ng/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Thyroglobulin=ng/mL|3.5|77',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-103' AND name = 'T3' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-103', 'Thyroid Profile (T3, T4, TSH)', 'T3',
            'Both', 0, 130, 'years',
            80, 200, NULL, 'ng/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'T3=ng/dL|80|200',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-103' AND name = 'T4' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-103', 'Thyroid Profile (T3, T4, TSH)', 'T4',
            'Both', 0, 130, 'years',
            5.1, 14.1, NULL, 'µg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'T4=µg/dL|5.1|14.1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-103' AND name = 'TSH' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-103', 'Thyroid Profile (T3, T4, TSH)', 'TSH',
            'Both', 0, 130, 'years',
            0.4, 4.2, NULL, 'µIU/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'TSH=µIU/mL|0.4|4.2',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-104' AND name = 'T3' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-104', 'Thyroid Profile (unspecified)', 'T3',
            'Both', 0, 130, 'years',
            80, 200, NULL, 'ng/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'T3=ng/dL|80|200',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-104' AND name = 'T4' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-104', 'Thyroid Profile (unspecified)', 'T4',
            'Both', 0, 130, 'years',
            5.1, 14.1, NULL, 'µg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'T4=µg/dL|5.1|14.1',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-104' AND name = 'TSH' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-104', 'Thyroid Profile (unspecified)', 'TSH',
            'Both', 0, 130, 'years',
            0.4, 4.2, NULL, 'µIU/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'TSH=µIU/mL|0.4|4.2',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-105' AND name = 'Total IgE' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-105', 'Total IgE', 'Total IgE',
            'Both', 0, 130, 'years',
            0, 100, NULL, 'IU/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Total IgE=IU/mL|0|100',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-106' AND name = 'Toxoplasma' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-106', 'Toxoplasma', 'Toxoplasma',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'Toxoplasma=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-107' AND name = 'Troponin-I' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-107', 'Troponin-I', 'Troponin-I',
            'Both', 0, 130, 'years',
            0, 0.04, NULL, 'ng/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Troponin-I=ng/mL|0|0.04',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-108' AND name = 'Urea' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-108', 'Urea', 'Urea',
            'Both', 0, 130, 'years',
            15, 40, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Urea=mg/dL|15|40',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-109' AND name = 'Uric Acid' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-109', 'Uric Acid', 'Uric Acid',
            'Male', 0, 130, 'years',
            3.5, 7.2, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Uric Acid=mg/dL|3.5|7.2|2.6|6',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-109' AND name = 'Uric Acid' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-109', 'Uric Acid', 'Uric Acid',
            'Female', 0, 130, 'years',
            2.6, 6, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Uric Acid=mg/dL|3.5|7.2|2.6|6',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-110' AND name = 'Result' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-110', 'Urine Culture', 'Result',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'Result=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-111' AND name = 'Colour' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-111', 'Urine Routine', 'Colour',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'Colour=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-111' AND name = 'Appearance' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-111', 'Urine Routine', 'Appearance',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'Appearance=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-111' AND name = 'Albumin' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-111', 'Urine Routine', 'Albumin',
            'Both', 0, 130, 'years',
            3.5, 5.2, NULL, 'g/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Albumin=g/dL|3.5|5.2',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-111' AND name = 'Sugar' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-111', 'Urine Routine', 'Sugar',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'Sugar=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-111' AND name = 'pH' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-111', 'Urine Routine', 'pH',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'pH=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-111' AND name = 'Pus Cells' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-111', 'Urine Routine', 'Pus Cells',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'Pus Cells=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-111' AND name = 'RBCs' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-111', 'Urine Routine', 'RBCs',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'RBCs=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-111' AND name = 'Epithelial Cells' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-111', 'Urine Routine', 'Epithelial Cells',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'Epithelial Cells=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-112' AND name = 'VDRL' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-112', 'VDRL', 'VDRL',
            'Both', 0, 130, 'years',
            NULL, NULL, 'Negative', '',
            'Serum / Whole Blood', 'Rapid Diagnostic / Immunoassay / Microscopy', 'Not required unless clinically ordered',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 15: fl; Line 17: refT)', 'VDRL=q (refT: Negative)',
            1, '2026-11-23', false, false,
            'APPROVED_QUALITATIVE_REFERENCE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-113' AND name = 'VLDL' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-113', 'VLDL', 'VLDL',
            'Both', 0, 130, 'years',
            5, 40, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'VLDL=mg/dL|5|40',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-114' AND name = 'Vitamin A' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-114', 'Vitamin A', 'Vitamin A',
            'Both', 0, 130, 'years',
            20, 60, NULL, 'µg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Vitamin A=µg/dL|20|60',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-115' AND name = 'Vitamin B12' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-115', 'Vitamin B12', 'Vitamin B12',
            'Both', 0, 130, 'years',
            200, 900, NULL, 'pg/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Vitamin B12=pg/mL|200|900',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-116' AND name = 'Vitamin C' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-116', 'Vitamin C', 'Vitamin C',
            'Both', 0, 130, 'years',
            0.4, 2, NULL, 'mg/dL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Vitamin C=mg/dL|0.4|2',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-117' AND name = 'Vitamin D (25-OH)' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-117', 'Vitamin D (25-OH)', 'Vitamin D (25-OH)',
            'Both', 0, 130, 'years',
            30, 100, NULL, 'ng/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Vitamin D (25-OH)=ng/mL|30|100',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-118' AND name = 'Vitamin D (25-OH)' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-118', 'Vitamin D + B12 Panel', 'Vitamin D (25-OH)',
            'Both', 0, 130, 'years',
            30, 100, NULL, 'ng/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Vitamin D (25-OH)=ng/mL|30|100',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-118' AND name = 'Vitamin B12' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-118', 'Vitamin D + B12 Panel', 'Vitamin B12',
            'Both', 0, 130, 'years',
            200, 900, NULL, 'pg/mL',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Vitamin B12=pg/mL|200|900',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-119' AND name = 'Vitamin E' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-119', 'Vitamin E', 'Vitamin E',
            'Both', 0, 130, 'years',
            5.5, 17, NULL, 'mg/L',
            'Serum / Whole Blood', 'Automated Clinical Chemistry / Hematology Analyzer', 'Routine non-fasting',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10: S; Line 14: rg)', 'Vitamin E=mg/L|5.5|17',
            1, '2026-11-23', false, false,
            'APPROVED_NUMERIC_RANGE'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-120' AND name = 'S.Typhi O' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-120', 'Widal', 'S.Typhi O',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'S.Typhi O=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-120' AND name = 'S.Typhi H' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-120', 'Widal', 'S.Typhi H',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'S.Typhi H=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-120' AND name = 'S.Paratyphi AH' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-120', 'Widal', 'S.Paratyphi AH',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'S.Paratyphi AH=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = 'LEG-120' AND name = 'S.Paratyphi BH' LIMIT 1;
    IF v_param_id IS NOT NULL THEN
        INSERT INTO public.reference_intervals (
            parameter_id, test_code, test_name, parameter_name,
            gender, age_min_years, age_max_years, age_unit,
            low_value, high_value, qualitative_normal, unit,
            specimen_type, method_instrument, fasting_requirement,
            source_file, source_location, original_source_wording,
            reference_version, extraction_date, is_verified, is_approved,
            governance_state
        ) VALUES (
            v_param_id, 'LEG-120', 'Widal', 'S.Paratyphi BH',
            'Both', 0, 130, 'years',
            NULL, NULL, NULL, '',
            'Clinical Specimen', 'Standard Laboratory Microscopy / Observation', 'As indicated by clinical protocol',
            'legacy_reference/BIO_HI_TECH_Lab_App/index.html', 'index.html (Line 10, Specification String S)', 'S.Paratyphi BH=t',
            1, '2026-11-23', false, false,
            'NOT_APPLICABLE_TO_NUMERIC_COMPARISON'
        );
    END IF;

END $$;
