import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import MobileSidebar from "@/components/MobileSidebar";
import BannerAd from "@/components/BannerAd";
import SortTabs from "@/components/SortTabs";
import Pagination from "@/components/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroups, useFeaturedGroups } from "@/hooks/use-groups";
import { groupPath } from "@/lib/slug";
import { Search, Shuffle, Bookmark, ExternalLink } from "lucide-react";
import type { Grupo } from "@/data/mock";

const PER_PAGE = 20;

// Category filter chips
const CATEGORY_FILTERS = [
  "Todas",
  "Novinhas",
  "Amadoras",
  "Morenas",
  "Loiras",
  "Ruivas",
  "Lésbicas",
  "MILFs",
  "Trans",
  "Casais",
  "Fetiche",
  "Fitness",
  "Cosplay",
  "Tatuadas",
  "Latina",
];

function formatLikes(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return n.toString();
}

// Model card component (Erogram-style)
function ModelCard({ grupo }: { grupo: Grupo }) {
  const hasThumb = !!grupo.thumbnail_url;
  const isFree = !grupo.is_premium;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10">
      {/* Bookmark icon */}
      <button className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white">
        <Bookmark className="h-4 w-4" />
      </button>

      {/* Image */}
      <div className="relative h-48 overflow-hidden sm:h-56">
        {hasThumb ? (
          <img
            src={grupo.thumbnail_url!}
            alt={`${grupo.name} - Modelo Privacy | Canais18`}
            width={400}
            height={224}
            className="h-full w-full object-cover object-top transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <span className="text-4xl font-bold text-primary/30">{grupo.name.charAt(0)}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1 p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <h3 className="line-clamp-1 text-sm font-bold text-card-foreground">{grupo.name}</h3>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              isFree
                ? "bg-green-500/20 text-green-400"
                : "bg-primary/20 text-primary"
            }`}
          >
            {isFree ? "Grátis" : "Premium"}
          </span>
        </div>

        <p className="text-xs text-primary/70">
          {grupo.category}
        </p>

        <p className="text-[11px] text-muted-foreground">
          {grupo.member_count ? `${formatLikes(grupo.member_count)} likes` : "Grupo Telegram"}
        </p>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Link
            to={groupPath(grupo)}
            className="flex flex-1 items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ver perfil
          </Link>
          <a
            href={grupo.telegram_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-lg border border-border bg-card px-2.5 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            title="Abrir no Telegram"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

const Modelos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sort, setSort] = useState("hot");

  // Featured models (from admin dashboard - featured=true)
  const { data: featuredData, isLoading: featuredLoading } = useFeaturedGroups();
  const featuredModels = useMemo(() => featuredData || [], [featuredData]);

  // Main query
  const { data, isLoading, isError } = useGroups({
    sort,
    search: searchTerm || (activeCategory !== "Todas" ? activeCategory : "Prévias"),
    page: 1,
    perPage: PER_PAGE,
  });

  const grupos = data?.groups ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / PER_PAGE);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Privacy Search — Explore as Melhores Criadoras Privacy | Canais18"
        description="Explore milhares de criadoras do Privacy. Busque por nome, categoria ou palavra-chave. Filtre por tipo de conteúdo e encontre os melhores grupos de prévias no Telegram."
        keywords="privacy search, modelos privacy, previas privacy, criadoras privacy, grupos privacy telegram"
        canonicalUrl="https://www.canais18.com/modelos"
      />
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={setSort} activeSort={sort} />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 via-background to-background px-4 pt-16 pb-8 text-center">
        <h1 className="mb-3 text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Privacy <span className="text-primary">Search</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground">
          Explore milhares de criadoras do Privacy. Busque por nome, categoria ou palavra-chave, 
          salve suas favoritas e filtre por tipo de conteúdo.
        </p>

        {/* Search Bar */}
        <div className="mx-auto mb-6 max-w-2xl">
          <div className="relative flex items-center rounded-2xl border border-border bg-card px-4 py-3 shadow-lg">
            <Search className="mr-3 h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome, palavra-chave, tipo..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl space-y-12 px-4 py-8">
        {/* Featured Section - from admin dashboard */}
        {featuredModels.length > 0 && (
          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <span className="text-lg">👑</span>
                Criadoras em <span className="text-primary">Destaque</span>
              </h2>
              <Link
                to="/add"
                className="rounded-lg bg-card border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-secondary"
              >
                Enviar sua criadora
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {featuredLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                      <Skeleton className="h-48 w-full sm:h-56" />
                      <div className="space-y-2 p-3 sm:p-4">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    </div>
                  ))
                : featuredModels.map((grupo) => <ModelCard key={grupo.id} grupo={grupo} />)}
            </div>
          </section>
        )}

        {/* All Models Section */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <span className="text-lg">🔥</span>
              Criadoras <span className="text-primary">Populares</span>
            </h2>
            <Link
              to="/add"
              className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Adicionar nova criadora
            </Link>
          </div>

          {isError && (
            <p className="py-12 text-center text-destructive">
              Erro ao carregar modelos. Tente novamente.
            </p>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <Skeleton className="h-48 w-full sm:h-56" />
                  <div className="space-y-2 p-3 sm:p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {grupos.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {grupos.map((grupo) => (
                    <ModelCard key={grupo.id} grupo={grupo} />
                  ))}
                </div>
              )}

              {grupos.length > 8 && <BannerAd position="middle" />}

              {grupos.length > 16 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {grupos.slice(16).map((grupo) => (
                    <ModelCard key={grupo.id} grupo={grupo} />
                  ))}
                </div>
              )}
            </>
          )}

          {!isLoading && !isError && grupos.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              Nenhuma modelo encontrada com este critério.
            </p>
          )}

          {/* Sort & Pagination */}
          <div className="mt-8 space-y-4">
            <SortTabs active={sort} onChange={setSort} />
            <Pagination current={1} total={totalPages} onChange={() => {}} />
          </div>
        </section>

        <BannerAd position="bottom" />
      </main>

    </div>
  );
};

export default Modelos;
