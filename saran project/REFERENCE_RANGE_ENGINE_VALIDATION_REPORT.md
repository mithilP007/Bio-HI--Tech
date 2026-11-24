# BIO HI TECH — CLINICAL REFERENCE RANGE ENGINE VALIDATION REPORT

**Project**: BIO HI TECH Laboratory Information Management System (LIMS)  
**Component**: Clinical Reference Matching & Deterministic Result Interpretation Engine (`lib/clinical-engine.ts`)  
**Evaluation Date**: 2026-11-23  
**Status Policy**: Strictly use `PASS`, `FAIL`, `BLOCKED`, `NOT TESTED`  

---

## 1. ARCHITECTURE & CLASSIFICATION LOGIC

The automatic result interpretation engine is implemented as a deterministic TypeScript/JavaScript module backed by the canonical PostgreSQL reference interval dataset (`public.reference_intervals` and `data/clinical/reference-intervals.json`). 

In strict adherence to clinical safety directives:
1. **Zero LLM or Generative AI Logic**: Result classification uses deterministic floating-point mathematical boundaries.
2. **Deterministic Interval Selection**: For any given test and analyte, the engine evaluates:
   - Test identifier (`test_id` / `test_code`)
   - Parameter identifier (`parameter_id` / `parameter_name`)
   - Patient age at sample collection (years/months) against `[age_min, age_max]`
   - Patient sex (`Male`, `Female`, or `Both`) against `applicable_sex`
   - Pregnancy status / trimester where applicable
   - Specimen type
   - Unit matching
3. **Boundary Mathematical Formulas**:
   For a valid numeric result $x$, approved lower reference limit $L$, and approved upper reference limit $U$:
   - If $x < L$: Flag = `LOW`
   - If $L \le x \le U$: Flag = `NORMAL` (Display: `WITHIN REFERENCE RANGE`)
   - If $x > U$: Flag = `HIGH`
4. **Borderline / Intermediate Handling**:
   - Only evaluated if explicit `borderline_low` or `borderline_high` are defined in the reference dataset. If absent, no intermediate category is inferred.
5. **Critical Threshold Handling**:
   - Only evaluated if explicit `critical_low` or `critical_high` are approved. If absent, results are never arbitrarily classified as critical.
6. **Governance Gating**:
   - When an interval is not yet approved (`is_verified = false` or `is_approved = false`), the classification displays with explicit clinical notice: `LOW (UNVERIFIED)`, `HIGH (UNVERIFIED)`, `WITHIN RANGE (UNVERIFIED)`, or `UNVERIFIED`.
   - If units do not match or required patient context is missing, numeric comparison is blocked and flagged as `UNAVAILABLE`.

---

## 2. AUTOMATED TEST SUITE & BOUNDARY VERIFICATION

The clinical interpretation engine was submitted to comprehensive test harness executions via `scripts/test_clinical_interpretation.mjs` (22 test assertions) and `scripts/test_decoder.mjs` (7 test assertions).

### 2.1 Boundary & Mathematical Test Cases

| Case ID | Test Scenario | Input Value | Reference Interval | Expected Interpretation | Result | Status |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| TC-01 | Value immediately below lower limit | `11.9` | `12.0 – 15.0 g/dL` | LOW | LOW | PASS |
| TC-02 | Value exactly at lower limit | `12.0` | `12.0 – 15.0 g/dL` | WITHIN REFERENCE RANGE | WITHIN REFERENCE RANGE | PASS |
| TC-03 | Value inside interval (median) | `13.5` | `12.0 – 15.0 g/dL` | WITHIN REFERENCE RANGE | WITHIN REFERENCE RANGE | PASS |
| TC-04 | Value exactly at upper limit | `15.0` | `12.0 – 15.0 g/dL` | WITHIN REFERENCE RANGE | WITHIN REFERENCE RANGE | PASS |
| TC-05 | Value immediately above upper limit | `15.1` | `12.0 – 15.0 g/dL` | HIGH | HIGH | PASS |
| TC-06 | Floating-point decimal precision | `1.25` | `0.6 – 1.2 mg/dL` | HIGH | HIGH | PASS |
| TC-07 | Invalid non-numeric input string | `"abc"` | `70 – 140 mg/dL` | NOT CLASSIFIABLE | NOT CLASSIFIABLE | PASS |
| TC-08 | Missing / empty measurement | `""` | `70 – 140 mg/dL` | Pending | Pending | PASS |
| TC-09 | Mismatched measurement units | `100` (`mg/L`) | `mg/dL` | Comparison Blocked / UNAVAILABLE | UNAVAILABLE | PASS |
| TC-10 | Missing patient sex context on sex-specific test | `14.0` | Hemoglobin (Male: 13-17, Female: 12-15) | Ambiguous / UNAVAILABLE | UNAVAILABLE | PASS |
| TC-11 | Age-specific interval selection | `100` (Age 35) | Age-banded interval | Matched adult range | Adult range selected | PASS |
| TC-12a | Sex-specific matching (Male) | `12.5` (Male) | Male: 13-17 g/dL | LOW (below 13.0) | LOW | PASS |
| TC-12b | Sex-specific matching (Female) | `12.5` (Female) | Female: 12-15 g/dL | WITHIN REFERENCE RANGE | WITHIN REFERENCE RANGE | PASS |
| TC-13 | Approved Borderline category handling | `145` | Defined Borderline: 140-159 mg/dL | BORDERLINE | BORDERLINE | PASS |
| TC-14 | Approved Critical threshold alert | `2.1` | Defined Critical Low: < 2.5 mmol/L | CRITICAL LOW | CRITICAL LOW | PASS |

### 2.2 Qualitative & Non-Numeric Analytes

| Case ID | Analyte / Test | Input Value | Expected Reference | Result Flag | Status |
|:---:|:---|:---:|:---:|:---:|:---:|
| TC-15 | VDRL / RPR | `"Non-Reactive"` | `"Negative"` / `"Non-Reactive"` | Within Range / Negative | PASS |
| TC-16 | HIV 1 & 2 Rapid | `"Reactive"` | `"Negative"` / `"Non-Reactive"` | Abnormal / High Alert | PASS |
| TC-17 | Widal Test (Slide Agglutination) | `"Negative"` | `"Negative"` | Within Range / Negative | PASS |
| TC-18 | Blood Culture & Sensitivity | `"No growth after 48 hrs"` | Descriptive narrative observation | Text preserved / No numeric flag | PASS |
| TC-19 | Urine Microscopy | `"Pus cells 2-4 / HPF"` | Microscopic observation | Text preserved / No numeric flag | PASS |
| TC-20 | Peripheral Blood Smear | `"Normocytic Normochromic"` | Morphological report | Text preserved / No numeric flag | PASS |

### 2.3 Governance & Safety Verification

| Case ID | Verification Scenario | Condition | Result | Status |
|:---:|:---|:---|:---|:---:|
| TC-21 | Unverified reference interval safety banner | Interval has `is_verified: false` | Rendered with `(UNVERIFIED)` tag | PASS |
| TC-22 | Verified reference interval clean badge | Interval has `is_verified: true, is_approved: true` | Clean badge without unverified notice | PASS |
| TC-23 | Catalogue audit across all 211 parameters | Match coverage across all catalogue entries | 100% (211/211) catalogued | PASS |

---

## 3. SUMMARY OF TEST EXECUTION RESULTS

- Total Test Cases Executed: 23
- Total Passed: 23
- Total Failed: 0
- Total Blocked: 0
- Total Not Tested: 0

**Overall Engine Validation Result**: **PASS**
