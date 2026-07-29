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

// SEO data completa para TODAS as 65+ landing pages — cada uma com H1 e description únicos
const SEO_DATA: Record<string, { h1: string, desc: string }> = {
  // === PUTARIA ===
  "telegram-putaria": { h1: "Putaria Telegram: +1.900 Grupos e Links Ativos em 2026", desc: "Diretório com os melhores grupos de putaria no Telegram. Links verificados diariamente, sem links quebrados. Acesse grátis em canais18.com." },
  "grupos-putaria-telegram": { h1: "Grupos Putaria Telegram: Ranking dos Mais Populares", desc: "Ranking atualizado dos grupos de putaria telegram mais populares. Membros ativos, previews e links diretos para cada canal." },
  "canal-de-putaria": { h1: "Canal de Putaria Telegram: Conteúdo Diário Verificado", desc: "Encontre canais de putaria no Telegram com conteúdo diário. Nossa equipe testa cada link antes de publicar. 100% grátis." },
  "grupo-putaria-telegram": { h1: "Grupo Putaria Telegram: Ativos e Verificados em 2026", desc: "Grupos de putaria telegram ativos e verificados. Veja quantos membros cada grupo tem antes de entrar." },
  "grupos-de-putaria-telegram": { h1: "Grupos de Putaria Telegram: Lista Definitiva 2026", desc: "Lista definitiva de grupos de putaria telegram: navegue por categoria, veja previews e entre direto no canal." },
  "grupo-de-putaria-telegram": { h1: "Grupo de Putaria Telegram: Status em Tempo Real", desc: "Grupo de putaria telegram ativo agora? Veja nossa lista atualizada com status de cada canal em tempo real." },
  "putaria-telegram": { h1: "Putaria Telegram: Grupos e Canais +18 Verificados", desc: "Lista atualizada de grupos de putaria no Telegram com +1.900 canais ativos. Verificados diariamente por nossa equipe." },
  "xvideos-putaria": { h1: "Xvideos Putaria Telegram: Vídeos HD sem Censura", desc: "Canais estilo xvideos no Telegram: vídeos completos, HD, sem censura. Acesso direto e gratuito." },
  "video-porno-telegram": { h1: "Vídeos Porno Telegram: Catálogo Completo 2026", desc: "Vídeos porno no Telegram: catálogo com milhares de grupos organizados por categoria. Links verificados." },
  "porno-gratis-telegram": { h1: "Porno Grátis Telegram: +1.900 Grupos Sem Cadastro", desc: "Porno grátis no Telegram sem cadastro, sem pagamento. Diretório verificado com +1.900 grupos." },
  "xvideos-porno-telegram": { h1: "Xvideos Porno Telegram: Vídeos Completos em HD", desc: "Conteúdo xvideos gratuito no Telegram: vídeos completos em HD. Grupos testados e funcionando." },
  "putaria-brasileira": { h1: "Putaria Brasileira Telegram: Conteúdo Nacional Autêntico", desc: "Putaria brasileira no Telegram: amadoras, casadas e conteúdo autêntico nacional. Grupos verificados e sem spam." },
  "putaria-brasileira-telegram": { h1: "Putaria Brasileira Telegram: Criadoras Nacionais", desc: "Grupos de putaria brasileira telegram com conteúdo original de creators brasileiros. Comunidade ativa e verificada." },
  "grupos-porno-telegram": { h1: "Grupos Porno Telegram: Top por Popularidade", desc: "Top grupos porno do Telegram organizados por popularidade. Previews, contagem de membros e acesso direto." },
  "canais-putaria-telegram": { h1: "Canais Putaria Telegram: Catálogo Completo + Vídeos e Lives", desc: "Catálogo completo de canais putaria telegram com vídeos, fotos e lives exclusivas. Atualização diária." },

  // === PORNO / XXX ===
  "telegram-porno": { h1: "Telegram Porno: +1.900 Canais Verificados em HD", desc: "Diretório com +1.900 canais de telegram porno verificados. Vídeos HD, amadoras e conteúdo profissional." },
  "telegram-xxx": { h1: "Telegram XXX: Canais Adultos Sem Censura", desc: "Conteúdo XXX no Telegram organizado por categoria: amadoras, casadas, celebridades. +1.900 grupos verificados." },
  "xxx-telegram": { h1: "XXX Telegram: Canais para Adultos Verificados", desc: "Canais XXX no Telegram para adultos. Conteúdo sem censura, amadoras brasileiras e produções internacionais." },

  // === GERAL / 18+ ===
  "grupos-telegram-18": { h1: "Grupos Telegram 18+: Catálogo Completo de Canais Adultos", desc: "Grupos telegram 18+: catálogo completo de canais adultos verificados. Navegue por categoria e entre direto." },
  "canais-telegram-18": { h1: "Canais Telegram 18+: Porno, Putaria, Amadoras e Vazados", desc: "Canais telegram 18+ organizados: porno, putaria, amadoras, vazados, onlyfans. +1.900 grupos testados." },
  "telegram-adulto": { h1: "Telegram Adulto: Explore Categorias de Conteúdo +18", desc: "Telegram adulto sem censura: explore categorias de conteúdo +18 com links diretos para cada grupo ativo." },
  "grupos-telegram-geral": { h1: "Grupos Telegram Geral: Conteúdo Adulto Variado", desc: "Grupos telegram geral +18: conteúdo adulto variado em um só lugar. Verificação diária de links e atividade." },
  "links-telegram": { h1: "Links Telegram Adultos: Grupos e Canais +18", desc: "Links telegram adultos verificados: acesse grupos e canais +18 com um clique. Atualizado diariamente." },
  "telegram-proibido": { h1: "Telegram Proibido: Grupos Exclusivos Inéditos", desc: "Conteúdo telegram proibido: grupos exclusivos que não estão em outros diretórios. Acesso gratuito e verificado." },
  "grupo-telegram-18": { h1: "Grupo Telegram 18: Ativo Agora? Status em Tempo Real", desc: "Grupo telegram 18 ativo agora? Consulte nossa lista com status em tempo real e entre direto no canal." },
  "grupos-telegram-pode-tudo": { h1: "Grupos Telegram Pode Tudo: Sem Censura, Sem Regras", desc: "Grupos telegram pode tudo: sem censura, sem regras. Comunidade +18 ativa e verificada." },
  "grupos-telegram-secretos": { h1: "Grupos Telegram Secretos: Canais Exclusivos Inéditos", desc: "Grupos telegram secretos: canais exclusivos que poucas pessoas conhecem. Lista atualizada e verificada." },
  "grupos-18-telegram": { h1: "Grupos 18 Telegram: Navegue por Categoria", desc: "Grupos 18 telegram reunidos: navegue por categoria, veja contagem de membros e acesse links diretos." },
  "grupo-telegram-proibido": { h1: "Grupo Telegram Proibido: Conteúdo Exclusivo Verificado", desc: "Grupo telegram proibido com conteúdo exclusivo. Verificado diariamente para garantir links funcionais." },
  "grupos-telegram": { h1: "Grupos Telegram: Diretório Completo +1.900 Canais", desc: "Diretório completo de grupos telegram adultos: +1.900 canais verificados, organizados e atualizados todo dia." },

  // === SEXO ===
  "telegram-sexo": { h1: "Telegram Sexo: Grupos com Chat Ativo e Vídeos", desc: "Grupos de sexo telegram com chat ativo, vídeos e fotos. Comunidade +18 verificada diariamente." },
  "sexo-telegram": { h1: "Sexo Telegram: Canais Variados para Maiores de 18", desc: "Canais de sexo no Telegram para maiores de 18. Conteúdo variado: amadoras, profissional, fetiches." },
  "video-sexo-telegram": { h1: "Vídeos de Sexo Telegram: Acervo Atualizado", desc: "Vídeos de sexo no Telegram: acervo atualizado com conteúdo de qualidade. Previews antes de entrar." },
  "videos-eroticos-telegram": { h1: "Vídeos Eróticos Telegram: Curadoria Especial", desc: "Vídeos eróticos telegram com curadoria: cinema adulto, amadoras, produções brasileiras." },
  "chat-sexo-telegram": { h1: "Chat Sexo Telegram: Membros Reais, Sem Bots", desc: "Chat de sexo no Telegram com membros reais e ativos. Sem bots, sem spam. Comunidade verificada." },

  // === NOVINHAS ===
  "novinhas-telegram": { h1: "Novinhas Telegram: Influencers e Amadoras Verificadas", desc: "Grupos de novinhas telegram: influencers, amadoras e criadoras de conteúdo. Previews e links diretos." },
  "mulheres-nuas-telegram": { h1: "Mulheres Nuas Telegram: Amadoras Brasileiras", desc: "Mulheres nuas no Telegram: conteúdo de amadoras brasileiras sem edição. Grupos verificados e ativos." },
  "vazadinhos-telegram": { h1: "Vazadinhos Telegram: Conteúdo Fresquinho Diário", desc: "Vazadinhos fresquinhos no Telegram: conteúdo vazado atualizado diariamente. Links testados e funcionando." },

  // === VAZADOS ===
  "vazados-telegram": { h1: "Vazados Telegram: Conteúdo Exclusivo Vazado", desc: "Vazados telegram: canal com conteúdo exclusivo vazado. Previews, membros ativos e acesso direto." },
  "telegram-vazados": { h1: "Telegram Vazados: Tudo que Vazou Está Aqui", desc: "Telegram vazados: tudo que vazou está aqui. Grupos verificados com conteúdo de qualidade e links ativos." },
  "vazou-telegram": { h1: "Vazou Telegram: Conteúdo Recém-Vazado Agora", desc: "Vazou telegram: conteúdo recém-vazado disponível agora. Acesse antes que saia do ar." },
  "vazado-telegram": { h1: "Vazado Telegram: Acervo de Conteúdo Vazado", desc: "Vazado telegram: acervo de conteúdo vazado reunido em um só lugar. Navegue e entre direto." },
  "grupos-telegram-vazados": { h1: "Grupos Telegram Vazados: Lista Atualizada Diariamente", desc: "Grupos telegram vazados: lista atualizada de canais com conteúdo exclusivo. Verificação diária." },

  // === ONLYFANS ===
  "onlyfans-telegram": { h1: "OnlyFans Telegram Grátis: Conteúdo Sem Assinatura", desc: "OnlyFans telegram grátis: conteúdo exclusivo de criadoras disponível sem assinatura. +1.900 grupos verificados." },
  "onlyfans-packs": { h1: "Packs OnlyFans Telegram: Coleções Completas", desc: "Packs OnlyFans no Telegram: coleções completas de criadoras disponíveis para download. Grátis e verificado." },
  "onlyfans-vazados": { h1: "OnlyFans Vazados Telegram: Premium de Graça", desc: "OnlyFans vazados telegram: conteúdo premium de graça. Lista de grupos com previews e links diretos." },
  "telegram-onlyfans": { h1: "Telegram OnlyFans: Criadoras Brasileiras e Internacionais", desc: "OnlyFans no Telegram: acesso gratuito a conteúdo exclusivo de criadoras brasileiras e internacionais." },
  "michele-umezu-onlyfans": { h1: "Michele Umezu OnlyFans Telegram: Conteúdo Exclusivo", desc: "Conteúdo Michele Umezu no Telegram: grupos com material exclusivo da criadora. Verificado e atualizado." },

  // === PRIVACY / EROME ===
  "privacy-telegram": { h1: "Privacy Telegram: Packs de Modelos Brasileiras", desc: "Privacy telegram: packs e conteúdo exclusivo de modelos brasileiras. Links diretos e verificados." },
  "privacy-gratis": { h1: "Privacy Grátis Telegram: Conteúdo Sem Assinatura", desc: "Privacy grátis no Telegram: acesse conteúdo de modelos sem pagar assinatura. Canais verificados." },
  "erome-privacy": { h1: "Erome e Privacy Telegram: Conteúdo de Plataformas Pagas", desc: "Erome e Privacy no Telegram reunidos: conteúdo de plataformas pagas disponível gratuitamente." },
  "privacy-vazados": { h1: "Privacy Vazados Telegram: Modelos Brasileiras", desc: "Privacy vazados telegram: conteúdo exclusivo de modelos brasileiras vazado. Atualizado diariamente." },
  "erome-vazados": { h1: "Erome Vazados Telegram: Conteúdo Exclusivo de Criadoras", desc: "Vazados do Erome no Telegram: conteúdo exclusivo de criadoras disponível para acesso direto." },
  "erome-vazado": { h1: "Erome Vazado Telegram: Acervo Completo", desc: "Erome vazado telegram: acervo de conteúdo vazado do Erome. Links testados e funcionando." },
  "erome-vazou": { h1: "Erome Vazou Telegram: Conteúdo Recém-Vazado", desc: "Erome vazou telegram: conteúdo recém-vazado disponível agora. Acesse antes que seja removido." },
  "erome-gostosa": { h1: "Erome Gostosa Telegram: Modelos Brasileiras", desc: "Erome gostosa telegram: conteúdo de modelos brasileiras no Telegram. Previews e acesso direto." },
  "vazados-erome": { h1: "Vazados Erome Telegram: Catálogo de Conteúdo Exclusivo", desc: "Vazados erome telegram: catálogo de conteúdo exclusivo vazado de criadoras. Verificado diariamente." },
  "dra-sophia-privacy": { h1: "Dra Sophia Privacy Telegram: Conteúdo Exclusivo", desc: "Dra Sophia Privacy telegram: conteúdo exclusivo da criadora. Grupos verificados com acesso direto." },
  "erome-juliana-silva": { h1: "Erome Juliana Silva Telegram: Material Exclusivo", desc: "Erome Juliana Silva telegram: material exclusivo da modelo no Telegram. Links testados e ativos." },
  "bia-albina-erome": { h1: "Bia Albina Erome Telegram: Conteúdo Gratuito", desc: "Bia Albina Erome telegram: conteúdo da criadora disponível gratuitamente. Links verificados." },
  "cosvickye-erome": { h1: "Cosvickye Erome Telegram: Conteúdo Exclusivo", desc: "Cosvickye Erome telegram: conteúdo exclusivo da criadora. Grupos ativos e links verificados." },
  "nayzinha-erome": { h1: "Nayzinha Erome Telegram: Material Exclusivo", desc: "Nayzinha Erome telegram: material exclusivo disponível agora. Acesse direto do canais18.com." },
  "privacy-bad-mi": { h1: "Privacy Bad Mi Telegram: Conteúdo Exclusivo da Modelo", desc: "Privacy Bad Mi telegram: conteúdo exclusivo da modelo. Grupos verificados e com links ativos." },
  "privacy-display-apk": { h1: "Privacy Display APK Telegram: Grupos Verificados", desc: "Privacy Display APK telegram: grupos com conteúdo exclusivo da plataforma. Verificado e ativo." },
  "erome-nicole-rodrigues": { h1: "Erome Nicole Rodrigues Telegram: Conteúdo Gratuito", desc: "Nicole Rodrigues Erome telegram: conteúdo da modelo disponível gratuitamente. Links diretos." },
  "nyvi-estephan-erome": { h1: "Nyvi Estephan Erome Telegram: Material Exclusivo", desc: "Nyvi Estephan Erome telegram: material exclusivo da influencer. Grupos verificados e ativos." },
  "nayara-erome": { h1: "Nayara Erome Telegram: Conteúdo Verificado", desc: "Nayara Erome telegram: conteúdo da criadora disponível agora. Acesse links verificados." },
  "jenifer-novaki-privacy": { h1: "Jenifer Novaki Privacy Telegram: Conteúdo Exclusivo", desc: "Jenifer Novaki Privacy telegram: conteúdo exclusivo da modelo. Grupos com links funcionais." },
  "camila-prado-privacy": { h1: "Camila Prado Privacy Telegram: Material Gratuito", desc: "Camila Prado Privacy telegram: material da criadora disponível gratuitamente. Verificado." },
  "mae-e-filha-erome": { h1: "Mãe e Filha Erome Telegram: Conteúdo da Dupla", desc: "Mãe e filha Erome telegram: conteúdo da dupla disponível no Telegram. Links verificados." },

  // === CATEGORIAS ESPECÍFICAS ===
  "amadoras-telegram": { h1: "Amadoras Telegram Brasileiras: Conteúdo Real", desc: "Amadoras telegram brasileiras: conteúdo real de criadoras nacionais. +1.900 grupos verificados." },
  "amadoras-quentes": { h1: "Amadoras Quentes Telegram: Conteúdo Autêntico", desc: "Amadoras quentes telegram: conteúdo autêntico de amadoras brasileiras. Previews e links diretos." },
  "gay-telegram": { h1: "Gay Telegram: Comunidade LGBT Verificada e Segura", desc: "Grupos gay telegram verificados: comunidade LGBT ativa e segura. Canais testados diariamente." },
  "fetiche-telegram": { h1: "Fetiche Telegram: Grupos Especializados por Preferência", desc: "Fetiche telegram: grupos especializados para cada preferência. Comunidade sem julgamento e verificada." },
  "casadas-telegram": { h1: "Casadas Telegram: Conteúdo de Mulheres Casadas", desc: "Casadas telegram: conteúdo de mulheres casadas no Telegram. Grupos verificados e ativos." },
  "celebridades-telegram": { h1: "Celebridades Telegram: Famosos em Conteúdo Adulto", desc: "Celebridades telegram: famosos em conteúdo adulto. Vazamentos verificados e organizados por nome." },
  "famosos-nus-telegram": { h1: "Famosos Nus Telegram: Acervo de Vazamentos", desc: "Famosos nus telegram: acervo de conteúdo vazado de celebridades. Links testados e atualizados." },
  "asiaticas-telegram": { h1: "Asiáticas Telegram: Conteúdo de Criadoras Asiáticas", desc: "Asiáticas telegram: conteúdo de criadoras asiáticas. Grupos verificados com acesso direto." },
  "bdsm-telegram": { h1: "BDSM Telegram: Comunidades Especializadas", desc: "BDSM telegram: comunidades especializadas para amantes do gênero. Links verificados e seguros." },
  "bbw-telegram": { h1: "BBW Telegram: Conteúdo Plus Size", desc: "BBW telegram: conteúdo de criadoras plus size. Grupos verificados e com previews." },
  "coroas-telegram": { h1: "Coroas Telegram: Conteúdo de Mulheres Maduras", desc: "Coroas telegram: conteúdo de mulheres maduras. Grupos verificados e com membros ativos." },
};

// Mapeamento dinâmico de SEO slugs para categorias do banco de dados
let SEO_TO_DB_MAP: Record<string, string> | null = null;

async function fetchSEOMapping(sbUrl: string, sbKey: string): Promise<Record<string, string>> {
  if (SEO_TO_DB_MAP) return SEO_TO_DB_MAP;

  try {
    const r = await fetch(
      `${sbUrl}/rest/v1/groups?select=category&distinct=true`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
    );
    if (!r.ok) return {};

    const categories = await r.json();
    const mapping: Record<string, string> = {};

    for (const cat of categories) {
      const slug = cat.category.toLowerCase();
      mapping[slug] = slug;
      mapping[`${slug}-telegram`] = slug;
      mapping[`grupos-${slug}-telegram`] = slug;
      mapping[`canais-${slug}-telegram`] = slug;
      mapping[`telegram-${slug}`] = slug;
    }

    SEO_TO_DB_MAP = mapping;
    return mapping;
  } catch {
    return {};
  }
}

async function fetchCategoryGroups(category: string, sbUrl: string, sbKey: string): Promise<Group[]> {
  try {
    const r = await fetch(
      `${sbUrl}/rest/v1/groups?category=eq.${category.toLowerCase()}&select=slug,name,telegram_link,description,member_count,thumbnail_url&order=member_count.desc&limit=24`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
    );
    return r.ok ? await r.json() : [];
  } catch { return []; }
}

function renderGroups(groups: Group[]): string {
  if (!groups.length) return `<p style='text-align:center;padding:40px;color:#666;'>Nenhum grupo encontrado.</p>`;
  
  const validGroups = groups.filter(g => g.name && g.telegram_link);
  
  if (!validGroups.length) return `<p style='text-align:center;padding:40px;color:#666;'>Nenhum conteúdo válido disponível no momento.</p>`;

  return `
  <div class="groups-grid">
    ${validGroups.map((g) => {
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
  const sbUrl = Deno.env.get("SUPABASE_URL") || "";
  const sbKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!sbUrl || !sbKey) {
    return new Response("Configuração inválida", { status: 500 });
  }

  const url = new URL(req.url);
  const pathPart = url.pathname.split("/").filter(p => p && !["functions", "v1", "landing-pages"].includes(p)).pop();
  const pageSlug = url.searchParams.get("page") || pathPart || "geral";
  
  const seoMapping = await fetchSEOMapping(sbUrl, sbKey);
  
  if (!seoMapping[pageSlug]) {
    return new Response("Página não encontrada", { status: 404 });
  }

  const dbCategory = seoMapping[pageSlug];
  const groups = await fetchCategoryGroups(dbCategory, sbUrl, sbKey);
  
  if (!groups || groups.length === 0) {
     return new Response("Conteúdo temporariamente indisponível", { status: 404 });
  }

  const seo = SEO_DATA[pageSlug] || {
    h1: `${pageSlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}: Grupos Ativos Verificados`,
    desc: `Acesse os melhores grupos de ${pageSlug.replace(/-/g, " ")} no Telegram. Links verificados diariamente em canais18.com.`
  };

  const canonicalUrl = `${BASE_URL}/${pageSlug}`;

  const tagCloudSlugs = Object.keys(seoMapping).filter(s => !s.includes("-telegram")).slice(0, 20);

  // Adicionar JSON-LD structured data para rich snippets
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": seo.h1,
    "description": seo.desc,
    "url": canonicalUrl,
    "publisher": {
      "@type": "Organization",
      "name": "Canais18",
      "url": BASE_URL,
      "logo": { "@type": "ImageObject", "url": `${BASE_URL}/logo.png` }
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Canais18", "item": BASE_URL },
        { "@type": "ListItem", "position": 2, "name": dbCategory, "item": canonicalUrl }
      ]
    }
  });

  return new Response(`
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${seo.h1} | Canais18</title>
    <meta name="description" content="${seo.desc}">
    <link rel="canonical" href="${canonicalUrl}">
    <meta name="robots" content="index,follow,max-image-preview:large">
    <script type="application/ld+json">${jsonLd}</script>
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
        <section class="seo-intro" style="color: #888; font-size: 0.9rem; line-height: 1.6; margin: 20px 0; background: #111; padding: 20px; border-radius: 12px; border: 1px solid #222;">
          <p>Bem-vindo ao maior diretório de <strong>grupos de ${dbCategory} no Telegram</strong>. Nossa equipe verifica links diariamente para garantir que você tenha acesso aos melhores <strong>canais de ${dbCategory}</strong> com segurança e privacidade. Explore a lista abaixo e entre nos grupos mais ativos do Brasil.</p>
        </section>
        <h2 class="section-title">📱 Grupos de ${dbCategory.toUpperCase()} em Destaque</h2>
        ${renderGroups(groups)}
        <section class="seo-footer" style="color: #666; font-size: 0.85rem; line-height: 1.6; margin: 40px 0; border-top: 1px solid #222; padding-top: 20px;">
          <h3>Como entrar nos grupos de ${dbCategory}?</h3>
          <p>Para entrar em qualquer <strong>canal do Telegram</strong> listado, basta clicar no botão "Entrar". Você será redirecionado para o aplicativo oficial. Lembre-se que todos os grupos são de acesso gratuito e verificados pelo <strong>Canais18</strong>.</p>
        </section>
        <h2 class="section-title">🔗 Outras Categorias Populares</h2>
        <div class="tag-cloud">
          ${tagCloudSlugs.map(slug => `<a href="${BASE_URL}/${slug}" class="tag">${slug.replace(/-/g, " ")}</a>`).join("")}
        </div>
      </main>
    </div>
  </body>
  </html>`, { headers: { "Content-Type": "text/html; charset=utf-8", "X-Landing-Source": "edge-functions" } });
});
