import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { join } from "path";

const SUPABASE_URL = "https://lymjjozpdsdoloahsyey.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5bWpqb3pwZHNkb2xvYWhzeWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODgxMDQsImV4cCI6MjA4NjU2NDEwNH0.dC2d16T0DHt67rDr4RFuTU4hg79vxj0YUGf91xdxdBs";

const BASE_URL = "https://www.canais18.com";

// Static pages with SEO-relevant priority
const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  // High-value SEO pages
  { path: "/modelos", priority: "0.95", changefreq: "daily" },
  { path: "/categorias", priority: "0.9", changefreq: "daily" },
  { path: "/grupos-telegram", priority: "0.9", changefreq: "daily" },
  { path: "/blog", priority: "0.8", changefreq: "weekly" },
  // Category landing pages (strong SEO targets)
  { path: "/telegram-putaria", priority: "0.9", changefreq: "daily" },
  { path: "/grupos-putaria-telegram", priority: "0.9", changefreq: "daily" },
  { path: "/telegram-porno", priority: "0.9", changefreq: "daily" },
  { path: "/telegram-xxx", priority: "0.9", changefreq: "daily" },
  { path: "/grupos-telegram-18", priority: "0.9", changefreq: "daily" },
  { path: "/novinhas-telegram", priority: "0.9", changefreq: "daily" },
  { path: "/vazados-telegram", priority: "0.9", changefreq: "daily" },
  { path: "/onlyfans-telegram", priority: "0.9", changefreq: "daily" },
  { path: "/canal-de-putaria", priority: "0.9", changefreq: "daily" },
  { path: "/grupo-putaria-telegram", priority: "0.9", changefreq: "daily" },
  { path: "/xxx-telegram", priority: "0.9", changefreq: "daily" },
  { path: "/grupos-porno-telegram", priority: "0.9", changefreq: "daily" },
  { path: "/canais-putaria-telegram", priority: "0.9", changefreq: "daily" },
  { path: "/canais-telegram-18", priority: "0.9", changefreq: "daily" },
  { path: "/telegram-adulto", priority: "0.9", changefreq: "daily" },
  { path: "/grupos-telegram-geral", priority: "0.9", changefreq: "daily" },
  { path: "/amadoras-telegram", priority: "0.9", changefreq: "daily" },
  { path: "/gay-telegram", priority: "0.9", changefreq: "daily" },
  { path: "/fetiche-telegram", priority: "0.9", changefreq: "daily" },
  { path: "/casadas-telegram", priority: "0.9", changefreq: "daily" },
  { path: "/celebridades-telegram", priority: "0.9", changefreq: "daily" },
  { path: "/asiaticas-telegram", priority: "0.9", changefreq: "daily" },
  { path: "/bdsm-telegram", priority: "0.9", changefreq: "daily" },
  { path: "/bbw-telegram", priority: "0.9", changefreq: "daily" },
  { path: "/coroas-telegram", priority: "0.9", changefreq: "daily" },
  // Functional / legal pages
  { path: "/submit", priority: "0.5", changefreq: "monthly" },
  { path: "/contato", priority: "0.5", changefreq: "monthly" },
  { path: "/advertise", priority: "0.5", changefreq: "monthly" },
  { path: "/privacy", priority: "0.3", changefreq: "monthly" },
  { path: "/terms", priority: "0.3", changefreq: "monthly" },
  { path: "/dmca", priority: "0.3", changefreq: "monthly" },
  { path: "/2257", priority: "0.3", changefreq: "monthly" },
  { path: "/removal", priority: "0.3", changefreq: "monthly" },
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

async function fetchAllPrivacyModels() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const allModels: { id: number; name: string }[] = [];
  const batchSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("privacy_models")
      .select("id, name")
      .range(offset, offset + batchSize - 1);

    if (error) throw error;
    if (data && data.length > 0) {
      allModels.push(...data);
      offset += batchSize;
      hasMore = data.length === batchSize;
    } else {
      hasMore = false;
    }
  }
  return allModels;
}

function buildXml(
  groups: { id: string; name: string; created_at: string }[],
  privacyModels: { id: string; name: string }[]
) {
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
      const path = slug ? `/group/${slug}-${compactId}` : `/group/${compactId}`;
      const lastmod = group.created_at
        ? group.created_at.split("T")[0]
        : today;
      return `  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    })
    .join("\n");

  const modelUrls = privacyModels
    .filter((m) => m.name)
    .map((model) => {
      const slug = generateSlug(model.name);
      const path = slug ? `/modelo/${slug}-${model.id}` : `/modelo/${model.id}`;
      return `  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${groupUrls}
${modelUrls}
</urlset>`;
}

async function main() {
  console.log("Fetching groups from Supabase...");
  const groups = await fetchAllGroups();
  console.log(`Fetched ${groups.length} groups.`);

  console.log("Fetching privacy models from Supabase...");
  const privacyModels = await fetchAllPrivacyModels();
  console.log(`Fetched ${privacyModels.length} privacy models.`);

  const xml = buildXml(groups, privacyModels);
  const outPath = join(process.cwd(), "public", "sitemap.xml");
  writeFileSync(outPath, xml, "utf-8");
  console.log(`Sitemap written to ${outPath}`);
  console.log(`Total: ${STATIC_PAGES.length + groups.length + privacyModels.length} URLs.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
