import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import MobileSidebar from "@/components/MobileSidebar";
import BannerAd from "@/components/BannerAd";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroups, useFeaturedGroups } from "@/hooks/use-groups";
import { groupPath } from "@/lib/slug";
import { Search, ExternalLink, CheckCircle } from "lucide-react";
import type { Grupo } from "@/data/mock";

const PER_PAGE = 20;

function formatLikes(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return n.toString();
}

// Featured model card (destaque) — compact with photo + name + handle style
function FeaturedModelCard({ grupo }: { grupo: Grupo }) {
  const hasThumb = !!grupo.thumbnail_url;

  return (
    <Link
      to={groupPath(grupo)}
      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
    >
      {/* Large photo background */}
      <div className="relative h-48 sm:h-56 overflow-hidden">
        {hasThumb ? (
          <img
            src={grupo.thumbnail_url!}
            alt={`${grupo.name} - Modelo Privacy | Canais18`}
            width={400}
            height={224}
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <span className="text-4xl font-bold text-primary/30">{grupo.name.charAt(0)}</span>
          </div>
        )}

        {/* Avatar circle overlay */}
        {hasThumb && (
          <div className="absolute bottom-[-20px] left-4 h-14 w-14 overflow-hidden rounded-full border-3 border-card bg-card shadow-lg">
            <img
              src={grupo.thumbnail_url!}
              alt={grupo.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Info below image */}
      <div className="relative px-4 pb-4 pt-3">
        <div className="flex items-center gap-2">
          <h3 className="line-clamp-1 text-base font-bold text-card-foreground">{grupo.name}</h3>
          {grupo.is_verified && (
            <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
          )}
        </div>

        {/* Handle-like text */}
        <p className="text-xs text-primary/70">
          @{grupo.name.toLowerCase().replace(/\s+/g, "").substring(0, 20)}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              !grupo.is_premium
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {!grupo.is_premium ? "Grátis" : "Premium"}
          </span>
          {grupo.member_count ? (
            <span className="text-[11px] text-muted-foreground">
              {formatLikes(grupo.member_count)} likes
            </span>
          ) : null}
        </div>

        {/* External link */}
        <a
          href={grupo.telegram_link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/70 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </Link>
  );
}

const Modelos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<"todos" | "gratuitos">("todos");

  // Featured models (from admin dashboard - featured=true)
  const { data: featuredData, isLoading: featuredLoading } = useFeaturedGroups();
  const featuredModels = useMemo(() => featuredData || [], [featuredData]);

  // Main query — filter by gratuitos if tab is active
  const { data, isLoading, isError } = useGroups({
    sort: "hot",
    search: searchTerm || (filterTab === "gratuitos" ? "" : "Prévias"),
    page: 1,
    perPage: PER_PAGE,
  });

  const grupos = useMemo(() => {
    const all = data?.groups ?? [];
    if (filterTab === "gratuitos") {
      return all.filter((g) => !g.is_premium);
    }
    return all;
  }, [data?.groups, filterTab]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Privacy Search — Explore as Melhores Criadoras Privacy | Canais18"
        description="Explore milhares de criadoras do Privacy. Busque por nome, categoria ou palavra-chave. Filtre por tipo de conteúdo e encontre os melhores grupos de prévias no Telegram."
        keywords="privacy search, modelos privacy, previas privacy, criadoras privacy, grupos privacy telegram"
        canonicalUrl="https://www.canais18.com/modelos"
      />
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 via-background to-background px-4 pt-10 pb-6 text-center">
        <h1 className="mb-2 text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Privacy <span className="text-primary">Search</span>
        </h1>
        <p className="mx-auto mb-4 max-w-2xl text-base text-muted-foreground">
          Explore milhares de criadoras do Privacy. Busque por nome, categoria ou palavra-chave,
          salve suas favoritas e filtre por tipo de conteúdo.
        </p>

        {/* Search Bar */}
        <div className="mx-auto mb-4 max-w-2xl">
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
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl space-y-12 px-4 py-8">
        {/* Section 1: Criadoras em Destaque (from admin) */}
        {featuredModels.length > 0 && (
          <section>
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-foreground">
              <span className="text-lg">👑</span>
              Criadoras em <span className="text-primary">Destaque</span>
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {featuredLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                      <Skeleton className="h-48 w-full sm:h-56" />
                      <div className="space-y-2 p-4">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))
                : featuredModels.map((grupo) => (
                    <FeaturedModelCard key={grupo.id} grupo={grupo} />
                  ))}
            </div>
          </section>
        )}

        {/* Section 2: Mais Buscadas */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <span className="text-lg">🔍</span>
              Mais <span className="text-primary">Buscadas</span>
            </h2>
            <Link
              to="/add"
              className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Adicionar nova criadora
            </Link>
          </div>

          {/* Todos / Gratuitos tabs */}
          <div className="mb-5 flex items-center justify-center">
            <div className="flex w-full max-w-md rounded-full border border-border bg-secondary/50 p-1">
              <button
                onClick={() => setFilterTab("todos")}
                className={`flex-1 rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                  filterTab === "todos"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterTab("gratuitos")}
                className={`flex-1 rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                  filterTab === "gratuitos"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Gratuitos
              </button>
            </div>
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
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {grupos.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {grupos.map((grupo) => (
                    <FeaturedModelCard key={grupo.id} grupo={grupo} />
                  ))}
                </div>
              )}

              {grupos.length > 8 && <BannerAd position="middle" />}

              {grupos.length > 16 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {grupos.slice(16).map((grupo) => (
                    <FeaturedModelCard key={grupo.id} grupo={grupo} />
                  ))}
                </div>
              )}
            </>
          )}

          {!isLoading && !isError && grupos.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              Nenhuma modelo encontrada com este filtro.
            </p>
          )}
        </section>

        <BannerAd position="bottom" />
      </main>
    </div>
  );
};

export default Modelos;
