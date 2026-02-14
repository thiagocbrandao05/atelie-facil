-- INSTRUCTIONS:
-- Run this script in the Supabase SQL Editor to seed the database with the 6-tier matrix users.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_user_id uuid;
    v_tenant_id uuid;
    v_password text := 'password123';
    v_plan text;
    v_profile text;
    v_email text;
    v_name text;
    v_plans text[] := ARRAY['free_creative', 'free_reseller', 'paid_creative', 'paid_reseller', 'premium_creative', 'premium_reseller'];
    v_profiles text[] := ARRAY['CREATIVE', 'RESELLER', 'CREATIVE', 'RESELLER', 'CREATIVE', 'RESELLER'];
    v_emails text[] := ARRAY['free-c@test.com', 'free-r@test.com', 'paid-c@test.com', 'paid-r@test.com', 'premium-c@test.com', 'premium-r@test.com'];
    v_names text[] := ARRAY['Criativo Gratuito', 'Revendedor Gratuito', 'Criativo Pago', 'Revendedor Pago', 'Criativo Premium', 'Revendedor Premium'];
BEGIN
    FOR i IN 1..6 LOOP
        v_plan := v_plans[i];
        v_profile := v_profiles[i];
        v_email := v_emails[i];
        v_name := v_names[i];

        -- 1. Create User in auth.users
        SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

        IF v_user_id IS NULL THEN
            INSERT INTO auth.users (
                instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                confirmation_token, email_change, email_change_token_new, recovery_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
                v_email, extensions.crypt(v_password, extensions.gen_salt('bf')), now(),
                '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
            ) RETURNING id INTO v_user_id;
        END IF;

        -- 2. Create Tenant for this user
        INSERT INTO public."Tenant" (name, slug, plan, profile, "createdAt", "updatedAt")
        VALUES ('Ateliê ' || v_name, 'atelie-' || replace(lower(v_name), ' ', '-'), v_plan, v_profile::"TenantProfile", now(), now())
        ON CONFLICT (slug) DO UPDATE SET "updatedAt" = now()
        RETURNING id INTO v_tenant_id;

        -- 3. Create Public User Profile
        INSERT INTO public."User" (id, "tenantId", name, email, role, "createdAt", "updatedAt")
        VALUES (v_user_id, v_tenant_id, v_name, v_email, 'owner', now(), now())
        ON CONFLICT (id) DO UPDATE SET "tenantId" = EXCLUDED."tenantId", "updatedAt" = now();

        -- 4. Initial Settings for the Tenant
        INSERT INTO public."Settings" (id, "tenantId", "storeName", "updatedAt")
        VALUES (gen_random_uuid()::text, v_tenant_id, 'Ateliê ' || v_name, now())
        ON CONFLICT ("tenantId") DO NOTHING;

    END LOOP;

    RAISE NOTICE 'Seed completed! 6 test users created with password: %', v_password;
END $$;
