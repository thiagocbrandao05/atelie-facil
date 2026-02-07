-- INSTRUCTIONS:
-- Run this script in the Supabase SQL Editor to seed the database.

-- 1. Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_user_id uuid;
    v_tenant_id uuid;
    v_email text := 'teste@ateliefacil.com';
    v_password text := 'password123';
BEGIN
    -- 2. Get or Create User in auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            now(),
            now(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO v_user_id;
    END IF;

    -- 3. Create or Get Tenant
    INSERT INTO public."Tenant" (name, slug, plan, "createdAt", "updatedAt")
    VALUES ('Ateliê de Teste', 'atelie-teste', 'free', now(), now())
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = now()
    RETURNING id INTO v_tenant_id;

    -- 4. Create Public User Profile
    INSERT INTO public."User" (id, "tenantId", name, email, role, "createdAt", "updatedAt")
    VALUES (v_user_id, v_tenant_id, 'Usuário Teste', v_email, 'owner', now(), now())
    ON CONFLICT (id) DO UPDATE SET "tenantId" = EXCLUDED."tenantId", "updatedAt" = now();

    RAISE NOTICE 'Seed completed successfully!';
    RAISE NOTICE 'Credential: % / %', v_email, v_password;
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE 'Tenant ID: %', v_tenant_id;
END $$;
