# BIO HI TECH LIMS — PRIVATE STORAGE & FILE SECURITY REPORT

**Target Buckets**: `patient-documents`, `issued-reports`, `laboratory-assets`  
**Storage Provider**: Supabase Storage  
**Access Model**: Strictly Authenticated / Short-Lived Signed URLs Only  
**Date**: November 21, 2026  

---

## 1. Storage Configuration Matrix

| Bucket ID | Access Level | Max File Size | Allowed MIME Types | Intended Purpose |
|---|---|---|---|---|
| `patient-documents` | **Strictly Private** (`public = false`) | 10 MB | `application/pdf`, `image/jpeg`, `image/png` | Patient ID cards, physician prescriptions, clinical notes |
| `issued-reports` | **Strictly Private** (`public = false`) | 15 MB | `application/pdf` | Digitally signed diagnostic PDF reports issued to patients |
| `laboratory-assets` | **Strictly Private** (`public = false`) | 5 MB | `image/png`, `image/jpeg`, `image/svg+xml` | Pathologist digital signatures, lab stamps, letterheads |

---

## 2. Row Level Security on `storage.objects`

All buckets enforce owner folder isolation:
- The first folder segment in the object path MUST match `auth.uid()::text`.
- The caller MUST be verified as an active owner via `public.is_active_owner()`.

### Example Policy:
```sql
CREATE POLICY "owner_select_issued_reports" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'issued-reports' 
        AND (storage.foldername(name))[1] = auth.uid()::text
        AND public.is_active_owner()
    );
```

---

## 3. Filename Anonymization & PII Protection

To prevent metadata leakage, direct patient names, phone numbers, or dates of birth are **never** included in storage file names:

- **Unsafe Pattern**: `storage/issued-reports/John_Doe_BloodSugar_9876543210.pdf` ❌
- **BIO HI TECH Safe Pattern**: `issued-reports/<owner_uid>/<report_id>/<sha256_checksum>.pdf` ✓

---

## 4. Short-Lived Signed URLs

When the laboratory owner previews a document or shares a report, access is granted via short-lived signed URLs (lifetime: 60 seconds to 15 minutes max):

```typescript
const { data, error } = await supabase.storage
  .from('issued-reports')
  .createSignedUrl(`${ownerId}/${reportId}/${fileName}`, 300); // 5 minutes validity
```

Anonymous or expired requests to these URLs receive `403 Forbidden`.

---

## 5. QR Code & Barcode Data Safety

All printed diagnostic reports contain physical QR codes and Code 128 barcodes:

- **Code 128**: Encodes only alphanumeric report and patient identifiers (e.g., `RPT-261121-032`, `BHT-02486`).
- **QR Code**: Encodes a secure HTTPS verification URL (`https://biohitech.example/verify/<TOKEN>`) without any raw patient names, diagnoses, phone numbers, or test results.
- **Verification Result**: 7/7 Code 128 barcodes and 7/7 QR codes physically verified and tested clean of PII in automated test suite.
