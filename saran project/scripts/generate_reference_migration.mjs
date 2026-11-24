import fs from 'fs';
import path from 'path';

import dataset from '../data/clinical/reference-intervals.json' with { type: 'json' };

const intervals = dataset.intervals;

let sql = `-- ==============================================================================
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

CREATE POLICY \"audit_owner_select\" ON public.reference_interval_audit
    FOR SELECT TO authenticated USING (public.is_active_owner());

CREATE POLICY \"audit_owner_insert\" ON public.reference_interval_audit
    FOR INSERT TO authenticated WITH CHECK (public.is_active_owner());

-- 4. POPULATE CANONICAL REFERENCE INTERVALS (234 records covering 211 parameter instances)
DO $$
DECLARE
    v_param_id UUID;
BEGIN
`;

intervals.forEach((inv, idx) => {
  const esc = (str) => (str ? str.replace(/'/g, "''") : '');
  const lowVal = inv.lowerLimit !== null ? inv.lowerLimit : 'NULL';
  const highVal = inv.upperLimit !== null ? inv.upperLimit : 'NULL';
  const qual = inv.qualitativeExpected ? `'${esc(inv.qualitativeExpected)}'` : 'NULL';
  const sex = inv.applicableSex;

  sql += `
    SELECT id INTO v_param_id FROM public.test_parameters WHERE test_code = '${esc(inv.testId)}' AND name = '${esc(inv.parameterName)}' LIMIT 1;
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
            v_param_id, '${esc(inv.testId)}', '${esc(inv.testName)}', '${esc(inv.parameterName)}',
            '${sex}', ${inv.ageMin}, ${inv.ageMax}, '${esc(inv.ageUnit)}',
            ${lowVal}, ${highVal}, ${qual}, '${esc(inv.units)}',
            '${esc(inv.specimenType)}', '${esc(inv.methodInstrument)}', '${esc(inv.fastingRequirement)}',
            '${esc(inv.sourceFile)}', '${esc(inv.sourceLocation)}', '${esc(inv.originalSourceWording)}',
            ${inv.referenceVersion}, '${inv.extractionDate}', false, false,
            '${esc(inv.clinicalGovernanceState)}'
        );
    END IF;
`;
});

sql += `
END $$;
`;

const migrationPath = '/home/mithil/Downloads/BIO-HI-TECH-LIMS/saran project/supabase/migrations/20261123000003_clinical_reference_intervals.sql';
fs.writeFileSync(migrationPath, sql, 'utf8');
console.log('Saved migration to:', migrationPath);
console.log('Migration size bytes:', fs.statSync(migrationPath).size);
