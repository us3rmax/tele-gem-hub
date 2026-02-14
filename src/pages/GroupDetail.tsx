import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Send, Users, Star, CheckCircle, Clock, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileSidebar from "@/components/MobileSidebar";
import BannerAd from "@/components/BannerAd";
import GroupCard from "@/components/GroupCard";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { extractIdFromSlug } from "@/lib/slug";
import type { Grupo } from "@/data/mock";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Há ${mins} minutos`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Há ${hrs} horas`;
  const days = Math.floor(hrs / 24);
  return `Há ${days} dias`;
}

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
  const navigate = useNavigate();
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [related, setRelated] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sort, setSort] = useState("recentes");

  useEffect(() => {
    if (!slug) return;
    const groupId = extractIdFromSlug(slug);
    const fetchGroup = async () => {
      setLoading(true);
      setNotFound(false);

      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setGrupo(data as Grupo);

      // Increment views
      void supabase.rpc("increment_views", { group_id: data.id });

      // Fetch related
      const { data: relatedData } = await supabase
        .from("groups")
        .select("*")
        .eq("category", data.category)
        .neq("id", data.id)
        .limit(8);

      if (relatedData) {
        // Shuffle
        const shuffled = relatedData.sort(() => Math.random() - 0.5);
        setRelated(shuffled as Grupo[]);
      }

      setLoading(false);
    };

    fetchGroup();
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
          <Skeleton className="h-40 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  if (notFound || !grupo) {
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={setSort} activeSort={sort} />

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-foreground">TGIndex</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            to={`/?category=${encodeURIComponent(grupo.category)}`}
            className="transition-colors hover:text-foreground"
          >
            {grupo.category}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate text-foreground">{grupo.name}</span>
        </nav>

        <BannerAd />

        {/* Hero Section */}
        <section className="space-y-4">
          {/* Cover */}
          <div className="mx-auto w-full max-w-[400px]">
            <div className="relative aspect-square overflow-hidden rounded-xl border border-border">
              {grupo.thumbnail_url ? (
                <img
                  src={grupo.thumbnail_url}
                  alt={grupo.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${placeholderBg}`}>
                  <span className="text-7xl font-bold text-white/60 sm:text-8xl">
                    {grupo.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">{grupo.name}</h1>

            <span className="inline-block rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {grupo.category}
            </span>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" /> {formatMembers(grupo.member_count)} membros
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> {timeAgo(grupo.created_at)}
              </span>
            </div>

            {(grupo.is_premium || grupo.is_verified) && (
              <div className="flex items-center gap-2">
                {grupo.is_premium && (
                  <span className="flex items-center gap-1 rounded-md bg-yellow-500/20 px-2.5 py-1 text-xs font-bold uppercase text-yellow-500">
                    <Star className="h-3.5 w-3.5" /> Premium
                  </span>
                )}
                {grupo.is_verified && (
                  <span className="flex items-center gap-1 rounded-md bg-blue-500/20 px-2.5 py-1 text-xs font-bold uppercase text-blue-500">
                    <CheckCircle className="h-3.5 w-3.5" /> Verificado
                  </span>
                )}
              </div>
            )}

            {/* CTA */}
            <a
              href={grupo.telegram_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-14 w-full max-w-md items-center justify-center gap-2 rounded-lg bg-primary text-base font-bold uppercase text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Send className="h-5 w-5" />
              Entrar no Grupo
            </a>
          </div>
        </section>

        {/* Description */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-card-foreground">📝 Sobre o grupo</h2>
          {grupo.description ? (
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{grupo.description}</p>
          ) : (
            <p className="mt-3 text-base italic text-muted-foreground">Sem descrição disponível</p>
          )}
        </section>

        {/* Related Groups */}
        {related.length > 0 && (
          <section className="space-y-4">
            <div>
            <h2 className="text-xl font-bold text-foreground">🔗 Grupos Relacionados de {grupo.category}</h2>
              <p className="text-sm text-muted-foreground">Outros grupos que você pode gostar</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {related.map((g) => (
                <GroupCard key={g.id} grupo={g} />
              ))}
            </div>
          </section>
        )}

        <BannerAd />
      </main>
    </div>
  );
};

export default GroupDetail;
