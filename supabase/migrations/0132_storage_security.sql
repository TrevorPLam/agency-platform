-- Storage Security Migration
-- Implements secure file upload tracking with RLS and tenant isolation

-- Files table for tracking uploaded files
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name TEXT NOT NULL,
  safe_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size BIGINT NOT NULL,
  checksum TEXT NOT NULL,
  tenant_id UUID NOT NULL,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_quarantined BOOLEAN NOT NULL DEFAULT FALSE,
  scan_status TEXT NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending', 'clean', 'infected', 'error')),
  scan_result JSONB,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  retention_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
  
  -- Constraints
  CONSTRAINT files_checksum_tenant_unique UNIQUE (checksum, tenant_id),
  CONSTRAINT files_size_positive CHECK (size > 0),
  CONSTRAINT files_checksum_format CHECK (checksum ~ '^[a-f0-9]{64}$'),
  CONSTRAINT files_retention_future CHECK (retention_until > uploaded_at)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_tenant_id ON public.files(tenant_id);
CREATE INDEX IF NOT EXISTS idx_files_tenant_uploaded_at ON public.files(tenant_id, uploaded_at);
CREATE INDEX IF NOT EXISTS idx_files_checksum ON public.files(checksum);
CREATE INDEX IF NOT EXISTS idx_files_content_type ON public.files(content_type);
CREATE INDEX IF NOT EXISTS idx_files_scan_status ON public.files(scan_status);
CREATE INDEX IF NOT EXISTS idx_files_quarantined ON public.files(is_quarantined);
CREATE INDEX IF NOT EXISTS idx_files_retention_until ON public.files(retention_until);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON public.files(uploaded_by);

-- File access logs for audit trails
CREATE TABLE IF NOT EXISTS public.file_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  user_id UUID,
  action TEXT NOT NULL CHECK (action IN ('upload', 'download', 'view', 'delete', 'quarantine', 'release')),
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT file_access_logs_action_valid CHECK (action IN ('upload', 'download', 'view', 'delete', 'quarantine', 'release'))
);

-- Create indexes for access logs
CREATE INDEX IF NOT EXISTS idx_file_access_logs_file_id ON public.file_access_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_tenant_id ON public.file_access_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_created_at ON public.file_access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_action ON public.file_access_logs(action);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_user_id ON public.file_access_logs(user_id);

-- Enable RLS on files table
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Files RLS policies
CREATE POLICY "Users can view their own tenant files" ON public.files
  FOR SELECT USING (
    tenant_id = public.tenant_id() AND
    is_quarantined = FALSE
  );

CREATE POLICY "Users can upload files to their tenant" ON public.files
  FOR INSERT WITH CHECK (
    tenant_id = public.tenant_id() AND
    uploaded_by = auth.uid()
  );

CREATE POLICY "Users can update their own uploaded files" ON public.files
  FOR UPDATE USING (
    tenant_id = public.tenant_id() AND
    uploaded_by = auth.uid()
  );

CREATE POLICY "Users can delete their own uploaded files" ON public.files
  FOR DELETE USING (
    tenant_id = public.tenant_id() AND
    uploaded_by = auth.uid()
  );

CREATE POLICY "Platform admins can view all files" ON public.files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = public.tenant_id() 
      AND user_id = auth.uid() 
      AND role = 'platform_admin'
    )
  );

CREATE POLICY "Platform admins can manage all files" ON public.files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = public.tenant_id() 
      AND user_id = auth.uid() 
      AND role = 'platform_admin'
    )
  );

-- Enable RLS on file_access_logs table
ALTER TABLE public.file_access_logs ENABLE ROW LEVEL SECURITY;

-- File access logs RLS policies
CREATE POLICY "Users can view their tenant access logs" ON public.file_access_logs
  FOR SELECT USING (tenant_id = public.tenant_id());

CREATE POLICY "Users can create access logs for their tenant" ON public.file_access_logs
  FOR INSERT WITH CHECK (tenant_id = public.tenant_id());

CREATE POLICY "Platform admins can view all access logs" ON public.file_access_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_id = public.tenant_id() 
      AND user_id = auth.uid() 
      AND role = 'platform_admin'
    )
  );

-- Storage security functions
CREATE OR REPLACE FUNCTION public.log_file_access(
  p_file_id UUID,
  p_action TEXT,
  p_success BOOLEAN DEFAULT TRUE,
  p_error_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.file_access_logs (
    file_id,
    tenant_id,
    user_id,
    action,
    ip_address,
    user_agent,
    success,
    error_message
  ) VALUES (
    p_file_id,
    public.tenant_id(),
    auth.uid(),
    p_action,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    p_success,
    p_error_message
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired files
CREATE OR REPLACE FUNCTION public.cleanup_expired_files() 
RETURNS TABLE (deleted_files_count BIGINT, deleted_logs_count BIGINT) AS $$
DECLARE
  v_deleted_files BIGINT;
  v_deleted_logs BIGINT;
BEGIN
  -- Delete expired files
  DELETE FROM public.files 
  WHERE retention_until < NOW()
  RETURNING 1 INTO v_deleted_files;
  
  -- Delete orphaned access logs (older than 90 days)
  DELETE FROM public.file_access_logs 
  WHERE created_at < NOW() - INTERVAL '90 days'
  RETURNING 1 INTO v_deleted_logs;
  
  -- Return counts
  deleted_files_count := COALESCE(v_deleted_files, 0);
  deleted_logs_count := COALESCE(v_deleted_logs, 0);
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get file statistics
CREATE OR REPLACE FUNCTION public.get_file_statistics(
  p_tenant_id UUID DEFAULT NULL
) RETURNS TABLE (
  total_files BIGINT,
  total_size BIGINT,
  quarantined_files BIGINT,
  infected_files BIGINT,
  pending_scans BIGINT,
  uploads_today BIGINT,
  unique_content_types BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT,
    COALESCE(SUM(size), 0)::BIGINT,
    COUNT(*) FILTER (WHERE is_quarantined = TRUE)::BIGINT,
    COUNT(*) FILTER (WHERE scan_status = 'infected')::BIGINT,
    COUNT(*) FILTER (WHERE scan_status = 'pending')::BIGINT,
    COUNT(*) FILTER (WHERE DATE(uploaded_at) = CURRENT_DATE)::BIGINT,
    COUNT(DISTINCT content_type)::BIGINT
  FROM public.files
  WHERE 
    (p_tenant_id IS NULL OR tenant_id = p_tenant_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.files TO authenticated;
GRANT ALL ON public.file_access_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_file_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_files TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_file_statistics TO authenticated;

-- Grant permissions to service role for background jobs
GRANT ALL ON public.files TO service_role;
GRANT ALL ON public.file_access_logs TO service_role;

-- Comments for documentation
COMMENT ON TABLE public.files IS 'Secure file upload tracking with tenant isolation and virus scanning';
COMMENT ON TABLE public.file_access_logs IS 'Audit trail for file access and security events';
COMMENT ON COLUMN public.files.scan_status IS 'Virus scanning status: pending, clean, infected, or error';
COMMENT ON COLUMN public.files.is_quarantined IS 'Whether file is quarantined due to security concerns';
COMMENT ON COLUMN public.files.checksum IS 'SHA-256 checksum for duplicate detection and integrity verification';
COMMENT ON COLUMN public.files.retention_until IS 'Automatic deletion date for data retention compliance';
