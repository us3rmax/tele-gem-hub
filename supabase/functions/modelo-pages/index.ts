// modelo-pages — SSR edge function para páginas dinâmicas de modelo/celebridade.
// Acionada pelo Cloudflare Pages via _redirects: /modelo/:slug -> /functions/v1/modelo-pages?slug=:slug
//
// Lógica:
// 1. Recebe o slug do modelo (ex: "nayzinha" ou "dra-sophia")
// 2. Busca no Supabase grupos visíveis onde category LIKE "modelo_%[nome]%"
// 3. Renderiza HTML completo com Schema.org (WebPage + Person + ItemList + FAQPage)
// 4. Retorna 404 se nenhum grupo encontrado

const BASE_URL = "https://www.canais18.com";
const PRIMARY_COLOR = "#0ea5e9";

interface Group {
  slug: string | null;
  name: string;
  telegram_link: string;
  description: string | null;
  member_count: number;
  thumbnail_url: string | null;
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

// Dados SEO pré-definidos para modelos populares (fallback)
const MODEL_SEO: Record<string, { displayName: string; platform: string; description: string }> = {
  "nayzinha": { displayName: "Nayzinha", platform: "OnlyFans", description: "Nayzinha — conteúdo exclusivo vazado do OnlyFans no Telegram. Grupos verificados com material da criadora." },
  "dra-sophia": { displayName: "Dra. Sophia", platform: "Privacy", description: "Dra. Sophia — conteúdo exclusivo vazado do Privacy no Telegram. Grupos verificados com material da criadora." },
  "bia-albina": { displayName: "Bia Albina", platform: "Privacy", description: "Bia Albina — conteúdo exclusivo vazado do Privacy no Telegram. Grupos verificados com material da criadora." },
  "erome-juliana-silva": { displayName: "Juliana Silva", platform: "Erome", description: "Juliana Silva — conteúdo do Erome disponível no Telegram. Grupos verificados com material da criadora." },
  "michele-umezu": { displayName: "Michele Umezu", platform: "OnlyFans", description: "Michele Umezu — conteúdo exclusivo vazado do OnlyFans no Telegram. Grupos verificados com material da criadora." },
  "cosvickye": { displayName: "Cosvickye", platform: "Erome", description: "Cosvickye — conteúdo do Erome disponível no Telegram. Grupos verificados com material da criadora." },
  "privacy-bad-mi": { displayName: "Bad Mi", platform: "Privacy", description: "Bad Mi — conteúdo exclusivo vazado do Privacy no Telegram. Grupos verificados com material da criadora." },
  "privacy-display-apk": { displayName: "Display APK", platform: "Privacy", description: "Display APK — conteúdo exclusivo vazado do Privacy no Telegram. Grupos verificados." },
  "erome-nicole-rodrigues": { displayName: "Nicole Rodrigues", platform: "Erome", description: "Nicole Rodrigues — conteúdo do Erome disponível no Telegram. Grupos verificados com material da criadora." },
  "nyvi-estephan": { displayName: "Nyvi Estephan", platform: "Erome", description: "Nyvi Estephan — conteúdo do Erome disponível no Telegram. Grupos verificados com material da criadora." },
  "nayara": { displayName: "Nayara", platform: "Erome", description: "Nayara — conteúdo do Erome disponível no Telegram. Grupos verificados com material da criadora." },
  "jenifer-novaki": { displayName: "Jenifer Novaki", platform: "Privacy", description: "Jenifer Novaki — conteúdo exclusivo vazado do Privacy no Telegram. Grupos verificados." },
  "camila-prado": { displayName: "Camila Prado", platform: "Privacy", description: "Camila Prado — conteúdo exclusivo vazado do Privacy no Telegram. Grupos verificados." },
  "mae-e-filha": { displayName: "Mãe e Filha", platform: "Erome", description: "Mãe e Filha — conteúdo do Erome disponível no Telegram. Grupos verificados." },
  "erome-gostosa": { displayName: "Gostosa", platform: "Erome", description: "Conteúdo gostosa do Erome disponível no Telegram. Grupos verificados e atualizados." },
  "erome-privacy": { displayName: "Privacy Erome", platform: "Erome/Privacy", description: "Conteúdo vazado do Privacy para Erome disponível no Telegram. Grupos verificados." },
};

async function fetchModelGroups(modelSlug: string, sbUrl: string, sbKey: string): Promise<Group[]> {
  try {
    // Busca grupos visíveis com categoria que contém o nome do modelo
    const modelName = modelSlug.replace(/-/g, " ");
    const { data, error } = await fetch(
      `${sbUrl}/rest/v1/groups?hidden=eq.false&not.thumbnail_url=is.null&order=member_count.desc&limit=30&select=slug,name,telegram_link,description,member_count,thumbnail_url,category&category=ilike.*${encodeURIComponent(modelName)}*`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
    );
    if (!error && data) return data;
  } catch {
    // fallback
  }

  // Fallback: buscar por category com prefixo "modelo_"
  try {
    const categoryPrefix = `modelo_${modelSlug.replace(/-/g, "_")}`;
    const { data, error } = await fetch(
      `${sbUrl}/rest/v1/groups?hidden=eq.false&not.thumbnail_url=is.null&order=member_count.desc&limit=30&select=slug,name,telegram_link,description,member_count,thumbnail_url&category=eq.${categoryPrefix}`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
    );
    if (!error && data && data.length > 0) return data;
  } catch {
    // fallback
  }

  // Fallback 2: buscar pelo nome do modelo em qualquer campo
  try {
    const searchName = modelSlug.replace(/-/g, " ");
    const { data, error } = await fetch(
      `${sbUrl}/rest/v1/groups?hidden=eq.false&not.thumbnail_url=is.null&order=member_count.desc&limit=30&select=slug,name,telegram_link,description,member_count,thumbnail_url&name=ilike.*${encodeURIComponent(searchName)}*`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
    );
    if (!error && data) return data;
  } catch {
    // fallback
  }

  return [];
}

function renderGroups(groups: Group[], modelSlug: string): string {
  if (!groups.length) {
    return `<p style='text-align:center;padding:40px;color:#666;'>Nenhum grupo encontrado para este modelo no momento. Tente novamente mais tarde.</p>`;
  }
  
  const validGroups = groups.filter(g => g.name && g.telegram_link);
  if (!validGroups.length) {
    return `<p style='text-align:center;padding:40px;color:#666;'>Nenhum conteúdo válido disponível no momento.</p>`;
  }

  return `
  <div class="groups-grid">
    ${validGroups.map((g) => {
      const groupSlug = g.slug || generateSlug(g.name);
      const thumb = g.thumbnail_url 
        ? `<img src="${g.thumbnail_url}" alt="${g.name}" loading="lazy" class="card-img">`
        : `<div class="card-placeholder">${g.name.charAt(0).toUpperCase()}</div>`;
      return `
      <a href="${BASE_URL}/group/${groupSlug}" class="group-card">
        <div class="card-image-container">${thumb}<div class="card-badge">18+</div></div>
        <div class="card-content">
          <h3 class="card-title">${g.name}</h3>
          <div class="card-stats">👥 ${g.member_count.toLocaleString("pt-BR")}</div>
          <div class="card-btn">Entrar</div>
        </div>
      </a>`;
    }).join("")}
  </div>`;
}

serve(async (req) => {
  const sbUrl = Deno.env.get("SUPABASE_URL") || "";
  const sbKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!sbUrl || !sbKey) {
    return new Response("Configuração inválida", { status: 500 });
  }

  const url = new URL(req.url);
  const modelSlug = url.searchParams.get("slug") || "";
  
  if (!modelSlug) {
    return new Response("Slug do modelo não fornecido", { status: 400 });
  }

  const seo = MODEL_SEO[modelSlug] || {
    displayName: modelSlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    platform: "Telegram",
    description: `Conteúdo de ${modelSlug.replace(/-/g, " ")} no Telegram. Grupos verificados com material da criadora.`
  };

  const groups = await fetchModelGroups(modelSlug, sbUrl, sbKey);
  
  if (!groups || groups.length === 0) {
    return new Response(
      `<!DOCTYPE html><html><head><title>Modelo não encontrado | Canais18</title></head>
      <body style="background:#0a0a0a;color:#fff;font-family:system-ui;text-align:center;padding:100px 20px;">
        <h1>Página não encontrada</h1>
        <p>O modelo <strong>${seo.displayName}</strong> não tem grupos disponíveis no momento.</p>
        <a href="${BASE_URL}" style="color:${PRIMARY_COLOR}">Voltar para a página inicial</a>
      </body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const canonicalUrl = `${BASE_URL}/modelo/${modelSlug}`;
  const h1 = `${seo.displayName} Telegram: Conteúdo de ${seo.platform}`;
  const metaDesc = seo.description;

  // JSON-LD structured data: @graph with WebPage + Person + ItemList + BreadcrumbList + FAQPage
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        "name": "Canais18",
        "url": BASE_URL,
        "description": "Maior diretório de grupos e canais adultos do Telegram no Brasil.",
        "inLanguage": "pt-BR",
        "publisher": { "@id": `${BASE_URL}/#organization` }
      },
      {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        "name": "Canais18",
        "url": BASE_URL,
        "logo": { "@type": "ImageObject", "url": `${BASE_URL}/logo.png` },
        "sameAs": []
      },
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        "url": canonicalUrl,
        "name": h1,
        "description": metaDesc,
        "isPartOf": { "@id": `${BASE_URL}/#website` },
        "about": {
          "@type": "Person",
          "name": seo.displayName,
          "url": canonicalUrl,
          "description": `Criadora de conteúdo adulto com presença no Telegram. Conteúdo de ${seo.platform}.`
        },
        "numberOfItems": groups.filter(g => g.name && g.telegram_link).length,
        "itemListElement": groups.filter(g => g.name && g.telegram_link).slice(0, 10).map((g, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "name": g.name,
          "url": `${BASE_URL}/group/${g.slug || generateSlug(g.name)}`
        }))
      },
      {
        "@type": "Person",
        "@id": `${canonicalUrl}#person`,
        "name": seo.displayName,
        "description": `Criadora de conteúdo adulto. Conteúdo disponível no Telegram com ${groups.length} grupos verificados.`,
        "url": canonicalUrl
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Início", "item": BASE_URL },
          { "@type": "ListItem", "position": 2, "name": "Modelos", "item": `${BASE_URL}/modelos` },
          { "@type": "ListItem", "position": 3, "name": seo.displayName, "item": canonicalUrl }
        ]
      }
    ]
  });

  // FAQPage schema for rich snippets
  const faqJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `Onde encontrar conteúdo de ${seo.displayName} no Telegram?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `O Canais18 reúne ${groups.length} grupos verificados com conteúdo de ${seo.displayName}. Todos os links são testados diariamente para garantir que estão funcionando.`
        }
      },
      {
        "@type": "Question",
        "name": "O conteúdo de ${seo.displayName} no Telegram é gratuito?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Sim, todos os grupos de ${seo.displayName} listados no Canais18 são de acesso gratuito. Basta clicar no botão "Entrar" para ser redirecionado ao canal no Telegram.`
        }
      },
      {
        "@type": "Question",
        "name": "O conteúdo é do ${seo.platform}?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Sim. Os grupos listados contêm conteúdo exclusivo de ${seo.displayName} que originalmente está no ${seo.platform}, disponível gratuitamente no Telegram.`
        }
      },
      {
        "@type": "Question",
        "name": "Os links estão funcionando?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Sim. Nossa equipe verifica diariamente cada link dos grupos de ${seo.displayName}. Se um link estiver quebrado, ele é removido automaticamente do diretório.`
        }
      }
    ]
  });

  return new Response(`
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${h1} | Canais18</title>
    <meta name="description" content="${metaDesc}">
    <link rel="canonical" href="${canonicalUrl}">
    <meta name="robots" content="index,follow,max-image-preview:large">
    <meta property="og:title" content="${h1}">
    <meta property="og:description" content="${metaDesc}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Canais18">
    <script type="application/ld+json">${jsonLd}</script>
    <script type="application/ld+json">${faqJsonLd}</script>
    <style>
      :root { --primary: ${PRIMARY_COLOR}; --bg: #0a0a0a; --card: #161616; }
      body { background: var(--bg); color: #fff; font-family: system-ui, sans-serif; margin: 0; padding-top: 56px; }
      .container { max-width: 1100px; margin: 0 auto; padding: 0 12px; }
      .navbar { position: fixed; top: 0; left: 0; right: 0; height: 56px; background: rgba(10,10,10,0.9); backdrop-filter: blur(10px); border-bottom: 1px solid #222; display: flex; align-items: center; justify-content: space-between; padding: 0 15px; z-index: 1000; }
      .logo { font-weight: 900; font-size: 1.1rem; color: #fff; text-decoration: none; }
      .logo span { color: var(--primary); }
      .nav-btn { background: var(--primary); color: #fff; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; text-decoration: none; }
      .hero { text-align: center; padding: 20px 0 15px; }
      .hero h1 { font-size: 1.5rem; margin: 0 0 8px; font-weight: 800; line-height: 1.2; }
      .hero .platform { color: var(--primary); font-size: 0.9rem; font-weight: 600; margin-bottom: 8px; }
      .hero p { color: #777; font-size: 0.85rem; line-height: 1.4; margin: 0; max-width: 600px; margin: 8px auto 0; }
      .stats-bar { display: flex; gap: 20px; justify-content: center; margin-top: 12px; flex-wrap: wrap; }
      .stat-item { background: #161616; padding: 8px 16px; border-radius: 8px; border: 1px solid #222; }
      .stat-item strong { color: var(--primary); font-size: 1.1rem; }
      .stat-item span { color: #666; font-size: 0.75rem; margin-left: 6px; }
      .groups-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px; }
      @media (min-width: 768px) { .groups-grid { grid-template-columns: repeat(4, 1fr); gap: 20px; } }
      .group-card { background: var(--card); border-radius: 12px; overflow: hidden; border: 1px solid #222; text-decoration: none; display: flex; flex-direction: column; }
      .card-image-container { position: relative; height: 100px; }
      .card-img { width: 100%; height: 100%; object-fit: cover; }
      .card-placeholder { width: 100%; height: 100%; background: #222; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 900; color: #333; }
      .card-badge { position: absolute; top: 6px; left: 6px; background: rgba(0,0,0,0.8); color: #ff4d4d; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
      .card-content { padding: 10px; flex: 1; display: flex; flex-direction: column; }
      .card-title { color: #fff; font-size: 0.8rem; margin: 0 0 4px; font-weight: 700; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
      .card-stats { color: #555; font-size: 0.7rem; margin-bottom: 8px; }
      .card-btn { background: var(--primary); color: #fff; text-align: center; padding: 6px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; margin-top: auto; }
      .section-title { font-size: 1.1rem; margin: 30px 0 15px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
      .section-title::before { content: ''; width: 4px; height: 20px; background: var(--primary); border-radius: 2px; }
      details { margin-bottom: 12px; }
      summary { cursor: pointer; font-weight: 700; color: #ccc; padding: 8px 0; }
    </style>
  </head>
  <body>
    <nav class="navbar">
      <a href="${BASE_URL}" class="logo">canais<span>18</span>.com</a>
      <a href="${BASE_URL}/modelos" class="nav-btn">Ver Modelos</a>
    </nav>
    <div class="container">
      <header class="hero">
        <h1>${h1}</h1>
        <div class="platform">${seo.platform}</div>
        <p>${metaDesc}</p>
        <div class="stats-bar">
          <div class="stat-item"><strong>${groups.length}</strong><span>grupos</span></div>
          <div class="stat-item"><strong>${groups.reduce((sum, g) => sum + (g.member_count || 0), 0).toLocaleString("pt-BR")}</strong><span>membros</span></div>
          <div class="stat-item"><strong>100%</strong><span>verificados</span></div>
        </div>
      </header>
      <main>
        <section class="seo-intro" style="color: #888; font-size: 0.9rem; line-height: 1.6; margin: 20px 0; background: #111; padding: 20px; border-radius: 12px; border: 1px solid #222;">
          <p>Encontre <strong>grupos de ${seo.displayName} no Telegram</strong> com conteúdo exclusivo de <strong>${seo.platform}</strong>. Nossa equipe verifica links diariamente para garantir que você tenha acesso aos melhores canais com segurança. Explore a lista abaixo e entre nos grupos mais ativos.</p>
        </section>
        <h2 class="section-title">📱 Grupos de ${seo.displayName} em Destaque</h2>
        ${renderGroups(groups, modelSlug)}
        <section class="seo-footer" style="color: #666; font-size: 0.85rem; line-height: 1.6; margin: 40px 0; border-top: 1px solid #222; padding-top: 20px;">
          <h3>Como entrar nos grupos de ${seo.displayName}?</h3>
          <p>Para entrar em qualquer <strong>canal do Telegram</strong> listado, basta clicar no botão "Entrar". Você será redirecionado para o aplicativo oficial. Todos os grupos de <strong>${seo.displayName}</strong> são de acesso gratuito e verificados pelo <strong>Canais18</strong>.</p>
        </section>

        <section class="faq-section" style="margin: 40px 0;">
          <h2 class="section-title">❓ Perguntas Frequentes sobre ${seo.displayName}</h2>
          <div style="background: #111; padding: 20px; border-radius: 12px; border: 1px solid #222;">
            <details>
              <summary>Onde encontrar conteúdo de ${seo.displayName} no Telegram?</summary>
              <p style="color: #888; font-size: 0.9rem; margin-top: 8px; line-height: 1.6;">O Canais18 reúne <strong>${groups.length} grupos verificados</strong> com conteúdo de ${seo.displayName}. Todos os links são testados diariamente para garantir que estão funcionando.</p>
            </details>
            <details>
              <summary>O conteúdo de ${seo.displayName} no Telegram é gratuito?</summary>
              <p style="color: #888; font-size: 0.9rem; margin-top: 8px; line-height: 1.6;">Sim, todos os grupos de ${seo.displayName} listados no Canais18 são de acesso gratuito. Basta clicar no botão "Entrar" para ser redirecionado ao canal no Telegram.</p>
            </details>
            <details>
              <summary>O conteúdo é do ${seo.platform}?</summary>
              <p style="color: #888; font-size: 0.9rem; margin-top: 8px; line-height: 1.6;">Sim. Os grupos listados contêm conteúdo exclusivo de ${seo.displayName} que originalmente está no ${seo.platform}, disponível gratuitamente no Telegram.</p>
            </details>
            <details>
              <summary>Os links estão funcionando?</summary>
              <p style="color: #888; font-size: 0.9rem; margin-top: 8px; line-height: 1.6;">Sim. Nossa equipe verifica diariamente cada link dos grupos de ${seo.displayName}. Se um link estiver quebrado, ele é removido automaticamente.</p>
            </details>
          </div>
        </section>

        <section style="margin: 40px 0;">
          <h2 class="section-title">🔗 Outros Modelos Populares</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 30px;">
            ${Object.keys(MODEL_SEO).filter(s => s !== modelSlug).slice(0, 15).map(slug => {
              const m = MODEL_SEO[slug];
              return `<a href="${BASE_URL}/modelo/${slug}" style="background: #161616; color: #888; padding: 8px 16px; border-radius: 50px; font-size: 0.75rem; text-decoration: none; border: 1px solid #222;">${m.displayName}</a>`;
            }).join("")}
            <a href="${BASE_URL}/modelos" style="background: var(--primary); color: #fff; padding: 8px 16px; border-radius: 50px; font-size: 0.75rem; text-decoration: none;">Ver todos</a>
          </div>
        </section>
      </main>
    </div>
  </body>
  </html>`, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Modelo-Source": "edge-functions",
      "X-Modelo-Slug": modelSlug,
      "X-Modelo-Groups": String(groups.length),
    }
  });
});
