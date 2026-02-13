import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MobileSidebar from "@/components/MobileSidebar";
import BannerAd from "@/components/BannerAd";
import GroupCard from "@/components/GroupCard";
import SortTabs from "@/components/SortTabs";
import Pagination from "@/components/Pagination";
import { supabase } from "@/lib/supabase";
import type { Grupo } from "@/data/mock";

const PER_PAGE = 12;

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sort, setSort] = useState("recentes");
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);

  const page = Number(searchParams.get("page") || "1");

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      let query = supabase.from("groups").select("*");

      switch (sort) {
        case "vistos":
          query = query.order("member_count", { ascending: false });
          break;
        case "votados":
          query = query.order("member_count", { ascending: false });
          break;
        case "hot":
          query = query.order("is_premium", { ascending: false }).order("member_count", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching groups:", error);
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
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={setSort} activeSort={sort} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {/* Banner */}
        <BannerAd />

        {/* Sort */}
        <SortTabs active={sort} onChange={setSort} />

        {/* Grid */}
        {loading ? (
          <p className="py-12 text-center text-muted-foreground">Carregando grupos...</p>
        ) : (
          <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {paged.map((grupo) => (
              <GroupCard key={grupo.id} grupo={grupo} />
            ))}
          </section>
        )}

        {!loading && paged.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">Nenhum grupo encontrado.</p>
        )}

        {/* Pagination */}
        <Pagination current={currentPage} total={totalPages} onChange={handlePageChange} />
      </main>
    </div>
  );
};

export default Index;
