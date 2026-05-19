ALTER TABLE public.groups
ALTER COLUMN slug SET NOT NULL;

ALTER TABLE public.groups
ADD CONSTRAINT groups_slug_key UNIQUE (slug);
