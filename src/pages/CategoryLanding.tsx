import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MobileSidebar from "@/components/MobileSidebar";
import GroupCard from "@/components/GroupCard";
import SEO from "@/components/SEO";
import { supabase } from "@/lib/supabase";
import type { Grupo } from "@/data/mock";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CategoryConfig {
  title: string;
  h1: string;
  description: string;
  keywords: string;
  intro: string;
  faqs: { q: string; a: string }[];
}

const defaultConfig = (category: string): CategoryConfig => ({
  title: `Grupos Telegram ${category} | Canais18`,
  h1: `Grupos Telegram ${category}`,
  description: `Encontre os melhores grupos de ${category} no Telegram. Canais verificados. Entre agora!`,
  keywords: `grupos telegram ${category.toLowerCase()}, telegram ${category.toLowerCase()}, canais ${category.toLowerCase()}`,
  intro: `Navegue pelo maior diretório de grupos de <strong>${category}</strong> do Telegram. Todos os grupos são verificados manualmente antes de serem publicados. Clique e entre diretamente no Telegram, sem cadastro.`,
  faqs: [
    {
      q: `Como entrar nos grupos de ${category} no Telegram?`,
      a: "Basta clicar no botão 'Entrar' em qualquer grupo listado. Você será redirecionado diretamente para o grupo no Telegram.",
    },
    {
      q: "Os grupos são gratuitos?",
      a: "Sim! Todos os grupos listados são de acesso gratuito. Basta clicar e entrar diretamente pelo Telegram.",
    },
    {
      q: "Como enviar meu grupo para o diretório?",
      a: "Acesse a página de envio e preencha o formulário. Nossa equipe analisa e aprova em até 48 horas.",
    },
    {
      q: "Os links são atualizados com frequência?",
      a: "Sim, verificamos e atualizamos os links diariamente para garantir que todos estejam funcionando.",
    },
  ],
});

interface CategoryLandingProps {
  /** Override the URL param with a fixed category */
  category?: string;
  /** Custom SEO/content config — falls back to auto-generated if not provided */
  config?: Partial<CategoryConfig>;
}

const CategoryLanding = ({ category: propCategory, config: propConfig }: CategoryLandingProps) => {
  const { category: paramCategory } = useParams<{ category: string }>();
  const rawCategory = propCategory || paramCategory || "Telegram";
  const category = decodeURIComponent(rawCategory);

  const base = defaultConfig(category);
  const config: CategoryConfig = { ...base, ...propConfig };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      const query = supabase
        .from("groups")
        .select("*")
        .order("member_count", { ascending: false })
        .limit(12);

      // If we have a real category (not generic), filter by it
      if (category && category !== "Telegram") {
        query.eq("category", category);
      }

      const { data } = await query;
      setGrupos((data as Grupo[]) || []);
      setLoading(false);
    };
    fetchGroups();
  }, [category]);

  const canonicalSlug = category.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={config.title}
        description={config.description}
        keywords={config.keywords}
        canonicalUrl={`https://canais18.com/grupos/${canonicalSlug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: config.title,
          description: config.description,
          url: `https://canais18.com/grupos/${canonicalSlug}`,
          inLanguage: "pt-BR",
          mainEntity: {
            "@type": "ItemList",
            name: `Grupos ${category} Telegram`,
            numberOfItems: grupos.length,
          },
        }}
      />

      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSort={() => {}}
        activeSort="hot"
      />

      <main className="mx-auto max-w-[1200px] px-4 py-8 space-y-12">

        {/* H1 + Intro */}
        <section className="space-y-4 max-w-3xl">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Canais18</Link>
            <span>/</span>
            <Link to="/grupos-telegram" className="hover:text-foreground transition-colors">Grupos Telegram</Link>
            <span>/</span>
            <span className="text-foreground">{category}</span>
          </nav>

          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            {config.h1}
          </h1>
          <p
            className="text-muted-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: config.intro }}
          />
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Ver todos os grupos
            </Link>
            <Link
              to="/submit"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              Enviar meu grupo
            </Link>
          </div>
        </section>

        {/* Groups Grid */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">
            🔥 Grupos de {category} em Destaque
          </h2>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <Skeleton className="h-32 w-full sm:h-36" />
                  <div className="space-y-2 p-3 sm:p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : grupos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {grupos.map((grupo) => (
                <GroupCard key={grupo.id} grupo={grupo} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
              Nenhum grupo encontrado nesta categoria ainda.
            </div>
          )}
        </section>

        {/* Benefits */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: "✅", title: "Verificados Diariamente", desc: "Links checados todos os dias para garantir que estão ativos e funcionando." },
            { icon: "🆓", title: "100% Gratuito", desc: "Sem cadastro obrigatório. Acesse todos os grupos de graça." },
            { icon: "🔒", title: "Seguro e Privado", desc: "Não coletamos dados pessoais. Todos os links são verificados antes da publicação." },
          ].map((b) => (
            <div key={b.title} className="rounded-2xl border border-border bg-card p-5 space-y-2">
              <div className="text-2xl">{b.icon}</div>
              <h3 className="font-semibold text-foreground">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-border bg-card p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-foreground">
            Explore Todos os Grupos do Telegram
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Navegue pelo diretório completo com grupos verificados, filtrados por categoria.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Ver Todos os Grupos
            </Link>
            <Link
              to="/grupos-telegram"
              className="rounded-lg border border-border bg-background px-6 py-2.5 text-sm font-bold text-foreground hover:bg-secondary transition-colors"
            >
              Grupos Telegram
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-4 max-w-2xl">
          <h2 className="text-xl font-bold text-foreground">Perguntas Frequentes</h2>
          <div className="space-y-2">
            {config.faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-foreground hover:bg-secondary/50 transition-colors"
                >
                  {faq.q}
                  {openFaq === i
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
};

export default CategoryLanding;
