-- BIO HI TECH LIMS — OWNER AUTHENTICATION & SECURITY QUESTION RECOVERY
ALTER TABLE public.owner_profile 
ADD COLUMN IF NOT EXISTS security_question text DEFAULT 'What is your favorite car?',
ADD COLUMN IF NOT EXISTS security_answer_hash text;

CREATE OR REPLACE FUNCTION public.hash_security_answer(answer text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT encode(digest(lower(trim(answer)), 'sha256'), 'hex');
$$;

CREATE OR REPLACE FUNCTION public.check_owner_exists()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.owner_access WHERE is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.get_owner_security_question(p_email text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_question text;
  v_clean_email text := lower(trim(p_email));
BEGIN
  SELECT security_question INTO v_question
  FROM public.owner_profile
  WHERE lower(trim(email)) = v_clean_email;

  IF v_question IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No owner account registered with this email.');
  END IF;

  RETURN json_build_object('success', true, 'question', v_question);
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_owner_password_via_security_question(
  p_email text,
  p_answer text,
  p_new_password text
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
  v_stored_hash text;
  v_answer_hash text;
  v_clean_email text := lower(trim(p_email));
BEGIN
  IF length(trim(p_new_password)) < 6 THEN
    RETURN json_build_object('success', false, 'error', 'New password must be at least 6 characters.');
  END IF;

  SELECT id, security_answer_hash INTO v_user_id, v_stored_hash
  FROM public.owner_profile
  WHERE lower(trim(email)) = v_clean_email;

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Owner account not found.');
  END IF;

  IF v_stored_hash IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No security question has been set for this account. Please contact system admin.');
  END IF;

  v_answer_hash := public.hash_security_answer(p_answer);

  IF v_answer_hash <> v_stored_hash THEN
    RETURN json_build_object('success', false, 'error', 'Incorrect answer to your security question. Please try again.');
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = v_user_id;

  RETURN json_build_object('success', true, 'message', 'Password successfully reset! You can now sign in with your new password.');
END;
$$;

CREATE OR REPLACE FUNCTION public.setup_initial_owner_account(
  p_email text,
  p_password text,
  p_full_name text,
  p_question text,
  p_answer text
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
  v_clean_email text := lower(trim(p_email));
  v_answer_hash text;
BEGIN
  IF EXISTS (SELECT 1 FROM public.owner_access WHERE is_active = true) THEN
    RETURN json_build_object('success', false, 'error', 'Owner account is already configured.');
  END IF;

  IF length(trim(p_password)) < 6 THEN
    RETURN json_build_object('success', false, 'error', 'Password must be at least 6 characters.');
  END IF;

  v_answer_hash := public.hash_security_answer(p_answer);
  v_user_id := gen_random_uuid();

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
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    v_clean_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    json_build_object('full_name', p_full_name, 'designation', 'Laboratory Director')::jsonb,
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
  );

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
    v_user_id,
    v_user_id,
    json_build_object('sub', v_user_id::text, 'email', v_clean_email)::jsonb,
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;

  INSERT INTO public.owner_access (id, email, is_active, role)
  VALUES (v_user_id, v_clean_email, true, 'OWNER')
  ON CONFLICT (id) DO UPDATE SET is_active = true, email = v_clean_email;

  INSERT INTO public.owner_profile (
    id,
    email,
    full_name,
    designation,
    security_question,
    security_answer_hash
  ) VALUES (
    v_user_id,
    v_clean_email,
    p_full_name,
    'Laboratory Director',
    coalesce(nullif(trim(p_question), ''), 'What is your favorite car?'),
    v_answer_hash
  )
  ON CONFLICT (id) DO UPDATE SET
    email = v_clean_email,
    full_name = p_full_name,
    security_question = coalesce(nullif(trim(p_question), ''), 'What is your favorite car?'),
    security_answer_hash = v_answer_hash;

  RETURN json_build_object(
    'success', true, 
    'message', 'Owner account created successfully!',
    'user_id', v_user_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_owner_exists() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_owner_security_question(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_owner_password_via_security_question(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.setup_initial_owner_account(text, text, text, text, text) TO anon, authenticated;
