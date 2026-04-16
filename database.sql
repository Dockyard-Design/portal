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
  user_id TEXT NOT NULL -- Clerk User ID
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
('allow_signup', 'true', 'Determines if new users can register accounts'),
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
