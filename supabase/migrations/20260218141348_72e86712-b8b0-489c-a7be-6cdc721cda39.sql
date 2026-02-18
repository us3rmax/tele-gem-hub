ALTER TABLE groups ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'imported';

UPDATE groups SET source = 'user' WHERE submitted_by IS NOT NULL;
