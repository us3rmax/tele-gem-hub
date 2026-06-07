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
import { useGroups, usePremiumGroups } from "@/hooks/use-groups";
const PER_PAGE = 20;

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sort, setSort] = useState("hot");

  const page = Number(searchParams.get("page") || "1");
  const searchTerm = searchParams.get("search") || "";

  const { data, isLoading, isError } = useGroups({ sort, search: searchTerm, page, perPage: 20 });
  const { data: premiumGrupos = [] } = usePremiumGroups();

  const grupos = data?.groups ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / PER_PAGE);

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
        canonicalUrl="https://www.canais18.com/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Canais18",
          alternateName: "Canais Telegram 18+",
          url: "https://www.canais18.com",
          description: "Diretório de canais telegram 18+ verificados",
          inLanguage: "pt-BR",
          potentialAction: {
            "@type": "SearchAction",
            target: {
  "@type": "EntryPoint",
  urlTemplate: "https://www.canais18.com/?search={search_term_string}",
},
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={setSort} activeSort={sort} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
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

        <hr className="border-border/30" />

        <div id="grupos" className="scroll-mt-20"></div>
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
              {grupos.slice(0, 10).map((grupo) => (
                <GroupCard key={grupo.id} grupo={grupo} hideBadges />
              ))}
            </section>

            {grupos.length > 10 && <BannerAd position="middle" />}

            {grupos.length > 10 && (
              <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {grupos.slice(10).map((grupo) => (
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
