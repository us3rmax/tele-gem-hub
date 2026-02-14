

## Replace Banner Placeholders with Real Database Banners

### Overview
Rewrite the `BannerAd` component to fetch active banners from the Supabase `banners` table instead of using mock data, support position-based filtering, and add click tracking.

---

### 1. Database Migration -- Add `clicks` Column

Add a `clicks` integer column (default 0) to the `banners` table for click tracking.

```sql
ALTER TABLE public.banners ADD COLUMN clicks integer NOT NULL DEFAULT 0;
```

### 2. Rewrite `BannerAd` Component

**File:** `src/components/BannerAd.tsx`

- Accept a `position` prop: `"top" | "middle" | "bottom"` (default `"top"`)
- On mount, fetch banners from Supabase filtered by:
  - `position` matches prop
  - `is_active = true`
  - `expires_at IS NULL OR expires_at > now()` (handled by existing RLS policy)
- If multiple banners returned, randomly select one
- If no banner found, show a placeholder: "Espaco disponivel para anuncio"
- If banner has `link_url`, wrap image in an `<a>` tag (target="_blank", rel="noopener noreferrer")
- Show a subtle "Anuncio" label in the top-right corner
- On click, fire-and-forget an update to increment the `clicks` field
- Show a Skeleton while loading
- Height constraints: `max-h-[50px] sm:max-h-[90px]` for top/bottom positions

### 3. Update Banner Usage in Pages

**`src/pages/Index.tsx`:**
- Top banner: `<BannerAd position="top" />`
- Add a bottom banner after Pagination: `<BannerAd position="bottom" />`

**`src/pages/GroupDetail.tsx`:**
- First BannerAd (line 168): `<BannerAd position="top" />`
- Second BannerAd (line 255): `<BannerAd position="bottom" />`

### 4. Click Tracking

When a banner link is clicked, call:
```typescript
supabase.from("banners").update({ clicks: banner.clicks + 1 }).eq("id", banner.id)
```
This runs as fire-and-forget (no await, `.catch(() => {})`) so it doesn't block navigation.

---

### Technical Details

- The existing RLS policy "Anyone can view active banners" already filters by `is_active = true` and non-expired, so the client query only needs to filter by `position`
- A new RLS policy for UPDATE on `clicks` won't be needed since we can use an RPC function or simply rely on the anon role -- however, since the current RLS only allows admin ALL access, we'll need to add a permissive UPDATE policy for the `clicks` column. Alternative: create a small `increment_banner_clicks` RPC function (security definer) that only increments the clicks field, similar to the existing `increment_views` pattern.
- Recommended approach: Create an `increment_banner_clicks(banner_id uuid)` database function to keep it secure.

### Database Function for Click Tracking

```sql
CREATE OR REPLACE FUNCTION public.increment_banner_clicks(banner_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  UPDATE banners SET clicks = clicks + 1 WHERE id = banner_id;
$$;
```

### Files Changed

| File | Change |
|------|--------|
| `src/components/BannerAd.tsx` | Full rewrite: Supabase fetch, position prop, click tracking, skeleton, placeholder |
| `src/pages/Index.tsx` | Pass `position="top"`, add `position="bottom"` banner |
| `src/pages/GroupDetail.tsx` | Pass `position="top"` and `position="bottom"` to BannerAd instances |
| Database migration | Add `clicks` column, create `increment_banner_clicks` function |

