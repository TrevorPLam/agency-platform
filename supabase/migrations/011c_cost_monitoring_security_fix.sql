-- Cost Summary Function Authorization Fix
-- Addresses SECURITY DEFINER vulnerability in get_tenant_cost_summary function
-- Ensures proper caller authorization enforcement and tenant isolation

-- First, revoke public access to the existing function
REVOKE EXECUTE ON FUNCTION public.get_tenant_cost_summary FROM PUBLIC;

-- Drop and recreate the function with proper authorization
DROP FUNCTION IF EXISTS public.get_tenant_cost_summary(p_tenant_id UUID, p_days INTEGER);

-- Create secure version with caller authorization enforcement
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
    caller_tenant_id UUID;
    recent_total DECIMAL;
    previous_total DECIMAL;
    trend_calc DECIMAL;
BEGIN
    -- Security: Extract caller's tenant_id from JWT claims
    -- This ensures the function only operates on the caller's own tenant data
    BEGIN
        SELECT (current_setting('request.jwt.claims', true)::json->>'app_metadata')::json->>'tenant_id'
        INTO STRICT caller_tenant_id;
    EXCEPTION WHEN OTHERS THEN
        -- If we can't extract tenant_id from JWT, deny access
        RAISE EXCEPTION 'Unauthorized: Valid tenant context required', SQLSTATE '42501';
    END;

    -- Convert to UUID for comparison
    caller_tenant_id := caller_tenant_id::UUID;

    -- Authorization: Ensure caller can only access their own tenant data
    -- Platform admins (service role) can access any tenant, regular users only their own
    IF current_setting('request.jwt.claims', true)::json->>'email' NOT IN (
        SELECT email FROM auth.users 
        WHERE raw_user_meta_data->>'is_platform_admin' = 'true'
        UNION SELECT 'admin@agency.com' -- hardcoded platform admin
    ) AND caller_tenant_id IS DISTINCT FROM p_tenant_id THEN
        RAISE EXCEPTION 'Access denied: Cannot access other tenant data', SQLSTATE '42501';
    END IF;

    -- Get recent period total for the requested tenant
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

-- Grant access only to authenticated users
GRANT EXECUTE ON FUNCTION public.get_tenant_cost_summary TO authenticated;

-- Add comprehensive security documentation
COMMENT ON FUNCTION public.get_tenant_cost_summary IS $$
Secure cost summary function with caller authorization enforcement.

SECURITY MODEL:
- Executes with SECURITY DEFINER (bypasses RLS for performance)
- Enforces tenant isolation internally via JWT claim validation
- Platform admins can access any tenant data
- Regular users can only access their own tenant data

AUTHORIZATION CHECKS:
1. Extracts tenant_id from app_metadata.tenant_id in JWT claims
2. Validates caller is platform admin OR accessing own tenant
3. Raises 42501 (UNAUTHORIZED) for cross-tenant access attempts

USAGE:
- Called by cost summary API routes with proper session context
- Requires valid JWT with tenant context in app_metadata
- p_tenant_id parameter is validated against caller's tenant context

SECURITY NOTES:
- Never trust client-provided tenant_id without validation
- Always verify caller authorization in SECURITY DEFINER functions
- This pattern prevents cross-tenant data access via function escalation
$$;
