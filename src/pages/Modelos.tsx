import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import MobileSidebar from "@/components/MobileSidebar";
import BannerAd from "@/components/BannerAd";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeaturedGroups } from "@/hooks/use-groups";
import { useFeaturedPrivacyModels, useCreadoraPrivacyModels, usePrivacyModels, type PrivacyModel, type PrivacyModelWithProxy } from "@/hooks/use-privacy-models";

import { groupPath } from "@/lib/slug";
import { Search, CheckCircle, ExternalLink } from "lucide-react";
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

// Privacy Model Card — exact Erogram style
function PrivacyModelCard({ model }: { model: PrivacyModelWithProxy }) {
  const hasThumb = !!model.proxied_avatar;

  return (
    <button
      type="button"
      onClick={() => window.open(model.privacy_link, '_blank', 'noopener,noreferrer')}
      className="group w-full text-left rounded-2xl overflow-hidden bg-white ring-[2px] ring-[#00AFF0]/30 hover:ring-[#00AFF0] shadow-[0_8px_28px_-8px_rgba(0,175,240,0.25)] hover:shadow-[0_12px_36px_-6px_rgba(0,175,240,0.35)] hover:-translate-y-1 transition-all duration-300 cursor-pointer focus:outline-none"
    >
      <div className="relative aspect-[3/4] bg-[#f0f8ff]">
        {hasThumb ? (
          <img
            alt={`${model.name} Privacy`}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            loading="lazy"
            referrerPolicy="no-referrer"
            src={model.proxied_avatar}
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : null}
        <div className={`absolute inset-0 flex items-center justify-center ${hasThumb ? 'hidden' : ''}`}>
          <span className="text-5xl font-bold text-[#00AFF0]/20">{model.name.charAt(0)}</span>
        </div>
      </div>
      <div className="px-3 pt-2.5 sm:px-4 sm:pt-3">
        <div className="flex items-center gap-1.5">
          <h3 className="font-bold text-[13px] sm:text-[15px] text-gray-900 truncate leading-tight">{model.name}</h3>
          {model.is_verified && (
            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-[#00AFF0]" />
          )}
        </div>
        <p className="text-[11px] sm:text-[13px] text-[#00AFF0] font-semibold mt-0.5">@{model.profile_name}</p>
      </div>
      <div className="px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3">
        <div className="w-full py-2 sm:py-2.5 rounded-xl bg-[#00AFF0] text-white text-[12px] sm:text-sm font-black text-center shadow-lg border border-[#00AFF0] group-hover:bg-[#009AD6] transition-colors">
          Ver perfil
        </div>
      </div>
    </button>
  );
}

// Creadora Privacy Model Card — exact Erogram style with video support
function CreadoraPrivacyModelCard({ model }: { model: PrivacyModelWithProxy }) {
  const hasMedia = !!model.proxied_media;
  const isVideo = model.media_type === "video";
  const hasFallback = !hasMedia && !model.proxied_avatar;

  return (
    <button
      type="button"
      onClick={() => window.open(model.privacy_link, '_blank', 'noopener,noreferrer')}
      className="group w-full text-left rounded-2xl overflow-hidden bg-white ring-[2px] ring-[#00AFF0]/30 hover:ring-[#00AFF0] shadow-[0_8px_28px_-8px_rgba(0,175,240,0.25)] hover:shadow-[0_12px_36px_-6px_rgba(0,175,240,0.35)] hover:-translate-y-1 transition-all duration-300 cursor-pointer focus:outline-none"
    >
      <div className="relative aspect-[3/4] bg-[#f0f8ff]">
        {hasMedia ? (
          isVideo ? (
            <video
              src={model.proxied_media}
              muted
              loop
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            />
          ) : (
            <img
              alt={`${model.name} Privacy`}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
              loading="lazy"
              referrerPolicy="no-referrer"
              src={model.proxied_media}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          )
        ) : null}
        <div className={`absolute inset-0 flex items-center justify-center ${hasMedia ? 'hidden' : ''}`}>
          <span className="text-5xl font-bold text-[#00AFF0]/20">{model.name.charAt(0)}</span>
        </div>
      </div>
      <div className="px-3 pt-2.5 sm:px-4 sm:pt-3">
        <div className="flex items-center gap-1.5">
          <h3 className="font-bold text-[13px] sm:text-[15px] text-gray-900 truncate leading-tight">{model.name}</h3>
          {model.is_verified && (
            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-[#00AFF0]" />
          )}
        </div>
        <p className="text-[11px] sm:text-[13px] text-[#00AFF0] font-semibold mt-0.5">@{model.profile_name}</p>
      </div>
      <div className="px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3">
        <div className="w-full py-2 sm:py-2.5 rounded-xl bg-[#00AFF0] text-white text-[12px] sm:text-sm font-black text-center shadow-lg border border-[#00AFF0] group-hover:bg-[#009AD6] transition-colors">
          Ver perfil
        </div>
      </div>
    </button>
  );
}


const Modelos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<"todos" | "gratuitos">("todos");

  // Section 1a: Featured groups (from admin dashboard - groups with featured=true)
  const { data: featuredData, isLoading: featuredLoading } = useFeaturedGroups();
  const featuredModels = useMemo(() => featuredData || [], [featuredData]);

  // Section 1b: Creadora Privacy models (featured_type = 'creadora' - page próprio)
  const { data: creadoraData, isLoading: creadoraLoading } = useCreadoraPrivacyModels();
  const creadoraPrivacyModels = useMemo(() => creadoraData || [], [creadoraData]);

  // Section 2: Top Creators (featured Privacy models with featured_type = 'top_creator')
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

        {/* Section 1: Criadoras em Destaque (groups + Privacy creadora models) */}
        {(featuredModels.length > 0 || creadoraPrivacyModels.length > 0) && (
          <section className="rounded-2xl border border-sky-200 bg-white p-3">
            <div className="mb-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <span className="text-lg">⭐</span>
                Criadoras em <span className="text-primary">Destaque</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
              {featuredLoading || creadoraLoading
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
                    <ModelCard key={`g-${grupo.id}`} grupo={grupo} />
                  ))}
              {creadoraPrivacyModels.map((model) => (
                <CreadoraPrivacyModelCard key={`p-${model.id}`} model={model} />
              ))}
            </div>
          </section>
        )}

        {/* Section 2: Top Creators (featured Privacy models) */}
        {featuredPrivacyModels.length > 0 && (
          <section className="rounded-2xl border border-sky-200 bg-white p-3">
            <div className="mb-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <span className="text-lg">👑</span>
                <span className="text-primary">Top Creators</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
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
        <section className="rounded-2xl border border-sky-200 bg-white p-3">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
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
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
                  {privacyModels.map((model) => (
                    <PrivacyModelCard key={model.id} model={model} />
                  ))}
                </div>
              )}

              {privacyModels.length > 8 && <BannerAd position="middle" />}

              {privacyModels.length > 16 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
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
