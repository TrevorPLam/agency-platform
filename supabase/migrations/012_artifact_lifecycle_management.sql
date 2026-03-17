-- Artifact Lifecycle Management Migration
-- Implements centralized artifact registry with RLS and tenant isolation

-- Enable Row Level Security
ALTER DATABASE SET row_security = on;

-- Artifacts table
CREATE TABLE IF NOT EXISTS public.artifacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('package', 'container', 'binary', 'document')),
  status TEXT NOT NULL CHECK (status IN ('created', 'testing', 'staging', 'production', 'archived', 'deprecated')),
  environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
  integrity TEXT NOT NULL,
  size BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}',
  promotion_path JSONB NOT NULL DEFAULT '[]',
  retention_policy JSONB NOT NULL DEFAULT '{}',
  
  -- Tenant isolation
  tenant_id TEXT NOT NULL,
  
  -- Constraints
  CONSTRAINT artifacts_name_version_environment_tenant UNIQUE (name, version, environment, tenant_id),
  CONSTRAINT artifacts_integrity_format CHECK (integrity ~ '^sha256:[a-f0-9]{64}$')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_artifacts_tenant_id ON public.artifacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_tenant_created_at ON public.artifacts(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_artifacts_name ON public.artifacts(name);
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON public.artifacts(type);
CREATE INDEX IF NOT EXISTS idx_artifacts_status ON public.artifacts(status);
CREATE INDEX IF NOT EXISTS idx_artifacts_environment ON public.artifacts(environment);
CREATE INDEX IF NOT EXISTS idx_artifacts_name_version_tenant ON public.artifacts(name, version, tenant_id);

-- Promotion steps table
CREATE TABLE IF NOT EXISTS public.promotion_steps (
  id TEXT PRIMARY KEY,
  from_environment TEXT NOT NULL CHECK (from_environment IN ('development', 'staging', 'production')),
  to_environment TEXT NOT NULL CHECK (to_environment IN ('development', 'staging', 'production')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'failed')),
  required_approvals INTEGER NOT NULL DEFAULT 1,
  current_approvals INTEGER NOT NULL DEFAULT 0,
  checks JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Tenant isolation
  tenant_id TEXT NOT NULL,
  
  -- Constraints
  CONSTRAINT promotion_steps_approvals_check CHECK (current_approvals >= 0 AND current_approvals <= required_approvals),
  CONSTRAINT promotion_steps_environment_check CHECK (from_environment != to_environment)
);

-- Create indexes for promotion steps
CREATE INDEX IF NOT EXISTS idx_promotion_steps_tenant_id ON public.promotion_steps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_promotion_steps_status ON public.promotion_steps(status);
CREATE INDEX IF NOT EXISTS idx_promotion_steps_to_environment ON public.promotion_steps(to_environment);
CREATE INDEX IF NOT EXISTS idx_promotion_steps_created_at ON public.promotion_steps(created_at);

-- Promotion approvals table
CREATE TABLE IF NOT EXISTS public.promotion_approvals (
  id BIGSERIAL PRIMARY KEY,
  promotion_id TEXT NOT NULL REFERENCES public.promotion_steps(id) ON DELETE CASCADE,
  approver TEXT NOT NULL,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Tenant isolation
  tenant_id TEXT NOT NULL,
  
  -- Constraints
  CONSTRAINT promotion_approvals_unique UNIQUE (promotion_id, approver, tenant_id)
);

-- Create indexes for promotion approvals
CREATE INDEX IF NOT EXISTS idx_promotion_approvals_tenant_id ON public.promotion_approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_promotion_approvals_promotion_id ON public.promotion_approvals(promotion_id);

-- Promotion rejections table
CREATE TABLE IF NOT EXISTS public.promotion_rejections (
  id BIGSERIAL PRIMARY KEY,
  promotion_id TEXT NOT NULL REFERENCES public.promotion_steps(id) ON DELETE CASCADE,
  rejector TEXT NOT NULL,
  reason TEXT NOT NULL,
  rejected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Tenant isolation
  tenant_id TEXT NOT NULL
);

-- Create indexes for promotion rejections
CREATE INDEX IF NOT EXISTS idx_promotion_rejections_tenant_id ON public.promotion_rejections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_promotion_rejections_promotion_id ON public.promotion_rejections(promotion_id);

-- Policy rules table
CREATE TABLE IF NOT EXISTS public.policy_rules (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('retention', 'promotion', 'security', 'compliance')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Tenant isolation
  tenant_id TEXT NOT NULL,
  
  -- Constraints
  CONSTRAINT policy_rules_name_tenant_unique UNIQUE (name, tenant_id)
);

-- Create indexes for policy rules
CREATE INDEX IF NOT EXISTS idx_policy_rules_tenant_id ON public.policy_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policy_rules_type ON public.policy_rules(type);
CREATE INDEX IF NOT EXISTS idx_policy_rules_enabled ON public.policy_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_policy_rules_name ON public.policy_rules(name);

-- Retention policies table
CREATE TABLE IF NOT EXISTS public.retention_policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
  max_age INTEGER NOT NULL, -- days
  max_versions INTEGER NOT NULL,
  archive_older_than INTEGER NOT NULL, -- days
  delete_older_than INTEGER NOT NULL, -- days
  exceptions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Tenant isolation
  tenant_id TEXT NOT NULL,
  
  -- Constraints
  CONSTRAINT retention_policies_name_environment_tenant_unique UNIQUE (name, environment, tenant_id),
  CONSTRAINT retention_policies_age_check CHECK (max_age > 0),
  CONSTRAINT retention_policies_versions_check CHECK (max_versions > 0),
  CONSTRAINT retention_policies_archive_delete_check CHECK (archive_older_than <= delete_older_than)
);

-- Create indexes for retention policies
CREATE INDEX IF NOT EXISTS idx_retention_policies_tenant_id ON public.retention_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_retention_policies_environment ON public.retention_policies(environment);
CREATE INDEX IF NOT EXISTS idx_retention_policies_name ON public.retention_policies(name);

-- Promotion checks table
CREATE TABLE IF NOT EXISTS public.promotion_checks (
  id BIGSERIAL PRIMARY KEY,
  promotion_step_id TEXT NOT NULL REFERENCES public.promotion_steps(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL CHECK (check_type IN ('security', 'performance', 'compliance', 'manual')),
  check_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'passed', 'failed', 'skipped')),
  result TEXT,
  required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Tenant isolation
  tenant_id TEXT NOT NULL,
  
  -- Constraints
  CONSTRAINT promotion_checks_unique UNIQUE (promotion_step_id, check_type, tenant_id)
);

-- Create indexes for promotion checks
CREATE INDEX IF NOT EXISTS idx_promotion_checks_tenant_id ON public.promotion_checks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_promotion_checks_promotion_step_id ON public.promotion_checks(promotion_step_id);
CREATE INDEX IF NOT EXISTS idx_promotion_checks_status ON public.promotion_checks(status);

-- Enable Row Level Security on all tables
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_rejections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for artifacts table
CREATE POLICY "Users can view artifacts in their tenant" ON public.artifacts
  FOR SELECT USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can insert artifacts in their tenant" ON public.artifacts
  FOR INSERT WITH CHECK (tenant_id = public.tenant_id());

CREATE POLICY "Users can update artifacts in their tenant" ON public.artifacts
  FOR UPDATE USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can delete artifacts in their tenant" ON public.artifacts
  FOR DELETE USING (tenant_id = public.tenant_id());

-- RLS Policies for promotion_steps table
CREATE POLICY "Users can view promotion steps in their tenant" ON public.promotion_steps
  FOR SELECT USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can insert promotion steps in their tenant" ON public.promotion_steps
  FOR INSERT WITH CHECK (tenant_id = public.tenant_id());

CREATE POLICY "Users can update promotion steps in their tenant" ON public.promotion_steps
  FOR UPDATE USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can delete promotion steps in their tenant" ON public.promotion_steps
  FOR DELETE USING (tenant_id = public.tenant_id());

-- RLS Policies for promotion_approvals table
CREATE POLICY "Users can view promotion approvals in their tenant" ON public.promotion_approvals
  FOR SELECT USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can insert promotion approvals in their tenant" ON public.promotion_approvals
  FOR INSERT WITH CHECK (tenant_id = public.tenant_id());

-- RLS Policies for promotion_rejections table
CREATE POLICY "Users can view promotion rejections in their tenant" ON public.promotion_rejections
  FOR SELECT USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can insert promotion rejections in their tenant" ON public.promotion_rejections
  FOR INSERT WITH CHECK (tenant_id = public.tenant_id());

-- RLS Policies for policy_rules table
CREATE POLICY "Users can view policy rules in their tenant" ON public.policy_rules
  FOR SELECT USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can insert policy rules in their tenant" ON public.policy_rules
  FOR INSERT WITH CHECK (tenant_id = public.tenant_id());

CREATE POLICY "Users can update policy rules in their tenant" ON public.policy_rules
  FOR UPDATE USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can delete policy rules in their tenant" ON public.policy_rules
  FOR DELETE USING (tenant_id = public.tenant_id());

-- RLS Policies for retention_policies table
CREATE POLICY "Users can view retention policies in their tenant" ON public.retention_policies
  FOR SELECT USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can insert retention policies in their tenant" ON public.retention_policies
  FOR INSERT WITH CHECK (tenant_id = public.tenant_id());

CREATE POLICY "Users can update retention policies in their tenant" ON public.retention_policies
  FOR UPDATE USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can delete retention policies in their tenant" ON public.retention_policies
  FOR DELETE USING (tenant_id = public.tenant_id());

-- RLS Policies for promotion_checks table
CREATE POLICY "Users can view promotion checks in their tenant" ON public.promotion_checks
  FOR SELECT USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can insert promotion checks in their tenant" ON public.promotion_checks
  FOR INSERT WITH CHECK (tenant_id = public.tenant_id());

CREATE POLICY "Users can update promotion checks in their tenant" ON public.promotion_checks
  FOR UPDATE USING (tenant_id = public.tenant_id());

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_artifacts_updated_at
  BEFORE UPDATE ON public.artifacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_policy_rules_updated_at
  BEFORE UPDATE ON public.policy_rules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_retention_policies_updated_at
  BEFORE UPDATE ON public.retention_policies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_promotion_checks_updated_at
  BEFORE UPDATE ON public.promotion_checks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create default retention policies for each environment
INSERT INTO public.retention_policies (
  id, name, environment, max_age, max_versions, archive_older_than, delete_older_than, tenant_id
) VALUES
  ('default-package-development', 'Default Package Development Policy', 'development', 30, 3, 15, 30, 'default'),
  ('default-package-staging', 'Default Package Staging Policy', 'staging', 90, 5, 45, 90, 'default'),
  ('default-package-production', 'Default Package Production Policy', 'production', 365, 10, 180, 365, 'default'),
  ('default-container-development', 'Default Container Development Policy', 'development', 30, 3, 15, 30, 'default'),
  ('default-container-staging', 'Default Container Staging Policy', 'staging', 90, 5, 45, 90, 'default'),
  ('default-container-production', 'Default Container Production Policy', 'production', 365, 10, 180, 365, 'default'),
  ('default-binary-development', 'Default Binary Development Policy', 'development', 30, 3, 15, 30, 'default'),
  ('default-binary-staging', 'Default Binary Staging Policy', 'staging', 90, 5, 45, 90, 'default'),
  ('default-binary-production', 'Default Binary Production Policy', 'production', 365, 10, 180, 365, 'default'),
  ('default-document-development', 'Default Document Development Policy', 'development', 30, 5, 20, 30, 'default'),
  ('default-document-staging', 'Default Document Staging Policy', 'staging', 90, 10, 60, 90, 'default'),
  ('default-document-production', 'Default Document Production Policy', 'production', 365, 20, 240, 365, 'default')
ON CONFLICT (id) DO NOTHING;

-- Create default policy rules
INSERT INTO public.policy_rules (
  id, type, name, description, enabled, conditions, actions, tenant_id
) VALUES
  ('security-block-critical', 'security', 'Block Critical Vulnerabilities', 'Block artifacts with critical security vulnerabilities', true, 
   '[{"field": "metadata", "operator": "contains", "value": "critical"}]', 
   '[{"type": "block", "parameters": {"message": "Artifact has critical security vulnerabilities"}}]', 
   'default'),
  ('promotion-production-approval', 'promotion', 'Production Approval Required', 'Require approval for production promotions', true,
   '[{"field": "environment", "operator": "equals", "value": "production"}]',
   '[{"type": "warn", "parameters": {"message": "Production promotion requires approval"}}]',
   'default'),
  ('retention-cleanup-warning', 'retention', 'Retention Cleanup Warning', 'Warn before artifact cleanup', true,
   '[{"field": "age", "operator": "greaterThan", "value": 180}]',
   '[{"type": "notify", "parameters": {"message": "Artifact eligible for cleanup", "recipients": ["admin"]}}]',
   'default')
ON CONFLICT (id) DO NOTHING;
