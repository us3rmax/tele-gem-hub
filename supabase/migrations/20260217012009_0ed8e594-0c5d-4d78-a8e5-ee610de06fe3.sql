-- Add is_pinned column for premium groups pinning
ALTER TABLE public.groups ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;