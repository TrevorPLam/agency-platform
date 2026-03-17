-- Cost Monitoring System Migration
-- Creates tables for cost metrics, budget alerts, and optimization recommendations
-- Implements proper Row-Level Security (RLS) for tenant isolation

-- Cost Metrics Table
-- Stores historical cost data with tenant isolation
CREATE TABLE IF NOT EXISTS public.cost_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    storage_usage BIGINT DEFAULT 0, -- Storage usage in bytes
    cicd_runtime INTEGER DEFAULT 0, -- CI/CD runtime in minutes
    bandwidth_usage BIGINT DEFAULT 0, -- Bandwidth usage in bytes
    total_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- Total cost in currency
    currency VARCHAR(3) NOT NULL DEFAULT 'USD', -- Currency code
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    period VARCHAR(10) NOT NULL CHECK (period IN ('hourly', 'daily', 'weekly', 'monthly')),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Indexes for performance
    CONSTRAINT cost_metrics_tenant_period CHECK (tenant_id IS NOT NULL AND period IS NOT NULL)
);

ALTER TABLE public.cost_metrics ENABLE ROW LEVEL SECURITY;

-- Budget Alerts Table
-- Stores alert configurations with tenant isolation
CREATE TABLE IF NOT EXISTS public.budget_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('storage', 'compute', 'bandwidth', 'total')),
    threshold DECIMAL(10,2) NOT NULL,
    threshold_type VARCHAR(20) NOT NULL DEFAULT 'absolute' CHECK (threshold_type IN ('absolute', 'percentage', 'rate')),
    severity VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    active BOOLEAN NOT NULL DEFAULT true,
    notification_channels JSONB DEFAULT '[]'::jsonb,
    last_triggered TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT budget_alerts_unique_name UNIQUE (tenant_id, name)
);

ALTER TABLE public.budget_alerts ENABLE ROW LEVEL SECURITY;

-- Optimization Recommendations Table
-- Stores AI/ML-driven optimization recommendations
CREATE TABLE IF NOT EXISTS public.optimization_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL CHECK (category IN ('storage', 'compute', 'bandwidth', 'general')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    estimated_savings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    review_by TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT optimization_recommendations_positive_savings CHECK (estimated_savings >= 0)
);

ALTER TABLE public.optimization_recommendations ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_cost_metrics_tenant_id ON public.cost_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cost_metrics_tenant_timestamp ON public.cost_metrics(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_cost_metrics_period ON public.cost_metrics(period);
CREATE INDEX IF NOT EXISTS idx_cost_metrics_timestamp ON public.cost_metrics(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_budget_alerts_tenant_id ON public.budget_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_active ON public.budget_alerts(active);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_category ON public.budget_alerts(category);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_severity ON public.budget_alerts(severity);

CREATE INDEX IF NOT EXISTS idx_optimization_recommendations_tenant_id ON public.optimization_recommendations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_optimization_recommendations_status ON public.optimization_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_optimization_recommendations_priority ON public.optimization_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_optimization_recommendations_category ON public.optimization_recommendations(category);
CREATE INDEX IF NOT EXISTS idx_optimization_recommendations_created_at ON public.optimization_recommendations(created_at DESC);

-- Row Level Security Policies

-- Cost Metrics RLS Policies
CREATE POLICY "Users can view own tenant cost metrics" ON public.cost_metrics
    FOR SELECT USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can insert own tenant cost metrics" ON public.cost_metrics
    FOR INSERT WITH CHECK (tenant_id = public.tenant_id());

CREATE POLICY "Users can update own tenant cost metrics" ON public.cost_metrics
    FOR UPDATE USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can delete own tenant cost metrics" ON public.cost_metrics
    FOR DELETE USING (tenant_id = public.tenant_id());

-- Budget Alerts RLS Policies
CREATE POLICY "Users can view own tenant budget alerts" ON public.budget_alerts
    FOR SELECT USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can insert own tenant budget alerts" ON public.budget_alerts
    FOR INSERT WITH CHECK (tenant_id = public.tenant_id());

CREATE POLICY "Users can update own tenant budget alerts" ON public.budget_alerts
    FOR UPDATE USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can delete own tenant budget alerts" ON public.budget_alerts
    FOR DELETE USING (tenant_id = public.tenant_id());

-- Optimization Recommendations RLS Policies
CREATE POLICY "Users can view own tenant recommendations" ON public.optimization_recommendations
    FOR SELECT USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can insert own tenant recommendations" ON public.optimization_recommendations
    FOR INSERT WITH CHECK (tenant_id = public.tenant_id());

CREATE POLICY "Users can update own tenant recommendations" ON public.optimization_recommendations
    FOR UPDATE USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can delete own tenant recommendations" ON public.optimization_recommendations
    FOR DELETE USING (tenant_id = public.tenant_id());

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cost_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budget_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.optimization_recommendations TO authenticated;

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER handle_budget_alerts_updated_at
    BEFORE UPDATE ON public.budget_alerts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create view for cost metrics aggregation
CREATE OR REPLACE VIEW public.cost_metrics_daily AS
SELECT 
    tenant_id,
    DATE(timestamp) as date,
    period,
    SUM(storage_usage) as total_storage_usage,
    SUM(cicd_runtime) as total_cicd_runtime,
    SUM(bandwidth_usage) as total_bandwidth_usage,
    SUM(total_cost) as total_cost,
    currency,
    COUNT(*) as data_points,
    MAX(timestamp) as latest_timestamp
FROM public.cost_metrics
WHERE period = 'daily'
GROUP BY tenant_id, DATE(timestamp), period, currency;

-- Create view for cost trends
CREATE OR REPLACE VIEW public.cost_trends_weekly AS
SELECT 
    tenant_id,
    date_trunc('week', timestamp) as week_start,
    SUM(total_cost) as weekly_cost,
    AVG(total_cost) as average_daily_cost,
    COUNT(*) as data_points
FROM public.cost_metrics
WHERE period = 'daily'
GROUP BY tenant_id, date_trunc('week', timestamp)
ORDER BY week_start DESC;

-- Create function to get cost summary for tenant
CREATE OR REPLACE FUNCTION public.get_tenant_cost_summary(p_tenant_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    total_cost DECIMAL,
    storage_cost DECIMAL,
    cicd_cost DECIMAL,
    bandwidth_cost DECIMAL,
    average_daily_cost DECIMAL,
    trend_direction VARCHAR,
    trend_percentage DECIMAL
) AS $$
DECLARE
    recent_total DECIMAL;
    previous_total DECIMAL;
    trend_calc DECIMAL;
BEGIN
    -- Get recent period total
    SELECT SUM(total_cost) INTO recent_total
    FROM public.cost_metrics
    WHERE tenant_id = p_tenant_id 
    AND timestamp >= NOW() - INTERVAL '1 day' * p_days;
    
    -- Get previous period total for comparison
    SELECT SUM(total_cost) INTO previous_total
    FROM public.cost_metrics
    WHERE tenant_id = p_tenant_id 
    AND timestamp >= NOW() - INTERVAL '1 day' * (p_days * 2)
    AND timestamp < NOW() - INTERVAL '1 day' * p_days;
    
    -- Calculate trend
    IF previous_total > 0 THEN
        trend_calc := ((recent_total - previous_total) / previous_total) * 100;
    ELSE
        trend_calc := 0;
    END IF;
    
    -- Return results
    RETURN QUERY
    SELECT 
        COALESCE(recent_total, 0) as total_cost,
        COALESCE((SELECT SUM(total_cost * 0.6) FROM public.cost_metrics WHERE tenant_id = p_tenant_id AND timestamp >= NOW() - INTERVAL '1 day' * p_days), 0) as storage_cost,
        COALESCE((SELECT SUM(total_cost * 0.3) FROM public.cost_metrics WHERE tenant_id = p_tenant_id AND timestamp >= NOW() - INTERVAL '1 day' * p_days), 0) as cicd_cost,
        COALESCE((SELECT SUM(total_cost * 0.1) FROM public.cost_metrics WHERE tenant_id = p_tenant_id AND timestamp >= NOW() - INTERVAL '1 day' * p_days), 0) as bandwidth_cost,
        COALESCE(recent_total, 0) / p_days as average_daily_cost,
        CASE 
            WHEN trend_calc > 5 THEN 'up'
            WHEN trend_calc < -5 THEN 'down'
            ELSE 'stable'
        END as trend_direction,
        COALESCE(trend_calc, 0) as trend_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to views and functions
GRANT SELECT ON public.cost_metrics_daily TO authenticated;
GRANT SELECT ON public.cost_trends_weekly TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_cost_summary TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.cost_metrics IS 'Historical cost tracking data with tenant isolation';
COMMENT ON TABLE public.budget_alerts IS 'Budget alert configurations with tenant isolation';
COMMENT ON TABLE public.optimization_recommendations IS 'AI/ML-driven cost optimization recommendations';
COMMENT ON VIEW public.cost_metrics_daily IS 'Daily aggregated cost metrics for reporting';
COMMENT ON VIEW public.cost_trends_weekly IS 'Weekly cost trends for analysis';
COMMENT ON FUNCTION public.get_tenant_cost_summary IS 'Returns cost summary and trends for a tenant';
