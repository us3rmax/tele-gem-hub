interface Group {
  id: string;
  name: string;
  description: string | null;
  category: string;
  member_count: number;
  thumbnail_url: string | null;
  telegram_link: string;
  views: number | null;
  is_premium: boolean | null;
  created_at: string;
}

function extractIdFromSlug(slugParam: string): string {
  const match = slugParam.match(/([a-f0-9]{32})$/);
  if (match) {
    const hex = match[1];
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return slugParam;
}

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

function groupPath(grupo: { id: string; name: string }): string {
  const slug = generateSlug(grupo.name);
  const compactId = grupo.id.replace(/-/g, "");
  return `/group/${slug}-${compactId}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMembers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toString();
}

export const onRequestGet: PagesFunction<{ SUPABASE_URL: string; SUPABASE_ANON_KEY: string }> = async (ctx) => {
  const slug = ctx.params.slug as string;
  const groupId = extractIdFromSlug(slug);

  const SUPABASE_URL = ctx.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = ctx.env.SUPABASE_ANON_KEY;

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/groups?id=eq.${groupId}&select=*&limit=1`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data: Group[] = await res.json();
  const grupo = data?.[0];

  if (!grupo) {
    return ctx.next();
  }

  const indexRes = await ctx.env.ASSETS.fetch(new URL("/index.html", ctx.request.url));
  const html = await indexRes.text();

  const canonicalUrl = `https://www.canais18.com${groupPath(grupo)}`;
  const seoDescription = grupo.description
    ? grupo.description.slice(0, 155) + (grupo.description.length > 155 ? "..." : "")
    : `Entre no canal ${escapeHtml(grupo.name)} do Telegram. ${formatMembers(grupo.member_count)} membros ativos. Categoria: ${escapeHtml(grupo.category)}. Conteúdo exclusivo 18+.`;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemPage",
    name: `${grupo.name} - Canal Telegram 18+`,
    description: seoDescription,
    url: canonicalUrl,
    image: grupo.thumbnail_url || undefined,
    datePublished: grupo.created_at,
    dateModified: grupo.created_at,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Canais18", item: "https://www.canais18.com" },
        { "@type": "ListItem", position: 2, name: grupo.category, item: `https://www.canais18.com/?category=${encodeURIComponent(grupo.category)}` },
        { "@type": "ListItem", position: 3, name: grupo.name, item: canonicalUrl },
      ],
    },
  });

  const seoTags = `
    <title>${escapeHtml(grupo.name)} — Grupo Telegram +18 | Canais18</title>
    <meta name="description" content="${escapeHtml(seoDescription)}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:title" content="${escapeHtml(grupo.name)} — Grupo Telegram +18 | Canais18" />
    <meta property="og:description" content="${escapeHtml(seoDescription)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="article" />
    ${grupo.thumbnail_url ? `<meta property="og:image" content="${escapeHtml(grupo.thumbnail_url)}" />` : ""}
    <meta name="robots" content="index, follow" />
    <script type="application/ld+json">${jsonLd}</script>`;

  const googleBotContent = `
  <div id="ssg-content" style="display:none" aria-hidden="true">
    <h1>${escapeHtml(grupo.name)}</h1>
    <p>${escapeHtml(seoDescription)}</p>
    <p>Categoria: ${escapeHtml(grupo.category)}</p>
    <p>Membros: ${formatMembers(grupo.member_count)}</p>
  </div>`;

  const injectedHtml = html
    .replace(/<title>.*?<\/title>/i, "")
    .replace("</head>", `${seoTags}\n</head>`)
    .replace("</body>", `${googleBotContent}\n</body>`);

  return new Response(injectedHtml, {
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "index, follow",
    },
  });
};
