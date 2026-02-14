
ALTER TABLE public.banners ADD COLUMN clicks integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_banner_clicks(banner_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  UPDATE banners SET clicks = clicks + 1 WHERE id = banner_id;
$$;
