import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import MobileSidebar from "@/components/MobileSidebar";
import BannerAd from "@/components/BannerAd";
import GroupCard from "@/components/GroupCard";
import SortTabs from "@/components/SortTabs";
import PremiumCarousel from "@/components/PremiumCarousel";
import Pagination from "@/components/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroups, usePremiumGroups } from "@/hooks/use-groups";
const PER_PAGE = 22;

// Meta descriptions únicas por categoria para evitar duplicidade quando filtrado por ?category=X
const CATEGORY_SEO: Record<string, { title: string; description: string; keywords: string }> = {
  putaria: {
    title: "Grupos de Putaria Telegram | Canais18",
    description: "Grupos de putaria no Telegram verificados e ativos. +1.900 canais com conteúdo adulto brasileiro. Acesse grátis em canais18.com.",
    keywords: "grupos putaria telegram, canais putaria, putaria telegram 2026",
  },
  porno: {
    title: "Canais Porno Telegram | Canais18",
    description: "Canais de telegram porno com vídeos HD, amadoras e conteúdo profissional. Diretório verificado com +1.900 grupos ativos.",
    keywords: "telegram porno, canais porno telegram, porno telegram 2026",
  },
  xxx: {
    title: "Canais XXX Telegram | Canais18",
    description: "Conteúdo XXX no Telegram sem censura. Amadoras, casadas e celebridades. +1.900 grupos verificados em canais18.com.",
    keywords: "telegram xxx, canais xxx telegram, xxx telegram 2026",
  },
  novinhas: {
    title: "Grupos de Novinhas Telegram | Canais18",
    description: "Grupos de novinhas no Telegram: influencers, amadoras e criadoras de conteúdo. Previews e links diretos verificados.",
    keywords: "novinhas telegram, grupos novinhas, novinhas telegram 2026",
  },
  amadoras: {
    title: "Amadoras Telegram Brasileiras | Canais18",
    description: "Amadoras brasileiras no Telegram com conteúdo real e autêntico. +1.900 grupos verificados. Acesse grátis em canais18.com.",
    keywords: "amadoras telegram, amadoras brasileiras telegram, telegram amadoras 2026",
  },
  vazados: {
    title: "Vazados Telegram | Canais18",
    description: "Vazados fresquinhos no Telegram: conteúdo exclusivo atualizado diariamente. Links testados e funcionando. Canais18.com.",
    keywords: "vazados telegram, vazados telegram 2026, telegram vazados",
  },
  onlyfans: {
    title: "OnlyFans Telegram Grátis | Canais18",
    description: "OnlyFans no Telegram grátis: conteúdo exclusivo de criadoras sem assinatura. +1.900 grupos verificados em canais18.com.",
    keywords: "onlyfans telegram, onlyfans telegram grátis, telegram onlyfans 2026",
  },
  privacy: {
    title: "Privacy Telegram | Canais18",
    description: "Privacy telegram: packs e conteúdo exclusivo de modelos brasileiras. Links diretos e verificados. Canais18.com.",
    keywords: "privacy telegram, privacy telegram grátis, telegram privacy 2026",
  },
  geral: {
    title: "Grupos Telegram 18+ | Canais18",
    description: "Grupos telegram 18+: catálogo completo de canais adultos verificados. Navegue por categoria e entre direto. Canais18.com.",
    keywords: "grupos telegram 18, canais telegram adulto, telegram 18+ 2026",
  },
  celebridades: {
    title: "Celebridades Telegram | Canais18",
    description: "Celebridades no Telegram: famosos em conteúdo adulto. Vazamentos verificados e organizados por nome. Canais18.com.",
    keywords: "celebridades telegram, famosos telegram, telegram celebridades 2026",
  },
  gay: {
    title: "Grupos Gay Telegram | Canais18",
    description: "Grupos gay telegram verificados: comunidade LGBT ativa e segura. Canais testados diariamente. Canais18.com.",
    keywords: "gay telegram, grupos gay telegram, telegram gay 2026",
  },
  casadas: {
    title: "Casadas Telegram | Canais18",
    description: "Casadas no Telegram com conteúdo adulto real. Grupos verificados e ativos. Acesse grátis em canais18.com.",
    keywords: "casadas telegram, grupos casadas telegram, telegram casadas 2026",
  },
  fetiche: {
    title: "Fetiche Telegram | Canais18",
    description: "Fetiche telegram: grupos especializados para cada preferência. Comunidade sem julgamento e verificada. Canais18.com.",
    keywords: "fetiche telegram, grupos fetiche telegram, telegram fetiche 2026",
  },
  asiaticas: {
    title: "Asiáticas Telegram | Canais18",
    description: "Asiáticas no Telegram: conteúdo de criadoras asiáticas. Grupos verificados com acesso direto. Canais18.com.",
    keywords: "asiáticas telegram, grupos asiáticas telegram, telegram asiáticas 2026",
  },
  bdsm: {
    title: "BDSM Telegram | Canais18",
    description: "BDSM telegram: comunidades especializadas para amantes do gênero. Links verificados e seguros. Canais18.com.",
    keywords: "bdsm telegram, grupos bdsm telegram, telegram bdsm 2026",
  },
  bbw: {
    title: "BBW Telegram | Canais18",
    description: "BBW no Telegram: conteúdo de criadoras plus size. Grupos verificados e com previews. Canais18.com.",
    keywords: "bbw telegram, grupos bbw telegram, telegram bbw 2026",
  },
  coroas: {
    title: "Coroas Telegram | Canais18",
    description: "Coroas no Telegram: conteúdo de mulheres maduras. Grupos verificados e com membros ativos. Canais18.com.",
    keywords: "coroas telegram, grupos coroas telegram, telegram coroas 2026",
  },
};

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sort, setSort] = useState("hot");

  const page = Number(searchParams.get("page") || "1");
  const searchTerm = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "";

	  const { data, isLoading, isError } = useGroups({ sort, search: searchTerm, page, perPage: 30 });
	  const { data: premiumGrupos = [], isLoading: premiumLoading } = usePremiumGroups();
	
	
	  // Filter out "gay" category groups from homepage (only visible when accessing the category page directly)
	  const grupos = useMemo(() => {
	    const raw = data?.groups ?? [];
	    // If searching or in a specific category (including 'gay'), show everything
	    if (searchTerm || categoryFilter) return raw;
	    // On the main home feed, hide 'gay' category
	    return raw.filter((g: any) => g.category !== "gay");
	  }, [data?.groups, searchTerm, categoryFilter]);

  const totalCount = useMemo(() => {
    if (categoryFilter) return data?.totalCount ?? 0;
    return grupos.length > 0 ? data?.totalCount ?? 0 : 0;
  }, [data?.totalCount, categoryFilter, grupos.length]);
  const totalPages = Math.ceil(totalCount / PER_PAGE);

  // SEO dinâmico baseado na categoria filtrada
  const seo = useMemo(() => {
    if (categoryFilter && CATEGORY_SEO[categoryFilter.toLowerCase()]) {
      const cat = CATEGORY_SEO[categoryFilter.toLowerCase()];
      return {
        title: cat.title,
        description: cat.description,
        keywords: cat.keywords,
        canonicalUrl: `https://www.canais18.com/?category=${encodeURIComponent(categoryFilter)}`,
      };
    }
    return {
      title: "Canais Telegram 18+ | Canais18 - Putaria, Porno, Grupos Adultos",
      description: "Encontre os melhores canais telegram 18+. Putaria, porno, novinhas, amadoras, vazados e mais. 151+ canais verificados e atualizados diariamente. Entre agora!",
      keywords: "canais 18, canais telegram 18, telegram adulto, canais putaria telegram, canais porno telegram, telegram 18+",
      canonicalUrl: "https://www.canais18.com/",
    };
  }, [categoryFilter]);

  const handlePageChange = (p: number) => {
    setSearchParams({ page: String(p), ...(categoryFilter ? { category: categoryFilter } : {}) });
  };

  // Scroll to top after page data loads (useEffect to run after render)
  useEffect(() => {
    if (page > 1) {
      const timer = setTimeout(() => window.scrollTo({ top: 0 }), 50);
      return () => clearTimeout(timer);
    }
  }, [page]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        canonicalUrl={seo.canonicalUrl}
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://www.canais18.com/#website",
              "name": "Canais18",
              "alternateName": "Canais Telegram 18+",
              "url": "https://www.canais18.com",
              "description": "Maior diretório de grupos e canais adultos do Telegram no Brasil. Links verificados diariamente.",
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
              "@id": `${seo.canonicalUrl}#webpage`,
              "url": seo.canonicalUrl,
              "name": seo.title,
              "description": seo.description,
              "isPartOf": { "@id": "https://www.canais18.com/#website" },
              "inLanguage": "pt-BR",
              "publisher": { "@id": "https://www.canais18.com/#organization" },
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://www.canais18.com/?search={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            },
            {
              "@type": "BreadcrumbList",
              "@id": `${seo.canonicalUrl}#breadcrumb`,
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Início", "item": "https://www.canais18.com" }
              ]
            }
          ]
        }}
      />
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={setSort} activeSort={sort} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {/* Hero header only on page 1 (no search, no category filter) */}
        {page <= 1 && !searchTerm && !categoryFilter && (
          <section className="space-y-6 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-2 text-sm text-muted-foreground mx-auto">
              <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
              A maior coleção de grupos de putaria do telegram
            </div>

            {/* H1 - Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-foreground leading-[1.1]">
              Encontre os melhores grupos e canais do Telegram, além de modelos do <span className="text-primary">Privacy</span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              O seu site favorito para encontrar links de grupos +18, canais do Telegram e milhares de modelos do Privacy. Entre nos grupos ativos e salve os seus favoritos.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 justify-center pt-4 max-w-xl mx-auto w-full">
              {/* Grid for buttons - Force 2 columns even on mobile */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <a href="#grupos" className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-2 py-4 rounded-xl transition shadow-lg text-[13px] sm:text-base">
                  <span>📱</span> Descubra Grupos
                </a>
                <a href="#bots" className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-2 py-4 rounded-xl transition shadow-lg text-[13px] sm:text-base">
                  <span>🔒</span> Descubra Bots
                </a>
              </div>
              {/* Full width bottom button */}
              <a href="/modelos" className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-4 rounded-xl transition shadow-lg text-sm sm:text-base">
                Modelos Privacy +10k criadoras
              </a>
            </div>
          </section>
        )}

        <hr className="border-border/30" />

        <div id="grupos" className="scroll-mt-20"></div>
	{!premiumLoading && !searchTerm && !categoryFilter && premiumGrupos.length > 0 && <PremiumCarousel grupos={premiumGrupos} />}


        {searchTerm ? (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">
              Resultados para: <span className="text-primary">{searchTerm}</span>
            </h2>
          </section>
        ) : (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Canais e Grupos</h2>
            <SortTabs active={sort} onChange={setSort} />
          </section>
        )}

        {isError && <p className="py-12 text-center text-destructive">Erro ao carregar grupos. Tente novamente.</p>}

        {isLoading ? (
          <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                <Skeleton className="h-32 w-full sm:h-36" />
                <div className="space-y-2 p-3 sm:p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </section>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {grupos.map((grupo) => (
                <GroupCard key={grupo.id} grupo={grupo} hideBadges />
              ))}
            </section>

            {grupos.length >= 22 && page < totalPages && <BannerAd position="middle" />}
          </>
        )}

        {!isLoading && !isError && grupos.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">Nenhum grupo encontrado.</p>
        )}

        <Pagination current={page} total={totalPages} onChange={handlePageChange} />

        <BannerAd position="bottom" />
      </main>
    </div>
  );
};

export default Index;
