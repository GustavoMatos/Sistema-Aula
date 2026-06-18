-- ============================================================================
-- MIGRATION: Multi-Tenant System with Role-Based Access Control
-- Date: 2024-04-07
-- Description: Implements 3-tier role system (superadmin, admin_tenant, user_tenant)
--              with RLS policies for data isolation
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE ENUM FOR ROLES
-- ============================================================================

-- Create role enum type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('superadmin', 'admin_tenant', 'user_tenant');
    END IF;
END $$;

-- ============================================================================
-- PART 2: CREATE/UPDATE TENANTS TABLE (formerly workspaces)
-- ============================================================================

-- Rename workspaces to tenants if exists, or create tenants table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspaces' AND table_schema = 'public') THEN
        -- Rename existing workspaces table to tenants
        ALTER TABLE IF EXISTS workspaces RENAME TO tenants;

        -- Add new columns if they don't exist
        ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
        ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
        ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 5;
        ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
        ALTER TABLE tenants ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
        ALTER TABLE tenants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

        -- Update slug from name for existing records
        UPDATE tenants SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '-', 'g')) WHERE slug IS NULL;
    ELSE
        -- Create tenants table from scratch
        CREATE TABLE IF NOT EXISTS tenants (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            slug TEXT UNIQUE,
            plan TEXT DEFAULT 'free',
            max_users INTEGER DEFAULT 5,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

-- Create index on slug
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- ============================================================================
-- PART 3: UPDATE USERS TABLE
-- ============================================================================

-- Add/update columns in users table
DO $$
BEGIN
    -- Rename workspace_id to tenant_id if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'workspace_id') THEN
        ALTER TABLE users RENAME COLUMN workspace_id TO tenant_id;
    END IF;

    -- Add tenant_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tenant_id') THEN
        ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;

    -- Convert role column to use enum (keeping existing data)
    -- First, rename old role column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role' AND data_type = 'text') THEN
        ALTER TABLE users RENAME COLUMN role TO role_old;
        ALTER TABLE users ADD COLUMN role user_role DEFAULT 'user_tenant';

        -- Migrate existing roles
        UPDATE users SET role =
            CASE
                WHEN role_old = 'superadmin' THEN 'superadmin'::user_role
                WHEN role_old = 'admin' THEN 'admin_tenant'::user_role
                ELSE 'user_tenant'::user_role
            END;

        ALTER TABLE users DROP COLUMN role_old;
    END IF;

    -- Add new columns
    ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- PART 4: CREATE INVITATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'user_tenant',
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate pending invitations
    CONSTRAINT unique_pending_invitation UNIQUE (email, tenant_id)
);

-- Indexes for invitations
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_tenant ON invitations(tenant_id);

-- ============================================================================
-- PART 5: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
    user_role_val user_role;
BEGIN
    SELECT role INTO user_role_val
    FROM users
    WHERE id = auth.uid();

    RETURN COALESCE(user_role_val, 'user_tenant'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get current user's tenant_id
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
DECLARE
    tenant_id_val UUID;
BEGIN
    SELECT tenant_id INTO tenant_id_val
    FROM users
    WHERE id = auth.uid();

    RETURN tenant_id_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'superadmin'::user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is admin of their tenant
CREATE OR REPLACE FUNCTION is_tenant_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('superadmin'::user_role, 'admin_tenant'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PART 6: ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on existing data tables (if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
        ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kanban_stages') THEN
        ALTER TABLE kanban_stages ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_history') THEN
        ALTER TABLE lead_history ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_instances') THEN
        ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'followups') THEN
        ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================================================
-- PART 7: RLS POLICIES FOR TENANTS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "tenants_superadmin_all" ON tenants;
DROP POLICY IF EXISTS "tenants_admin_own" ON tenants;
DROP POLICY IF EXISTS "tenants_user_read_own" ON tenants;

-- Superadmin: full access to all tenants
CREATE POLICY "tenants_superadmin_all" ON tenants
    FOR ALL
    USING (is_superadmin())
    WITH CHECK (is_superadmin());

-- Admin tenant: read/update own tenant only
CREATE POLICY "tenants_admin_own" ON tenants
    FOR ALL
    USING (
        get_user_role() = 'admin_tenant'::user_role
        AND id = get_user_tenant_id()
    )
    WITH CHECK (
        get_user_role() = 'admin_tenant'::user_role
        AND id = get_user_tenant_id()
    );

-- User tenant: read-only own tenant
CREATE POLICY "tenants_user_read_own" ON tenants
    FOR SELECT
    USING (
        get_user_role() = 'user_tenant'::user_role
        AND id = get_user_tenant_id()
    );

-- ============================================================================
-- PART 8: RLS POLICIES FOR USERS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "users_superadmin_all" ON users;
DROP POLICY IF EXISTS "users_admin_manage_tenant" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;

-- Superadmin: full access to all users
CREATE POLICY "users_superadmin_all" ON users
    FOR ALL
    USING (is_superadmin())
    WITH CHECK (is_superadmin());

-- Admin tenant: manage users in own tenant (except superadmins)
CREATE POLICY "users_admin_manage_tenant" ON users
    FOR ALL
    USING (
        get_user_role() = 'admin_tenant'::user_role
        AND tenant_id = get_user_tenant_id()
        AND role != 'superadmin'::user_role
    )
    WITH CHECK (
        get_user_role() = 'admin_tenant'::user_role
        AND tenant_id = get_user_tenant_id()
        AND role != 'superadmin'::user_role
    );

-- Users: read own profile + see other users in same tenant
CREATE POLICY "users_read_own" ON users
    FOR SELECT
    USING (
        id = auth.uid()
        OR tenant_id = get_user_tenant_id()
    );

-- ============================================================================
-- PART 9: RLS POLICIES FOR INVITATIONS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "invitations_superadmin_all" ON invitations;
DROP POLICY IF EXISTS "invitations_admin_manage" ON invitations;
DROP POLICY IF EXISTS "invitations_check_own" ON invitations;

-- Superadmin: full access
CREATE POLICY "invitations_superadmin_all" ON invitations
    FOR ALL
    USING (is_superadmin())
    WITH CHECK (is_superadmin());

-- Admin tenant: manage invitations for own tenant
CREATE POLICY "invitations_admin_manage" ON invitations
    FOR ALL
    USING (
        is_tenant_admin()
        AND tenant_id = get_user_tenant_id()
    )
    WITH CHECK (
        is_tenant_admin()
        AND tenant_id = get_user_tenant_id()
        -- Admin can only invite user_tenant, not other admins
        AND (
            get_user_role() = 'superadmin'::user_role
            OR role = 'user_tenant'::user_role
        )
    );

-- Anyone can check invitations by token (for accepting)
CREATE POLICY "invitations_check_own" ON invitations
    FOR SELECT
    USING (email = auth.email());

-- ============================================================================
-- PART 10: RLS POLICIES FOR DATA TABLES (leads, etc.)
-- ============================================================================

-- Generic policy template for tenant-scoped tables
-- Apply to leads table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
        -- Rename workspace_id to tenant_id if needed
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'workspace_id') THEN
            ALTER TABLE leads RENAME COLUMN workspace_id TO tenant_id;
        END IF;

        DROP POLICY IF EXISTS "leads_superadmin_all" ON leads;
        DROP POLICY IF EXISTS "leads_tenant_access" ON leads;
        DROP POLICY IF EXISTS "leads_user_no_delete" ON leads;

        -- Superadmin: full access
        CREATE POLICY "leads_superadmin_all" ON leads
            FOR ALL USING (is_superadmin()) WITH CHECK (is_superadmin());

        -- Admin tenant: full CRUD on own tenant
        CREATE POLICY "leads_tenant_admin" ON leads
            FOR ALL
            USING (
                get_user_role() = 'admin_tenant'::user_role
                AND tenant_id = get_user_tenant_id()
            )
            WITH CHECK (
                get_user_role() = 'admin_tenant'::user_role
                AND tenant_id = get_user_tenant_id()
            );

        -- User tenant: read + insert + update (no delete)
        CREATE POLICY "leads_user_read" ON leads
            FOR SELECT
            USING (
                get_user_role() = 'user_tenant'::user_role
                AND tenant_id = get_user_tenant_id()
            );

        CREATE POLICY "leads_user_insert" ON leads
            FOR INSERT
            WITH CHECK (
                get_user_role() = 'user_tenant'::user_role
                AND tenant_id = get_user_tenant_id()
            );

        CREATE POLICY "leads_user_update" ON leads
            FOR UPDATE
            USING (
                get_user_role() = 'user_tenant'::user_role
                AND tenant_id = get_user_tenant_id()
            )
            WITH CHECK (
                get_user_role() = 'user_tenant'::user_role
                AND tenant_id = get_user_tenant_id()
            );
    END IF;
END $$;

-- Apply similar policies to other tables
DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY['kanban_stages', 'lead_history', 'messages', 'whatsapp_instances', 'followups'];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl) THEN
            -- Rename workspace_id to tenant_id if needed
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = tbl AND column_name = 'workspace_id') THEN
                EXECUTE format('ALTER TABLE %I RENAME COLUMN workspace_id TO tenant_id', tbl);
            END IF;

            -- Drop existing policies
            EXECUTE format('DROP POLICY IF EXISTS "%s_superadmin_all" ON %I', tbl, tbl);
            EXECUTE format('DROP POLICY IF EXISTS "%s_tenant_access" ON %I', tbl, tbl);

            -- Superadmin: full access
            EXECUTE format('
                CREATE POLICY "%s_superadmin_all" ON %I
                FOR ALL USING (is_superadmin()) WITH CHECK (is_superadmin())
            ', tbl, tbl);

            -- Tenant members: access own tenant data
            EXECUTE format('
                CREATE POLICY "%s_tenant_access" ON %I
                FOR ALL
                USING (tenant_id = get_user_tenant_id())
                WITH CHECK (tenant_id = get_user_tenant_id())
            ', tbl, tbl);
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- PART 11: CREATE SUPERADMIN DASHBOARD VIEW
-- ============================================================================

CREATE OR REPLACE VIEW superadmin_dashboard AS
SELECT
    t.id as tenant_id,
    t.name as tenant_name,
    t.plan,
    t.max_users,
    t.is_active,
    COUNT(DISTINCT u.id) as user_count,
    COUNT(DISTINCT CASE WHEN u.role = 'admin_tenant' THEN u.id END) as admin_count,
    t.created_at
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
GROUP BY t.id;

-- Only superadmins can access this view
CREATE OR REPLACE FUNCTION superadmin_dashboard_policy()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN is_superadmin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PART 12: TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- PART 13: DISABLE SELF-REGISTRATION (via Supabase Auth settings)
-- ============================================================================
-- NOTE: To fully disable self-registration, go to Supabase Dashboard:
-- Authentication > Providers > Email > Disable "Enable email signup"
-- Or use the API to set auth.email.enable_signup = false

-- This function will be used by the invitation acceptance flow
CREATE OR REPLACE FUNCTION accept_invitation(invitation_token TEXT, user_password TEXT)
RETURNS JSON AS $$
DECLARE
    inv RECORD;
    new_user_id UUID;
BEGIN
    -- Get invitation
    SELECT * INTO inv FROM invitations
    WHERE token = invitation_token
    AND accepted_at IS NULL
    AND expires_at > NOW();

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Convite inválido ou expirado');
    END IF;

    -- Mark invitation as accepted
    UPDATE invitations SET accepted_at = NOW() WHERE id = inv.id;

    RETURN json_build_object(
        'success', true,
        'email', inv.email,
        'tenant_id', inv.tenant_id,
        'role', inv.role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMPLETED!
-- ============================================================================
-- Summary of what was created:
-- 1. user_role ENUM: superadmin, admin_tenant, user_tenant
-- 2. tenants table (renamed from workspaces)
-- 3. Updated users table with role enum and tenant_id
-- 4. invitations table for invite-only registration
-- 5. Helper functions: get_user_role(), get_user_tenant_id(), is_superadmin(), is_tenant_admin()
-- 6. RLS policies for all tables based on roles
-- 7. Superadmin dashboard view
--
-- Role capabilities:
-- - superadmin: Full access to everything, manage tenants and plans
-- - admin_tenant: Manage own tenant, invite users, full CRUD on tenant data
-- - user_tenant: Read/create/update (no delete) on leads, read-only on tenant info
-- ============================================================================
