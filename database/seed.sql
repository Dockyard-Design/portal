-- SEED DATA FOR TESTING
-- Use this file to populate the database with sample content

-- 1. Seed Projects/Posts
-- Note: author_id should ideally match a real User ID from Clerk in your environment.
-- Using 'seed-author-id' as a placeholder.
INSERT INTO projects (title, slug, content, excerpt, is_public, is_indexable, status, author_id, seo_title, seo_description)
VALUES
('Getting Started with Next.js', 'getting-started-nextjs', 'Full content for getting started with Next.js. This is a comprehensive guide to building modern web applications.', 'Learn the basics of Next.js and start building today.', true, true, 'published', 'seed-author-id', 'Next.js Guide', 'Learn how to get started with Next.js'),
('Advanced PostgreSQL Techniques', 'advanced-postgresql', 'Deep dive into PostgreSQL performance tuning, indexing strategies, and atomic operations.', 'Master the art of database optimization with these advanced tips.', true, true, 'published', 'seed-author-id', 'Advanced Postgres', 'Expert techniques for PostgreSQL'),
('The Future of AI in Engineering', 'future-ai-engineering', 'Exploring how LLMs and AI agents are transforming the software development lifecycle.', 'How AI is changing the way we write and maintain code.', true, true, 'published', 'seed-author-id', 'AI in Engineering', 'The impact of AI on software engineering'),
('Draft Post: Coming Soon', 'coming-soon', 'This content is still under construction.', 'A sneak peek at what is coming next.', false, false, 'draft', 'seed-author-id', NULL, NULL);

-- 2. Seed Contact Form Submissions
INSERT INTO contact_submissions (name, email, message, status, archived)
VALUES
('Jane Doe', 'jane@example.com', 'I would love to learn more about your services. Do you offer custom consulting?', 'new', false),
('John Smith', 'john.smith@company.com', 'I found a typo in your advanced PostgreSQL guide on line 42.', 'read', false),
('Alice Johnson', 'alice@webdev.io', 'Great blog! I really enjoyed the article on AI agents.', 'replied', false),
('Bob Brown', 'bob@test.com', 'This is a spam message test.', 'closed', true);

-- 3. Seed API Keys (Optional)
-- Note: key_hash and key_prefix are required. In a real app, hashes are generated.
INSERT INTO api_keys (name, key_hash, key_prefix, user_id, is_active)
VALUES
('Test Key 1', 'hashed_value_1', 'sk_test_1', 'seed-author-id', true),
('Test Key 2', 'hashed_value_2', 'sk_test_2', 'seed-author-id', true);
