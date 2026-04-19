ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS brief_text TEXT NOT NULL DEFAULT '' CHECK (char_length(brief_text) <= 500),
  ADD COLUMN IF NOT EXISTS brief_gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS prototyping_text TEXT NOT NULL DEFAULT '' CHECK (char_length(prototyping_text) <= 500),
  ADD COLUMN IF NOT EXISTS prototyping_gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS building_text TEXT NOT NULL DEFAULT '' CHECK (char_length(building_text) <= 500),
  ADD COLUMN IF NOT EXISTS building_gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS feedback_text TEXT NOT NULL DEFAULT '' CHECK (char_length(feedback_text) <= 500),
  ADD COLUMN IF NOT EXISTS feedback_gallery JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'archived')),
  created_by TEXT NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unread_admin BOOLEAN NOT NULL DEFAULT TRUE,
  unread_customer BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'customer', 'system')),
  body TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_message_threads_customer ON message_threads(customer_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_status ON message_threads(status);
CREATE INDEX IF NOT EXISTS idx_message_threads_last_message ON message_threads(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

DROP TRIGGER IF EXISTS update_message_threads_updated_at ON message_threads;
CREATE TRIGGER update_message_threads_updated_at
  BEFORE UPDATE ON message_threads
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published projects" ON projects;
CREATE POLICY "Public can read published projects"
  ON projects FOR SELECT
  USING (status = 'published' AND is_public = TRUE);

DROP POLICY IF EXISTS "Public can create contact submissions" ON contact_submissions;
CREATE POLICY "Public can create contact submissions"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);
