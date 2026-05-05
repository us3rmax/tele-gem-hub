import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { join } from "path";

const SUPABASE_URL = "https://lymjjozpdsdoloahsyey.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5bWpqb3pwZHNkb2xvYWhzeWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODgxMDQsImV4cCI6MjA4NjU2NDEwNH0.dC2d16T0DHt67rDr4RFuTU4hg79vxj0YUGf91xdxdBs";

const BASE_URL = "https://www.canais18.com";

const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily", lastmod: "2026-02-20" },
  { path: "/submit", priority: "0.6", changefreq: "monthly", lastmod: "2026-02-20" },
  { path: "/privacy", priority: "0.3", changefreq: "monthly", lastmod: "2026-02-20" },
  { path: "/terms", priority: "0.3", changefreq: "monthly", lastmod: "2026-02-20" },
  { path: "/contact", priority: "0.3", changefreq: "monthly", lastmod: "2026-02-20" },
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

function buildXml(groups: { id: string; name: string; created_at: string }[]) {
  const staticUrls = STATIC_PAGES.map(
    (page) => `  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  ).join("\n");

  const groupUrls = groups
    .map((group) => {
      const slug = generateSlug(group.name);
      const compactId = group.id.replace(/-/g, "");
      const path = slug ? `/group/${slug}-${compactId}` : `/group/${compactId}`;
      const lastmod = group.created_at
        ? group.created_at.split("T")[0]
        : "2026-02-20";
      return `  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${groupUrls}
</urlset>`;
}

async function main() {
  console.log("Fetching groups from Supabase...");
  const groups = await fetchAllGroups();
  console.log(`Fetched ${groups.length} groups.`);
  const xml = buildXml(groups);
  const outPath = join(process.cwd(), "public", "sitemap.xml");
  writeFileSync(outPath, xml, "utf-8");
  console.log(`Sitemap written to ${outPath} with ${groups.length} group URLs.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
