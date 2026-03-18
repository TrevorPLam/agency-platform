-- Lifecycle Events Migration
-- Adds lifecycle events table for artifact lifecycle management

-- Lifecycle events table
CREATE TABLE IF NOT EXISTS public.lifecycle_events (
  id TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL REFERENCES public.artifacts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'registered', 'testing_started', 'testing_completed', 'promoted', 
    'archived', 'decommissioned', 'maintenance_completed', 
    'security_scan_completed', 'vulnerability_detected'
  )),
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Tenant isolation
  tenant_id TEXT NOT NULL,
  
  -- Constraints
  CONSTRAINT lifecycle_events_type_check CHECK (type IN (
    'registered', 'testing_started', 'testing_completed', 'promoted', 
    'archived', 'decommissioned', 'maintenance_completed', 
    'security_scan_completed', 'vulnerability_detected'
  ))
);

-- Create indexes for lifecycle events
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_tenant_id ON public.lifecycle_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_artifact_id ON public.lifecycle_events(artifact_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_type ON public.lifecycle_events(type);
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_created_at ON public.lifecycle_events(created_at);
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_artifact_type ON public.lifecycle_events(artifact_id, type);
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_tenant_created_at ON public.lifecycle_events(tenant_id, created_at);

-- Enable Row Level Security
ALTER TABLE public.lifecycle_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lifecycle_events table
CREATE POLICY "Users can view lifecycle events in their tenant" ON public.lifecycle_events
  FOR SELECT USING (tenant_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND tenant_id::uuid = public.tenant_id());

CREATE POLICY "Users can insert lifecycle events in their tenant" ON public.lifecycle_events
  FOR INSERT WITH CHECK (tenant_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND tenant_id::uuid = public.tenant_id());

CREATE POLICY "Users can update lifecycle events in their tenant" ON public.lifecycle_events
  FOR UPDATE USING (tenant_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND tenant_id::uuid = public.tenant_id());

CREATE POLICY "Users can delete lifecycle events in their tenant" ON public.lifecycle_events
  FOR DELETE USING (tenant_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND tenant_id::uuid = public.tenant_id());

-- Create a view for lifecycle event statistics
CREATE OR REPLACE VIEW public.lifecycle_event_stats AS
SELECT 
  tenant_id,
  type,
  COUNT(*) as event_count,
  MAX(created_at) as last_event_at,
  MIN(created_at) as first_event_at
FROM public.lifecycle_events
GROUP BY tenant_id, type;

-- Enable RLS on the view
ALTER VIEW public.lifecycle_event_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policy for the view
CREATE POLICY "Users can view lifecycle event stats in their tenant" ON public.lifecycle_event_stats
  FOR SELECT USING (tenant_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND tenant_id::uuid = public.tenant_id());

-- Create a function to clean up old lifecycle events
CREATE OR REPLACE FUNCTION public.cleanup_old_lifecycle_events(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.lifecycle_events
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage to authenticated users
GRANT USAGE ON FUNCTION public.cleanup_old_lifecycle_events(INTEGER) TO authenticated;
