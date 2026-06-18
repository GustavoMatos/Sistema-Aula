-- ============================================================================
-- SCRIPT: Create Superadmin User
-- Date: 2024-04-07
-- Description: Creates the first superadmin user for the system
-- ============================================================================
--
-- INSTRUCOES:
--
-- OPCAO 1: Via Supabase Dashboard (Recomendado)
-- 1. Acesse: https://supabase.com/dashboard/project/jqduuiuqxfarhsvnrgvl
-- 2. Va em Authentication > Users
-- 3. Clique em "Add user" > "Create new user"
-- 4. Preencha email e senha do superadmin
-- 5. Marque "Auto Confirm User"
-- 6. Copie o UUID do usuario criado
-- 7. Execute o script abaixo substituindo os valores
--
-- OPCAO 2: Via SQL (se tiver acesso admin ao auth schema)
-- Execute todo o script abaixo
-- ============================================================================

-- ============================================================================
-- PASSO 1: Defina as variaveis do superadmin
-- ============================================================================
-- IMPORTANTE: Substitua estes valores antes de executar!

DO $$
DECLARE
    -- =======================================================================
    -- CONFIGURE AQUI OS DADOS DO SUPERADMIN
    -- =======================================================================
    superadmin_email TEXT := 'admin@seudominio.com';  -- Altere para o email desejado
    superadmin_password TEXT := 'SenhaForte123!';     -- Altere para uma senha segura
    superadmin_name TEXT := 'Super Administrador';    -- Nome do superadmin
    -- =======================================================================

    new_user_id UUID;
    existing_user_id UUID;
BEGIN
    -- Verificar se ja existe um superadmin
    SELECT id INTO existing_user_id
    FROM users
    WHERE role = 'superadmin'
    LIMIT 1;

    IF existing_user_id IS NOT NULL THEN
        RAISE NOTICE 'Ja existe um superadmin no sistema (ID: %)', existing_user_id;
        RETURN;
    END IF;

    -- Verificar se o email ja existe no auth
    SELECT id INTO existing_user_id
    FROM auth.users
    WHERE email = superadmin_email;

    IF existing_user_id IS NOT NULL THEN
        -- Usuario ja existe no auth, apenas criar registro na tabela users
        RAISE NOTICE 'Usuario ja existe no auth (ID: %), criando registro de superadmin...', existing_user_id;

        INSERT INTO users (id, email, full_name, role, tenant_id, is_active)
        VALUES (existing_user_id, superadmin_email, superadmin_name, 'superadmin', NULL, true)
        ON CONFLICT (id) DO UPDATE SET role = 'superadmin';

        RAISE NOTICE 'Superadmin criado/atualizado com sucesso!';
        RETURN;
    END IF;

    -- Criar usuario no auth.users
    -- NOTA: Isso requer permissao de service_role
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        aud,
        role,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token
    )
    VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        superadmin_email,
        crypt(superadmin_password, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', superadmin_name),
        'authenticated',
        'authenticated',
        NOW(),
        NOW(),
        '',
        ''
    )
    RETURNING id INTO new_user_id;

    -- Criar identidade
    INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        new_user_id,
        superadmin_email,
        jsonb_build_object('sub', new_user_id, 'email', superadmin_email),
        'email',
        NOW(),
        NOW(),
        NOW()
    );

    -- Criar registro na tabela users como superadmin
    INSERT INTO users (id, email, full_name, role, tenant_id, is_active)
    VALUES (new_user_id, superadmin_email, superadmin_name, 'superadmin', NULL, true);

    RAISE NOTICE 'Superadmin criado com sucesso! ID: %', new_user_id;
    RAISE NOTICE 'Email: %', superadmin_email;
    RAISE NOTICE 'IMPORTANTE: Guarde a senha em local seguro!';
END $$;

-- ============================================================================
-- ALTERNATIVA SIMPLES: Se voce ja criou o usuario via Dashboard
-- ============================================================================
-- Descomente e execute apenas o INSERT abaixo, substituindo os valores:
--
-- INSERT INTO users (id, email, full_name, role, tenant_id, is_active)
-- VALUES (
--     'COLE_AQUI_O_UUID_DO_USUARIO',  -- UUID do usuario criado no Dashboard
--     'email@dominio.com',             -- Email do superadmin
--     'Super Administrador',           -- Nome
--     'superadmin',                    -- Role
--     NULL,                            -- Sem tenant (superadmin e global)
--     true                             -- Ativo
-- );

-- ============================================================================
-- VERIFICACAO: Confirmar que o superadmin foi criado
-- ============================================================================
SELECT
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.is_active,
    u.created_at
FROM users u
WHERE u.role = 'superadmin';
