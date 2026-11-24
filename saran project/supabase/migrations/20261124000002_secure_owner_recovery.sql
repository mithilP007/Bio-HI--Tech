-- ==============================================================================
-- BIO HI TECH LIMS — SECURE OWNER AUTHENTICATION & PRODUCTION RECOVERY GATE
-- Migration: 20261124000002_secure_owner_recovery.sql
-- Description: Revokes insecure client bootstrap RPCs and security questions;
-- enforces server-side pre-provisioned owner access and Supabase verified email recovery.
-- ==============================================================================

-- 1. Drop and revoke insecure client bootstrap and security question RPCs
DROP FUNCTION IF EXISTS public.setup_initial_owner_account(text, text, text, text, text);
DROP FUNCTION IF EXISTS public.reset_owner_password_via_security_question(text, text, text);
DROP FUNCTION IF EXISTS public.get_owner_security_question(text);
DROP FUNCTION IF EXISTS public.hash_security_answer(text);

-- 2. Pre-provision the single authorized laboratory owner (Server-Side / Admin Provisioned Only)
-- Pre-provisioning prevents arbitrary installer users from claiming ownership on initial launch
DO $$
DECLARE
  v_owner_id uuid := 'e0000000-0000-0000-0000-000000000001'::uuid;
  v_owner_email text := 'owner@biohitech.com';
BEGIN
  -- Insert into auth.users if not present
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    v_owner_id,
    '00000000-0000-0000-0000-000000000000',
    v_owner_email,
    crypt('BioHiTech2026!Master', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Dr. Arun Kumar","designation":"Chief Pathologist & Lab Director"}'::jsonb,
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = now();

  -- Identity for GoTrue email provider
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_owner_id,
    v_owner_id,
    json_build_object('sub', v_owner_id::text, 'email', v_owner_email)::jsonb,
    'email',
    v_owner_id::text,
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;

  -- Add to owner_access allowlist (single tenant security gate)
  INSERT INTO public.owner_access (id, email, is_active, role)
  VALUES (v_owner_id, v_owner_email, true, 'OWNER')
  ON CONFLICT (id) DO UPDATE SET is_active = true, email = v_owner_email;

  -- Add to owner_profile
  INSERT INTO public.owner_profile (
    id,
    email,
    full_name,
    designation,
    lab_name,
    lab_address
  ) VALUES (
    v_owner_id,
    v_owner_email,
    'Dr. Arun Kumar',
    'Chief Pathologist & Lab Director',
    'BIO HI TECH',
    'Ground Floor, Health Plaza, Mumbai, Maharashtra'
  )
  ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    designation = EXCLUDED.designation,
    email = v_owner_email;
END $$;
