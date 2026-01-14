-- SQL Script to introduce Test Credentials
-- Run this in the Supabase SQL Editor

-- 1. Add is_test_user flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_test_user BOOLEAN DEFAULT false;

-- 2. Function to create test users safely (if using service_role)
-- Note: This requires high privileges. Usually done via Supabase Dashboard or Admin SDK.
-- For the user to run in SQL editor, we will provide the user creation logic.

-- IMPORTANT: Supabase auth.users is in a separate schema and directly inserting is discouraged.
-- Best practice is to use auth.signUp or Supabase Dashboard.
-- However, for a one-click SQL script, we can use the following pattern if the user has permissions:

DO $$
DECLARE
    admin_id UUID := gen_random_uuid();
    client_id UUID := gen_random_uuid();
    driver_id UUID := gen_random_uuid();
    test_password_hash TEXT := crypt('VDeliveriesTest2024!', gen_salt('bf'));
BEGIN
    -- Only create if they don't exist
    
    -- ADMIN TEST USER
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin+test@vdeliveries.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, email_change, email_change_sent_at, is_super_admin)
        VALUES (
            admin_id, '00000000-0000-0000-0000-000000000000', 'admin+test@vdeliveries.com', test_password_hash, now(), 
            '{"provider":"email","providers":["email"]}', '{"full_name":"Test Admin","role":"admin"}', 
            now(), now(), 'authenticated', '', '', now(), false
        );
        INSERT INTO auth.identities (user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
        VALUES (admin_id, format('{"sub":"%s","email":"%s"}', admin_id, 'admin+test@vdeliveries.com')::jsonb, 'email', admin_id, now(), now(), now());
        
        -- Trigger handle_new_user should take care of public.profiles, but we force it for clarity
        UPDATE public.profiles SET is_test_user = true WHERE id = admin_id;
    END IF;

    -- CLIENT TEST USER
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'client+test@vdeliveries.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, email_change, email_change_sent_at, is_super_admin)
        VALUES (
            client_id, '00000000-0000-0000-0000-000000000000', 'client+test@vdeliveries.com', test_password_hash, now(), 
            '{"provider":"email","providers":["email"]}', '{"full_name":"Test Client","role":"client"}', 
            now(), now(), 'authenticated', '', '', now(), false
        );
        INSERT INTO auth.identities (user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
        VALUES (client_id, format('{"sub":"%s","email":"%s"}', client_id, 'client+test@vdeliveries.com')::jsonb, 'email', client_id, now(), now(), now());
        
        UPDATE public.profiles SET is_test_user = true WHERE id = client_id;
    END IF;

    -- DRIVER TEST USER
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'driver+test@vdeliveries.com') THEN
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, email_change, email_change_sent_at, is_super_admin)
        VALUES (
            driver_id, '00000000-0000-0000-0000-000000000000', 'driver+test@vdeliveries.com', test_password_hash, now(), 
            '{"provider":"email","providers":["email"]}', '{"full_name":"Test Driver","role":"driver","vehicle_type":"motorcycle"}', 
            now(), now(), 'authenticated', '', '', now(), false
        );
        INSERT INTO auth.identities (user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
        VALUES (driver_id, format('{"sub":"%s","email":"%s"}', driver_id, 'driver+test@vdeliveries.com')::jsonb, 'email', driver_id, now(), now(), now());
        
        UPDATE public.profiles SET is_test_user = true WHERE id = driver_id;
    END IF;
END $$;

-- 3. Verify RLS (Safety Check)
-- Ensure test users don't skip RLS
-- (Already covered by existing policies being based on auth.uid())
