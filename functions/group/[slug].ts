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

function groupPath(grupo: { id: string; name: string; slug?: string }): string {
  if (grupo.slug) return `/group/${grupo.slug}`;
  const s = generateSlug(grupo.name);
  const compactId = grupo.id.replace(/-/g, "");
  return `/group/${s}-${compactId}`;
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
    // Redireciona para a página de grupos geral se o grupo específico não for encontrado
    // Isso evita o erro 404 no Search Console e mantém o usuário no site
    return Response.redirect("https://www.canais18.com/grupos-telegram", 301);
  }

  const indexRes = await ctx.env.ASSETS.fetch(new Request("https://dummy.com/index.html"));
  const html = await indexRes.text();

  const canonicalUrl = `https://www.canais18.com${groupPath(grupo)}`;
  // Garante que a descrição seja única adicionando o ID compacto se não houver descrição original
  const compactId = grupo.id.replace(/-/g, "").slice(-6);
  const seoDescription = grupo.description
    ? grupo.description.slice(0, 155) + (grupo.description.length > 155 ? "..." : "")
    : `Acesse agora o canal ${escapeHtml(grupo.name)} no Telegram. No Canais18 você encontra os melhores grupos de ${escapeHtml(grupo.category)} com ${formatMembers(grupo.member_count)} membros ativos. Ref: ${compactId}.`;

  // Título único para evitar duplicatas (usando o ID compacto)
  const uniqueTitle = `${escapeHtml(grupo.name)} — Canal Telegram ${escapeHtml(grupo.category)} | Canais18 #${compactId}`;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemPage",
    name: uniqueTitle,
    description: seoDescription,
    url: canonicalUrl,
    image: grupo.thumbnail_url || undefined,
    datePublished: grupo.created_at,
    dateModified: grupo.created_at,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Canais18", item: "https://www.canais18.com" },
        { "@type": "ListItem", position: 2, name: grupo.category, item: `https://www.canais18.com/categoria/${generateSlug(grupo.category)}` },
        { "@type": "ListItem", position: 3, name: grupo.name, item: canonicalUrl },
      ],
    },
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
    <meta name="robots" content="index, follow" />
    <script type="application/ld+json">${jsonLd}</script>`;

  // Aumenta o word count para o Googlebot com texto estruturado e útil
  const googleBotContent = `
<div id="ssg-content" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;">
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
      "X-Robots-Tag": "index, follow",
    },
  });
};
