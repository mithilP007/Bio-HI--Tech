# BIO HI TECH LIMS — LEGACY APPLICATION MIGRATION MAP

**Audit Date**: November 21, 2026  
**Source File**: [`legacy_reference/BIO_HI_TECH_Lab_App/index.html`](file:///home/mithil/Downloads/BIO-HI-TECH-LIMS/legacy_reference/BIO_HI_TECH_Lab_App/index.html)  
**Source Characteristics**: Standalone HTML (185,501 bytes), 2 `<script>` blocks (175,717 bytes of JavaScript logic and embedded assets).

---

## 1. Executive Migration Summary

The original BIO HI TECH laboratory HTML application represents the clinical and operational baseline for this LIMS project. It contains:
1. **120 preconfigured laboratory test entries** in array `D`, each with calibrated normal prices and discount prices (120/120 price pairs verified with 0 mismatches).
2. **120 parameter specifications** in string/object `S` (0 duplicate keys), defining units, numeric reference ranges (including sex-specific male/female ranges), qualitative test indicators (`=q`), and text fields (`=t`).
3. **5 intermediate panel arrays** on line 59: `CBC`, `KID`, `ELE`, `TH`, and `LIP`.
4. **22 multi-parameter panels** in object `RG` mapping comprehensive profiles (CBC, LFT, RFT, Lipid, Thyroid, Electrolytes, Widal, Stool, Urine, etc.).
5. **51 clinical interpretation notes** in array `NU` (indices 0 to 50), mapped to all 120 tests via object `NT` (0 unmapped tests, 0 orphaned notes).
6. **Department categorization regex** in array `DP` dynamically sorting tests at runtime into 6 clinical departments (inferred at runtime, not explicit raw table attributes).
7. **Embedded visual assets**:
   - `LH`: Base64 JPEG (104,276 characters) of the official BIO HI TECH laboratory letterhead.
   - `SGA`: Base64 PNG (21,548 characters) of Signature A.
   - `SGB`: Base64 PNG (19,104 characters) of Signature B.
   - Laboratory Technologist credit: `Mr. J. SRIDHAR. M.Sc, [MLT], DMLT, DXRT, DHI`.
8. **Offline Barcode Engine**: Embedded Code 128 SVG barcode generator (`c128`), physically verified with scanner decoders.
9. **QR Code Engine**: SVG QR code generator (`qrs`) targeting verification links without patient PII.

### Migration Status (Milestone 2.1 Completed):
All 120 legacy tests and parameter profiles have been extracted into canonical directory `saran project/data/legacy/` and integrated into the frontend via `lib/catalogue-data.ts` and `lib/demo-data.tsx`.
In accordance with laboratory compliance guidelines, **all legacy reference intervals are explicitly marked as "Range not verified" pending formal clinical review and sign-off by qualified clinical laboratory staff.** All 51 legacy interpretation notes are labelled as "Unverified legacy advisory content". Both recovered legacy signature images are preserved as historical facsimiles with explicit "Pending Owner Approval" status and non-cryptographic disclaimers.

---

## 2. Complete Inventory of the 120 Legacy Laboratory Tests

Below is the verified extraction of all 120 test entries from array `D` in the legacy application:

| # | Test Name | Normal Price (₹) | Discount Price (₹) | Department (`DP` Regex) | Parameter Profile (`RG` / `S`) |
| :-: | :--- | :-: | :-: | :--- | :--- |
| 1 | AMH | 2,150 | 1,935 | BIOCHEMISTRY | Numeric (`ng/mL`) |
| 2 | ANA | 750 | 675 | SEROLOGY / IMMUNOLOGY | Qualitative (`q`) |
| 3 | ANA (IFA) | 900 | 810 | SEROLOGY / IMMUNOLOGY | Qualitative (`q`) |
| 4 | ANC Profile | 1,480 | 1,330 | HAEMATOLOGY | Panel (`ANC`) |
| 5 | APTT | 380 | 340 | HAEMATOLOGY | Numeric (`seconds`) |
| 6 | ASO | 300 | 270 | SEROLOGY / IMMUNOLOGY | Qualitative (`q`) / Titre |
| 7 | Anti-CCP | 1,350 | 1,215 | SEROLOGY / IMMUNOLOGY | Numeric (`U/mL`) |
| 8 | Anti-Phospholipid Antibody | 900 | 810 | SEROLOGY / IMMUNOLOGY | Qualitative (`q`) |
| 9 | Anti-TPO | 800 | 720 | SEROLOGY / IMMUNOLOGY | Numeric (`IU/mL`) |
| 10 | Anti-Thyroglobulin Antibody | 800 | 720 | SEROLOGY / IMMUNOLOGY | Numeric (`IU/mL`) |
| 11 | Anti-Thyroid Microsomal Antibody | 1,500 | 1,350 | SEROLOGY / IMMUNOLOGY | Qualitative (`q`) |
| 12 | Bicarbonate | 140 | 125 | BIOCHEMISTRY | Numeric (`mmol/L`) |
| 13 | Bilirubin | 100 | 90 | BIOCHEMISTRY | Panel: Total & Direct |
| 14 | Bleeding / Clotting Time | 50 | 45 | HAEMATOLOGY | Numeric (`min/sec`) |
| 15 | Blood Culture | 400 | 360 | MICROBIOLOGY | Text / Qualitative |
| 16 | Blood Group | 60 | 55 | HAEMATOLOGY | Text (`Blood Group & Rh`) |
| 17 | Blood Sugar (unspecified) | 50 | 45 | BIOCHEMISTRY | Numeric (`mg/dL`) |
| 18 | Blood Urea Nitrogen (BUN) | 80 | 70 | BIOCHEMISTRY | Numeric (`mg/dL`) |
| 19 | CA 15-3 | 750 | 675 | BIOCHEMISTRY | Numeric (`U/mL`) |
| 20 | CA 19-9 | 750 | 675 | BIOCHEMISTRY | Numeric (`U/mL`) |
| 21 | CA-125 | 680 | 610 | BIOCHEMISTRY | Numeric (`U/mL`) |
| 22 | CBC / Hemogram | 280 | 250 | HAEMATOLOGY | Panel: 13 parameters |
| 23 | CBC with Peripheral Smear & ESR | 420 | 380 | HAEMATOLOGY | Panel: 15 parameters |
| 24 | CK-MB | 580 | 520 | BIOCHEMISTRY | Numeric (`U/L`) |
| 25 | CPK | 500 | 450 | BIOCHEMISTRY | Numeric (`U/L`) |
| 26 | CRP | 360 | 325 | SEROLOGY / IMMUNOLOGY | Qualitative / Numeric |
| 27 | CSF Analysis | 450 | 405 | CLINICAL PATHOLOGY | Multi-parameter Panel |
| 28 | Calcium | 140 | 125 | BIOCHEMISTRY | Numeric (`mg/dL`) |
| 29 | Chloride | 120 | 110 | BIOCHEMISTRY | Numeric (`mmol/L`) |
| 30 | Cholesterol | 100 | 90 | BIOCHEMISTRY | Numeric (`mg/dL`) |
| 31 | Cortisol | 660 | 595 | BIOCHEMISTRY | Numeric (`µg/dL`) |
| 32 | Creatinine | 80 | 70 | BIOCHEMISTRY | Numeric (`mg/dL`) |
| 33 | Cryptococcal Antigen | 2,500 | 2,250 | MICROBIOLOGY | Qualitative (`q`) |
| 34 | DHEA | 650 | 585 | BIOCHEMISTRY | Numeric (`µg/dL`) |
| 35 | Dengue IgG | 980 | 880 | SEROLOGY / IMMUNOLOGY | Qualitative (`q`) |
| 36 | Dengue IgM | 1,000 | 900 | SEROLOGY / IMMUNOLOGY | Qualitative (`q`) |
| 37 | Dengue NS1 Antigen | 600 | 540 | SEROLOGY / IMMUNOLOGY | Qualitative (`q`) |
| 38 | ESR | 60 | 55 | HAEMATOLOGY | Numeric (`mm/hr`) |
| 39 | Electrolytes | 600 | 540 | BIOCHEMISTRY | Panel: Na, K, Cl |
| 40 | Electrolytes (Na/K/Cl) | 400 | 360 | BIOCHEMISTRY | Panel: Na, K, Cl |
| 41 | Estradiol (E2) | 500 | 450 | BIOCHEMISTRY | Numeric (`pg/mL`) |
| 42 | FSH | 350 | 315 | BIOCHEMISTRY | Numeric (`mIU/mL`) |
| 43 | Ferritin | 680 | 610 | BIOCHEMISTRY | Numeric (`ng/mL`) |
| 44 | Fever Panel Comprehensive | 2,000 | 1,800 | SEROLOGY / IMMUNOLOGY | Multi-parameter Panel |
| 45 | Folic Acid | 800 | 720 | BIOCHEMISTRY | Numeric (`ng/mL`) |
| 46 | Free Thyroid Panel (FT3, FT4, TSH) | 900 | 810 | BIOCHEMISTRY | Panel: 3 parameters |
| 47 | G6PD | 600 | 540 | HAEMATOLOGY | Numeric / Qualitative |
| 48 | GTT | 420 | 380 | BIOCHEMISTRY | Panel: Fasting, 1h, 2h |
| 49 | Gamma GT | 500 | 450 | BIOCHEMISTRY | Numeric (`U/L`) |
| 50 | Globulin | 200 | 180 | BIOCHEMISTRY | Numeric (`g/dL`) |
| 51 | HBsAg | 200 | 180 | SEROLOGY / IMMUNOLOGY | Qualitative (`q`) |
| 52 | HCV Antibody | 500 | 450 | SEROLOGY / IMMUNOLOGY | Qualitative (`q`) |
| 53 | HDL Cholesterol | 180 | 160 | BIOCHEMISTRY | Numeric (`mg/dL`) |
| 54 | HGH | 550 | 495 | BIOCHEMISTRY | Numeric (`ng/mL`) |
| 55 | HIV | 250 | 225 | SEROLOGY / IMMUNOLOGY | Qualitative (`q`) |
| 56 | Hb Variant Analysis | 1,040 | 935 | HAEMATOLOGY | Panel / HPLC |
| 57 | HbA1c | 440 | 395 | BIOCHEMISTRY | Numeric (`%`) |
| 58 | Hemoglobin | 50 | 45 | HAEMATOLOGY | Numeric (`g/dL`) |
| 59 | Insulin | 620 | 560 | BIOCHEMISTRY | Numeric (`µIU/mL`) |
| 60 | Iron | 300 | 270 | BIOCHEMISTRY | Numeric (`µg/dL`) |
| 61 | Kidney / Renal Function Profile | 660 | 595 | BIOCHEMISTRY | Panel: 6 parameters |
| 62 | Kidney Profile | 280 | 250 | BIOCHEMISTRY | Panel: 6 parameters |
| 63 | LDH | 350 | 315 | BIOCHEMISTRY | Numeric (`U/L`) |
| 64 | LE Cells | 550 | 495 | HAEMATOLOGY | Qualitative (`q`) |
| 65 | LH | 450 | 405 | BIOCHEMISTRY | Numeric (`mIU/mL`) |
| 66 | Lipid Profile | 450 | 405 | BIOCHEMISTRY | Panel: 6 parameters |
| 67 | Lipoprotein(a) | 800 | 720 | BIOCHEMISTRY | Numeric (`mg/dL`) |
| 68 | Lithium | 550 | 495 | BIOCHEMISTRY | Numeric (`mmol/L`) |
| 69 | Liver Function Test (LFT) | 500 | 450 | BIOCHEMISTRY | Panel: 10 parameters |
| 70 | Lupus Anticoagulant | 1,300 | 1,170 | HAEMATOLOGY | Qualitative (`q`) |
| 71 | Magnesium | 280 | 250 | BIOCHEMISTRY | Numeric (`mg/dL`) |
| 72 | Malaria Parasite | 180 | 160 | HAEMATOLOGY | Qualitative (`q`) / Smear |
| 73 | Microalbumin | 250 | 225 | CLINICAL PATHOLOGY | Numeric (`mg/L`) |
| 74 | Microfilaria | 130 | 115 | HAEMATOLOGY | Qualitative (`q`) |
| 75 | PCV | 100 | 90 | HAEMATOLOGY | Numeric (`%`) |
| 76 | PSA | 760 | 685 | BIOCHEMISTRY | Numeric (`ng/mL`) |
| 77 | PT / Prothrombin Time | 180 | 160 | HAEMATOLOGY | Numeric: Time & INR |
| 78 | Phosphorus | 180 | 160 | BIOCHEMISTRY | Numeric (`mg/dL`) |
| 79 | Platelet Count | 100 | 90 | HAEMATOLOGY | Numeric (`lakh/cumm`) |
| 80 | Potassium | 150 | 135 | BIOCHEMISTRY | Numeric (`mmol/L`) |
| 81 | Pregnancy Test | 150 | 135 | CLINICAL PATHOLOGY | Qualitative (`q`) |
| 82 | Progesterone | 420 | 380 | BIOCHEMISTRY | Numeric (`ng/mL`) |
| 83 | Prolactin | 450 | 405 | BIOCHEMISTRY | Numeric (`ng/mL`) |
| 84 | Protein | 150 | 135 | BIOCHEMISTRY | Numeric (`g/dL`) |
| 85 | Protein / Creatinine Ratio | 160 | 145 | CLINICAL PATHOLOGY | Ratio |
| 86 | Renal Profile | 250 | 225 | BIOCHEMISTRY | Panel: 6 parameters |
| 87 | Reticulocyte Count | 100 | 90 | HAEMATOLOGY | Numeric (`%`) |
| 88 | Rheumatoid Factor (RF) | 270 | 245 | SEROLOGY / IMMUNOLOGY | Qualitative / Numeric |
| 89 | Rubella | 900 | 810 | SEROLOGY / IMMUNOLOGY | Qualitative (`q`) |
| 90 | SGOT / AST | 120 | 110 | BIOCHEMISTRY | Numeric (`U/L`) |
| 91 | SGPT / ALT | 120 | 110 | BIOCHEMISTRY | Numeric (`U/L`) |
| 92 | Semen Analysis | 250 | 225 | CLINICAL PATHOLOGY | Multi-parameter Panel |
| 93 | Sickling Test | 220 | 200 | HAEMATOLOGY | Qualitative (`q`) |
| 94 | Sodium | 150 | 135 | BIOCHEMISTRY | Numeric (`mmol/L`) |
| 95 | Sputum Culture | 800 | 720 | MICROBIOLOGY | Text / Culture |
| 96 | Sputum Routine | 100 | 90 | CLINICAL PATHOLOGY | Microscopic Examination |
| 97 | Stool Culture | 550 | 495 | MICROBIOLOGY | Text / Culture |
| 98 | Stool Routine | 100 | 90 | CLINICAL PATHOLOGY | Microscopic Examination |
| 99 | T3 | 300 | 270 | BIOCHEMISTRY | Numeric (`ng/mL`) |
| 100 | T4 | 300 | 270 | BIOCHEMISTRY | Numeric (`µg/dL`) |
| 101 | TSH | 220 | 200 | BIOCHEMISTRY | Numeric (`µIU/mL`) |
| 102 | Thyroglobulin | 1,250 | 1,125 | BIOCHEMISTRY | Numeric (`ng/mL`) |
| 103 | Thyroid Profile (T3, T4, TSH) | 550 | 495 | BIOCHEMISTRY | Panel: 3 parameters |
| 104 | Thyroid Profile (unspecified) | 450 | 405 | BIOCHEMISTRY | Panel |
| 105 | Total IgE | 900 | 810 | SEROLOGY / IMMUNOLOGY | Numeric (`IU/mL`) |
| 106 | Toxoplasma | 700 | 630 | SEROLOGY / IMMUNOLOGY | Qualitative (`q`) |
| 107 | Troponin-I | 1,050 | 945 | BIOCHEMISTRY | Numeric / Qualitative |
| 108 | Urea | 100 | 90 | BIOCHEMISTRY | Numeric (`mg/dL`) |
| 109 | Uric Acid | 120 | 110 | BIOCHEMISTRY | Numeric (`mg/dL`) |
| 110 | Urine Culture | 850 | 765 | MICROBIOLOGY | Text / Culture |
| 111 | Urine Routine | 80 | 70 | CLINICAL PATHOLOGY | Routine & Microscopy |
| 112 | VDRL | 140 | 125 | SEROLOGY / IMMUNOLOGY | Qualitative (`q`) |
| 113 | VLDL | 100 | 90 | BIOCHEMISTRY | Numeric (`mg/dL`) |
| 114 | Vitamin A | 2,500 | 2,250 | BIOCHEMISTRY | Numeric (`µg/dL`) |
| 115 | Vitamin B12 | 900 | 810 | BIOCHEMISTRY | Numeric (`pg/mL`) |
| 116 | Vitamin C | 2,500 | 2,250 | BIOCHEMISTRY | Numeric (`mg/dL`) |
| 117 | Vitamin D (25-OH) | 1,500 | 1,350 | BIOCHEMISTRY | Numeric (`ng/mL`) |
| 118 | Vitamin D + B12 Panel | 1,820 | 1,640 | BIOCHEMISTRY | Panel: 2 parameters |
| 119 | Vitamin E | 2,250 | 2,025 | BIOCHEMISTRY | Numeric (`mg/L`) |
| 120 | Widal | 140 | 125 | SEROLOGY / IMMUNOLOGY | Slide Agglutination Titres |

---

## 3. Department Classification Logic

In the legacy app, test grouping is performed dynamically by matching test names against the regex array `DP`:
```javascript
const DP = [
  [/culture|sensitivity/i, 'MICROBIOLOGY'],
  [/urine|stool|semen|csf|sputum/i, 'CLINICAL PATHOLOGY'],
  [/cbc|hemogram|hemoglobin|platelet|reticulocyte|prothrombin|aptt|bleeding|g6pd|sickling|blood group|smear|malaria|microfilaria|hb variant|\b(pt|pcv|esr|anc)\b/i, 'HAEMATOLOGY'],
  [/widal|dengue|fever|hiv|hbsag|hcv|vdrl|crp|aso|rf|ana|ccp|tpo|cardiolipin|thyroglobulin|rubella|toxoplasma|ige|cryptococcal|lupus/i, 'SEROLOGY / IMMUNOLOGY'],
  [/.*/, 'BIOCHEMISTRY']
];
```
This grouping must be preserved when generating multi-test patient reports, ensuring tests from different disciplines are clearly partitioned into distinct sections on the printed document.

---

## 4. Parameter & Reference Range Architecture

### 4.1 Specification String (`S`) Structure
Parameters are specified using compact notation:
- **Numeric with unisex interval**: `Name=unit|low|high`  
  *Example*: `Total WBC Count=/cumm|4000|11000`
- **Numeric with sex-specific intervals**: `Name=unit|male_low|male_high|female_low|female_high`  
  *Example*: `Hemoglobin=g/dL|13|17|12|15`  
  *Example*: `RBC Count=million/cumm|4.5|5.5|3.8|4.8`  
  *Example*: `ESR=mm/hr|0|15|0|20`
- **Qualitative**: `Name=q` (outputs Negative / Positive options)  
  *Example*: `HIV=q`, `HBsAg=q`, `HCV Antibody=q`, `VDRL=q`, `Dengue NS1 Antigen=q`
- **Free Text**: Defaults to text input if not found in `S` or tagged with `t`.

### 4.2 Interpretation Notes Engine (`NU` & `NT`)
- Array `NU` holds 43 pre-formulated medical advisory statements regarding fasting requirements, timing variations, interference factors, and false positives.
- Object `NT` maps test names to specific array indices in `NU`.
- Function `inter(t, sx, id, k)` evaluates whether a test's observed values trigger abnormal flags (`hi` or `lo`) and renders the corresponding clinical advisory note at the bottom of the test block.

---

## 5. Visual Asset Extraction & Migration Target

The legacy file contains three high-resolution Base64 assets that must be preserved:

| Asset Variable | Type | Size | Visual Description | Target Destination |
| :--- | :--- | :--- | :--- | :--- |
| `LH` | `image/jpeg` | 104 KB | Official green/teal BIO HI TECH letterhead banner with clinic address, phone, and registration | Supabase Storage: `lab-assets/letterhead.jpg` |
| `SGA` | `image/png` | 21 KB | Primary Signature (Lab Technologist / Pathologist) | Supabase Storage: `lab-assets/signature_a.png` |
| `SGB` | `image/png` | 19 KB | Secondary Signature / Verification Mark | Supabase Storage: `lab-assets/signature_b.png` |

---

## 6. Report Engines: Barcode & QR Code

### 6.1 Code 128 Native Barcode (`c128`)
The legacy app implements a fully self-contained Code 128 barcode generator in JavaScript that requires no external libraries:
- Encodes patient phone / report ID into standard Code 128B pattern.
- Emits clean, resolution-independent SVG `<rect>` elements.
- Works 100% offline.
- **Migration Plan**: Port the `c128(s)` function into a modern React TypeScript component (`components/report/barcode-128.tsx`) to replace the non-scannable CSS stripes in `report-print-sheet.tsx`.

### 6.2 QR Code Engine (`qrs`)
- In legacy, QR code generation was delegated to `qrcode-generator@1.4.4` loaded from CDN.
- **Migration Plan**: Install `qrcode` npm package or bundle an offline QR generation function to ensure 100% offline operability when printing laboratory reports without an active internet connection.

---

## 7. Migration Checklist for Future Phases

- [ ] Extract all 120 tests from `D` into structured SQL seed scripts for Supabase.
- [ ] Extract 124 parameter specifications and reference intervals into a `test_parameters` table.
- [ ] Save Base64 letterhead (`LH`) and signatures (`SGA`, `SGB`) as physical image files in `public/assets/` and Supabase Storage.
- [ ] Implement letterhead printing mode toggle:
  - Mode 1: With Letterhead (prints top letterhead graphic for plain A4 paper).
  - Mode 2: Without Letterhead (leaves a 45mm top blank margin for preprinted stationery).
- [ ] Integrate Code 128 SVG generator into `report-print-sheet.tsx`.
- [ ] Integrate offline QR code generator into `report-print-sheet.tsx`.
- [ ] Maintain the "Range not verified" notice across all user interfaces until professional sign-off.
