-- RESET SCRIPT
-- Drop all tables and functions to start fresh
DROP TABLE IF EXISTS contact_submissions CASCADE;
DROP TABLE IF EXISTS api_rate_limits CASCADE;
DROP TABLE IF EXISTS api_request_logs CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS increment_api_key_request_count CASCADE;
DROP FUNCTION IF EXISTS check_rate_limit CASCADE;

-- Table for Projects (Blog Posts)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  is_indexable BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  canonical_url TEXT,

  -- Metadata
  featured_image_url TEXT,
  author_id TEXT NOT NULL -- Clerk User ID
);

-- Table for API Keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL, -- Store hash, not plain text
  key_prefix TEXT UNIQUE NOT NULL, -- For identification (e.g., 'sk_live_...')
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  user_id TEXT NOT NULL, -- Clerk User ID
  request_count INTEGER DEFAULT 0
);

-- Table for Global Settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- Initial Settings
INSERT INTO settings (key, value, description) VALUES
('api_rate_limit', '1000', 'Max requests per minute for API keys');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- API Request Logs
CREATE TABLE IF NOT EXISTS api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  api_key_id UUID REFERENCES api_keys(id),
  auth_method TEXT NOT NULL CHECK (auth_method IN ('api-key', 'clerk')),
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_api_request_logs_created_at ON api_request_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_api_key_id ON api_request_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_path ON api_request_logs(path);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_status_code ON api_request_logs(status_code);

-- Rate limit counters
CREATE TABLE IF NOT EXISTS api_rate_limits (
  identifier TEXT PRIMARY KEY,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_identifier ON api_rate_limits(identifier);

-- Atomic increment functions for rate limiting and API key request counting
CREATE OR REPLACE FUNCTION increment_api_key_request_count(key_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE api_keys
  SET request_count = COALESCE(request_count, 0) + 1,
      last_used_at   = NOW()
  WHERE id = key_id;
$$;

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier   TEXT,
  p_limit         INTEGER DEFAULT 100,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, rate_limit INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_reset_at     TIMESTAMPTZ;
  v_current_count INTEGER;
BEGIN
  v_window_start := DATE_TRUNC('second', NOW() - (INTERVAL '1 second' * (EXTRACT(EPOCH FROM NOW())::BIGINT % p_window_seconds)));
  v_reset_at     := v_window_start + (INTERVAL '1 second' * p_window_seconds);

  UPDATE api_rate_limits
  SET request_count = request_count + 1
  WHERE identifier   = p_identifier
    AND window_start >= v_window_start;

  GET DIAGNOSTICS v_current_count := ROW_COUNT;

  IF v_current_count > 0 THEN
    SELECT request_count INTO v_current_count
    FROM api_rate_limits
    WHERE identifier = p_identifier;

    IF v_current_count > p_limit THEN
      UPDATE api_rate_limits
      SET request_count = request_count - 1
      WHERE identifier = p_identifier;

      RETURN QUERY SELECT FALSE, 0, p_limit, v_reset_at;
    ELSE
      RETURN QUERY SELECT TRUE, p_limit - v_current_count, p_limit, v_reset_at;
    END IF;
  ELSE
    INSERT INTO api_rate_limits (identifier, window_start, request_count)
    VALUES (p_identifier, NOW(), 1)
    ON CONFLICT (identifier)
    DO UPDATE SET window_start   = NOW(),
                  request_count  = 1;

    RETURN QUERY SELECT TRUE, p_limit - 1, p_limit, v_reset_at;
  END IF;
END;
$$;

-- Contact submissions table
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
    CONSTRAINT contact_status_check CHECK (status IN ('new', 'read', 'replied', 'closed')),
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_contact_submissions
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_archived ON contact_submissions(archived);
