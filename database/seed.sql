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

-- 4. Seed Customers for Kanban
-- Using fixed UUIDs for consistent seeding
INSERT INTO customers (id, name, email, company, notes)
VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'Acme Corporation', 'contact@acme.com', 'Acme Corp', 'Large enterprise client, priority support'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Demo Customer A', 'demo-a@example.com', 'Demo Corp A', 'Small business with ongoing project'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Demo Customer B', 'demo-b@example.com', 'Demo Corp B', 'Technology startup'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'TechStart Inc', 'hello@techstart.io', 'TechStart', 'Startup with rapid development needs'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Global Solutions', 'info@globalsolutions.com', 'Global Solutions Ltd', 'International client with multiple projects');

-- 5. Seed Kanban Tasks
INSERT INTO kanban_tasks (customer_id, assigned_to, title, description, status, priority, position, author_id, due_date)
VALUES
-- Backlog tasks for Demo Customer A
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', null, 'Initial consultation', 'Setup kickoff meeting with stakeholders', 'backlog', 'high', 0, 'seed-author-id', NOW() + INTERVAL '7 days'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', null, 'Requirements gathering', 'Document all technical requirements', 'backlog', 'medium', 1, 'seed-author-id', NOW() + INTERVAL '14 days'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'seed-author-id', 'Budget planning', 'Estimate project costs and timeline', 'backlog', 'low', 2, 'seed-author-id', NOW() + INTERVAL '21 days'),
-- Todo tasks for Demo Customer A
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'seed-author-id', 'Wireframe approval', 'Get sign-off on initial wireframes', 'todo', 'high', 0, 'seed-author-id', NOW() + INTERVAL '3 days'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', null, 'Technical planning', 'Create architecture diagram', 'todo', 'medium', 1, 'seed-author-id', NOW() + INTERVAL '5 days'),
-- In Progress tasks for Demo Customer B
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'seed-author-id', 'Database schema design', 'Design and document database structure', 'in_progress', 'urgent', 0, 'seed-author-id', NOW() + INTERVAL '2 days'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', null, 'API endpoints', 'Build REST API endpoints', 'in_progress', 'high', 1, 'seed-author-id', NOW() + INTERVAL '4 days'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'seed-author-id', 'Authentication flow', 'Implement user auth with Clerk', 'in_progress', 'medium', 2, 'seed-author-id', NOW() + INTERVAL '5 days'),
-- Complete tasks for Demo Customer B  
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', null, 'Project setup', 'Initialize repository and CI/CD', 'complete', 'medium', 0, 'seed-author-id', NOW() - INTERVAL '5 days'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'seed-author-id', 'Design system', 'Create component library', 'complete', 'low', 1, 'seed-author-id', NOW() - INTERVAL '3 days'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', null, 'Team onboarding', 'Setup accounts for team members', 'complete', 'low', 2, 'seed-author-id', NOW() - INTERVAL '2 days'),
-- Tasks for Acme Corporation
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', null, 'Security audit', 'Complete SOC2 compliance assessment', 'backlog', 'urgent', 0, 'seed-author-id', NOW() + INTERVAL '30 days'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'seed-author-id', 'Performance review', 'Optimize database queries', 'todo', 'high', 0, 'seed-author-id', NOW() + INTERVAL '7 days'),
-- Tasks for TechStart
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'seed-author-id', 'MVP launch prep', 'Prepare marketing materials', 'in_progress', 'urgent', 0, 'seed-author-id', NOW() + INTERVAL '3 days'),
-- Tasks for Global Solutions
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', null, 'Multi-region deployment', 'Setup EU and APAC instances', 'backlog', 'high', 0, 'seed-author-id', NOW() + INTERVAL '60 days'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'seed-author-id', 'Localization', 'Translate app to 5 languages', 'todo', 'medium', 0, 'seed-author-id', NOW() + INTERVAL '30 days');
