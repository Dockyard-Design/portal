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

-- 5. Seed Kanban Boards (multiple boards per customer)
INSERT INTO kanban_boards (id, customer_id, name, description, is_default, author_id)
VALUES
-- Demo Customer A boards
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Main Board', 'Primary project board for Demo Customer A', true, 'seed-author-id'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Website Redesign', 'Website redesign project board', false, 'seed-author-id'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Q4 Marketing', 'Marketing campaigns for Q4', false, 'seed-author-id'),

-- Demo Customer B boards
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Main Board', 'Primary project board for Demo Customer B', true, 'seed-author-id'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Mobile App', 'Mobile app development board', false, 'seed-author-id'),

-- Acme Corporation boards
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'Main Board', 'Primary project board for Acme Corp', true, 'seed-author-id'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'Security Audit', 'SOC2 compliance and security audit board', false, 'seed-author-id'),

-- TechStart Inc boards
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Main Board', 'Primary project board for TechStart', true, 'seed-author-id'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'MVP Launch', 'MVP launch preparation board', false, 'seed-author-id'),

-- Global Solutions boards
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Main Board', 'Primary project board for Global Solutions', true, 'seed-author-id'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'International Expansion', 'Multi-region deployment board', false, 'seed-author-id'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Localization', 'App translation project board', false, 'seed-author-id');

-- 6. Seed Kanban Tasks (now reference board_id instead of customer_id)
INSERT INTO kanban_tasks (board_id, assigned_to, title, description, status, priority, position, author_id, due_date)
VALUES
-- Demo Customer A - Main Board tasks
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', null, 'Initial consultation', 'Setup kickoff meeting with stakeholders', 'backlog', 'high', 0, 'seed-author-id', NOW() + INTERVAL '7 days'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', null, 'Requirements gathering', 'Document all technical requirements', 'backlog', 'medium', 1, 'seed-author-id', NOW() + INTERVAL '14 days'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'seed-author-id', 'Budget planning', 'Estimate project costs and timeline', 'backlog', 'low', 2, 'seed-author-id', NOW() + INTERVAL '21 days'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'seed-author-id', 'Wireframe approval', 'Get sign-off on initial wireframes', 'todo', 'high', 0, 'seed-author-id', NOW() + INTERVAL '3 days'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', null, 'Technical planning', 'Create architecture diagram', 'todo', 'medium', 1, 'seed-author-id', NOW() + INTERVAL '5 days'),

-- Demo Customer A - Website Redesign Board
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'seed-author-id', 'Homepage mockups', 'Design new homepage layouts', 'in_progress', 'high', 0, 'seed-author-id', NOW() + INTERVAL '5 days'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', null, 'Color palette selection', 'Choose brand colors and typography', 'backlog', 'medium', 0, 'seed-author-id', NOW() + INTERVAL '10 days'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'seed-author-id', 'Wireframe review', 'Present wireframes to client', 'complete', 'high', 0, 'seed-author-id', NOW() - INTERVAL '2 days'),

-- Demo Customer B - Main Board tasks
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'seed-author-id', 'Database schema design', 'Design and document database structure', 'in_progress', 'urgent', 0, 'seed-author-id', NOW() + INTERVAL '2 days'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', null, 'API endpoints', 'Build REST API endpoints', 'in_progress', 'high', 1, 'seed-author-id', NOW() + INTERVAL '4 days'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'seed-author-id', 'Authentication flow', 'Implement user auth with Clerk', 'in_progress', 'medium', 2, 'seed-author-id', NOW() + INTERVAL '5 days'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', null, 'Project setup', 'Initialize repository and CI/CD', 'complete', 'medium', 0, 'seed-author-id', NOW() - INTERVAL '5 days'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'seed-author-id', 'Design system', 'Create component library', 'complete', 'low', 1, 'seed-author-id', NOW() - INTERVAL '3 days'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', null, 'Team onboarding', 'Setup accounts for team members', 'complete', 'low', 2, 'seed-author-id', NOW() - INTERVAL '2 days'),

-- Demo Customer B - Mobile App Board
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', null, 'iOS prototype', 'Build iOS wireframe prototype', 'backlog', 'high', 0, 'seed-author-id', NOW() + INTERVAL '14 days'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'seed-author-id', 'User research', 'Interview potential users', 'todo', 'medium', 0, 'seed-author-id', NOW() + INTERVAL '7 days'),

-- Acme Corporation - Main Board
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'seed-author-id', 'Performance review', 'Optimize database queries', 'todo', 'high', 0, 'seed-author-id', NOW() + INTERVAL '7 days'),

-- Acme Corporation - Security Audit Board
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', null, 'Security audit', 'Complete SOC2 compliance assessment', 'backlog', 'urgent', 0, 'seed-author-id', NOW() + INTERVAL '30 days'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'seed-author-id', 'Penetration testing', 'Schedule external security testing', 'backlog', 'high', 1, 'seed-author-id', NOW() + INTERVAL '45 days'),

-- TechStart Inc - Main Board
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'seed-author-id', 'Feature planning', 'Prioritize MVP features', 'backlog', 'high', 0, 'seed-author-id', NOW() + INTERVAL '7 days'),

-- TechStart Inc - MVP Launch Board
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'seed-author-id', 'MVP launch prep', 'Prepare marketing materials', 'in_progress', 'urgent', 0, 'seed-author-id', NOW() + INTERVAL '3 days'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', null, 'Beta testing', 'Recruit beta testers', 'todo', 'high', 0, 'seed-author-id', NOW() + INTERVAL '5 days'),

-- Global Solutions - Main Board
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', null, 'Account setup', 'Configure enterprise account', 'in_progress', 'medium', 0, 'seed-author-id', NOW() + INTERVAL '2 days'),

-- Global Solutions - International Expansion Board
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', null, 'Multi-region deployment', 'Setup EU and APAC instances', 'backlog', 'high', 0, 'seed-author-id', NOW() + INTERVAL '60 days'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'seed-author-id', 'Compliance review', 'Meet regional compliance requirements', 'backlog', 'urgent', 1, 'seed-author-id', NOW() + INTERVAL '45 days'),

-- Global Solutions - Localization Board
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'seed-author-id', 'Localization', 'Translate app to 5 languages', 'todo', 'medium', 0, 'seed-author-id', NOW() + INTERVAL '30 days'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', null, 'Translation review', 'Review translated content', 'backlog', 'medium', 0, 'seed-author-id', NOW() + INTERVAL '45 days');

-- 7. Seed Quotes for Acme Corporation (customer a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10)
INSERT INTO quotes (id, customer_id, title, description, subtotal, tax_rate, tax_amount, total, status, notes, terms, author_id)
VALUES
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'Website Development Quote', 'Complete website redesign including CMS and e-commerce integration', 15000.00, 10.00, 1500.00, 16500.00, 'accepted', 'Priority project with tight deadline', 'Payment terms: 50% upfront, 50% upon completion', 'seed-author-id'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'SEO Optimization Package', '6-month SEO campaign including technical audit and content strategy', 5000.00, 10.00, 500.00, 5500.00, 'sent', 'Monthly reporting included', 'Monthly billing in arrears', 'seed-author-id'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'Mobile App Development', 'Native iOS and Android app development', 45000.00, 10.00, 4500.00, 49500.00, 'draft', 'Phased delivery approach', 'Payment schedule: 25% monthly over 4 months', 'seed-author-id');

-- Quote items for accepted quote
INSERT INTO quote_items (quote_id, description, quantity, unit_price, total, sort_order)
VALUES
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Design & UX', 1, 5000.00, 5000.00, 0),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Frontend Development', 1, 6000.00, 6000.00, 1),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Backend & CMS', 1, 4000.00, 4000.00, 2);

-- Quote items for sent quote
INSERT INTO quote_items (quote_id, description, quantity, unit_price, total, sort_order)
VALUES
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'Technical SEO Audit', 1, 1500.00, 1500.00, 0),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'Content Strategy (6 months)', 6, 500.00, 3000.00, 1),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'Monthly Reporting & Analysis', 6, 83.33, 500.00, 2);

-- 8. Seed Invoices for Acme Corporation
INSERT INTO invoices (id, customer_id, quote_id, invoice_number, title, description, subtotal, tax_rate, tax_amount, total, amount_paid, balance_due, status, due_date, notes, author_id)
VALUES
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'INV-2024-0001', 'Website Development - Deposit', '50% deposit for website redesign project', 7500.00, 10.00, 750.00, 8250.00, 8250.00, 0, 'paid', NOW() + INTERVAL '30 days', 'Paid via bank transfer', 'seed-author-id'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'INV-2024-0002', 'Website Development - Final', 'Final payment for website redesign', 7500.00, 10.00, 750.00, 8250.00, 0, 8250.00, 'sent', NOW() + INTERVAL '15 days', 'Due upon project completion', 'seed-author-id'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', null, 'INV-2024-0003', 'Consulting Services - January', 'Monthly consulting services', 3000.00, 10.00, 300.00, 3300.00, 3300.00, 0, 'paid', NOW() - INTERVAL '15 days', 'Paid on time', 'seed-author-id'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', null, 'INV-2024-0004', 'Consulting Services - February', 'Monthly consulting services', 3000.00, 10.00, 300.00, 3300.00, 1650.00, 1650.00, 'partial', NOW() - INTERVAL '30 days', 'Partial payment received', 'seed-author-id'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', null, 'INV-2024-0005', 'Consulting Services - March', 'Monthly consulting services', 3000.00, 10.00, 300.00, 3300.00, 0, 3300.00, 'overdue', NOW() - INTERVAL '45 days', 'Payment overdue - follow up required', 'seed-author-id');

-- Invoice items
INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total, sort_order)
VALUES
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Website Design & Development (50% deposit)', 1, 7500.00, 7500.00, 0),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'Website Design & Development (50% final)', 1, 7500.00, 7500.00, 0),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'Consulting Services', 20, 150.00, 3000.00, 0),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'Consulting Services', 20, 150.00, 3000.00, 0),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'Consulting Services', 20, 150.00, 3000.00, 0);
