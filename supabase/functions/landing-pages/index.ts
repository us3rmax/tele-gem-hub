import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

const SEO_TO_DB_MAP: Record<string, string> = {
  "telegram-putaria": "putaria",
  "grupos-putaria-telegram": "putaria",
  "telegram-porno": "putaria",
  "telegram-xxx": "putaria",
  "xxx-telegram": "putaria",
  "grupos-porno-telegram": "putaria",
  "canal-de-putaria": "putaria",
  "grupo-putaria-telegram": "putaria",
  "canais-putaria-telegram": "putaria",
  "grupos-telegram-18": "geral",
  "canais-telegram-18": "geral",
  "telegram-adulto": "geral",
  "grupos-telegram-geral": "geral",
  "novinhas-telegram": "novinhas",
  "vazados-telegram": "vazados",
  "gay-telegram": "gay",
  "trans-telegram": "trans",
  "onlyfans-telegram": "onlyfans",
  "amadoras-telegram": "amadoras",
  "fetiche-telegram": "fetiche",
  "bdsm-telegram": "bdsm",
  "casadas-telegram": "casadas",
  "coroas-telegram": "coroas",
  "celebridades-telegram": "celebridades",
  "bbw-telegram": "bbw",
  "latina-telegram": "latina",
  "asiaticas-telegram": "asiaticas",
  "hentai-telegram": "hentai",
  "privacy-telegram": "privacy",
  "cornos-telegram": "cornos",
  "lesbicas-telegram": "lesbicas"
};

const SEO_DATA: Record<string, { h1: string, desc: string }> = {
  "telegram-putaria": { h1: "Putaria Telegram: +1.902 Grupos e Links Ativos", desc: "Acesse agora os melhores grupos de putaria no Telegram. Lista atualizada com links diretos e conteúdos +18 verificados." },
  "telegram-porno": { h1: "Telegram Porno: Canais e Grupos +18 Sem Censura", desc: "Os melhores canais de telegram porno reunidos em um só lugar. Acesse conteúdos exclusivos e grupos porno telegram." },
  "novinhas-telegram": { h1: "Novinhas Telegram: Grupos e Canais Verificados", desc: "Encontre os melhores grupos de novinhas no Telegram. Links diretos para canais de influencers e amadoras." },
  "gay-telegram": { h1: "Gay Telegram: Os Melhores Grupos e Canais LGBT", desc: "Explore a melhor seleção de grupos gay no Telegram. Conteúdo verificado, amadores e chats ativos." }
};

async function fetchCategoryGroups(category: string): Promise<Group[]> {
  const sbUrl = Deno.env.get("SUPABASE_URL") || "";
  const sbKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!sbUrl || !sbKey) return [];
  try {
    const r = await fetch(
      `${sbUrl}/rest/v1/groups?category=eq.${category.toLowerCase()}&select=slug,name,telegram_link,description,member_count,thumbnail_url&order=member_count.desc&limit=24`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
    );
    return r.ok ? await r.json() : [];
  } catch { return []; }
}

function renderGroups(groups: Group[], categoryName: string): string {
  if (!groups.length) return `<p style='text-align:center;padding:40px;color:#666;'>Nenhum grupo encontrado na categoria ${categoryName}.</p>`;
  return `
  <div class="groups-grid">
    ${groups.map((g) => {
      const groupSlug = g.slug || g.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
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
  const url = new URL(req.url);
  const pathPart = url.pathname.split("/").filter(p => p && !["functions", "v1", "landing-pages"].includes(p)).pop();
  const pageSlug = url.searchParams.get("page") || pathPart || "telegram-putaria";
  const dbCategory = SEO_TO_DB_MAP[pageSlug] || "putaria";
  const groups = await fetchCategoryGroups(dbCategory);
  const seo = SEO_DATA[pageSlug] || {
    h1: `${pageSlug.replace(/-/g, " ").toUpperCase()}: Grupos Ativos`,
    desc: `Acesse os melhores grupos de ${pageSlug.replace(/-/g, " ")} no Telegram. Links verificados no canais18.com.`
  };

  return new Response(`
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${seo.h1} | Canais18</title>
    <meta name="description" content="${seo.desc}">
    <style>
      :root { --primary: ${PRIMARY_COLOR}; --bg: #0a0a0a; --card: #161616; }
      body { background: var(--bg); color: #fff; font-family: system-ui, sans-serif; margin: 0; padding-top: 56px; }
      .container { max-width: 1100px; margin: 0 auto; padding: 0 12px; }
      .navbar { position: fixed; top: 0; left: 0; right: 0; height: 56px; background: rgba(10,10,10,0.9); backdrop-filter: blur(10px); border-bottom: 1px solid #222; display: flex; align-items: center; justify-content: space-between; padding: 0 15px; z-index: 1000; }
      .logo { font-weight: 900; font-size: 1.1rem; color: #fff; text-decoration: none; }
      .logo span { color: var(--primary); }
      .nav-btn { background: var(--primary); color: #fff; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; text-decoration: none; }
      .hero { text-align: center; padding: 20px 0 15px; }
      .hero h1 { font-size: 1.4rem; margin: 0 0 8px; font-weight: 800; line-height: 1.2; }
      .hero p { color: #777; font-size: 0.8rem; line-height: 1.4; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
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
      .tag-cloud { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 30px; }
      .tag { background: #161616; color: #888; padding: 8px 16px; border-radius: 50px; font-size: 0.75rem; text-decoration: none; border: 1px solid #222; }
    </style>
  </head>
  <body>
    <nav class="navbar">
      <a href="${BASE_URL}" class="logo">canais<span>18</span>.com</a>
      <a href="${BASE_URL}" class="nav-btn">Ver Grupos Grátis</a>
    </nav>
    <div class="container">
      <header class="hero">
        <h1>${seo.h1}</h1>
        <p>${seo.desc}</p>
      </header>
      <main>
        <h2 class="section-title">📱 Grupos de ${dbCategory.toUpperCase()}</h2>
        ${renderGroups(groups, dbCategory)}
        <h2 class="section-title">🔗 Outras Categorias</h2>
        <div class="tag-cloud">
          ${Object.keys(SEO_TO_DB_MAP).slice(0, 20).map(slug => `<a href="${BASE_URL}/${slug}" class="tag">${slug.replace(/-/g, " ")}</a>`).join("")}
        </div>
      </main>
    </div>
  </body>
  </html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
});
