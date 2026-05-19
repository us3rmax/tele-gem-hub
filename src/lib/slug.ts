/**
 * Generate a URL-friendly slug from a group name.
 */
export function generateSlug(name: string): string {
  let slug = name.toLowerCase();
  slug = slug.replace(/[^\x20-\x7E]/g, '');
  slug = slug.replace(/[\s_]+/g, '-');
  slug = slug.replace(/[^a-z0-9-]/g, '');
  slug = slug.replace(/-+/g, '-');
  slug = slug.replace(/^-+|-+$/g, '');
  slug = slug.slice(0, 60).replace(/-+$/, '');
  return slug;
}

/**
 * Create a group URL path with slug and full ID.
 * Format: /group/{slug}-{id} where id has hyphens removed
 */
export function groupPath(grupo: { id: string; name: string; slug?: string | null }): string {
  if (grupo.slug) return `/group/${grupo.slug}`;
  const s = generateSlug(grupo.name);
  const compactId = grupo.id.replace(/-/g, '');
  return `/group/${s}-${compactId}`;
}

/**
 * Extract the UUID from a slug-id URL param.
 * The compact UUID (32 hex chars) is at the end.
 */
export function extractIdFromSlug(slugParam: string): string {
  // Extract the last 32 hex characters as the compact UUID
  const match = slugParam.match(/([a-f0-9]{32})$/);
  if (match) {
    const hex = match[1];
    // Reconstruct UUID format: 8-4-4-4-12
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return slugParam;
}
