import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const BASE_URL = "https://www.canais18.com";

const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/categorias", priority: "0.8", changefreq: "weekly" },
  { path: "/blog", priority: "0.7", changefreq: "weekly" },
  { path: "/contato", priority: "0.5", changefreq: "monthly" },
  { path: "/grupos-telegram", priority: "0.8", changefreq: "daily" },
  { path: "/submit", priority: "0.6", changefreq: "monthly" },
  { path: "/privacy", priority: "0.3", changefreq: "monthly" },
  { path: "/terms", priority: "0.3", changefreq: "monthly" },
];

function generateSlug(name: string): string {
  let slug = name.toLowerCase();
  slug = slug.replace(/[^\x20-\x7E]/g, "");
  slug = slug.replace(/[\s_]+/g, "-");
  slug = slug.replace(/[^a-z0-9-]/g, "");
  slug = slug.replace(/-+/g, "-");
  slug = slug.replace(/^-+|-+$/g, "");
  slug = slug.slice(0, 60).replace(/-+$/, "");
  return slug;
}

async function fetchAllGroups() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const allGroups: { id: string; name: string; created_at: string }[] = [];
  const batchSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("groups")
      .select("id, name, created_at")
      .range(offset, offset + batchSize - 1);
    if (error) throw error;
    if (data && data.length > 0) {
      allGroups.push(...data);
      offset += batchSize;
      hasMore = data.length === batchSize;
    } else {
      hasMore = false;
    }
  }
  return allGroups;
}

Deno.serve(async () => {
  try {
    const groups = await fetchAllGroups();
    const today = new Date().toISOString().split("T")[0];

    const staticUrls = STATIC_PAGES.map(
      (page) => `  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    ).join("\n");

    const groupUrls = groups
      .map((group) => {
        const slug = generateSlug(group.name);
        const compactId = group.id.replace(/-/g, "");
        const urlPath = slug
          ? `/group/${slug}-${compactId}`
          : `/group/${compactId}`;
        const lastmod = group.created_at
          ? group.created_at.split("T")[0]
          : today;
        return `  <url>
    <loc>${BASE_URL}${urlPath}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${groupUrls}
</urlset>`;

    return new Response(xml, {
      headers: { "Content-Type": "application/xml; charset=utf-8", "X-Sitemap-Source": "edge-functions" },
    });
  } catch (e) {
    console.error("Sitemap generation failed:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
});
