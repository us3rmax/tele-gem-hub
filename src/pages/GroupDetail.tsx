import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Send, Users, Star, ChevronRight, Eye } from "lucide-react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { groupPath } from "@/lib/slug";
import MobileSidebar from "@/components/MobileSidebar";
import BannerAd from "@/components/BannerAd";
import GroupCard from "@/components/GroupCard";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useGroupDetail, useRelatedGroups } from "@/hooks/use-groups";

function formatMembers(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toString();
}

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

const GroupDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sort, setSort] = useState("recentes");

  const { data: grupo, isLoading: loading, isError } = useGroupDetail(slug);
  const { data: related = [] } = useRelatedGroups(grupo?.category, grupo?.id);

  useEffect(() => {
    if (grupo?.id) {
      supabase.from("groups").update({ views: (grupo.views || 0) + 1 }).eq("id", grupo.id).then(() => {});
    }
  }, [grupo?.id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  const placeholderBg = grupo
    ? categoryColors[grupo.category] || "from-gray-500 to-gray-700"
    : "from-gray-500 to-gray-700";

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={setSort} activeSort={sort} />
        <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="aspect-video w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-14 w-full max-w-md" />
          </div>
        </main>
      </div>
    );
  }

  if (isError || !grupo) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={setSort} activeSort={sort} />
        <div className="flex flex-col items-center justify-center py-32">
          <p className="text-xl font-semibold text-muted-foreground">Grupo não encontrado</p>
          <Link to="/" className="mt-4 text-primary hover:underline">
            Voltar para o início
          </Link>
        </div>
      </div>
    );
  }

  const seoDescription = grupo.description
    ? grupo.description.slice(0, 155) + (grupo.description.length > 155 ? "..." : "")
    : `Entre no canal ${grupo.name} do Telegram. ${formatMembers(grupo.member_count)} membros ativos. Categoria: ${grupo.category}. Conteúdo exclusivo 18+ atualizado.`;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${grupo.name} — Grupo Telegram +18 | Canais18`}
        description={seoDescription}
        keywords={`canal telegram 18, ${grupo.category.toLowerCase()}, ${grupo.name}, telegram ${grupo.category.toLowerCase()}`}
        ogImage={grupo.thumbnail_url || undefined}
        ogType="article"
        canonicalUrl={`https://www.canais18.com${groupPath(grupo)}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${grupo.name} — Canal Telegram ${grupo.category} 18+`,
          description: seoDescription,
          url: `https://www.canais18.com${groupPath(grupo)}`,
          image: grupo.thumbnail_url || undefined,
          datePublished: grupo.created_at,
          dateModified: grupo.created_at,
          mainEntity: {
            "@type": "OnlineCommunity",
            name: grupo.name,
            description: seoDescription,
            url: grupo.telegram_link,
            numberOfMembers: grupo.member_count,
            ...(grupo.thumbnail_url ? { image: grupo.thumbnail_url } : {}),
            "@context": "https://schema.org",
          },
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Canais18", item: "https://www.canais18.com" },
              { "@type": "ListItem", position: 2, name: grupo.category, item: `https://www.canais18.com/?category=${encodeURIComponent(grupo.category)}` },
              { "@type": "ListItem", position: 3, name: grupo.name, item: `https://www.canais18.com${groupPath(grupo)}` },
            ],
          },
          publisher: {
            "@type": "Organization",
            name: "Canais18",
            logo: { "@type": "ImageObject", url: "https://www.canais18.com/logo.png" },
          },
        }}
      />
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={setSort} activeSort={sort} />

      <main className="mx-auto max-w-3xl space-y-3 px-4 py-2 sm:space-y-6 sm:py-4">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-foreground">Canais18</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to={`/?category=${encodeURIComponent(grupo.category)}`} className="transition-colors hover:text-foreground">
            {grupo.category}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate text-foreground">{grupo.name}</span>
        </nav>

        <BannerAd position="top" />

        <section className="space-y-2 sm:space-y-4">
          <div className="mx-auto w-full max-w-[140px] sm:max-w-[400px]">
            <div className="relative aspect-square overflow-hidden rounded-xl border border-border">
              {grupo.thumbnail_url ? (
                <img
                  src={grupo.thumbnail_url}
                  alt={`${grupo.name} - Canal Telegram ${grupo.category} 18+ | Canais18`}
                  width={400}
                  height={400}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              ) : (
                <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${placeholderBg}`}>
                  <span className="text-7xl font-bold text-white/60 sm:text-8xl">{grupo.name.charAt(0)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-3">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">{grupo.name}</h1>
            <span className="inline-block rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {grupo.category}
            </span>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" /> {formatMembers(grupo.member_count)} membros
              </span>
              {!!grupo.views && (
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" /> {formatMembers(grupo.views)} visualizações
                </span>
              )}
            </div>
            {grupo.is_premium && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-md bg-yellow-500/20 px-2.5 py-1 text-xs font-bold uppercase text-yellow-500">
                  <Star className="h-3.5 w-3.5" /> Premium
                </span>
              </div>
            )}
            
              <a
                href={grupo.telegram_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-14 w-full max-w-md items-center justify-center gap-2 rounded-lg bg-primary text-base font-bold uppercase text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Send className="h-5 w-5" />
              Entrar no Canal
            </a>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-card-foreground">Sobre o Canal</h2>
          {grupo.description ? (
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{grupo.description}</p>
          ) : (
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              {`Canal de Telegram na categoria ${grupo.category} com ${formatMembers(grupo.member_count)} membros ativos. `}
              {`Encontre conteúdo ${grupo.category.toLowerCase()} atualizado diariamente neste grupo público do Telegram. `}
              {`Acesse o link direto acima para participar do canal e receber conteúdo exclusivo.`}
            </p>
          )}
        </section>

        <BannerAd position="middle" />

        {related.length > 0 && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Canais Relacionados de {grupo.category}</h2>
              <p className="text-sm text-muted-foreground">Mais canais de {grupo.category} que você pode gostar</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {related.map((g) => (
                <GroupCard key={g.id} grupo={g} />
              ))}
            </div>
          </section>
        )}

        {/* Internal linking section — helps Google crawl and understand site structure */}
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-card-foreground">Explorar Categorias</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Navegue pelas categorias do Canais18 para encontrar mais grupos do Telegram: {' '}
            <Link to="/?category=Putaria" className="text-primary hover:underline">Putaria</Link>{', '}
            <Link to="/?category=Novinhas" className="text-primary hover:underline">Novinhas</Link>{', '}
            <Link to="/?category=Amadoras" className="text-primary hover:underline">Amadoras</Link>{', '}
            <Link to="/?category=Vazados" className="text-primary hover:underline">Vazados</Link>{', '}
            <Link to="/?category=Onlyfans" className="text-primary hover:underline">OnlyFans</Link>{', '}
            <Link to="/telegram-putaria" className="text-primary hover:underline">Grupos Telegram</Link>
          </p>
        </section>

        <BannerAd position="bottom" />
      </main>
    </div>
  );
};

export default GroupDetail;
