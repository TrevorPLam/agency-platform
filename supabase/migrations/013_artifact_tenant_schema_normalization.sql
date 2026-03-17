-- Artifact Tenant Schema Normalization Migration
-- Aligns artifact tenant columns with canonical tenant UUID model

-- Enable Row Level Security
ALTER DATABASE SET row_security = on;

-- Add new UUID tenant_id columns to artifact tables
ALTER TABLE public.artifacts 
ADD COLUMN tenant_id_uuid uuid;

ALTER TABLE public.promotion_steps 
ADD COLUMN tenant_id_uuid uuid;

-- Update artifact_versions table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifact_versions') THEN
        ALTER TABLE public.artifact_versions 
        ADD COLUMN tenant_id_uuid uuid;
    END IF;
END $$;

-- Migrate data from TEXT tenant_id to UUID tenant_id_uuid
-- This assumes the TEXT tenant_id values are valid UUID strings
UPDATE public.artifacts 
SET tenant_id_uuid = tenant_id::uuid 
WHERE tenant_id IS NOT NULL AND tenant_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

UPDATE public.promotion_steps 
SET tenant_id_uuid = (
    SELECT a.tenant_id_uuid 
    FROM public.artifacts a 
    WHERE a.id = promotion_steps.artifact_id
    AND a.tenant_id_uuid IS NOT NULL
) 
WHERE EXISTS (
    SELECT 1 FROM public.artifacts a 
    WHERE a.id = promotion_steps.artifact_id 
    AND a.tenant_id_uuid IS NOT NULL
);

-- Update artifact_versions if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifact_versions') THEN
        UPDATE public.artifact_versions 
        SET tenant_id_uuid = (
            SELECT a.tenant_id_uuid 
            FROM public.artifacts a 
            WHERE a.id = artifact_versions.artifact_id
            AND a.tenant_id_uuid IS NOT NULL
        ) 
        WHERE EXISTS (
            SELECT 1 FROM public.artifacts a 
            WHERE a.id = artifact_versions.artifact_id 
            AND a.tenant_id_uuid IS NOT NULL
        );
    END IF;
END $$;

-- Make the new UUID columns NOT NULL after data migration
ALTER TABLE public.artifacts 
ALTER COLUMN tenant_id_uuid SET NOT NULL;

ALTER TABLE public.promotion_steps 
ALTER COLUMN tenant_id_uuid SET NOT NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifact_versions') THEN
        ALTER TABLE public.artifact_versions 
        ALTER COLUMN tenant_id_uuid SET NOT NULL;
    END IF;
END $$;

-- Add foreign key constraints to canonical tenants table
ALTER TABLE public.artifacts 
ADD CONSTRAINT artifacts_tenant_id_fkey 
FOREIGN KEY (tenant_id_uuid) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.promotion_steps 
ADD CONSTRAINT promotion_steps_tenant_id_fkey 
FOREIGN KEY (tenant_id_uuid) REFERENCES public.tenants(id) ON DELETE CASCADE;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifact_versions') THEN
        ALTER TABLE public.artifact_versions 
        ADD CONSTRAINT artifact_versions_tenant_id_fkey 
        FOREIGN KEY (tenant_id_uuid) REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create new UUID-based indexes for performance
CREATE INDEX IF NOT EXISTS idx_artifacts_tenant_id_uuid ON public.artifacts(tenant_id_uuid);
CREATE INDEX IF NOT EXISTS idx_artifacts_tenant_uuid_created_at ON public.artifacts(tenant_id_uuid, created_at);
CREATE INDEX IF NOT EXISTS idx_artifacts_name_version_tenant_uuid ON public.artifacts(name, version, tenant_id_uuid);

CREATE INDEX IF NOT EXISTS idx_promotion_steps_tenant_id_uuid ON public.promotion_steps(tenant_id_uuid);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifact_versions') THEN
        CREATE INDEX IF NOT EXISTS idx_artifact_versions_tenant_id_uuid ON public.artifact_versions(tenant_id_uuid);
        CREATE INDEX IF NOT EXISTS idx_artifact_versions_tenant_uuid_created_at ON public.artifact_versions(tenant_id_uuid, created_at);
    END IF;
END $$;

-- Update RLS policies to use UUID tenant_id
DROP POLICY IF EXISTS "Artifacts tenant isolation" ON public.artifacts;
CREATE POLICY "Artifacts tenant isolation" ON public.artifacts
    FOR ALL
    USING (tenant_id_uuid = public.tenant_id())
    WITH CHECK (tenant_id_uuid = public.tenant_id());

DROP POLICY IF EXISTS "Promotion steps tenant isolation" ON public.promotion_steps;
CREATE POLICY "Promotion steps tenant isolation" ON public.promotion_steps
    FOR ALL
    USING (tenant_id_uuid = public.tenant_id())
    WITH CHECK (tenant_id_uuid = public.tenant_id());

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifact_versions') THEN
        DROP POLICY IF EXISTS "Artifact versions tenant isolation" ON public.artifact_versions;
        CREATE POLICY "Artifact versions tenant isolation" ON public.artifact_versions
            FOR ALL
            USING (tenant_id_uuid = public.tenant_id())
            WITH CHECK (tenant_id_uuid = public.tenant_id());
    END IF;
END $$;

-- Update unique constraints to use UUID tenant_id
ALTER TABLE public.artifacts 
DROP CONSTRAINT IF EXISTS artifacts_name_version_environment_tenant;

ALTER TABLE public.artifacts 
ADD CONSTRAINT artifacts_name_version_environment_tenant_uuid 
UNIQUE (name, version, environment, tenant_id_uuid);

-- Drop old TEXT tenant_id columns (safe to do after migration)
ALTER TABLE public.artifacts 
DROP COLUMN IF EXISTS tenant_id;

ALTER TABLE public.promotion_steps 
DROP COLUMN IF EXISTS tenant_id;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifact_versions') THEN
        ALTER TABLE public.artifact_versions 
        DROP COLUMN IF EXISTS tenant_id;
    END IF;
END $$;

-- Update table comments
COMMENT ON COLUMN public.artifacts.tenant_id_uuid IS 'UUID reference to canonical tenants table for proper tenant isolation';
COMMENT ON COLUMN public.promotion_steps.tenant_id_uuid IS 'UUID reference to canonical tenants table for proper tenant isolation';

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artifact_versions') THEN
        COMMENT ON COLUMN public.artifact_versions.tenant_id_uuid IS 'UUID reference to canonical tenants table for proper tenant isolation';
    END IF;
END $$;
