-- ==============================================================================
-- BIO HI TECH LIMS — OWNER REGISTRATION RPC
-- Migration: 20261124000002_owner_registration_rpc.sql
-- Description: Provides secure registration/setup RPC for laboratory owner
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.register_owner_account(
  p_email text,
  p_password text,
  p_full_name text DEFAULT 'Dr. Arun Kumar',
  p_designation text DEFAULT 'Chief Pathologist & Lab Director'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id uuid;
  v_clean_email text := lower(trim(p_email));
BEGIN
  IF v_clean_email = '' OR v_clean_email NOT LIKE '%@%' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Please enter a valid email address.');
  END IF;

  IF length(p_password) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password must be at least 8 characters.');
  END IF;

  -- Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_clean_email;

  IF v_user_id IS NOT NULL THEN
    -- Update existing password and ensure owner access
    UPDATE auth.users
    SET encrypted_password = crypt(p_password, gen_salt('bf')),
        raw_user_meta_data = jsonb_build_object('full_name', p_full_name, 'designation', p_designation),
        updated_at = now()
    WHERE id = v_user_id;

    -- Deactivate any other active owner to satisfy single active owner constraint
    UPDATE public.owner_access SET is_active = false WHERE id != v_user_id;

    INSERT INTO public.owner_access (id, email, is_active, role)
    VALUES (v_user_id, v_clean_email, true, 'OWNER')
    ON CONFLICT (id) DO UPDATE SET is_active = true, email = v_clean_email;

    INSERT INTO public.owner_profile (id, email, full_name, designation, lab_name, lab_address)
    VALUES (v_user_id, v_clean_email, p_full_name, p_designation, 'BIO HI TECH', '#3/120, Tirupur Road, Perumanallur - 641 666. Tirupur District')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, designation = EXCLUDED.designation, email = v_clean_email;

    RETURN jsonb_build_object('success', true, 'message', 'Account registered and activated.');
  END IF;

  -- Create new user
  v_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    role, aud, confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    v_user_id, '00000000-0000-0000-0000-000000000000', v_clean_email,
    crypt(p_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name, 'designation', p_designation),
    now(), now(), 'authenticated', 'authenticated', '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_user_id, v_user_id, json_build_object('sub', v_user_id::text, 'email', v_clean_email)::jsonb,
    'email', v_user_id::text, now(), now(), now()
  ) ON CONFLICT (provider, provider_id) DO NOTHING;

  -- Deactivate any other active owner
  UPDATE public.owner_access SET is_active = false;

  INSERT INTO public.owner_access (id, email, is_active, role)
  VALUES (v_user_id, v_clean_email, true, 'OWNER')
  ON CONFLICT (id) DO UPDATE SET is_active = true, email = v_clean_email;

  INSERT INTO public.owner_profile (id, email, full_name, designation, lab_name, lab_address)
  VALUES (v_user_id, v_clean_email, p_full_name, p_designation, 'BIO HI TECH', '#3/120, Tirupur Road, Perumanallur - 641 666. Tirupur District')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, designation = EXCLUDED.designation, email = v_clean_email;

  RETURN jsonb_build_object('success', true, 'message', 'Account created successfully.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_owner_account(text, text, text, text) TO anon, authenticated;
