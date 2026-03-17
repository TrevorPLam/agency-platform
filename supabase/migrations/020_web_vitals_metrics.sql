-- Web Vitals Metrics Table
-- Stores Core Web Vitals data with tenant isolation for performance monitoring

-- Create Web Vitals metrics table
CREATE TABLE IF NOT EXISTS public.web_vitals_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  user_agent TEXT,
  device_category TEXT NOT NULL CHECK (device_category IN ('mobile', 'tablet', 'desktop')),
  connection_type TEXT NOT NULL CHECK (connection_type IN ('slow-2g', '2g', '3g', '4g', '5g', 'unknown')),
  lcp INTEGER NOT NULL CHECK (lcp >= 0), -- Largest Contentful Paint (ms)
  inp INTEGER NOT NULL CHECK (inp >= 0), -- Interaction to Next Paint (ms)
  cls DECIMAL(4,3) NOT NULL CHECK (cls >= 0), -- Cumulative Layout Shift
  fcp INTEGER NOT NULL CHECK (fcp >= 0), -- First Contentful Paint (ms)
  ttfb INTEGER NOT NULL CHECK (ttfb >= 0), -- Time to First Byte (ms)
  rating TEXT NOT NULL CHECK (rating IN ('good', 'needs-improvement', 'poor')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  context JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT web_vitals_metrics_lcp_reasonable CHECK (lcp <= 60000), -- Max 60 seconds
  CONSTRAINT web_vitals_metrics_inp_reasonable CHECK (inp <= 10000), -- Max 10 seconds
  CONSTRAINT web_vitals_metrics_fcp_reasonable CHECK (fcp <= 60000), -- Max 60 seconds
  CONSTRAINT web_vitals_metrics_ttfb_reasonable CHECK (ttfb <= 30000) -- Max 30 seconds
);

ALTER TABLE public.web_vitals_metrics ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_web_vitals_metrics_tenant_id 
  ON public.web_vitals_metrics(tenant_id);

CREATE INDEX IF NOT EXISTS idx_web_vitals_metrics_timestamp 
  ON public.web_vitals_metrics(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_web_vitals_metrics_tenant_timestamp 
  ON public.web_vitals_metrics(tenant_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_web_vitals_metrics_page_url 
  ON public.web_vitals_metrics(page_url);

CREATE INDEX IF NOT EXISTS idx_web_vitals_metrics_device_category 
  ON public.web_vitals_metrics(device_category);

CREATE INDEX IF NOT EXISTS idx_web_vitals_metrics_rating 
  ON public.web_vitals_metrics(rating);

-- Composite index for common dashboard queries
CREATE INDEX IF NOT EXISTS idx_web_vitals_metrics_dashboard 
  ON public.web_vitals_metrics(tenant_id, timestamp DESC, rating, device_category);

-- Row Level Security Policies
CREATE POLICY "Users can view their own tenant's web vitals" ON public.web_vitals_metrics
  FOR SELECT
  USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can insert their own tenant's web vitals" ON public.web_vitals_metrics
  FOR INSERT
  WITH CHECK (tenant_id = public.tenant_id());

CREATE POLICY "Platform admins can view all web vitals" ON public.web_vitals_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_users.tenant_id = public.tenant_id()
        AND tenant_users.user_id = auth.uid()
        AND tenant_users.role = 'platform_admin'
    )
  );

-- Performance budgets table
CREATE TABLE IF NOT EXISTS public.performance_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('lcp', 'inp', 'cls', 'fcp', 'ttfb', 'bundle-size', 'image-size')),
  threshold INTEGER NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('milliseconds', 'bytes', 'score')),
  type TEXT NOT NULL CHECK (type IN ('maximum', 'minimum', 'target')),
  active BOOLEAN NOT NULL DEFAULT true,
  alert_severity TEXT NOT NULL CHECK (alert_severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT performance_budgets_threshold_positive CHECK (threshold > 0),
  CONSTRAINT performance_budgets_unique_tenant_category UNIQUE (tenant_id, category, name)
);

-- Indexes for performance budgets
CREATE INDEX IF NOT EXISTS idx_performance_budgets_tenant_id 
  ON public.performance_budgets(tenant_id);

CREATE INDEX IF NOT EXISTS idx_performance_budgets_active 
  ON public.performance_budgets(active);

CREATE INDEX IF NOT EXISTS idx_performance_budgets_category 
  ON public.performance_budgets(category);

-- Row Level Security Policies for performance budgets
CREATE POLICY "Users can view their own tenant's performance budgets" ON public.performance_budgets
  FOR SELECT
  USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can manage their own tenant's performance budgets" ON public.performance_budgets
  FOR ALL
  USING (tenant_id = public.tenant_id())
  WITH CHECK (tenant_id = public.tenant_id());

CREATE POLICY "Platform admins can manage all performance budgets" ON public.performance_budgets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_users.tenant_id = public.tenant_id()
        AND tenant_users.user_id = auth.uid()
        AND tenant_users.role = 'platform_admin'
    )
  );

-- Performance alerts table
CREATE TABLE IF NOT EXISTS public.performance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  metric TEXT NOT NULL CHECK (metric IN ('lcp', 'inp', 'cls', 'fcp', 'ttfb')),
  threshold INTEGER NOT NULL,
  current_value INTEGER NOT NULL,
  threshold_type TEXT NOT NULL CHECK (threshold_type IN ('absolute', 'percentage', 'rating')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  active BOOLEAN NOT NULL DEFAULT true,
  violation_count INTEGER NOT NULL DEFAULT 1,
  last_triggered TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT performance_alerts_violation_count_positive CHECK (violation_count > 0)
);

-- Indexes for performance alerts
CREATE INDEX IF NOT EXISTS idx_performance_alerts_tenant_id 
  ON public.performance_alerts(tenant_id);

CREATE INDEX IF NOT EXISTS idx_performance_alerts_active 
  ON public.performance_alerts(active);

CREATE INDEX IF NOT EXISTS idx_performance_alerts_severity 
  ON public.performance_alerts(severity);

CREATE INDEX IF NOT EXISTS idx_performance_alerts_last_triggered 
  ON public.performance_alerts(last_triggered DESC);

-- Row Level Security Policies for performance alerts
CREATE POLICY "Users can view their own tenant's performance alerts" ON public.performance_alerts
  FOR SELECT
  USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can manage their own tenant's performance alerts" ON public.performance_alerts
  FOR ALL
  USING (tenant_id = public.tenant_id())
  WITH CHECK (tenant_id = public.tenant_id());

CREATE POLICY "Platform admins can manage all performance alerts" ON public.performance_alerts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users
      WHERE tenant_users.tenant_id = public.tenant_id()
        AND tenant_users.user_id = auth.uid()
        AND tenant_users.role = 'platform_admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_performance_budgets_updated_at
  BEFORE UPDATE ON public.performance_budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_alerts_updated_at
  BEFORE UPDATE ON public.performance_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default performance budgets for existing tenants
INSERT INTO public.performance_budgets (tenant_id, name, category, threshold, unit, type, active, alert_severity)
SELECT 
  tenant_id,
  'LCP Budget - Good Performance',
  'lcp',
  2500,
  'milliseconds',
  'maximum',
  true,
  'medium'
FROM public.tenants
ON CONFLICT (tenant_id, category, name) DO NOTHING;

INSERT INTO public.performance_budgets (tenant_id, name, category, threshold, unit, type, active, alert_severity)
SELECT 
  tenant_id,
  'INP Budget - Responsive Interaction',
  'inp',
  200,
  'milliseconds',
  'maximum',
  true,
  'medium'
FROM public.tenants
ON CONFLICT (tenant_id, category, name) DO NOTHING;

INSERT INTO public.performance_budgets (tenant_id, name, category, threshold, unit, type, active, alert_severity)
SELECT 
  tenant_id,
  'CLS Budget - Visual Stability',
  'cls',
  100, -- Store as integer (0.1 * 1000)
  'score',
  'maximum',
  true,
  'high'
FROM public.tenants
ON CONFLICT (tenant_id, category, name) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT ON public.web_vitals_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.performance_budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.performance_alerts TO authenticated;

