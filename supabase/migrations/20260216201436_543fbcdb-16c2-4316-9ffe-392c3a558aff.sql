
-- Add submitted_by to groups to track who submitted the group
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id);
