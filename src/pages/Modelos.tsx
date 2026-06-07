import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import MobileSidebar from "@/components/MobileSidebar";
import BannerAd from "@/components/BannerAd";
import GroupCard from "@/components/GroupCard";
import SortTabs from "@/components/SortTabs";
import Pagination from "@/components/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroups } from "@/hooks/use-groups";

const PER_PAGE = 20;

const Modelos = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sort, setSort] = useState("hot");

  const page = Number(searchParams.get("page") || "1");
  // Forçamos o termo de busca "Prévias" para filtrar os grupos de modelos
  const searchTerm = "Prévias";

  const { data, isLoading, isError } = useGroups({ 
    sort, 
    search: searchTerm, 
    page, 
    perPage: PER_PAGE 
  });

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
        title="Modelos Privacy +10k Criadoras | Canais18 - Prévias e Grupos Exclusivos"
        description="Acesse as melhores prévias de modelos do Privacy e Onlyfans no Telegram. Mais de 10 mil criadoras com grupos verificados e atualizados diariamente."
        keywords="modelos privacy, previas privacy, grupos privacy telegram, packs privacy, criadoras privacy"
        canonicalUrl="https://www.canais18.com/modelos"
      />
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={setSort} activeSort={sort} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <section className="space-y-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-2 text-sm text-muted-foreground mx-auto">
            <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
            As melhores prévias de modelos do Privacy
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-foreground leading-[1.1]">
            Modelos <span className="text-primary">Privacy</span> +10k Criadoras
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Explore nossa seleção exclusiva de grupos de prévias das modelos mais famosas do Privacy e Onlyfans. Conteúdo atualizado e verificado para você não perder nada.
          </p>
        </section>

        <hr className="border-border/30" />

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">⭐ Prévias em Destaque</h2>
          <SortTabs active={sort} onChange={setSort} />
        </section>

        {isError && <p className="py-12 text-center text-destructive">Erro ao carregar modelos. Tente novamente.</p>}

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
          <p className="py-12 text-center text-muted-foreground">Nenhuma modelo encontrada com este critério.</p>
        )}

        <Pagination current={page} total={totalPages} onChange={handlePageChange} />

        <BannerAd position="bottom" />
      </main>
    </div>
  );
};

export default Modelos;
