import { useState, useEffect } from "react";
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
import { supabase } from "@/lib/supabase";
import type { Grupo } from "@/data/mock";

const PER_PAGE = 20;

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sort, setSort] = useState("hot");
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [premiumGrupos, setPremiumGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = Number(searchParams.get("page") || "1");

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      setError(null);

      // Fetch premium groups
      const { data: premiumData } = await supabase
        .from("groups")
        .select("*")
        .eq("is_premium", true)
        .limit(50);

      if (premiumData) {
        // Pinned first, then randomize the rest
        const pinned = (premiumData as any[]).filter((g) => g.is_pinned);
        const unpinned = (premiumData as any[]).filter((g) => !g.is_pinned).sort(() => Math.random() - 0.5);
        setPremiumGrupos([...pinned, ...unpinned].slice(0, 10) as Grupo[]);
      } else {
        setPremiumGrupos([]);
      }

      // Fetch regular groups
      let query = supabase.from("groups").select("*").eq("is_premium", false);

      switch (sort) {
        case "vistos":
          query = query.order("member_count", { ascending: false });
          break;
        case "votados":
          query = query.order("member_count", { ascending: false });
          break;
        case "hot":
          query = query.order("member_count", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error("Error fetching groups:", fetchError);
        setError("Erro ao carregar grupos. Tente novamente.");
        setGrupos([]);
      } else {
        setGrupos(data as Grupo[]);
      }
      setLoading(false);
    };

    fetchGroups();
  }, [sort]);

  const totalPages = Math.ceil(grupos.length / PER_PAGE);
  const currentPage = Math.min(page, totalPages) || 1;
  const paged = grupos.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

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
          "name": "Canais18",
          "alternateName": "Canais Telegram 18+",
          "url": "https://canais18.com",
          "description": "Diretório de canais telegram 18+ verificados",
          "inLanguage": "pt-BR",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://canais18.com/?search={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        }}
      />
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={setSort} activeSort={sort} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <h1 className="sr-only">Canais Telegram Brasil</h1>

        <BannerAd position="top" />

        {/* Premium Carousel */}
        {!loading && <PremiumCarousel grupos={premiumGrupos} />}

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">Canais e Grupos</h2>
          <SortTabs active={sort} onChange={setSort} />
        </section>

        {error && <p className="py-12 text-center text-destructive">{error}</p>}

        {loading ? (
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
          <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {paged.map((grupo) => (
              <GroupCard key={grupo.id} grupo={grupo} hideBadges />
            ))}
          </section>
        )}

        {!loading && !error && paged.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">Nenhum grupo encontrado.</p>
        )}

        <Pagination current={currentPage} total={totalPages} onChange={handlePageChange} />

        <BannerAd position="bottom" />
      </main>
    </div>
  );
};

export default Index;
