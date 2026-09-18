interface Group {
  id: string;
  name: string;
  description: string | null;
  category: string;
  member_count: number;
  thumbnail_url: string | null;
  telegram_link: string;
  slug?: string;
  views: number | null;
  is_premium: boolean | null;
  created_at: string;
  hidden: boolean | null;
  broken: boolean | null;
}

function extractIdFromSlug(slugParam: string): string {
  const match = slugParam.match(/([a-f0-9]{32})$/);
  if (match) {
    const hex = match[1];
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return slugParam;
}

function groupPath(grupo: { slug?: string }): string | null {
  return grupo.slug ? `/group/${grupo.slug}` : null;
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
  const SUPABASE_URL = ctx.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = ctx.env.SUPABASE_ANON_KEY;

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };

  // Tenta buscar pelo slug curto primeiro
  let res = await fetch(
    `${SUPABASE_URL}/rest/v1/groups?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`,
    { headers }
  );
  let rows: Group[] = await res.json();

  // Fallback: busca pelo ID longo (URLs antigas já indexadas)
  if (!rows?.[0]) {
    const groupId = extractIdFromSlug(slug);
    res = await fetch(
      `${SUPABASE_URL}/rest/v1/groups?id=eq.${groupId}&select=*&limit=1`,
      { headers }
    );
    rows = await res.json();
  }

  const grupo = rows?.[0];

  if (!grupo) {
    return new Response("Grupo não encontrado", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=UTF-8", "X-Robots-Tag": "noindex" },
    });
  }

  const canonicalPath = groupPath(grupo);
  if (!canonicalPath) {
    return new Response("Grupo sem slug canônico", {
      status: 410,
      headers: { "Content-Type": "text/plain; charset=UTF-8", "X-Robots-Tag": "noindex" },
    });
  }

  if (slug !== grupo.slug) {
    return Response.redirect(`https://www.canais18.com${canonicalPath}`, 301);
  }

  // Only groups with a stable public record and real editorial content may
  // be indexed. Keep the page available for users/admin review, but mark
  // incomplete, hidden or broken records as noindex.
  const description = (grupo.description || "").trim();
  const telegramLink = (grupo.telegram_link || "").trim();
  const indexable = Boolean(
    (grupo.hidden === false || grupo.hidden === null) &&
    (grupo.broken === false || grupo.broken === null) &&
    grupo.name?.trim() &&
    description.length >= 40 &&
    /^https?:\/\/(t\.me|telegram\.me)\//i.test(telegramLink)
  );

  const indexRes = await ctx.env.ASSETS.fetch(new Request("https://www.canais18.com/index.html"));
  let html = await indexRes.text();

  // LIMPEZA CRÍTICA: Remove o H1 e o conteúdo da Home que injetamos no index.html
  // Isso evita que a página do grupo tenha o H1 da Home + o H1 do Grupo (duplicidade)
  html = html.replace(/<div id="ssg-hero-content"[\s\S]*?<\/div>/i, "");

  const canonicalUrl = `https://www.canais18.com${canonicalPath}`;
  const compactId = grupo.id.replace(/-/g, "").slice(-6);
  const seoDescription = indexable && grupo.description
    ? grupo.description.slice(0, 155) + (grupo.description.length > 155 ? "..." : "")
    : `Acesse agora o canal ${escapeHtml(grupo.name)} no Telegram. No Canais18 você encontra os melhores grupos de ${escapeHtml(grupo.category)} com ${formatMembers(grupo.member_count)} membros ativos. Ref: ${compactId}.`;

  const uniqueTitle = `${escapeHtml(grupo.name)} — Canal Telegram ${escapeHtml(grupo.category)} | Canais18 #${compactId}`;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.canais18.com/#website",
        "name": "Canais18",
        "url": "https://www.canais18.com",
        "description": "Maior diretório de grupos e canais adultos do Telegram no Brasil.",
        "inLanguage": "pt-BR",
        "publisher": { "@id": "https://www.canais18.com/#organization" }
      },
      {
        "@type": "Organization",
        "@id": "https://www.canais18.com/#organization",
        "name": "Canais18",
        "url": "https://www.canais18.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.canais18.com/logo.png",
          "width": 512,
          "height": 512
        },
        "sameAs": []
      },
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        "url": canonicalUrl,
        "name": uniqueTitle,
        "description": seoDescription,
        "isPartOf": { "@id": "https://www.canais18.com/#website" },
        "image": grupo.thumbnail_url || undefined,
        "datePublished": grupo.created_at,
        "dateModified": grupo.created_at,
        "inLanguage": "pt-BR",
        "publisher": { "@id": "https://www.canais18.com/#organization" }
      },
      {
        "@type": "OnlineCommunity",
        "@id": `${canonicalUrl}#community`,
        "name": grupo.name,
        "description": seoDescription,
        "url": grupo.telegram_link,
        "numberOfMembers": grupo.member_count,
        "isPartOf": {
          "@type": "WebSite",
          "@id": "https://www.canais18.com/#website"
        },
        ...(grupo.thumbnail_url ? { image: grupo.thumbnail_url } : {}),
        "inLanguage": "pt-BR"
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Início", "item": "https://www.canais18.com" },
          { "@type": "ListItem", "position": 2, "name": grupo.category, "item": `https://www.canais18.com/?category=${encodeURIComponent(grupo.category)}` },
          { "@type": "ListItem", "position": 3, "name": grupo.name, "item": canonicalUrl },
        ]
      }
    ]
  });

  const seoTags = `
    <title>${uniqueTitle}</title>
    <meta name="description" content="${escapeHtml(seoDescription)}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:title" content="${uniqueTitle}" />
    <meta property="og:description" content="${escapeHtml(seoDescription)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="article" />
    ${grupo.thumbnail_url ? `<meta property="og:image" content="${escapeHtml(grupo.thumbnail_url)}" />` : ""}
    <meta name="robots" content="${indexable ? "index, follow" : "noindex, follow"}" />
    <script type="application/ld+json">${jsonLd}</script>`;

  const googleBotContent = `
<div id="ssg-group-content" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;">
  <h1>${escapeHtml(grupo.name)}</h1>
  <p>${escapeHtml(seoDescription)}</p>
  <p>O canal <strong>${escapeHtml(grupo.name)}</strong> pertence à categoria <strong>${escapeHtml(grupo.category)}</strong> e possui atualmente mais de <strong>${formatMembers(grupo.member_count)}</strong> participantes ativos no Telegram.</p>
  <p>No Canais18, verificamos links de grupos de putaria, novinhas e conteúdos adultos diariamente para garantir que você sempre encontre links funcionando. Este grupo foi adicionado em ${new Date(grupo.created_at).toLocaleDateString('pt-BR')}.</p>
  <h2>Como entrar no grupo ${escapeHtml(grupo.name)}?</h2>
  <p>Para entrar no canal, basta clicar no link oficial do Telegram fornecido em nossa plataforma. Recomendamos ter o aplicativo do Telegram instalado no seu celular ou computador para uma melhor experiência.</p>
  <p>Explore também outros grupos de ${escapeHtml(grupo.category)} e conteúdos similares em nosso diretório atualizado.</p>
</div>`;

  const injectedHtml = html
    .replace(/<title>.*?<\/title>/i, "")
    .replace("</head>", `${seoTags}\n</head>`)
    .replace("</body>", `${googleBotContent}\n</body>`);

  return new Response(injectedHtml, {
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": indexable ? "index, follow" : "noindex, follow",
    },
  });
};
