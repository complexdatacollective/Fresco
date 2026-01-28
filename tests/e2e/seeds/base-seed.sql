-- Base seed data for e2e tests
-- This file contains minimal data needed for testing

-- Insert basic app settings
INSERT INTO "AppSettings" (key, value) VALUES
  ('configured', 'true'),
  ('allowAnonymousRecruitment', 'true'),
  ('limitInterviews', 'false'),
  ('disableAnalytics', 'true'),
  ('installationId', 'test-installation-e2e')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Create a test user (password is 'TestPassword123!')
INSERT INTO "User" (id, username) VALUES
  ('test-user-1', 'testuser')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Key" (id, hashed_password, user_id) VALUES
  ('username:testuser', '$2b$10$K7L1OJ0TfPIoYvPMqPcPpe/EW.K7fspOEnG4nJRO0QIXxEL7m0H2S', 'test-user-1')
ON CONFLICT (id) DO NOTHING;
