import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://canais18.com";

const STATIC_PAGES = [
  { path: "/submit", priority: "0.6", changefreq: "monthly" },
  { path: "/privacy", priority: "0.6", changefreq: "monthly" },
  { path: "/terms", priority: "0.6", changefreq: "monthly" },
  { path: "/contato", priority: "0.6", changefreq: "monthly" },
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

function groupPath(id: string, name: string): string {
  const slug = generateSlug(name);
  const compactId = id.replace(/-/g, "");
  return `/group/${slug}-${compactId}`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toISOString().split("T")[0];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: groups, error } = await supabase
      .from("groups")
      .select("id, name, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const today = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

    // Group pages (priority 0.8)
    for (const group of groups || []) {
      const path = groupPath(group.id, group.name);
      const lastmod = formatDate(group.created_at);
      xml += `
  <url>
    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    // Static pages (priority 0.6)
    for (const page of STATIC_PAGES) {
      xml += `
  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    }

    xml += `
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Sitemap error:", err);
    return new Response("Internal Server Error", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
