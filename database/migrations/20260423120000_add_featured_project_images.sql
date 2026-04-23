ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS featured_desktop_image_url TEXT,
  ADD COLUMN IF NOT EXISTS featured_phone_image_url TEXT;
