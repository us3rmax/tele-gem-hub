import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import MobileSidebar from "@/components/MobileSidebar";
import BannerAd from "@/components/BannerAd";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeaturedGroups } from "@/hooks/use-groups";
import { useFeaturedPrivacyModels, usePrivacyModels, type PrivacyModel, type PrivacyModelWithProxy } from "@/hooks/use-privacy-models";

import { groupPath } from "@/lib/slug";
import { Search, CheckCircle, Bookmark, ExternalLink } from "lucide-react";
import type { Grupo } from "@/data/mock";

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

// Privacy Model Card — dark horizontal layout matching Privacy.com.br style
function PrivacyModelCard({ model }: { model: PrivacyModelWithProxy }) {
  const hasThumb = !!model.proxied_avatar;

  return (
    <div className="overflow-hidden rounded-xl bg-gray-900 shadow-sm transition-all duration-300 hover:shadow-lg">
      {/* Horizontal photo section */}
      <a
        href={model.privacy_link}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-[4/3] overflow-hidden"
      >
        {hasThumb ? (
          <img
            src={model.proxied_cover || model.proxied_avatar}
            alt={`${model.name} - Modelo Privacy | Canais18`}
            className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
            loading="lazy"
            width={400}
            height={300}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-500/30 to-purple-600/20">
            <span className="text-5xl font-bold text-white/30">{model.name.charAt(0)}</span>
          </div>
        )}

        {/* Ranking badge top-right */}
        {model.featured && model.ranking <= 20 && (
          <div className="absolute top-2 right-2">
            <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
              {model.ranking}º
            </span>
          </div>
        )}
      </a>

      {/* Info section — dark background */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Small circular avatar */}
        <a href={model.privacy_link} target="_blank" rel="noopener noreferrer" className="shrink-0">
          <img
            src={model.proxied_avatar}
            alt={`${model.name} avatar`}
            className="h-8 w-8 rounded-full border-2 border-gray-700 object-cover"
            loading="lazy"
            width={32}
            height={32}
          />
        </a>

        {/* Name and handle */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h3 className="line-clamp-1 text-sm font-bold text-white">{model.name}</h3>
            {model.is_verified && (
              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-blue-400" />
            )}
          </div>
          <p className="text-xs text-gray-400">@{model.profile_name}</p>
        </div>
      </div>
    </div>
  );
}


const Modelos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<"todos" | "gratuitos">("todos");

  // Section 1: Featured models (from admin dashboard - groups with featured=true)
  const { data: featuredData, isLoading: featuredLoading } = useFeaturedGroups();
  const featuredModels = useMemo(() => featuredData || [], [featuredData]);

  // Section 2: Top Creators (featured Privacy models — the 16 we imported)
  const { data: featuredPrivacyData, isLoading: featuredPrivacyLoading } = useFeaturedPrivacyModels();
  const featuredPrivacyModels = useMemo(() => featuredPrivacyData || [], [featuredPrivacyData]);

  // Free profiles removed — already covered in Mais Buscadas tab

  // Section 3: Mais Buscadas (all Privacy models with tabs)
  // Exclude featured models (already shown in Top Creators section)
  const { data: privacyData, isLoading: privacyLoading, isError: privacyError } = usePrivacyModels(
    searchTerm || undefined,
    100,
    filterTab === "gratuitos" ? true : false,
    true // exclude featured (already shown in Top Creators)
  );
  const privacyModels = useMemo(() => privacyData?.models ?? [], [privacyData?.models]);

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

        {/* Section 1: Criadoras em Destaque (from admin - groups) */}
        {featuredModels.length > 0 && (
          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <span className="text-lg">⭐</span>
                Criadoras em <span className="text-primary">Destaque</span>
              </h2>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {featuredModels.length} criadoras
              </span>
            </div>

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

        {/* Section 2: Top Creators (featured Privacy models) */}
        {featuredPrivacyModels.length > 0 && (
          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <span className="text-lg">👑</span>
                <span className="text-primary">Top Creators</span>
              </h2>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
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



        {/* Section 3: Mais Buscadas (all Privacy models with tabs) */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <span className="text-lg">🔍</span>
              Mais <span className="text-primary">Buscadas</span>
            </h2>
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

          {privacyError && (
            <p className="py-12 text-center text-destructive">
              Erro ao carregar modelos. Tente novamente.
            </p>
          )}

          {privacyLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl bg-gray-900">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-2 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {privacyModels.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {privacyModels.map((model) => (
                    <PrivacyModelCard key={model.id} model={model} />
                  ))}
                </div>
              )}

              {privacyModels.length > 8 && <BannerAd position="middle" />}

              {privacyModels.length > 16 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {privacyModels.slice(16).map((model) => (
                    <PrivacyModelCard key={model.id} model={model} />
                  ))}
                </div>
              )}
            </>
          )}

          {!privacyLoading && !privacyError && privacyModels.length === 0 && (
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
