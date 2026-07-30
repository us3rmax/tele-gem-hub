import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const BASE_URL = "https://www.canais18.com";

// Static pages — high priority
const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/grupos-telegram", priority: "0.9", changefreq: "daily" },
  { path: "/categorias", priority: "0.8", changefreq: "weekly" },
  { path: "/modelos", priority: "0.8", changefreq: "weekly" },
  { path: "/blog", priority: "0.7", changefreq: "weekly" },
];

// Landing page routes — high priority SEO pages
const LANDING_PAGES = [
  "telegram-putaria", "putaria-telegram", "grupos-putaria-telegram",
  "grupo-putaria-telegram", "grupos-de-putaria-telegram",
  "grupo-de-putaria-telegram", "canal-de-putaria",
  "xvideos-putaria", "video-porno-telegram", "porno-gratis-telegram",
  "xvideos-porno-telegram", "putaria-brasileira", "putaria-brasileira-telegram",
  "grupos-porno-telegram", "canais-putaria-telegram",
  "telegram-porno", "telegram-xxx", "xxx-telegram",
  "grupos-telegram-18", "canais-telegram-18", "telegram-adulto",
  "grupos-telegram-geral", "links-telegram", "telegram-proibido",
  "grupo-telegram-18", "grupos-telegram-pode-tudo", "grupos-telegram-secretos",
  "grupos-18-telegram", "grupo-telegram-proibido", "grupos-telegram",
  "telegram-sexo", "sexo-telegram", "video-sexo-telegram",
  "videos-eroticos-telegram", "chat-sexo-telegram",
  "novinhas-telegram", "mulheres-nuas-telegram", "vazadinhos-telegram",
  "vazados-telegram", "telegram-vazados", "vazou-telegram", "vazado-telegram",
  "grupos-telegram-vazados",
  "onlyfans-telegram", "onlyfans-packs", "onlyfans-vazados",
  "telegram-onlyfans", "michele-umezu-onlyfans",
  "privacy-telegram", "erome-privacy", "privacy-gratis",
  "amadoras-telegram", "gay-telegram", "fetiche-telegram",
  "casadas-telegram", "celebridades-telegram", "asiaticas-telegram",
  "bdsm-telegram", "bbw-telegram", "coroas-telegram",
  // === NOVAS (keyword gap) ===
  "corno-telegram", "telegram-corno", "amador-telegram",
  "telegram-canais", "telegram-links", "telegram-grupo",
  "grupos-do-telegram", "telegram-puxadas", "curso-telegram",
  "erome-telegram", "telegram-fap", "flagras-telegram",
  "grupos-telegram-br",
  // === MODELOS INDIVIDUAIS (hardcoded) ===
  "dra-sophia-privacy", "erome-juliana-silva", "bia-albina-erome",
  "cosvickye-erome", "nayzinha-erome",
  "privacy-bad-mi", "privacy-display-apk", "erome-nicole-rodrigues",
  "nyvi-estephan-erome", "nayara-erome", "jenifer-novaki-privacy",
  "camila-prado-privacy", "mae-e-filha-erome",
  "erome-privacy", "privacy-vazados", "erome-vazados", "erome-vazado",
  "erome-vazou", "erome-gostosa", "vazados-erome",
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

/**
 * Fetch ONLY visible (non-hidden) groups for the sitemap.
 */
async function fetchVisibleGroups() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const allGroups: { id: string; name: string; created_at: string; description: string | null }[] = [];
  const batchSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("groups")
      .select("id, name, created_at, description")
      .eq("hidden", false)
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

/**
 * Fetch dynamic model/celebrity pages from the database.
 * Model pages are groups where category starts with "modelo_".
 * Deduplicates by model name so each model = 1 sitemap entry.
 */
async function fetchModelPages() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const { data, error } = await supabase
    .from("groups")
    .select("category, created_at")
    .eq("hidden", false)
    .like("category", "modelo_%");
  
  if (error) {
    console.error("Error fetching model pages:", error);
    return [];
  }
  if (!data || data.length === 0) return [];

  // Deduplicate: extract model name from category prefix
  const modelSet = new Map<string, { slug: string; name: string; created_at: string }>();
  for (const group of data) {
    const modelName = (group.category || "").replace(/^modelo_/, "");
    const slug = generateSlug(modelName);
    if (!slug) continue;
    if (!modelSet.has(slug)) {
      modelSet.set(slug, {
        slug,
        name: modelName,
        created_at: group.created_at || new Date().toISOString(),
      });
    }
  }
  return Array.from(modelSet.values());
}

function buildUrlBlock(
  path: string,
  lastmod: string,
  changefreq: string,
  priority: string,
): string {
  return `  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

Deno.serve(async () => {
  try {
    const groups = await fetchVisibleGroups();
    const modelPages = await fetchModelPages();
    const today = new Date().toISOString().split("T")[0];

    // ── Static pages ──
    const staticUrls = STATIC_PAGES.map((p) =>
      buildUrlBlock(p.path, today, p.changefreq, p.priority)
    ).join("\n");

    // ── Landing pages (SEO-optimized, high priority) ──
    const landingUrls = LANDING_PAGES.map((slug) =>
      buildUrlBlock(`/${slug}`, today, "weekly", "0.9")
    ).join("\n");

    // ── Model pages (dynamic, medium-high priority) ──
    const modelUrls = modelPages.map((model) =>
      buildUrlBlock(`/modelo/${model.slug}`, today, "weekly", "0.8")
    ).join("\n");

    // ── Group pages (only visible ones, with proper changefreq) ──
    const groupUrls = groups.map((group) => {
      const slug = generateSlug(group.name);
      const compactId = group.id.replace(/-/g, "");
      const urlPath = slug ? `/group/${slug}-${compactId}` : `/group/${compactId}`;
      const lastmod = group.created_at ? group.created_at.split("T")[0] : today;
      const priority = group.description ? "0.7" : "0.5";
      return buildUrlBlock(urlPath, lastmod, "weekly", priority);
    }).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${landingUrls}
${modelUrls}
${groupUrls}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "X-Sitemap-Source": "edge-functions",
        "X-Sitemap-Models": String(modelPages.length),
        "X-Sitemap-Groups": String(groups.length),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("Sitemap generation failed:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
});
