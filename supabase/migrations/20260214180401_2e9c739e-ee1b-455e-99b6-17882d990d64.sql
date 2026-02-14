
-- Fix submitted_by to be NOT NULL
ALTER TABLE public.group_submissions ALTER COLUMN submitted_by SET NOT NULL;
