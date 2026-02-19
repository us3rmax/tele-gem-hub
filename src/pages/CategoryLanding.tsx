import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import MobileSidebar from "@/components/MobileSidebar";
import GroupCard from "@/components/GroupCard";
import { supabase } from "@/lib/supabase";
import type { Grupo } from "@/data/mock";

const CategoryLanding = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .or("category.ilike.%porno%,category.ilike.%xxx%,category.ilike.%amadoras%")
        .eq("is_premium", false)
        .order("member_count", { ascending: false })
        .limit(12);

      if (!error && data) {
        setGrupos(data as Grupo[]);
      }

      setLoading(false);
    };

    fetchGroups();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Telegram Porno - Canais e Grupos +18 | Canais18"
        description="Encontre os melhores canais telegram porno. +100 canais verificados de conteúdo adulto brasileiro. Grátis, atualizado diariamente. Entre agora!"
        keywords="telegram porno, canais telegram porno, grupos telegram porno, telegram porno brasil, porno telegram gratis"
        canonicalUrl="https://canais18.com/telegram-porno"
      />

      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={() => {}} activeSort="" />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
        <section className="space-y-4">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Telegram Porno - Melhores Canais +18</h1>

          <div className="prose prose-invert max-w-none">
            <p className="text-base text-muted-foreground leading-relaxed">
              O Telegram se tornou uma das maiores plataformas para conteúdo adulto no Brasil. Com milhões de usuários
              ativos, a rede oferece privacidade, segurança e uma variedade impressionante de canais dedicados a
              entretenimento adulto.
            </p>

            <p className="text-base text-muted-foreground leading-relaxed">
              Aqui você encontra os <strong>melhores canais telegram porno</strong>, cuidadosamente selecionados e
              verificados pela nossa equipe. Nossa seleção inclui canais de diversas categorias: conteúdo amador
              brasileiro, produções profissionais em HD, lives exclusivas e muito mais.
            </p>

            <p className="text-base text-muted-foreground leading-relaxed">
              Todos os links são testados diariamente para garantir que estejam funcionais. Os canais são atualizados
              constantemente com novo conteúdo, proporcionando sempre novidades para os assinantes. A maioria é{" "}
              <strong>100% gratuita</strong>, sem necessidade de pagamento ou assinatura.
            </p>

            <p className="text-base text-muted-foreground leading-relaxed">
              <strong>Segurança e Privacidade:</strong> O Telegram oferece criptografia de ponta a ponta, garantindo que
              suas atividades permaneçam privadas. Você pode navegar pelos canais com tranquilidade, sabendo que sua
              identidade está protegida.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">🔥 Canais Telegram Porno em Destaque</h2>

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
                  to="/?category=Porno"
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
              to="/telegram-xxx"
              className="rounded-lg border border-border bg-card p-4 text-center transition-colors hover:bg-card/80"
            >
              <span className="font-semibold text-foreground">Telegram XXX</span>
            </Link>

            <Link
              to="/putaria-telegram"
              className="rounded-lg border border-border bg-card p-4 text-center transition-colors hover:bg-card/80"
            >
              <span className="font-semibold text-foreground">Putaria Telegram</span>
            </Link>

            <Link
              to="/grupos-putaria-telegram"
              className="rounded-lg border border-border bg-card p-4 text-center transition-colors hover:bg-card/80"
            >
              <span className="font-semibold text-foreground">Grupos Putaria</span>
            </Link>

            <Link
              to="/?category=Novinhas"
              className="rounded-lg border border-border bg-card p-4 text-center transition-colors hover:bg-card/80"
            >
              <span className="font-semibold text-foreground">Novinhas</span>
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">❓ Perguntas Frequentes</h2>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-2 text-lg font-semibold text-foreground">Como entrar em canais telegram porno?</h3>
              <p className="text-muted-foreground">
                Basta clicar no canal desejado acima e você será redirecionado para o Telegram. Clique em "Entrar no
                Canal" e pronto! O conteúdo estará disponível imediatamente.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                É seguro usar telegram para conteúdo adulto?
              </h3>
              <p className="text-muted-foreground">
                Sim! O Telegram oferece criptografia de ponta a ponta e não compartilha seus dados com terceiros. Sua
                privacidade está garantida ao acessar os canais.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-2 text-lg font-semibold text-foreground">Canais telegram porno são grátis?</h3>
              <p className="text-muted-foreground">
                A maioria dos canais listados é 100% gratuita. Alguns canais premium podem cobrar uma taxa de
                assinatura, mas isso é claramente indicado.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-2 text-lg font-semibold text-foreground">Como achar novos canais telegram porno?</h3>
              <p className="text-muted-foreground">
                Nosso site é atualizado diariamente com novos canais. Você também pode se cadastrar e enviar sugestões
                de canais para serem adicionados ao diretório.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
