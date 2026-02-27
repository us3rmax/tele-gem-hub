import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import MobileSidebar from "@/components/MobileSidebar";
import GroupCard from "@/components/GroupCard";
import { supabase } from "@/integrations/supabase/client";
import type { Grupo } from "@/data/mock";

// Configurações por página
const pageConfigs: Record<string, any> = {
  "/telegram-porno": {
    title: "Telegram Porno - Melhores Canais +18",
    seoTitle: "Telegram Porno - Canais e Grupos +18 | Canais18",
    description:
      "Encontre os melhores canais telegram porno. +100 canais verificados de conteúdo adulto brasileiro. Grátis, atualizado diariamente.",
    keywords: "telegram porno, canais telegram porno, grupos telegram porno",
    filter: "category.ilike.%porno%,category.ilike.%xxx%,category.ilike.%amadoras%",
    categoryLink: "Porno",
  },
  "/putaria-telegram": {
    title: "Putaria Telegram - Grupos e Canais Brasil",
    seoTitle: "Putaria Telegram - Grupos +18 Verificados | Canais18",
    description:
      "Os melhores grupos putaria telegram do Brasil. Conteúdo exclusivo, canais ativos e verificados. Entre grátis nos grupos mais quentes.",
    keywords: "putaria telegram, grupos putaria telegram, telegram putaria brasil",
    filter: "category.ilike.%putaria%,category.ilike.%novinhas%,category.ilike.%amadoras%",
    categoryLink: "Putaria",
  },
  "/telegram-xxx": {
    title: "Telegram XXX - Canais Adultos Verificados",
    seoTitle: "Telegram XXX - Melhores Canais +18 | Canais18",
    description:
      "Canais telegram xxx com conteúdo adulto de qualidade. Milhares de vídeos, fotos e lives. Acesso grátis e imediato.",
    keywords: "telegram xxx, canais telegram xxx, xxx telegram",
    filter: "category.ilike.%xxx%,category.ilike.%porno%",
    categoryLink: "XXX",
  },
  "/grupos-putaria-telegram": {
    title: "Grupos Putaria Telegram - Lista Atualizada",
    seoTitle: "Grupos Putaria Telegram - +100 Grupos Ativos | Canais18",
    description:
      "Lista completa de grupos putaria telegram. Grupos ativos com milhares de membros. Entre grátis e aproveite o melhor conteúdo.",
    keywords: "grupos putaria telegram, lista grupos putaria, grupos telegram putaria",
    filter: "category.ilike.%putaria%,category.ilike.%grupos%",
    categoryLink: "Putaria",
  },
};

const CategoryLanding = () => {
  const location = useLocation();
  const config = pageConfigs[location.pathname] || pageConfigs["/telegram-porno"];

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .or(config.filter)
        .eq("is_premium", false)
        .order("member_count", { ascending: false })
        .limit(12);

      if (!error && data) {
        setGrupos(data as Grupo[]);
      }

      setLoading(false);
    };

    fetchGroups();
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={config.seoTitle}
        description={config.description}
        keywords={config.keywords}
        canonicalUrl={`https://canais18.com${location.pathname}`}
      />

      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={() => {}} activeSort="" />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
        <section className="space-y-4">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{config.title}</h1>

          <div className="prose prose-invert max-w-none">
            <p className="text-base text-muted-foreground leading-relaxed">
              O Telegram se tornou uma das maiores plataformas para conteúdo adulto no Brasil. Com milhões de usuários
              ativos, a rede oferece privacidade, segurança e uma variedade impressionante de canais dedicados a
              entretenimento adulto.
            </p>

            <p className="text-base text-muted-foreground leading-relaxed">
              Nossa seleção inclui os melhores canais, cuidadosamente verificados pela nossa equipe. Conteúdo amador
              brasileiro, produções profissionais em HD, lives exclusivas e muito mais.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">🔥 Canais em Destaque</h2>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-card" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {grupos.map((grupo) => (
                  <GroupCard key={grupo.id} grupo={grupo} />
                ))}
              </div>

              <div className="flex justify-center pt-4">
                <Link
                  to={`/?category=${config.categoryLink}`}
                  className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Ver Todos os Canais
                </Link>
              </div>
            </>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">📂 Categorias Relacionadas</h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            <Link
              to="/telegram-porno"
              className="rounded-lg border border-border bg-card p-4 text-center transition-colors hover:bg-card/80"
            >
              <span className="font-semibold text-foreground">Telegram Porno</span>
            </Link>
            <Link
              to="/putaria-telegram"
              className="rounded-lg border border-border bg-card p-4 text-center transition-colors hover:bg-card/80"
            >
              <span className="font-semibold text-foreground">Putaria Telegram</span>
            </Link>
            <Link
              to="/telegram-xxx"
              className="rounded-lg border border-border bg-card p-4 text-center transition-colors hover:bg-card/80"
            >
              <span className="font-semibold text-foreground">Telegram XXX</span>
            </Link>
            <Link
              to="/grupos-putaria-telegram"
              className="rounded-lg border border-border bg-card p-4 text-center transition-colors hover:bg-card/80"
            >
              <span className="font-semibold text-foreground">Grupos Putaria</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CategoryLanding;
