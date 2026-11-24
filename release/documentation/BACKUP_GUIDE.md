# BIO HI TECH LIMS — Database Backup & Disaster Recovery Guide

## 1. Overview
Patient medical history, diagnostic reports, audit trails, and payment ledgers are critical business assets. BIO HI TECH uses a multi-layered disaster recovery architecture combining cloud-native snapshots, automated off-site backups, and cryptographic verification.

---

## 2. Cloud Backup Architecture (Supabase Mumbai)

### Automated Daily Snapshots
- On Supabase paid plans (Pro / Enterprise), automated daily physical and logical database backups are performed with 7 to 30 days point-in-time recovery (PITR).
- Backups are stored across physically separated availability zones in the Mumbai region (`ap-south-1`).

### Independent Encrypted Logical Backups (CLI / pg_dump)
Administrators should run periodic encrypted dumps to an independent off-cloud location:
```bash
# Using Supabase CLI to generate complete logical schema and data dump
pnpm exec supabase db dump --project-ref ymwfqvyvcavsbeezweea --data-only -f backup_data_$(date +%Y%m%d).sql

# Using standard pg_dump with direct database connection string
pg_dump -h db.ymwfqvyvcavsbeezweea.supabase.co -U postgres -d postgres -F c -b -v -f bio_hitech_backup_$(date +%Y%m%d).dump
```

---

## 3. Storage Bucket Backups

Documents stored in private Supabase Storage buckets (`patient-documents`, `issued-reports`, `laboratory-assets`) should be mirrored regularly to an off-site S3-compatible archive:
```bash
# S3 Sync mirroring private storage buckets to cold storage
aws s3 sync s3://ymwfqvyvcavsbeezweea/issued-reports /secure_backup/issued-reports/ --endpoint-url https://ymwfqvyvcavsbeezweea.supabase.co/storage/v1/s3
```

---

## 4. Disaster Recovery & Restoration Verification Plan

### Test Restoration Procedure
1. Create a staging or temporary database instance.
2. Apply all versioned migrations:
   ```bash
   pnpm exec supabase db push
   ```
3. Restore the logical data dump:
   ```bash
   pg_restore -h <staging_host> -U postgres -d postgres -v backup_data.dump
   ```
4. Verify data integrity:
   - Ensure the single active owner record in `public.owner_access` resolves properly.
   - Verify that all 120 tests in `public.test_catalogue` are present.
   - Run the automated test suite in `supabase/tests/rls_security_test.sql` to verify RLS enforcement.
   - Test PDF report generation and QR verification resolution.

---

## 5. Storage Integrity & Non-Reliance on Local Caches
- **No LocalStorage Reliance**: The native applications never rely on browser `localStorage` or device app caches as permanent data storage. If a device is lost, destroyed, or wiped, reinstalling the application and logging in as the authorized owner restores full operational state immediately from PostgreSQL.
