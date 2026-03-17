-- Experiments Framework Migration
-- Implements multi-tenant A/B testing and experimentation platform
-- Following PICOT framework: Population, Intervention, Control, Outcome, Time

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core experiments table
CREATE TABLE public.experiments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Basic experiment info
  name TEXT NOT NULL,
  description TEXT,
  key TEXT NOT NULL, -- Unique identifier for feature flags
  
  -- PICOT Framework fields
  population TEXT NOT NULL, -- Who is being tested (e.g., "all visitors", "mobile users")
  intervention TEXT NOT NULL, -- What is being tested (e.g., "new hero section")
  control TEXT NOT NULL, -- Baseline comparison
  outcome_metric TEXT NOT NULL, -- Primary success metric
  time_horizon TEXT NOT NULL, -- Test duration (e.g., "14 days", "1000 conversions")
  
  -- Experiment configuration
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'archived')),
  traffic_percentage INTEGER DEFAULT 100 CHECK (traffic_percentage BETWEEN 0 AND 100),
  
  -- Owner and metadata
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  hypothesis TEXT NOT NULL, -- Clear hypothesis statement
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(tenant_id, key), -- Unique experiment keys per tenant
  CHECK (ended_at IS NULL OR ended_at > started_at)
);

-- Experiment variants (A, B, C, etc.)
CREATE TABLE public.experiment_variants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL, -- e.g., "Control", "Variant A", "Variant B"
  description TEXT,
  key TEXT NOT NULL, -- e.g., "control", "variant_a", "variant_b"
  is_control BOOLEAN DEFAULT false,
  traffic_percentage INTEGER DEFAULT 0 CHECK (traffic_percentage BETWEEN 0 AND 100),
  
  -- Configuration payload for feature flags
  configuration JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(experiment_id, key),
  CHECK (traffic_percentage >= 0),
  UNIQUE(experiment_id, is_control) WHERE is_control = true -- Only one control variant
);

-- User experiment assignments
CREATE TABLE public.experiment_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.experiment_variants(id) ON DELETE CASCADE,
  
  -- User identification (pseudonymized for privacy)
  user_pseudonym TEXT NOT NULL, -- Hashed user identifier, not PII
  session_id TEXT, -- For anonymous user experiments
  
  -- Assignment metadata
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assignment_source TEXT DEFAULT 'server' CHECK (assignment_source IN ('server', 'client')),
  
  -- Constraints
  UNIQUE(user_pseudonym, experiment_id), -- One assignment per user per experiment
  CHECK (assigned_at >= COALESCE((SELECT started_at FROM public.experiments WHERE id = experiment_id), '1970-01-01'::timestamp))
);

-- Experiment results and metrics
CREATE TABLE public.experiment_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.experiment_variants(id) ON DELETE CASCADE,
  
  -- Metric information
  metric_name TEXT NOT NULL, -- e.g., "conversion_rate", "click_through_rate"
  metric_value NUMERIC NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('count', 'rate', 'average', 'sum')),
  
  -- Statistical significance
  sample_size INTEGER NOT NULL DEFAULT 0,
  confidence_level NUMERIC DEFAULT 0.95,
  p_value NUMERIC,
  is_significant BOOLEAN DEFAULT false,
  
  -- Time window
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(experiment_id, variant_id, metric_name, window_start, window_end)
);

-- Experiment events for audit trail
CREATE TABLE public.experiment_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES public.experiments(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.experiment_variants(id) ON DELETE CASCADE,
  
  -- Event information
  event_type TEXT NOT NULL CHECK (event_type IN ('started', 'paused', 'stopped', 'variant_assigned', 'metric_recorded')),
  event_data JSONB DEFAULT '{}',
  
  -- User context (pseudonymized)
  user_pseudonym TEXT,
  session_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX CONCURRENTLY idx_experiments_tenant_id ON public.experiments(tenant_id);
CREATE INDEX CONCURRENTLY idx_experiments_status ON public.experiments(status);
CREATE INDEX CONCURRENTLY idx_experiments_tenant_status ON public.experiments(tenant_id, status);
CREATE INDEX CONCURRENTLY idx_experiments_created_at ON public.experiments(created_at);

CREATE INDEX CONCURRENTLY idx_experiment_variants_experiment_id ON public.experiment_variants(experiment_id);
CREATE INDEX CONCURRENTLY idx_experiment_variants_tenant_id ON public.experiment_variants(tenant_id);
CREATE INDEX CONCURRENTLY idx_experiment_variants_experiment_tenant ON public.experiment_variants(experiment_id, tenant_id);

CREATE INDEX CONCURRENTLY idx_experiment_assignments_tenant_id ON public.experiment_assignments(tenant_id);
CREATE INDEX CONCURRENTLY idx_experiment_assignments_experiment_id ON public.experiment_assignments(experiment_id);
CREATE INDEX CONCURRENTLY idx_experiment_assignments_user_pseudonym ON public.experiment_assignments(user_pseudonym);
CREATE INDEX CONCURRENTLY idx_experiment_assignments_assigned_at ON public.experiment_assignments(assigned_at);

CREATE INDEX CONCURRENTLY idx_experiment_metrics_tenant_id ON public.experiment_metrics(tenant_id);
CREATE INDEX CONCURRENTLY idx_experiment_metrics_experiment_id ON public.experiment_metrics(experiment_id);
CREATE INDEX CONCURRENTLY idx_experiment_metrics_variant_id ON public.experiment_metrics(variant_id);
CREATE INDEX CONCURRENTLY idx_experiment_metrics_window ON public.experiment_metrics(window_start, window_end);

CREATE INDEX CONCURRENTLY idx_experiment_events_tenant_id ON public.experiment_events(tenant_id);
CREATE INDEX CONCURRENTLY idx_experiment_events_experiment_id ON public.experiment_events(experiment_id);
CREATE INDEX CONCURRENTLY idx_experiment_events_created_at ON public.experiment_events(created_at);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_experiments_updated_at
  BEFORE UPDATE ON public.experiments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_experiment_variants_updated_at
  BEFORE UPDATE ON public.experiment_variants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Helper function to get user's pseudonym for experiments
CREATE OR REPLACE FUNCTION public.get_user_experiment_pseudonym(user_id TEXT, tenant_id UUID)
RETURNS TEXT AS $$
BEGIN
  -- Create a consistent, non-reversible hash for user identification
  -- This prevents PII exposure while maintaining consistency
  RETURN encode(sha256(user_id || tenant_id::TEXT || 'experiment_salt'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign user to experiment variant
CREATE OR REPLACE FUNCTION public.assign_experiment_variant(
  p_experiment_key TEXT,
  p_user_id TEXT,
  p_tenant_id UUID DEFAULT public.tenant_id(),
  p_session_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  variant_key TEXT,
  variant_config JSONB,
  is_new_assignment BOOLEAN
) AS $$
DECLARE
  v_experiment_id UUID;
  v_variant_id UUID;
  v_user_pseudonym TEXT;
  v_existing_variant_key TEXT;
  v_hash_result INTEGER;
  v_total_percentage INTEGER;
BEGIN
  -- Get experiment ID
  SELECT id INTO v_experiment_id
  FROM public.experiments
  WHERE key = p_experiment_key 
    AND tenant_id = p_tenant_id
    AND status = 'running'
    AND started_at <= NOW()
    AND (ended_at IS NULL OR ended_at > NOW());
  
  IF v_experiment_id IS NULL THEN
    -- No running experiment found
    RETURN;
  END IF;
  
  -- Get user pseudonym
  v_user_pseudonym := public.get_user_experiment_pseudonym(p_user_id, p_tenant_id);
  
  -- Check for existing assignment
  SELECT ev.key INTO v_existing_variant_key
  FROM public.experiment_assignments ea
  JOIN public.experiment_variants ev ON ea.variant_id = ev.id
  WHERE ea.experiment_id = v_experiment_id
    AND ea.user_pseudonym = v_user_pseudonym;
  
  IF v_existing_variant_key IS NOT NULL THEN
    -- Return existing assignment
    SELECT ev.key, ev.configuration, false INTO variant_key, variant_config, is_new_assignment
    FROM public.experiment_assignments ea
    JOIN public.experiment_variants ev ON ea.variant_id = ev.id
    WHERE ea.experiment_id = v_experiment_id
      AND ea.user_pseudonym = v_user_pseudonym;
    
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- New assignment: use consistent hashing
  v_hash_result := (public.get_user_experiment_pseudonym(p_user_id, p_tenant_id)::bigint % 100);
  
  -- Find variant based on traffic percentage
  SELECT ev.id, ev.key, ev.configuration INTO v_variant_id, variant_key, variant_config
  FROM public.experiment_variants ev
  WHERE ev.experiment_id = v_experiment_id
  ORDER BY
    CASE 
      WHEN ev.is_control THEN 0
      ELSE 1
    END,
    ev.traffic_percentage DESC;
  
  -- Simple assignment logic (can be enhanced for more sophisticated distribution)
  -- For now, assign to first variant that matches hash
  FOR variant_record IN 
    SELECT ev.id, ev.key, ev.configuration, ev.traffic_percentage
    FROM public.experiment_variants ev
    WHERE ev.experiment_id = v_experiment_id
    ORDER BY ev.traffic_percentage DESC
  LOOP
    IF v_hash_result < variant_record.traffic_percentage THEN
      v_variant_id := variant_record.id;
      variant_key := variant_record.key;
      variant_config := variant_record.configuration;
      EXIT;
    END IF;
  END LOOP;
  
  -- Fallback to control if no variant matched
  IF v_variant_id IS NULL THEN
    SELECT id, key, configuration INTO v_variant_id, variant_key, variant_config
    FROM public.experiment_variants
    WHERE experiment_id = v_experiment_id AND is_control = true;
  END IF;
  
  -- Create assignment
  INSERT INTO public.experiment_assignments (
    tenant_id, experiment_id, variant_id, user_pseudonym, session_id
  ) VALUES (
    p_tenant_id, v_experiment_id, v_variant_id, v_user_pseudonym, p_session_id
  );
  
  -- Log assignment event
  INSERT INTO public.experiment_events (
    tenant_id, experiment_id, variant_id, event_type, event_data, user_pseudonym, session_id
  ) VALUES (
    p_tenant_id, v_experiment_id, v_variant_id, 'variant_assigned', 
    json_build_object('variant_key', variant_key), v_user_pseudonym, p_session_id
  );
  
  is_new_assignment := true;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Experiments
CREATE POLICY "Tenant users can view experiments" ON public.experiments FOR SELECT USING (tenant_id = public.tenant_id());
CREATE POLICY "Tenant admins can insert experiments" ON public.experiments FOR INSERT WITH CHECK (tenant_id = public.tenant_id());
CREATE POLICY "Tenant admins can update own experiments" ON public.experiments FOR UPDATE USING (tenant_id = public.tenant_id());
CREATE POLICY "Tenant admins can delete own experiments" ON public.experiments FOR DELETE USING (tenant_id = public.tenant_id());

-- RLS Policies for Experiment Variants
CREATE POLICY "Tenant users can view experiment variants" ON public.experiment_variants FOR SELECT USING (tenant_id = public.tenant_id());
CREATE POLICY "Tenant admins can manage experiment variants" ON public.experiment_variants FOR ALL USING (tenant_id = public.tenant_id());

-- RLS Policies for Experiment Assignments
CREATE POLICY "System can manage experiment assignments" ON public.experiment_assignments FOR ALL USING (tenant_id = public.tenant_id());

-- RLS Policies for Experiment Metrics
CREATE POLICY "Tenant users can view experiment metrics" ON public.experiment_metrics FOR SELECT USING (tenant_id = public.tenant_id());
CREATE POLICY "Tenant admins can manage experiment metrics" ON public.experiment_metrics FOR ALL USING (tenant_id = public.tenant_id());

-- RLS Policies for Experiment Events
CREATE POLICY "Tenant users can view experiment events" ON public.experiment_events FOR SELECT USING (tenant_id = public.tenant_id());
CREATE POLICY "System can create experiment events" ON public.experiment_events FOR INSERT WITH CHECK (tenant_id = public.tenant_id());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experiments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experiment_variants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experiment_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experiment_metrics TO authenticated;
GRANT SELECT, INSERT ON public.experiment_events TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_user_experiment_pseudonym TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_experiment_variant TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.experiments IS 'Multi-tenant A/B testing experiments following PICOT framework';
COMMENT ON TABLE public.experiment_variants IS 'Experiment variants (control, treatment groups) with configuration';
COMMENT ON TABLE public.experiment_assignments IS 'User-to-variant assignments with pseudonymized identifiers';
COMMENT ON TABLE public.experiment_metrics IS 'Statistical results and metrics for experiments';
COMMENT ON TABLE public.experiment_events IS 'Audit trail of experiment events and changes';

COMMENT ON COLUMN public.experiments.population IS 'PICOT: Population being tested';
COMMENT ON COLUMN public.experiments.intervention IS 'PICOT: What is being tested';
COMMENT ON COLUMN public.experiments.control IS 'PICOT: Baseline comparison';
COMMENT ON COLUMN public.experiments.outcome_metric IS 'PICOT: Primary success metric';
COMMENT ON COLUMN public.experiments.time_horizon IS 'PICOT: Test duration or sample size';
COMMENT ON COLUMN public.experiment_assignments.user_pseudonym IS 'Hashed user identifier for privacy (GDPR compliant)';
