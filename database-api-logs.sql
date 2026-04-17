-- API Request Logs — tracks every API call for analytics and auditing
CREATE TABLE IF NOT EXISTS api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Who made the request
  api_key_id UUID REFERENCES api_keys(id),
  auth_method TEXT NOT NULL CHECK (auth_method IN ('api-key', 'clerk')),
  
  -- What was requested
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  
  -- Performance
  response_time_ms INTEGER,
  
  -- Request context
  ip_address TEXT,
  user_agent TEXT
);

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_api_request_logs_created_at ON api_request_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_api_key_id ON api_request_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_path ON api_request_logs(path);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_status_code ON api_request_logs(status_code);

-- Rate limit counters — sliding window per identifier
CREATE TABLE IF NOT EXISTS api_rate_limits (
  identifier TEXT PRIMARY KEY,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_identifier ON api_rate_limits(identifier);

-- Per-key request count (denormalized for fast dashboard queries)
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS request_count INTEGER DEFAULT 0;