// modelo-pages — SSR edge function para páginas dinâmicas de modelo/celebridade.
// Acionada pelo Cloudflare Pages via _redirects: /modelo/:slug -> /functions/v1/modelo-pages?slug=:slug
//
// Lógica:
// 1. Recebe o slug do modelo (ex: "ester-muniz", "jaianelimma", "bad-mi")
// 2. Busca dados reais do modelo na tabela privacy_models
// 3. Busca grupos relacionados no Telegram
// 4. Renderiza HTML completo com foto, bio, CTA Privacy, Schema.org
// 5. Retorna 404 se modelo não encontrado

const BASE_URL = "https://www.canais18.com";
const PRIMARY_COLOR = "#0ea5e9";

interface ModelData {
  name: string;
  profile_name: string;
  is_verified: boolean;
  avatar_url: string | null;
  cover_url: string | null;
  privacy_link: string | null;
  ranking: number;
  featured_type: string | null;
}

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

// Dados SEO pré-definidos para modelos populares
const MODEL_SEO: Record<string, {
  displayName: string;
  platform: string;
  description: string;
  seoTitle: string;
  bio: string;
}> = {
  "ester-muniz": {
    displayName: "Ester Muniz",
    platform: "Privacy",
    description: "Ester Muniz (@Esttermuniz) — previas grátis, fotos e grupos Telegram com conteúdo exclusivo da criadora. Ranking #2 do Privacy. Links verificados diariamente.",
    seoTitle: "Ester Muniz Privacy — Previas Gratis, Fotos e Grupos Telegram | Canais18",
    bio: "Ester Muniz é uma das criadoras mais populares do Privacy, classificada como Top Creator. Com conteúdo exclusivo de fotos e vídeos, ela é uma das perfis mais buscados do Brasil. Aqui você encontra os melhores grupos e canais do Telegram com conteúdo dela."
  },
  "jaianelimma": {
    displayName: "Jaiane Lima",
    platform: "Privacy",
    description: "Jaiane Lima (@jaianelimma) — previas grátis, fotos e grupos Telegram com conteúdo exclusivo da criadora. Ranking #4 do Privacy. Links verificados diariamente.",
    seoTitle: "Jaiane Lima Privacy — Previas Gratis, Fotos e Grupos Telegram | Canais18",
    bio: "Jaiane Lima é uma Top Creator do Privacy com conteúdo exclusivo de fotos e vídeos. Seus perfis são muito buscados no Brasil. Aqui você encontra os melhores grupos e canais do Telegram com conteúdo dela."
  },
  "bad-mi": {
    displayName: "Bad Mi",
    platform: "Privacy",
    description: "Bad Mi (MC Mirella) (@badmi) — previas grátis, fotos e grupos Telegram com conteúdo exclusivo. Ranking #5 do Privacy. Links verificados diariamente.",
    seoTitle: "Bad Mi Privacy — Previas Gratis, Fotos e Grupos Telegram | Canais18",
    bio: "Bad Mi, também conhecida como MC Mirella, é uma criadora popular do Privacy classificada como Top Creator. Com conteúdo exclusivo de fotos e vídeos, seus perfis são muito buscados no Brasil."
  },
  "nayzinha": { displayName: "Nayzinha", platform: "OnlyFans", description: "Nayzinha — conteúdo exclusivo vazado do OnlyFans no Telegram. Grupos verificados.", seoTitle: "Nayzinha OnlyFans — Previas Gratis e Grupos Telegram | Canais18", bio: "Nayzinha é uma das criadoras mais conhecidas do OnlyFans no Brasil." },
  "dra-sophia": { displayName: "Dra. Sophia", platform: "Privacy", description: "Dra. Sophia — conteúdo exclusivo do Privacy no Telegram. Grupos verificados.", seoTitle: "Dra. Sophia Privacy — Previas Gratis e Grupos Telegram | Canais18", bio: "Dra. Sophia é uma criadora popular do Privacy." },
  "bia-albina": { displayName: "Bia Albina", platform: "Privacy", description: "Bia Albina — conteúdo exclusivo do Privacy no Telegram. Grupos verificados.", seoTitle: "Bia Albina Privacy — Previas Gratis e Grupos Telegram | Canais18", bio: "Bia Albina é uma criadora conhecida do Privacy." },
  "erome-juliana-silva": { displayName: "Juliana Silva", platform: "Erome", description: "Juliana Silva — conteúdo do Erome no Telegram. Grupos verificados.", seoTitle: "Juliana Silva Erome — Previas Gratis e Grupos Telegram | Canais18", bio: "Juliana Silva tem conteúdo disponível no Erome e Telegram." },
  "michele-umezu": { displayName: "Michele Umezu", platform: "OnlyFans", description: "Michele Umezu — conteúdo do OnlyFans no Telegram. Grupos verificados.", seoTitle: "Michele Umezu OnlyFans — Previas Gratis e Grupos Telegram | Canais18", bio: "Michele Umezu é uma criadora do OnlyFans com conteúdo no Telegram." },
  "cosvickye": { displayName: "Cosvickye", platform: "Erome", description: "Cosvickye — conteúdo do Erome no Telegram. Grupos verificados.", seoTitle: "Cosvickye Erome — Previas Gratis e Grupos Telegram | Canais18", bio: "Cosvickye tem conteúdo disponível no Erome." },
  "privacy-bad-mi": { displayName: "Bad Mi", platform: "Privacy", description: "Bad Mi — conteúdo exclusivo do Privacy no Telegram. Grupos verificados.", seoTitle: "Bad Mi Privacy — Previas Gratis e Grupos Telegram | Canais18", bio: "Bad Mi é uma criadora do Privacy." },
  "privacy-display-apk": { displayName: "Display APK", platform: "Privacy", description: "Display APK — conteúdo do Privacy no Telegram.", seoTitle: "Display APK Privacy — Grupos Telegram | Canais18", bio: "Display APK é um perfil do Privacy." },
  "erome-nicole-rodrigues": { displayName: "Nicole Rodrigues", platform: "Erome", description: "Nicole Rodrigues — conteúdo do Erome no Telegram.", seoTitle: "Nicole Rodrigues Erome — Grupos Telegram | Canais18", bio: "Nicole Rodrigues tem conteúdo no Erome." },
  "nyvi-estephan": { displayName: "Nyvi Estephan", platform: "Erome", description: "Nyvi Estephan — conteúdo do Erome no Telegram.", seoTitle: "Nyvi Estephan Erome — Grupos Telegram | Canais18", bio: "Nyvi Estephan tem conteúdo no Erome." },
  "nayara": { displayName: "Nayara", platform: "Erome", description: "Nayara — conteúdo do Erome no Telegram.", seoTitle: "Nayara Erome — Grupos Telegram | Canais18", bio: "Nayara tem conteúdo no Erome." },
  "jenifer-novaki": { displayName: "Jenifer Novaki", platform: "Privacy", description: "Jenifer Novaki — conteúdo do Privacy no Telegram.", seoTitle: "Jenifer Novaki Privacy — Grupos Telegram | Canais18", bio: "Jenifer Novaki é uma criadora do Privacy." },
  "camila-prado": { displayName: "Camila Prado", platform: "Privacy", description: "Camila Prado — conteúdo do Privacy no Telegram.", seoTitle: "Camila Prado Privacy — Grupos Telegram | Canais18", bio: "Camila Prado é uma criadora do Privacy." },
  "mae-e-filha": { displayName: "Mãe e Filha", platform: "Erome", description: "Mãe e Filha — conteúdo do Erome no Telegram.", seoTitle: "Mãe e Filha Erome — Grupos Telegram | Canais18", bio: "Conteúdo Mãe e Filha disponível no Erome." },
  "erome-gostosa": { displayName: "Gostosa", platform: "Erome", description: "Gostosa — conteúdo do Erome no Telegram.", seoTitle: "Gostosa Erome — Grupos Telegram | Canais18", bio: "Conteúdo gostosa disponível no Erome." },
  "erome-privacy": { displayName: "Privacy Erome", platform: "Erome/Privacy", description: "Conteúdo vazado do Privacy para Erome no Telegram.", seoTitle: "Privacy Erome — Grupos Telegram | Canais18", bio: "Conteúdo vazado do Privacy para Erome." },
};

async function fetchModelData(sbUrl: string, sbKey: string, searchNames: string[]): Promise<ModelData | null> {
  try {
    // Build OR query for name matching
    const nameFilters = searchNames.map(n => `name.eq.${encodeURIComponent(n)}`).join(",");
    const { data, error } = await fetch(
      `${sbUrl}/rest/v1/privacy_models?${nameFilters}&limit=1`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
    );
    if (!error && data && data.length > 0) return data[0];
  } catch { /* fallback */ }
  return null;
}

async function fetchModelGroups(modelDisplayName: string, sbUrl: string, sbKey: string): Promise<Group[]> {
  try {
    // Search groups by model name in category or name
    const modelName = modelDisplayName.toLowerCase().replace(/\s+/g, " ");
    
    // Try 1: category ilike
    const { data: data1, error: err1 } = await fetch(
      `${sbUrl}/rest/v1/groups?hidden=eq.false&not.thumbnail_url=is.null&order=member_count.desc&limit=15&select=slug,name,telegram_link,description,member_count,thumbnail_url&category=ilike.*${encodeURIComponent(modelDisplayName.toLowerCase())}*`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
    );
    if (!err1 && data1 && data1.length > 0) return data1;
  } catch { /* fallback */ }

  // Try 2: name ilike
  try {
    const { data: data2, error: err2 } = await fetch(
      `${sbUrl}/rest/v1/groups?hidden=eq.false&not.thumbnail_url=is.null&order=member_count.desc&limit=15&select=slug,name,telegram_link,description,member_count,thumbnail_url&name=ilike.*${encodeURIComponent(modelDisplayName)}*`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
    );
    if (!err2 && data2 && data2.length > 0) return data2;
  } catch { /* fallback */ }

  return [];
}

function renderGroups(groups: Group[], modelSlug: string): string {
  if (!groups.length) {
    return `<div class="no-groups"><p>Nenhum grupo específico encontrado no momento. Confira os outros modelos populares abaixo ou <a href="${BASE_URL}/modelos" class="link-primary">veja todos os modelos</a>.</p></div>`;
  }
  
  const validGroups = groups.filter(g => g.name && g.telegram_link);
  if (!validGroups.length) {
    return `<div class="no-groups"><p>Nenhum conteúdo válido disponível no momento.</p></div>`;
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
          <div class="card-stats">${(g.member_count || 0).toLocaleString("pt-BR")} membros</div>
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
    description: `Conteúdo de ${modelSlug.replace(/-/g, " ")} no Telegram. Grupos verificados.`,
    seoTitle: `${modelSlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())} Telegram — Grupos | Canais18`,
    bio: `Conteúdo de ${modelSlug.replace(/-/g, " ")} disponível no Telegram.`
  };

  // Try to fetch real model data from database
  let modelData: ModelData | null = null;
  const searchNames = [seo.displayName, modelSlug.replace(/-/g, " ")];
  modelData = await fetchModelData(sbUrl, sbKey, searchNames);

  // Use real data if available, otherwise fall back to seo defaults
  const displayName = modelData?.name || seo.displayName;
  const avatarUrl = modelData?.avatar_url || null;
  const coverUrl = modelData?.cover_url || null;
  const privacyLink = modelData?.privacy_link || null;
  const isVerified = modelData?.is_verified || false;
  const ranking = modelData?.ranking || null;
  const featuredType = modelData?.featured_type || seo.displayName.toLowerCase().includes("bad") ? "top_creator" : null;

  // Fetch related groups
  const groups = await fetchModelGroups(displayName, sbUrl, sbKey);
  const groupCount = groups.filter(g => g.name && g.telegram_link).length;

  const canonicalUrl = `${BASE_URL}/modelo/${modelSlug}`;
  const h1 = `${seo.displayName} Telegram: Conteúdo de ${seo.platform}`;
  const metaDesc = seo.description;
  const seoTitle = seo.seoTitle;

  // Build JSON-LD with real data
  const personJsonLd: any = {
    "@type": "Person",
    "@id": `${canonicalUrl}#person`,
    "name": displayName,
    "url": canonicalUrl,
    "description": seo.bio
  };
  if (avatarUrl) personJsonLd["image"] = avatarUrl;
  if (isVerified) personJsonLd["additionalType"] = "VerifiedPerson";
  if (ranking && ranking < 1000) personJsonLd["interactionStatistic"] = {
    "@type": "InteractionCounter",
    "interactionType": "https://schema.org/FollowAction",
    "userInteractionCount": ranking
  };

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
        "name": seoTitle,
        "description": metaDesc,
        "isPartOf": { "@id": `${BASE_URL}/#website` },
        "about": personJsonLd,
        "numberOfItems": groupCount,
        "itemListElement": groups.filter(g => g.name && g.telegram_link).slice(0, 10).map((g, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "name": g.name,
          "url": `${BASE_URL}/group/${g.slug || generateSlug(g.name)}`
        }))
      },
      personJsonLd,
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Início", "item": BASE_URL },
          { "@type": "ListItem", "position": 2, "name": "Modelos", "item": `${BASE_URL}/modelos` },
          { "@type": "ListItem", "position": 3, "name": displayName, "item": canonicalUrl }
        ]
      }
    ]
  });

  const faqJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `Onde encontrar conteúdo de ${displayName} no Telegram?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `O Canais18 reúne ${groupCount} grupos verificados com conteúdo de ${displayName}. Todos os links são testados diariamente.`
        }
      },
      {
        "@type": "Question",
        "name": "O conteúdo de ${displayName} no Telegram é gratuito?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Sim, todos os grupos de ${displayName} listados no Canais18 são de acesso gratuito. Basta clicar no botão "Entrar" para ser redirecionado ao canal no Telegram.`
        }
      },
      {
        "@type": "Question",
        "name": `O conteúdo é do ${seo.platform}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Sim. Os grupos listados contêm conteúdo exclusivo de ${displayName} que originalmente está no ${seo.platform}, disponível gratuitamente no Telegram.`
        }
      }
    ]
  });

  // Build OG image from cover or avatar
  const ogImage = coverUrl || avatarUrl || null;
  const ogImageHtml = ogImage ? `<meta property="og:image" content="${ogImage}">` : "";

  return new Response(`
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${seoTitle}</title>
    <meta name="description" content="${metaDesc}">
    <link rel="canonical" href="${canonicalUrl}">
    <meta name="robots" content="index,follow,max-image-preview:large">
    <meta property="og:title" content="${seoTitle}">
    <meta property="og:description" content="${metaDesc}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Canais18">
    ${ogImageHtml}
    <script type="application/ld+json">${jsonLd}</script>
    <script type="application/ld+json">${faqJsonLd}</script>
    <style>
      :root { --primary: ${PRIMARY_COLOR}; --bg: #0a0a0a; --card: #161616; }
      * { box-sizing: border-box; }
      body { background: var(--bg); color: #fff; font-family: system-ui, -apple-system, sans-serif; margin: 0; padding-top: 56px; }
      .container { max-width: 1100px; margin: 0 auto; padding: 0 12px; }
      .navbar { position: fixed; top: 0; left: 0; right: 0; height: 56px; background: rgba(10,10,10,0.95); backdrop-filter: blur(10px); border-bottom: 1px solid #222; display: flex; align-items: center; justify-content: space-between; padding: 0 15px; z-index: 1000; }
      .logo { font-weight: 900; font-size: 1.1rem; color: #fff; text-decoration: none; }
      .logo span { color: var(--primary); }
      .nav-btn { background: var(--primary); color: #fff; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; text-decoration: none; }

      /* Hero with cover photo */
      .hero { position: relative; padding: 0; margin-bottom: 20px; }
      .hero-cover { width: 100%; height: 200px; object-fit: cover; border-radius: 0 0 16px 16px; }
      .hero-cover-placeholder { width: 100%; height: 200px; background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 0 0 16px 16px; }
      .hero-content { padding: 20px 0 15px; text-align: center; }
      .hero-avatar { width: 80px; height: 80px; border-radius: 50%; border: 3px solid var(--primary); margin: -60px auto 12px; display: block; object-fit: cover; background: #222; }
      .hero-avatar-placeholder { width: 80px; height: 80px; border-radius: 50%; border: 3px solid var(--primary); margin: -60px auto 12px; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 900; color: var(--primary); background: #222; }
      .hero h1 { font-size: 1.5rem; margin: 0 0 6px; font-weight: 800; line-height: 1.2; }
      .hero .verified { display: inline-flex; align-items: center; gap: 4px; color: var(--primary); font-size: 0.8rem; font-weight: 600; }
      .hero .platform { color: var(--primary); font-size: 0.9rem; font-weight: 600; margin-bottom: 6px; }
      .hero p { color: #777; font-size: 0.85rem; line-height: 1.4; margin: 8px auto 0; max-width: 600px; }
      .stats-bar { display: flex; gap: 12px; justify-content: center; margin-top: 14px; flex-wrap: wrap; }
      .stat-item { background: #161616; padding: 8px 16px; border-radius: 8px; border: 1px solid #222; text-align: center; }
      .stat-item strong { color: var(--primary); font-size: 1.1rem; }
      .stat-item span { color: #666; font-size: 0.75rem; margin-left: 4px; display: block; }

      /* CTA Button */
      .privacy-cta { display: flex; align-items: center; justify-content: center; gap: 10px; background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: #fff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 1rem; margin: 20px auto; max-width: 350px; box-shadow: 0 4px 20px rgba(238,90,36,0.3); transition: transform 0.2s; }
      .privacy-cta:hover { transform: scale(1.03); }
      .privacy-cta svg { width: 22px; height: 22px; }

      /* Intro */
      .intro-box { color: #888; font-size: 0.9rem; line-height: 1.7; margin: 20px 0; background: #111; padding: 20px; border-radius: 12px; border: 1px solid #222; }

      /* Groups */
      .groups-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px; }
      @media (min-width: 768px) { .groups-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; } }
      .group-card { background: var(--card); border-radius: 12px; overflow: hidden; border: 1px solid #222; text-decoration: none; display: flex; flex-direction: column; transition: border-color 0.2s; }
      .group-card:hover { border-color: var(--primary); }
      .card-image-container { position: relative; height: 100px; overflow: hidden; }
      .card-img { width: 100%; height: 100%; object-fit: cover; }
      .card-placeholder { width: 100%; height: 100%; background: #222; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 900; color: #333; }
      .card-badge { position: absolute; top: 6px; left: 6px; background: rgba(0,0,0,0.8); color: #ff4d4d; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
      .card-content { padding: 10px; flex: 1; display: flex; flex-direction: column; }
      .card-title { color: #fff; font-size: 0.8rem; margin: 0 0 4px; font-weight: 700; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .card-stats { color: #555; font-size: 0.7rem; margin-bottom: 8px; }
      .card-btn { background: var(--primary); color: #fff; text-align: center; padding: 6px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; margin-top: auto; }
      .no-groups { text-align: center; padding: 30px; color: #666; font-size: 0.9rem; }
      .link-primary { color: var(--primary); text-decoration: none; }

      /* Sections */
      .section-title { font-size: 1.1rem; margin: 30px 0 15px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
      .section-title::before { content: ''; width: 4px; height: 20px; background: var(--primary); border-radius: 2px; }

      /* FAQ */
      details { margin-bottom: 12px; }
      summary { cursor: pointer; font-weight: 700; color: #ccc; padding: 8px 0; font-size: 0.9rem; }
      details[open] summary { color: var(--primary); }

      /* Other models */
      .model-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 30px; }
      .model-tag { background: #161616; color: #888; padding: 8px 16px; border-radius: 50px; font-size: 0.75rem; text-decoration: none; border: 1px solid #222; transition: all 0.2s; }
      .model-tag:hover { color: #fff; border-color: var(--primary); }
    </style>
  </head>
  <body>
    <nav class="navbar">
      <a href="${BASE_URL}" class="logo">canais<span>18</span>.com</a>
      <a href="${BASE_URL}/modelos" class="nav-btn">Ver Modelos</a>
    </nav>
    <div class="container">

      <!-- Hero Section -->
      <div class="hero">
        ${coverUrl 
          ? `<img src="${coverUrl}" alt="${displayName} cover" class="hero-cover" loading="eager">` 
          : `<div class="hero-cover-placeholder"></div>`
        }
        <div class="hero-content">
          ${avatarUrl 
            ? `<img src="${avatarUrl}" alt="${displayName}" class="hero-avatar" loading="eager">`
            : `<div class="hero-avatar-placeholder">${displayName.charAt(0).toUpperCase()}</div>`
          }
          <h1>${displayName}</h1>
          ${isVerified ? `<div class="verified">&#10003; Criadora Verificada &mdash; Top Creator</div>` : ""}
          <div class="platform">${seo.platform}</div>
          <p>${seo.bio}</p>
          <div class="stats-bar">
            ${ranking && ranking < 1000 ? `<div class="stat-item"><strong>#${ranking}</strong><span>Ranking</span></div>` : ""}
            <div class="stat-item"><strong>${groupCount}</strong><span>grupos</span></div>
            ${groups.length > 0 ? `<div class="stat-item"><strong>${groups.reduce((sum, g) => sum + (g.member_count || 0), 0).toLocaleString("pt-BR")}</strong><span>membros</span></div>` : ""}
            <div class="stat-item"><strong>100%</strong><span>verificados</span></div>
          </div>
        </div>
      </div>

      <main>
        <!-- Privacy CTA -->
        ${privacyLink ? `
        <a href="${privacyLink}" class="privacy-cta" target="_blank" rel="noopener nofollow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          Ver Perfil no Privacy
        </a>` : ""}

        <!-- SEO Intro -->
        <section class="intro-box">
          <p>Encontre <strong>grupos de ${displayName} no Telegram</strong> com conteúdo exclusivo de <strong>${seo.platform}</strong>. Nossa equipe verifica links diariamente para garantir que você tenha acesso aos melhores canais com segurança.</p>
        </section>

        <!-- Groups Section -->
        <h2 class="section-title">Grupos de ${displayName} no Telegram</h2>
        ${renderGroups(groups, modelSlug)}

        <!-- SEO Footer -->
        <section style="color: #666; font-size: 0.85rem; line-height: 1.6; margin: 40px 0; border-top: 1px solid #222; padding-top: 20px;">
          <h3>Como entrar nos grupos de ${displayName}?</h3>
          <p>Para entrar em qualquer <strong>canal do Telegram</strong> listado, basta clicar no botão "Entrar". Você será redirecionado para o aplicativo oficial. Todos os grupos de <strong>${displayName}</strong> são de acesso gratuito e verificados pelo <strong>Canais18</strong>.</p>
        </section>

        <!-- FAQ -->
        <section style="margin: 40px 0;">
          <h2 class="section-title">Perguntas Frequentes</h2>
          <div style="background: #111; padding: 20px; border-radius: 12px; border: 1px solid #222;">
            <details>
              <summary>Onde encontrar conteúdo de ${displayName} no Telegram?</summary>
              <p style="color: #888; font-size: 0.9rem; margin-top: 8px; line-height: 1.6;">O Canais18 reúne <strong>${groupCount} grupos verificados</strong> com conteúdo de ${displayName}. Todos os links são testados diariamente.</p>
            </details>
            <details>
              <summary>O conteúdo de ${displayName} no Telegram é gratuito?</summary>
              <p style="color: #888; font-size: 0.9rem; margin-top: 8px; line-height: 1.6;">Sim, todos os grupos de ${displayName} listados no Canais18 são de acesso gratuito.</p>
            </details>
            <details>
              <summary>O conteúdo é do ${seo.platform}?</summary>
              <p style="color: #888; font-size: 0.9rem; margin-top: 8px; line-height: 1.6;">Sim. Os grupos contêm conteúdo exclusivo de ${displayName} que originalmente está no ${seo.platform}.</p>
            </details>
          </div>
        </section>

        <!-- Other Models -->
        <section style="margin: 40px 0;">
          <h2 class="section-title">Outros Modelos Populares</h2>
          <div class="model-tags">
            ${Object.keys(MODEL_SEO).filter(s => s !== modelSlug).slice(0, 12).map(slug => {
              const m = MODEL_SEO[slug];
              return `<a href="${BASE_URL}/modelo/${slug}" class="model-tag">${m.displayName}</a>`;
            }).join("")}
            <a href="${BASE_URL}/modelos" class="model-tag" style="background: var(--primary); color: #fff; border-color: var(--primary);">Ver todos</a>
          </div>
        </section>
      </main>
    </div>
  </body>
  </html>`, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Modelo-Source": "edge-function",
      "X-Modelo-Slug": modelSlug,
      "X-Modelo-Groups": String(groupCount),
    }
  });
});
