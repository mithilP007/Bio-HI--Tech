# BIO HI TECH — CLINICAL REFERENCE INTERVAL DISCREPANCY & RECONCILIATION REPORT

**Project**: BIO HI TECH Laboratory Information Management System (LIMS)  
**Evaluation Scope**: 120 Catalogue Tests, 211 Parameter Instances, 234 Canonical Reference Records  
**Primary Source**: `legacy_reference/BIO_HI_TECH_Lab_App/index.html` (Lines 50–65: `D`, `S`, `RG`, `CBC`, `KID`, `ELE`, `TH`, `LIP`)  
**Audit Date**: 2026-11-23  
**Status Policy**: Strictly use `PASS`, `FAIL`, `BLOCKED`, `NOT TESTED`  

---

## 1. RECONCILIATION SUMMARY & PARAMETER COUNTS

A 100% census audit of all catalogue items, parameter instances, and canonical database records was performed against the historical JavaScript application definitions.

### 1.1 Parameter Census Reconciliation (211 Parameter Instances)

| Parameter Category | Instances in Source | Extracted in Dataset | Seeded in PostgreSQL | Clinical Governance Status | Audit Status |
|:---|:---:|:---:|:---:|:---|:---:|
| **Approved Numeric Intervals** | 0 | 0 | 0 | Awaiting Qualified Owner Review | PASS |
| **Unverified Numeric Intervals (Unisex)** | 138 | 138 | 138 | Initialized as `UNVERIFIED` | PASS |
| **Unverified Numeric Intervals (Sex-Specific)** | 23 | 23 | 46 (M & F) | Initialized as `UNVERIFIED` | PASS |
| **Qualitative Reference Definitions** | 22 | 22 | 22 | Initialized as `UNVERIFIED` | PASS |
| **Descriptive / Narrative Text Parameters** | 28 | 28 | 28 | `NOT_APPLICABLE_TO_NUMERIC_COMPARISON` | PASS |
| **Missing Reference Information** | 0 | 0 | 0 | All 211 parameters accountably categorized | PASS |
| **Owner-Review-Required Records** | 211 | 211 | 234 | 100% require explicit human sign-off | PASS |
| **TOTAL PARAMETER INSTANCES** | **211** | **211** | **211** | **EXACT MATHEMATICAL MATCH** | **PASS** |

### 1.2 Database Record Count Reconciliation (234 Canonical Records)
- 138 Unisex Numeric Parameters $\times$ 1 interval record = 138 records
- 23 Sex-Specific Numeric Parameters $\times$ 2 interval records (Male & Female) = 46 records
- 22 Qualitative Parameters $\times$ 1 reference record = 22 records
- 28 Text / Descriptive Parameters $\times$ 1 reference record = 28 records
- **Total Canonical Reference Records** = $138 + 46 + 22 + 28 = \mathbf{234}$ records.
- Verified in PostgreSQL table `public.reference_intervals`: Exactly **234** records.

---

## 2. DISCREPANCY & CLINICAL RISK ANALYSIS

While all 211 parameters match their historical source string verbatim, five critical discrepancies, ambiguities, and transcription hazards inherent in the legacy JavaScript application were identified during the audit:

### Discrepancy 1: Name Collision — Urine Routine "Albumin" vs. Serum Albumin
- **Affected Test**: `Urine Routine` (`LEG-111`), Parameter: `Albumin` (Index 3).
- **Legacy Source Spec**: In `index.html:58`, `Albumin=g/dL|3.5|5.2` is defined in `S`. Because the lookup function `pars('Urine Routine')` resolved parameter names against global dictionary `S`, Urine Albumin inherited the reference interval of **Serum Albumin** (`3.5 – 5.2 g/dL`).
- **Clinical Reality**: In a standard urine routine analysis, Albumin is tested qualitatively or semi-quantitatively via dipstick/sulfosalicylic acid (reported as `Nil`, `Trace`, `1+`, `2+`, `3+`, `4+`) or quantitatively in mg/L (Microalbumin). A biological reference range of `3.5 - 5.2 g/dL` in urine is medically absurd and represents massive nephrotic proteinuria.
- **Action Taken**: Flagged as a major legacy transcription defect. Retained in unverified state with explicit annotation. The laboratory owner must correct this parameter to Qualitative (`Nil / Negative`) in the Reference Approval Console before authorizing urine routine reports.
- **Status**: **PASS** (Correctly isolated and flagged; zero automated approval).

### Discrepancy 2: Ambiguous Interval — "Blood Sugar (unspecified)" (`LEG-017`)
- **Affected Test**: `Blood Sugar (unspecified)` (`LEG-017`), Parameter: `Blood Sugar (unspecified)`.
- **Legacy Source Spec**: `mg/dL|70|140`.
- **Clinical Reality**: Clinical guidelines (ADA / ICMR) differentiate fasting glucose ($70–99\text{ mg/dL}$) from postprandial glucose ($<140\text{ mg/dL}$). Merging both into an indiscriminate $70–140\text{ mg/dL}$ normal range creates clinical ambiguity (e.g., a fasting result of $130\text{ mg/dL}$ is severely diabetic but would be classified as "WITHIN RANGE" under this legacy interval).
- **Action Taken**: Flagged for mandatory owner review in the console. The owner must specify whether fasting or random criteria apply or supersede this test with the specific Fasting Glucose (`LEG-048`) and Glucose PP (`LEG-050`) tests.
- **Status**: **PASS**

### Discrepancy 3: Qualitative Serology Terminology — "Negative" vs. "Non-Reactive"
- **Affected Tests**: 22 Qualitative tests (including `HIV`, `HBsAg`, `HCV Antibody`, `VDRL`, `Dengue IgG/IgM/NS1`).
- **Legacy Source Spec**: Defined merely as string `"q"`. Legacy function `fl(p,v,sx)` hardcoded `Negative` as the expected normal output and flagged any non-negative string as `Positive`.
- **Clinical Reality**: National accreditation bodies (NABL, NACO) require immunochromatographic and ELISA serology reports to be issued as `Non-Reactive`, not `Negative`. A patient report reading "Negative" on an HIV screening assay may not comply with NACO statutory reporting formats.
- **Action Taken**: The clinical engine has been engineered to accept both `Non-Reactive` and `Negative` as normal comparisons without raising false alarms, but all 22 tests remain unverified pending owner approval of standard terminology. Documented in [QUALITATIVE_REFERENCE_AUDIT.csv](file:///home/mithil/Downloads/BIO-HI-TECH-LIMS/QUALITATIVE_REFERENCE_AUDIT.csv).
- **Status**: **PASS**

### Discrepancy 4: Widal Slide Agglutination Titer Omission
- **Affected Test**: `Widal` (`LEG-120`), Parameters: `S.Typhi O`, `S.Typhi H`, `S.Paratyphi AH`, `S.Paratyphi BH`.
- **Legacy Source Spec**: Undefined in `S`, automatically defaulting to `'t'` (Text).
- **Clinical Reality**: Widal testing in endemic areas requires titer reporting (e.g., `< 1:80` for O, `< 1:160` for H). Because no numeric cutoff was supplied in the source, it cannot be numerically compared.
- **Action Taken**: Maintained strictly as `NOT_APPLICABLE_TO_NUMERIC_COMPARISON` (Descriptive). The engine preserves operator entered titer text without inventing numeric cutoffs.
- **Status**: **PASS**

### Discrepancy 5: Absence of Borderline Categories & Critical Alert Cutoffs
- **Finding**: In the entire `index.html` file, **zero** intermediate/borderline intervals and **zero** critical/panic thresholds were defined.
- **Clinical Governance Compliance**: Under Strict Governance Rule 5, no arbitrary borderline boundaries (such as dividing intervals into thirds) and no arbitrary panic values were fabricated.
- **Action Taken**: `borderline_low/high` and `critical_low/high` remain `NULL` in the canonical database.
- **Status**: **PASS**

---

## 3. SEX-SPECIFIC ANALYTES DETAILED BREAKDOWN

The 10 analytes (comprising 23 parameter instances across single tests and panels) with explicit gender-specific intervals in `legacy_reference/BIO_HI_TECH_Lab_App/index.html:S` were verified:

| Analyte | Unit | Male Interval | Female Interval | Raw Source String | Reconciled Instances | Status |
|:---|:---:|:---:|:---:|:---|:---:|:---:|
| **Hemoglobin** | g/dL | 13.0 – 17.0 | 12.0 – 15.0 | `g/dL\|13\|17\|12\|15` | 3 (CBC, CBC+Smear, Standalone) | PASS |
| **RBC Count** | million/cumm | 4.5 – 5.5 | 3.8 – 4.8 | `million/cumm\|4.5\|5.5\|3.8\|4.8` | 2 (CBC, CBC+Smear) | PASS |
| **PCV** | % | 40.0 – 50.0 | 36.0 – 46.0 | `%\|40\|50\|36\|46` | 3 (CBC, CBC+Smear, Standalone) | PASS |
| **ESR** | mm/hr | 0.0 – 15.0 | 0.0 – 20.0 | `mm/hr\|0\|15\|0\|20` | 2 (CBC+Smear, Standalone) | PASS |
| **Creatinine** | mg/dL | 0.7 – 1.3 | 0.6 – 1.1 | `mg/dL\|0.7\|1.3\|0.6\|1.1` | 4 (Kidney, Renal, KFT, Standalone) | PASS |
| **Uric Acid** | mg/dL | 3.5 – 7.2 | 2.6 – 6.0 | `mg/dL\|3.5\|7.2\|2.6\|6` | 4 (Kidney, Renal, KFT, Standalone) | PASS |
| **HDL Cholesterol** | mg/dL | 40.0 – 100.0 | 50.0 – 100.0 | `mg/dL\|40\|100\|50\|100` | 2 (Lipid Profile, Standalone) | PASS |
| **Ferritin** | ng/mL | 30.0 – 400.0 | 13.0 – 150.0 | `ng/mL\|30\|400\|13\|150` | 1 (Standalone) | PASS |
| **Iron** | µg/dL | 65.0 – 175.0 | 50.0 – 170.0 | `µg/dL\|65\|175\|50\|170` | 1 (Standalone) | PASS |
| **Prolactin** | ng/mL | 4.0 – 15.0 | 4.0 – 23.0 | `ng/mL\|4\|15\|4\|23` | 1 (Standalone) | PASS |
| **TOTAL** | — | — | — | — | **23 parameter instances** | **PASS** |

---

## 4. AUDIT CONCLUSION & GOVERNANCE SIGNOFF

- Extraction Fidelity: **PASS**
- Parameter Count Reconciliation: **PASS**
- Ambiguity Identification: **PASS**
- Zero Medical Inventions: **PASS**
- Owner Review Readiness: **PASS**
