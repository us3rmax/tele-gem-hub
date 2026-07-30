import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import MobileSidebar from "@/components/MobileSidebar";
import BannerAd from "@/components/BannerAd";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroups, useFeaturedGroups } from "@/hooks/use-groups";
import { useFeaturedPrivacyModels, usePrivacyModels, type PrivacyModel } from "@/hooks/use-privacy-models";
import { groupPath } from "@/lib/slug";
import { Search, CheckCircle, Bookmark, ExternalLink } from "lucide-react";
import type { Grupo } from "@/data/mock";

const PER_PAGE = 20;

function formatLikes(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
}

// Model card — Erogram OFsearch style (white card, large photo, price badge, view profile button)
function ModelCard({ grupo }: { grupo: Grupo }) {
  const hasThumb = !!grupo.thumbnail_url;
  const handle = grupo.name.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 25);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/30 bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
      {/* Photo section */}
      <Link to={groupPath(grupo)} className="relative block aspect-[3/4] overflow-hidden">
        {hasThumb ? (
          <img
            src={grupo.thumbnail_url!}
            alt={`${grupo.name} - Modelo Privacy | Canais18`}
            className="h-full w-full object-cover object-top transition-transform duration-500 hover:scale-105"
            loading="lazy"
            width={400}
            height={533}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <span className="text-5xl font-bold text-primary/30">{grupo.name.charAt(0)}</span>
          </div>
        )}

        {/* Price badge top-right */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold shadow-md ${
              !grupo.is_premium
                ? "bg-green-500 text-white"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {!grupo.is_premium ? "Gratis" : "$10"}
          </span>
        </div>

        {/* Bookmark button */}
        <button
          className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white"
          onClick={(e) => e.preventDefault()}
        >
          <Bookmark className="h-4 w-4" />
        </button>

        {/* Photo dots (carousel indicator) */}
        <div className="absolute bottom-3 left-3 flex gap-1">
          <div className="h-2 w-2 rounded-full bg-white/90 shadow-sm" />
          <div className="h-2 w-2 rounded-full bg-white/50" />
        </div>
      </Link>

      {/* Info section — white background */}
      <div className="px-4 pt-3 pb-3">
        <div className="mb-1 flex items-center gap-1.5">
          <h3 className="line-clamp-1 text-base font-bold text-gray-900">{grupo.name}</h3>
          {grupo.is_verified && (
            <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
          )}
        </div>

        <p className="mb-1.5 text-sm font-medium text-primary">@{handle}</p>

        {grupo.member_count ? (
          <p className="mb-3 text-xs text-gray-400">{formatLikes(grupo.member_count)} likes</p>
        ) : (
          <div className="mb-3 h-3" />
        )}

        {/* View Profile button */}
        <Link
          to={groupPath(grupo)}
          className="block w-full rounded-xl bg-primary py-2.5 text-center text-sm font-bold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg active:scale-[0.98]"
        >
          Ver perfil
        </Link>
      </div>
    </div>
  );
}

// Privacy Model Card — links directly to Privacy profile (no internal page)
function PrivacyModelCard({ model }: { model: PrivacyModel }) {
  const hasThumb = !!model.avatar_url;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/30 bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
      {/* Photo section — external link to Privacy */}
      <a
        href={model.privacy_link}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-[3/4] overflow-hidden"
      >
        {hasThumb ? (
          <img
            src={model.avatar_url}
            alt={`${model.name} - Modelo Privacy | Canais18`}
            className="h-full w-full object-cover object-top transition-transform duration-500 hover:scale-105"
            loading="lazy"
            width={400}
            height={533}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-500/20 to-primary/5">
            <span className="text-5xl font-bold text-primary/30">{model.name.charAt(0)}</span>
          </div>
        )}

        {/* Verified badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {model.featured && (
            <span className="rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow-md">
              Destaque
            </span>
          )}
          {model.is_verified && (
            <span className="flex items-center gap-1 rounded-full bg-blue-500 px-2 py-1 text-xs font-bold text-white shadow-md">
              <CheckCircle className="h-3 w-3" />
            </span>
          )}
        </div>

        {/* External link indicator */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
          <ExternalLink className="h-3 w-3" />
          Privacy
        </div>
      </a>

      {/* Info section — white background */}
      <div className="px-4 pt-3 pb-3">
        <div className="mb-1 flex items-center gap-1.5">
          <h3 className="line-clamp-1 text-base font-bold text-gray-900">{model.name}</h3>
          {model.is_verified && (
            <CheckCircle className="h-4 w-4 shrink-0 text-blue-500" />
          )}
        </div>

        <p className="mb-3 text-sm font-medium text-primary">@{model.profile_name}</p>

        {/* View on Privacy button */}
        <a
          href={model.privacy_link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-2.5 text-center text-sm font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
        >
          <ExternalLink className="h-4 w-4" />
          Ver no Privacy
        </a>
      </div>
    </div>
  );
}

const Modelos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<"todos" | "gratuitos">("todos");

  // Featured models (from admin dashboard - featured=true)
  const { data: featuredData, isLoading: featuredLoading } = useFeaturedGroups();
  const featuredModels = useMemo(() => featuredData || [], [featuredData]);

  // Featured Privacy models
  const { data: featuredPrivacyData, isLoading: featuredPrivacyLoading } = useFeaturedPrivacyModels();
  const featuredPrivacyModels = useMemo(() => featuredPrivacyData || [], [featuredPrivacyData]);

  // Main query — filter by gratuitos if tab is active
  const { data, isLoading, isError } = useGroups({
    sort: "hot",
    search: searchTerm || (filterTab === "gratuitos" ? "" : "Previas"),
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
        description="Explore milhares de criadoras do Privacy. Busque por nome, categoria ou palavra-chave. Filtre por tipo de conteudo e encontre os melhores grupos de previas no Telegram."
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
          salve suas favoritas e filtre por tipo de conteudo.
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
        {/* Section 1: Privacy Models em Destaque (direct link to Privacy) */}
        {featuredPrivacyModels.length > 0 && (
          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <span className="text-lg">👑</span>
                Modelos <span className="text-primary">Privacy</span> em Destaque
              </h2>
              <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-medium text-pink-600">
                {featuredPrivacyModels.length} criadoras
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {featuredPrivacyLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-border/30 bg-white">
                      <Skeleton className="aspect-[3/4] w-full" />
                      <div className="space-y-2 p-4">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-8 w-full rounded-xl" />
                      </div>
                    </div>
                  ))
                : featuredPrivacyModels.map((model) => (
                    <PrivacyModelCard key={model.id} model={model} />
                  ))}
            </div>
          </section>
        )}

        {/* Section 2: Criadoras em Destaque (from admin - groups) */}
        {featuredModels.length > 0 && (
          <section>
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-foreground">
              <span className="text-lg">⭐</span>
              Criadoras em <span className="text-primary">Destaque</span>
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {featuredLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-border/30 bg-white">
                      <Skeleton className="aspect-[3/4] w-full" />
                      <div className="space-y-2 p-4">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-8 w-full rounded-xl" />
                      </div>
                    </div>
                  ))
                : featuredModels.map((grupo) => (
                    <ModelCard key={grupo.id} grupo={grupo} />
                  ))}
            </div>
          </section>
        )}

        {/* Section 3: Todos os Modelos Privacy */}
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
                <div key={i} className="overflow-hidden rounded-2xl border border-border/30 bg-white">
                  <Skeleton className="aspect-[3/4] w-full" />
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-8 w-full rounded-xl" />
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
