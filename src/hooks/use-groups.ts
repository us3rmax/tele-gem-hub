import { useState } from "react";
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
import { useGroups, usePremiumGroups, PER_PAGE_MOBILE, PER_PAGE_DESKTOP } from "@/hooks/use-groups";

// Detecta desktop (>= 768px) para usar perPage correto
const isDesktop = () => typeof window !== "undefined" && window.innerWidth >= 768;

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sort, setSort] = useState("hot");

  const page = Number(searchParams.get("page") || "1");
  const searchTerm = searchParams.get("search") || "";

  // Desktop: 24 grupos (12+12), Mobile: 20 grupos (10+10)
  const perPage = isDesktop() ? PER_PAGE_DESKTOP : PER_PAGE_MOBILE;
  const half = perPage / 2;

  const { data, isLoading, isError } = useGroups({ sort, search: searchTerm, page, perPage });
  const { data: premiumGrupos = [] } = usePremiumGroups();

  const grupos = data?.groups ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / perPage);

  const handlePageChange = (p: number) => {
    setSearchParams({ page: String(p) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Canais Telegram 18+ | Canais18 - Putaria, Porno, Grupos Adultos"
        description="Encontre os melhores canais telegram 18+. Putaria, porno, novinhas, amadoras, vazados e mais. 151+ canais verificados e atualizados diariamente. Entre agora!"
        keywords="canais 18, canais telegram 18, telegram adulto, canais putaria telegram, canais porno telegram, telegram 18+"
        canonicalUrl="https://canais18.com/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Canais18",
          alternateName: "Canais Telegram 18+",
          url: "https://canais18.com",
          description: "Diretório de canais telegram 18+ verificados",
          inLanguage: "pt-BR",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://canais18.com/?search={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={setSort} activeSort={sort} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <h1 className="sr-only">Canais Telegram Brasil</h1>

        <BannerAd position="top" />

        {!isLoading && <PremiumCarousel grupos={premiumGrupos} />}

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
            {Array.from({ length: half }).map((_, i) => (
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
            {/* Primeira metade — acima do banner */}
            <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {grupos.slice(0, half).map((grupo) => (
                <GroupCard key={grupo.id} grupo={grupo} hideBadges />
              ))}
            </section>

            {/* Banner central */}
            {grupos.length > half && <BannerAd position="middle" />}

            {/* Segunda metade — abaixo do banner */}
            {grupos.length > half && (
              <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {grupos.slice(half).map((grupo) => (
                  <GroupCard key={grupo.id} grupo={grupo} hideBadges />
                ))}
              </section>
            )}
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
