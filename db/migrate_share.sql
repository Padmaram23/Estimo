-- Add share columns to projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS share_token VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS share_edit  BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_projects_share_token ON projects(share_token);
