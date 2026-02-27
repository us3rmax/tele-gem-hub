import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MobileSidebar from "@/components/MobileSidebar";
import BannerAd from "@/components/BannerAd";
import GroupCard from "@/components/GroupCard";
import Pagination from "@/components/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { Grupo } from "@/data/mock";

const allCategories = ["Novinhas", "Amadoras", "Cornos", "Onlyfans", "Vazados", "Lésbicas", "Pack", "Putaria"];

const categoryColors: Record<string, string> = {
  Novinhas: "from-pink-500 to-rose-600",
  Amadoras: "from-purple-500 to-fuchsia-600",
  Cornos: "from-amber-500 to-orange-600",
  Onlyfans: "from-cyan-500 to-blue-600",
  Vazados: "from-red-500 to-pink-600",
  Lésbicas: "from-violet-500 to-purple-600",
  Pack: "from-emerald-500 to-teal-600",
  Putaria: "from-rose-500 to-red-600",
};

const PER_PAGE = 12;

const Categories = () => {
  const { name } = useParams<{ name: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sort, setSort] = useState("recentes");

  // If a category name is in the URL, show filtered groups
  if (name) {
    return <CategoryGroups category={name} />;
  }

  // Otherwise show all categories
  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={setSort} activeSort={sort} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <BannerAd />

        <div>
          <h1 className="text-2xl font-bold text-foreground">📂 Categorias</h1>
          <p className="mt-1 text-sm text-muted-foreground">Escolha uma categoria para explorar</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {allCategories.map((cat) => (
            <Link
              key={cat}
              to={`/categorias/${encodeURIComponent(cat)}`}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className={`flex h-32 items-center justify-center bg-gradient-to-br ${categoryColors[cat] || "from-gray-500 to-gray-700"} transition-transform duration-500 group-hover:scale-110 sm:h-36`}>
                <span className="text-3xl font-bold text-white/90">{cat}</span>
              </div>
              <div className="p-3 text-center sm:p-4">
                <span className="text-sm font-semibold text-card-foreground">{cat}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

const CategoryGroups = ({ category }: { category: string }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sort, setSort] = useState("recentes");
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let query = supabase.from("groups").select("*").eq("category", category);

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

      const { data } = await query;
      setGrupos((data as Grupo[]) || []);
      setLoading(false);
    };
    fetch();
  }, [category, sort]);

  const totalPages = Math.ceil(grupos.length / PER_PAGE);
  const currentPage = Math.min(page, totalPages) || 1;
  const paged = grupos.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={setSort} activeSort={sort} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <BannerAd />

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">TGIndex</Link>
          <span>›</span>
          <Link to="/categorias" className="hover:text-foreground transition-colors">Categorias</Link>
          <span>›</span>
          <span className="text-foreground font-medium">{category}</span>
        </div>

        <h1 className="text-2xl font-bold text-foreground">{category}</h1>

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
              <GroupCard key={grupo.id} grupo={grupo} />
            ))}
          </section>
        )}

        {!loading && paged.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">Nenhum grupo encontrado nesta categoria.</p>
        )}

        <Pagination current={currentPage} total={totalPages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
      </main>
    </div>
  );
};

export default Categories;
