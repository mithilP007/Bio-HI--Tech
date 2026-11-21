# BIO HI TECH LIMS — SUPABASE BACKEND INTEGRATION PLAN

**Date**: November 21, 2026  
**Scope**: Database Architecture, Entity-Relationship Design, Row Level Security (RLS), Supabase Storage, and Authentication Integration.  
**Execution Notice**: This plan is an architectural blueprint. **Supabase is NOT connected during this audit phase.**

---

## 1. Integration Objectives

The Supabase integration will replace the current in-memory store (`lib/demo-store.ts`) with a secure, production-grade cloud PostgreSQL backend providing:
1. **Zero Data Loss**: Full persistence of patients, reports, results, and billing transactions.
2. **Medical Privacy & Regulatory Compliance**: Strict Row Level Security (RLS) guaranteeing that no unauthorized parties can query patient health information.
3. **Immutability of Clinical Reports**: Cryptographic audit trails and versioned revision tracking for all issued diagnostic reports.
4. **Relational Integrity**: Foreign key constraints preventing orphaned test results, unbalanced ledgers, or deleted patient records with active bills.
5. **Asset Storage**: High-resolution storage for laboratory letterhead graphics, clinical signatures, and archived report PDFs.

---

## 2. Proposed PostgreSQL Schema

```
 +--------------------+       +--------------------+       +--------------------+
 |     profiles       |       |      patients      |       |      reports       |
 |--------------------|       |--------------------|       |--------------------|
 | id (UUID) [PK]     |       | id (TEXT) [PK]     |<------| id (TEXT) [PK]     |
 | full_name (TEXT)   |       | full_name (TEXT)   |       | patient_id [FK]    |
 | role (TEXT)        |       | phone (TEXT UNIQUE)|       | report_date (DATE) |
 | designation (TEXT) |       | age (INT)          |       | status (TEXT)      |
 | is_active (BOOL)   |       | gender (TEXT)      |       | total_amount (NUM) |
 +---------+----------+       | doctor (TEXT)      |       | payment_status     |
           |                  +--------------------+       +---------+----------+
           |                                                         |
           +--------------------+------------------------------------+
                                |
                   +------------+------------+
                   |                         |
        +----------v---------+     +---------v----------+
        |   report_results   |     |      payments      |
        |--------------------|     |--------------------|
        | id (UUID) [PK]     |     | id (TEXT) [PK]     |
        | report_id [FK]     |     | report_id [FK]     |
        | test_name (TEXT)   |     | patient_id [FK]    |
        | parameter_name     |     | amount (NUMERIC)   |
        | observed_value     |     | method (TEXT)      |
        | flag (TEXT)        |     | payment_date (DATE)|
        +--------------------+     +--------------------+
```

---

## 3. Comprehensive Table Definitions

### 3.1 User Profiles & Roles (`public.profiles`)
Links to Supabase `auth.users` for role-based access control (RBAC).
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'pathologist', 'technologist', 'receptionist')),
  designation TEXT DEFAULT 'Laboratory Staff',
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Patients (`public.patients`)
Stores demographic, contact, and referral information.
```sql
CREATE TABLE public.patients (
  id TEXT PRIMARY KEY, -- e.g., 'BHT-02486'
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  age INTEGER CHECK (age >= 0 AND age <= 130),
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'Not specified')),
  date_of_birth DATE,
  address TEXT,
  referring_doctor TEXT DEFAULT 'Self / None',
  internal_notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_patients_phone ON public.patients(phone);
CREATE INDEX idx_patients_name ON public.patients USING gin (to_tsvector('english', full_name));
```

### 3.3 Test Catalogue (`public.tests`)
Stores the 120 laboratory tests.
```sql
CREATE TABLE public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- e.g., 'CBC-01'
  name TEXT NOT NULL,
  department TEXT NOT NULL CHECK (department IN ('HAEMATOLOGY', 'BIOCHEMISTRY', 'CLINICAL PATHOLOGY', 'SEROLOGY / IMMUNOLOGY', 'MICROBIOLOGY')),
  normal_price NUMERIC(10, 2) NOT NULL CHECK (normal_price >= 0),
  offer_price NUMERIC(10, 2) NOT NULL CHECK (offer_price >= 0 AND offer_price <= normal_price),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.4 Test Parameters (`public.test_parameters`)
Stores the 124 parameter specifications and clinical intervals.
```sql
CREATE TABLE public.test_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT DEFAULT '',
  data_type TEXT NOT NULL CHECK (data_type IN ('Numeric', 'Qualitative', 'Text', 'Unconfigured')),
  precision INTEGER DEFAULT 2 CHECK (precision >= 0 AND precision <= 6),
  male_low NUMERIC(12, 4),
  male_high NUMERIC(12, 4),
  female_low NUMERIC(12, 4),
  female_high NUMERIC(12, 4),
  qualitative_options TEXT[] DEFAULT ARRAY['Negative', 'Positive'],
  is_verified BOOLEAN DEFAULT FALSE, -- Must remain FALSE until professional review
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.5 Diagnostic Reports (`public.reports`)
Tracks patient report lifecycles and billing links.
```sql
CREATE TABLE public.reports (
  id TEXT PRIMARY KEY, -- e.g., 'RPT-261121-032'
  patient_id TEXT NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Issued', 'Amended', 'Cancelled')) DEFAULT 'Draft',
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('Pending', 'Partial', 'Paid')) DEFAULT 'Pending',
  amendment_of TEXT REFERENCES public.reports(id),
  created_by UUID REFERENCES public.profiles(id),
  issued_by UUID REFERENCES public.profiles(id),
  issued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.6 Report Test Results (`public.report_results`)
Stores individual parameter measurements for each report.
```sql
CREATE TABLE public.report_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  test_id UUID REFERENCES public.tests(id),
  test_name TEXT NOT NULL,
  parameter_name TEXT NOT NULL,
  observed_value TEXT NOT NULL,
  flag TEXT CHECK (flag IN ('normal', 'low', 'high', 'positive', 'negative', 'unverified')) DEFAULT 'unverified',
  unit TEXT DEFAULT '',
  reference_range_snapshot TEXT DEFAULT 'Range not verified',
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_report_results_report_id ON public.report_results(report_id);
```

### 3.7 Financial Transactions (`public.payments`)
Ledger of all collected payments.
```sql
CREATE TABLE public.payments (
  id TEXT PRIMARY KEY, -- e.g., 'TXN-00001'
  report_id TEXT NOT NULL REFERENCES public.reports(id) ON DELETE RESTRICT,
  patient_id TEXT NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Card', 'Bank transfer')),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  received_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.8 Laboratory Settings (`public.lab_settings`)
Single-row configuration record for laboratory profile, letterhead, and default preferences.
```sql
CREATE TABLE public.lab_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  laboratory_name TEXT NOT NULL DEFAULT 'BIO HI TECH',
  address TEXT NOT NULL DEFAULT 'Ground Floor, Health Plaza, Mumbai, Maharashtra',
  phone TEXT NOT NULL DEFAULT '+91 22 4567 8900',
  email TEXT NOT NULL DEFAULT 'care@biohitech.example',
  registration_number TEXT DEFAULT '',
  owner_name TEXT NOT NULL DEFAULT 'Arun Mehta',
  owner_designation TEXT NOT NULL DEFAULT 'Laboratory Owner',
  brand_color TEXT DEFAULT '#0F9D8C',
  letterhead_url TEXT,
  signature_a_url TEXT,
  signature_b_url TEXT,
  signatory_name TEXT DEFAULT 'Mr. J. SRIDHAR. M.Sc, [MLT], DMLT, DXRT, DHI',
  signatory_designation TEXT DEFAULT 'Lab Technologist',
  report_format TEXT DEFAULT 'A4 portrait',
  currency TEXT DEFAULT 'INR',
  default_discount NUMERIC(5, 2) DEFAULT 0,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Row Level Security (RLS) Architecture

All tables will have RLS enabled:
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_settings ENABLE ROW LEVEL SECURITY;
```

### Role-Based Policies:
1. **Authenticated Access**: Only authenticated laboratory staff can read or write data. Public anonymous access is disabled.
2. **Staff Roles**:
   - `receptionist`: Can read/insert/update `patients`, create draft `reports`, read `tests`, and insert `payments`.
   - `technologist`: Can enter results in `report_results` and execute the `issue_report` function.
   - `pathologist` / `owner`: Full privileges, including updating test catalogue prices and lab settings.

---

## 5. Storage Buckets Strategy

| Bucket Name | Privacy Level | Allowed File Types | Purpose |
| :--- | :--- | :--- | :--- |
| `lab-assets` | Public Read (App only) | JPEG, PNG, SVG, WebP | Letterhead graphics, signatures, lab logo |
| `report-archives` | Private (Encrypted) | PDF | Permanent cryptographic PDF copies of issued reports |

---

## 6. Migration Phasing & Client Layer Strategy

### Step 1: Client Setup (Future Phase)
Install `@supabase/supabase-js` and configure `lib/supabase/client.ts` and `lib/supabase/server.ts` using Next.js Server Components and Server Actions.

### Step 2: Database Seeding
Execute SQL migrations to insert all 120 tests and 124 parameter specifications from `LEGACY_MIGRATION_MAP.md`.

### Step 3: Progressive Adapter Swap
Replace methods in `lib/demo-store.ts` (`createPatient`, `createReport`, `recordPayment`) with asynchronous Supabase client calls while preserving the exact React UI components and state interfaces.
