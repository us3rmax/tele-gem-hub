import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MobileSidebar from "@/components/MobileSidebar";
import GroupCard from "@/components/GroupCard";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import type { Grupo } from "@/data/mock";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

const benefits = [
  {
    icon: "✅",
    title: "Verificados Diariamente",
    desc: "Todos os grupos são revisados diariamente para garantir que os links ainda estão ativos e o conteúdo é de qualidade.",
  },
  {
    icon: "🆓",
    title: "100% Gratuito",
    desc: "Acesso totalmente gratuito ao diretório. Sem cadastro obrigatório para visualizar os grupos.",
  },
  {
    icon: "🔒",
    title: "Seguro e Privado",
    desc: "Navegue com segurança. Não coletamos dados pessoais e todos os links são verificados antes de publicação.",
  },
];

const faqs = [
  {
    q: "Como entrar nos grupos do Telegram?",
    a: "Basta clicar no botão 'Entrar' em qualquer grupo listado. Você será redirecionado diretamente para o grupo no Telegram. Se não tiver o app instalado, faça o download gratuito na App Store ou Google Play.",
  },
  {
    q: "Os grupos do Telegram são gratuitos?",
    a: "Sim! Todos os grupos listados no Canais18 são de acesso gratuito. Basta clicar e entrar diretamente pelo Telegram, sem pagar nada.",
  },
  {
    q: "Como enviar meu grupo para o diretório?",
    a: "Acesse a página de envio e preencha o formulário com as informações do seu grupo. Nossa equipe analisa e aprova em até 48 horas.",
  },
  {
    q: "Os links são atualizados com frequência?",
    a: "Sim, verificamos e atualizamos os links diariamente para garantir que todos estejam funcionando corretamente.",
  },
];

const GruposTelegram = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      const { data } = await supabase
        .from("groups")
        .select("*")
        .order("member_count", { ascending: false })
        .limit(12);
      setGrupos((data as Grupo[]) || []);
      setLoading(false);
    };
    fetchGroups();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Grupos Telegram - 151+ Canais | Canais18"
        description="Encontre os melhores grupos do Telegram. +151 canais verificados. Entre agora!"
        keywords="grupos telegram, canais telegram, grupos telegram brasil, entrar grupos telegram"
        canonicalUrl="https://www.canais18.com/grupos-telegram"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Grupos Telegram - Canais18",
          description: "Diretório com os melhores grupos do Telegram verificados.",
          url: "https://www.canais18.com/grupos-telegram",
          inLanguage: "pt-BR",
          mainEntity: {
            "@type": "ItemList",
            name: "Grupos do Telegram",
            numberOfItems: 151,
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
          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            Melhores Grupos do Telegram
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            O <strong className="text-foreground">Canais18</strong> é o maior diretório de grupos
            do Telegram do Brasil. Reunimos mais de <strong className="text-foreground">151 grupos verificados</strong>,
            organizados por categoria, para você encontrar exatamente o que procura de forma rápida e segura.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Todos os grupos passam por verificação manual antes de serem publicados. Nosso time revisa
            diariamente os links para garantir que estejam ativos. Navegue pelo diretório, filtre por
            categoria e entre direto no Telegram com um clique — sem cadastro, sem complicação.
          </p>
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

        {/* Featured Groups */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">🔥 Grupos em Destaque</h2>

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
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {grupos.map((grupo) => (
                <GroupCard key={grupo.id} grupo={grupo} />
              ))}
            </div>
          )}
        </section>

        {/* Benefits */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Por que usar o Canais18?</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-border bg-card p-5 space-y-2"
              >
                <div className="text-2xl">{b.icon}</div>
                <h3 className="font-semibold text-foreground">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-border bg-card p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-foreground">
            Explore Todos os Grupos do Telegram
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Navegue pelo nosso diretório completo com mais de 151 grupos verificados, filtrados
            por categoria.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Ver Todos os Grupos
            </Link>
            <Link
              to="/categorias"
              className="rounded-lg border border-border bg-background px-6 py-2.5 text-sm font-bold text-foreground hover:bg-secondary transition-colors"
            >
              Ver Categorias
            </Link>
          </div>
        </section>

        {/* Internal links to categories */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">Categorias Populares</h2>
          <div className="flex flex-wrap gap-2">
            {["Novinhas", "Amadoras", "Vazados", "Onlyfans", "Pack", "Lésbicas", "Cornos"].map(
              (cat) => (
                <Link
                  key={cat}
                  to={`/categorias/${encodeURIComponent(cat)}`}
                  className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  {cat}
                </Link>
              )
            )}
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-4 max-w-2xl">
          <h2 className="text-xl font-bold text-foreground">Perguntas Frequentes</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-foreground hover:bg-secondary/50 transition-colors"
                >
                  {faq.q}
                  {openFaq === i ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
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

export default GruposTelegram;
