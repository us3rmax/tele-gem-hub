import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MobileSidebar from "@/components/MobileSidebar";
import BannerAd from "@/components/BannerAd";
import GroupCard from "@/components/GroupCard";
import SortTabs from "@/components/SortTabs";
import CategoryFilter from "@/components/CategoryFilter";
import Pagination from "@/components/Pagination";
import { mockGrupos } from "@/data/mock";

const PER_PAGE = 12;

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sort, setSort] = useState("recentes");
  const [category, setCategory] = useState("Todos");

  const page = Number(searchParams.get("page") || "1");

  const filtered = useMemo(() => {
    let list = [...mockGrupos];

    if (category !== "Todos") {
      list = list.filter((g) => g.categoria === category);
    }

    switch (sort) {
      case "vistos":
        list.sort((a, b) => b.visualizacoes - a.visualizacoes);
        break;
      case "votados":
        list.sort((a, b) => b.votos - a.votos);
        break;
      case "hot":
        list.sort((a, b) => (b.hot ? 1 : 0) - (a.hot ? 1 : 0) || b.visualizacoes - a.visualizacoes);
        break;
      default:
        list.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
    }

    return list;
  }, [sort, category]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = Math.min(page, totalPages) || 1;
  const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

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

        {/* Filters */}
        <div className="space-y-3">
          <CategoryFilter active={category} onChange={setCategory} />
        </div>

        {/* Grid */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {paged.map((grupo) => (
            <GroupCard key={grupo.id} grupo={grupo} />
          ))}
        </section>

        {paged.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">Nenhum grupo encontrado nesta categoria.</p>
        )}

        {/* Pagination */}
        <Pagination current={currentPage} total={totalPages} onChange={handlePageChange} />
      </main>
    </div>
  );
};

export default Index;
