import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import MobileSidebar from "@/components/MobileSidebar";
import BannerAd from "@/components/BannerAd";
import GroupCard from "@/components/GroupCard";
import Pagination from "@/components/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { Grupo } from "@/data/mock";

const CATEGORIES = [
  { slug: "putaria", label: "Putaria" },
  { slug: "privacy", label: "Privacy" },
  { slug: "amadoras", label: "Amadoras" },
  { slug: "gay", label: "Gay" },
  { slug: "vazados", label: "Vazados" },
  { slug: "fetiche", label: "Fetiche" },
  { slug: "casadas", label: "Casadas" },
  { slug: "trans", label: "Trans" },
  { slug: "hentai", label: "Hentai" },
  { slug: "celebridades", label: "Celebridades" },
  { slug: "latina", label: "Latina" },
  { slug: "asiaticas", label: "Asiáticas" },
  { slug: "novinhas", label: "Novinhas" },
  { slug: "interracial", label: "Interracial" },
  { slug: "bdsm", label: "BDSM" },
  { slug: "bbw", label: "BBW" },
  { slug: "coroas", label: "Coroas" },
  { slug: "negras", label: "Negras" },
  { slug: "lesbicas", label: "Lésbicas" },
  { slug: "geral", label: "Geral" },
];

const PER_PAGE = 20;

const FALLBACK_GRADIENT: Record<string, string> = {
  putaria: "from-rose-600 to-red-800",
  onlyfans: "from-cyan-500 to-blue-700",
  privacy: "from-blue-500 to-indigo-700",
  amadoras: "from-purple-500 to-fuchsia-700",
  gay: "from-rainbow-500 to-pink-600",
  vazados: "from-red-500 to-orange-700",
  fetiche: "from-violet-600 to-purple-800",
  casadas: "from-pink-500 to-rose-700",
  trans: "from-blue-400 to-pink-600",
  hentai: "from-indigo-500 to-violet-700",
  celebridades: "from-amber-500 to-yellow-700",
  latina: "from-green-500 to-emerald-700",
  asiaticas: "from-red-400 to-pink-600",
  novinhas: "from-pink-400 to-rose-600",
  interracial: "from-orange-500 to-amber-700",
  bdsm: "from-gray-700 to-gray-900",
  bbw: "from-purple-400 to-pink-600",
  coroas: "from-amber-600 to-orange-800",
  negras: "from-gray-600 to-gray-800",
  lesbicas: "from-violet-400 to-purple-600",
  geral: "from-slate-500 to-slate-700",
};

// Busca thumbnail + contagem de cada categoria
async function fetchCategoryPreviews() {
  const results = await Promise.all(
    CATEGORIES.map(async (cat) => {
      const [topGroup, countResult] = await Promise.all([
        supabase
          .from("groups")
          .select("thumbnail_url")
          .eq("category", cat.slug)
          .not("thumbnail_url", "is", null)
          .order("member_count", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("groups").select("*", { count: "exact", head: true }).eq("category", cat.slug),
      ]);
      return {
        slug: cat.slug,
        label: cat.label,
        thumbnail: topGroup.data?.thumbnail_url ?? null,
        count: countResult.count ?? 0,
      };
    }),
  );
  return results;
}

const PHOTO_PRIORITY_PAGES = 5;

async function fetchCategoryGroups(category: string, page: number) {
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  const [countResult, dataResult] = await Promise.all([
    supabase.from("groups").select("*", { count: "exact", head: true }).eq("category", category),
    supabase
      .from("groups")
      .select("*")
      .eq("category", category)
      .order("member_count", { ascending: false })
      .range(from, to),
  ]);

  let groups = (dataResult.data as Grupo[]) ?? [];

  // Nas primeiras 5 páginas, priorizar grupos com foto
  if (page <= PHOTO_PRIORITY_PAGES) {
    const withPhoto = groups.filter((g: any) => g.thumbnail_url);
    const withoutPhoto = groups.filter((g: any) => !g.thumbnail_url);
    groups = [...withPhoto, ...withoutPhoto];
  }

  return {
    groups,
    totalCount: countResult.count ?? 0,
  };
}

// ── Página principal de categorias ───────────────────────────────────────────

const CategoriesGrid = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: previews = [], isLoading } = useQuery({
    queryKey: ["category-previews"],
    queryFn: fetchCategoryPreviews,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={() => {}} activeSort="" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <BannerAd />

        <div>
          <h1 className="text-2xl font-bold text-foreground">📂 Categorias</h1>
          <p className="mt-1 text-sm text-muted-foreground">Escolha uma categoria para explorar</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 21 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <Skeleton className="h-32 w-full sm:h-36" />
                  <div className="space-y-1 p-3">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))
            : previews.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/categorias/${cat.slug}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="relative h-32 overflow-hidden sm:h-36">
                    {cat.thumbnail ? (
                      <img
                        src={cat.thumbnail}
                        alt={cat.label}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div
                        className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${FALLBACK_GRADIENT[cat.slug] ?? "from-gray-600 to-gray-800"} transition-transform duration-500 group-hover:scale-110`}
                      >
                        <span className="text-2xl font-bold text-white/90">{cat.label}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-2 left-3 text-sm font-bold text-white drop-shadow">
                      {cat.label}
                    </span>
                  </div>
                  <div className="px-3 py-2 text-center">
                    <span className="text-xs text-muted-foreground">{cat.count} grupos</span>
                  </div>
                </Link>
              ))}
        </div>
      </main>
    </div>
  );
};

// ── Página de grupos de uma categoria ────────────────────────────────────────

const CategoryGroups = ({ category }: { category: string }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);

  const label = CATEGORIES.find((c) => c.slug === category)?.label ?? category;

  const { data, isLoading } = useQuery({
    queryKey: ["category-groups", category, page],
    queryFn: () => fetchCategoryGroups(category, page),
    staleTime: 2 * 60 * 1000,
  });

  const grupos = data?.groups ?? [];
  const totalPages = Math.ceil((data?.totalCount ?? 0) / PER_PAGE);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={() => {}} activeSort="" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <BannerAd />

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-foreground">
            Início
          </Link>
          <span>›</span>
          <Link to="/categorias" className="transition-colors hover:text-foreground">
            Categorias
          </Link>
          <span>›</span>
          <span className="font-medium text-foreground">{label}</span>
        </div>

        <h1 className="text-2xl font-bold text-foreground">{label}</h1>

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
          <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {grupos.map((grupo) => (
              <GroupCard key={grupo.id} grupo={grupo} />
            ))}
          </section>
        )}

        {!isLoading && grupos.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">Nenhum grupo encontrado nesta categoria.</p>
        )}

        <Pagination
          current={page}
          total={totalPages}
          onChange={(p) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </main>
    </div>
  );
};

// ── Export ────────────────────────────────────────────────────────────────────

const Categories = () => {
  const { name } = useParams<{ name: string }>();
  if (name) return <CategoryGroups category={name} />;
  return <CategoriesGrid />;
};

export default Categories;
