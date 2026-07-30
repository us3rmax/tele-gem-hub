import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import GroupCard from "@/components/GroupCard";
import MobileSidebar from "@/components/MobileSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Group {
  id: string;
  slug: string | null;
  name: string;
  telegram_link: string;
  description: string | null;
  member_count: number;
  thumbnail_url: string | null;
  category: string | null;
}

// Map platform to database category for fallback
const PLATFORM_CATEGORY: Record<string, string> = {
  "OnlyFans": "onlyfans",
  "Privacy": "privacy",
  "Erome": "celebridades",
  "Erome/Privacy": "privacy",
};

const MODELS: Record<string, { displayName: string; platform: string; description: string }> = {
  "nayzinha": { displayName: "Nayzinha", platform: "OnlyFans", description: "Nayzinha — conteúdo exclusivo vazado do OnlyFans no Telegram. Grupos verificados com material da criadora." },
  "dra-sophia": { displayName: "Dra. Sophia", platform: "Privacy", description: "Dra. Sophia — conteúdo exclusivo vazado do Privacy no Telegram. Grupos verificados com material da criadora." },
  "bia-albina": { displayName: "Bia Albina", platform: "Privacy", description: "Bia Albina — conteúdo exclusivo vazado do Privacy no Telegram. Grupos verificados com material da criadora." },
  "michele-umezu": { displayName: "Michele Umezu", platform: "OnlyFans", description: "Michele Umezu — conteúdo exclusivo vazado do OnlyFans no Telegram. Grupos verificados." },
  "cosvickye": { displayName: "Cosvickye", platform: "Erome", description: "Cosvickye — conteúdo do Erome disponível no Telegram. Grupos verificados." },
  "privacy-bad-mi": { displayName: "Bad Mi", platform: "Privacy", description: "Bad Mi — conteúdo exclusivo vazado do Privacy no Telegram. Grupos verificados." },
  "erome-nicole-rodrigues": { displayName: "Nicole Rodrigues", platform: "Erome", description: "Nicole Rodrigues — conteúdo do Erome disponível no Telegram. Grupos verificados." },
  "nyvi-estephan": { displayName: "Nyvi Estephan", platform: "Erome", description: "Nyvi Estephan — conteúdo do Erome disponível no Telegram. Grupos verificados." },
  "jenifer-novaki": { displayName: "Jenifer Novaki", platform: "Privacy", description: "Jenifer Novaki — conteúdo exclusivo vazado do Privacy no Telegram. Grupos verificados." },
  "camila-prado": { displayName: "Camila Prado", platform: "Privacy", description: "Camila Prado — conteúdo exclusivo vazado do Privacy no Telegram. Grupos verificados." },
  "mae-e-filha": { displayName: "Mãe e Filha", platform: "Erome", description: "Mãe e Filha — conteúdo do Erome disponível no Telegram. Grupos verificados." },
  "erome-juliana-silva": { displayName: "Juliana Silva", platform: "Erome", description: "Juliana Silva — conteúdo do Erome disponível no Telegram. Grupos verificados." },
  "erome-gostosa": { displayName: "Gostosa", platform: "Erome", description: "Gostosa — conteúdo do Erome disponível no Telegram. Grupos verificados." },
  "erome-privacy": { displayName: "Privacy Erome", platform: "Erome", description: "Privacy Erome — conteúdo disponível no Telegram. Grupos verificados." },
  "nayara": { displayName: "Nayara", platform: "Erome", description: "Nayara — conteúdo do Erome disponível no Telegram. Grupos verificados." },
  "privacy-display-apk": { displayName: "Display APK", platform: "Privacy", description: "Display APK — conteúdo exclusivo vazado do Privacy no Telegram. Grupos verificados." },
};

export default function ModeloDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  const model = useMemo(() => {
    if (!slug) return null;
    const m = MODELS[slug];
    if (m) return m;
    return {
      displayName: slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      platform: "Telegram",
      description: `Conteúdo de ${slug.replace(/-/g, " ")} no Telegram. Grupos verificados.`,
    };
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function fetchGroups() {
      setLoading(true);
      try {
        const modelName = slug.replace(/-/g, " ");
        const categoryPrefix = `modelo_${slug.replace(/-/g, "_")}`;

        // Tentativa 1: buscar por category com prefixo "modelo_"
        const { data: data1, error: err1 } = await supabase
          .from("groups")
          .select("id, slug, name, telegram_link, description, member_count, thumbnail_url, category")
          .eq("hidden", false)
          .not("thumbnail_url", "is", null)
          .eq("category", categoryPrefix)
          .order("member_count", { ascending: false })
          .limit(30);

        if (!err1 && data1 && data1.length > 0) {
          if (!cancelled) { setGroups(data1 as Group[]); return; }
        }

        // Tentativa 2: buscar pelo nome no campo name (ilike)
        const { data: data2, error: err2 } = await supabase
          .from("groups")
          .select("id, slug, name, telegram_link, description, member_count, thumbnail_url, category")
          .eq("hidden", false)
          .not("thumbnail_url", "is", null)
          .ilike("name", `%${modelName}%`)
          .order("member_count", { ascending: false })
          .limit(30);

        if (!err2 && data2 && data2.length > 0) {
          if (!cancelled) { setGroups(data2 as Group[]); return; }
        }

        // FALLBACK: buscar grupos da categoria da plataforma (OnlyFans, Privacy, etc.)
        const m = MODELS[slug] || { platform: "Telegram" };
        const fallbackCategory = PLATFORM_CATEGORY[m.platform] || "onlyfans";
        const { data: data3, error: err3 } = await supabase
          .from("groups")
          .select("id, slug, name, telegram_link, description, member_count, thumbnail_url, category")
          .eq("hidden", false)
          .not("thumbnail_url", "is", null)
          .eq("category", fallbackCategory)
          .order("member_count", { ascending: false })
          .limit(30);

        if (!err3 && data3) {
          if (!cancelled) { setGroups(data3 as Group[]); return; }
        }

        if (!cancelled) {
          setGroups(data1 || data2 || data3 || []);
        }
      } catch (e) {
        console.error("Erro ao buscar grupos do modelo:", e);
        toast({ title: "Erro ao carregar grupos", variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchGroups();
    return () => { cancelled = true; };
  }, [slug, toast]);

  if (!slug || !model) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Modelo não encontrado.</p>
      </div>
    );
  }

  const h1 = `${model.displayName} Telegram: Conteúdo de ${model.platform}`;
  const canonicalUrl = `https://www.canais18.com/modelo/${slug}`;

  // JSON-LD @graph
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.canais18.com/#website",
        "name": "Canais18",
        "url": "https://www.canais18.com",
        "description": "Maior diretório de grupos e canais adultos do Telegram no Brasil.",
        "inLanguage": "pt-BR",
        "publisher": { "@id": "https://www.canais18.com/#organization" }
      },
      {
        "@type": "Organization",
        "@id": "https://www.canais18.com/#organization",
        "name": "Canais18",
        "url": "https://www.canais18.com",
        "logo": { "@type": "ImageObject", "url": "https://www.canais18.com/logo.png" },
        "sameAs": []
      },
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        "url": canonicalUrl,
        "name": h1,
        "description": model.description,
        "isPartOf": { "@id": "https://www.canais18.com/#website" },
        "about": {
          "@type": "Person",
          "name": model.displayName,
          "url": canonicalUrl
        },
        "numberOfItems": groups.filter(g => g.name && g.telegram_link).length,
        "itemListElement": groups.filter(g => g.name && g.telegram_link).slice(0, 10).map((g, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "name": g.name,
          "url": `https://www.canais18.com/group/${g.slug || g.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
        }))
      },
      {
        "@type": "Person",
        "@id": `${canonicalUrl}#person`,
        "name": model.displayName,
        "description": `Criadora de conteúdo adulto. Conteúdo disponível no Telegram com ${groups.length} grupos verificados.`,
        "url": canonicalUrl
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Início", "item": "https://www.canais18.com" },
          { "@type": "ListItem", "position": 2, "name": "Modelos", "item": "https://www.canais18.com/modelos" },
          { "@type": "ListItem", "position": 3, "name": model.displayName, "item": canonicalUrl }
        ]
      }
    ]
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `Onde encontrar conteúdo de ${model.displayName} no Telegram?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `O Canais18 reúne ${groups.length} grupos verificados com conteúdo de ${model.displayName}. Todos os links são testados diariamente.`
        }
      },
      {
        "@type": "Question",
        "name": "O conteúdo é gratuito?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sim, todos os grupos listados no Canais18 são de acesso gratuito."
        }
      },
      {
        "@type": "Question",
        "name": "Os links estão funcionando?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Sim. Nossa equipe verifica diariamente cada link dos grupos de ${model.displayName}.`
        }
      }
    ]
  };

  const totalMembers = groups.reduce((sum, g) => sum + (g.member_count || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${h1} | Canais18`}
        description={model.description}
        canonicalUrl={canonicalUrl}
        jsonLd={jsonLd}
        faqJsonLd={faqJsonLd}
      />

      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="max-w-[1100px] mx-auto px-3 pt-16">
        {/* Hero */}
        <header className="text-center py-5">
          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">{h1}</h1>
          <p className="text-primary font-semibold text-sm mt-1">{model.platform}</p>
          <p className="text-muted-foreground text-sm mt-2 max-w-lg mx-auto">{model.description}</p>
          
          {/* Stats bar */}
          <div className="flex gap-4 justify-center mt-3 flex-wrap">
            <div className="bg-card px-4 py-2 rounded-lg border border-border">
              <strong className="text-primary text-lg">{groups.length}</strong>
              <span className="text-muted-foreground text-xs ml-2">grupos</span>
            </div>
            <div className="bg-card px-4 py-2 rounded-lg border border-border">
              <strong className="text-primary text-lg">{totalMembers.toLocaleString("pt-BR")}</strong>
              <span className="text-muted-foreground text-xs ml-2">membros</span>
            </div>
            <div className="bg-card px-4 py-2 rounded-lg border border-border">
              <strong className="text-primary text-lg">100%</strong>
              <span className="text-muted-foreground text-xs ml-2">verificados</span>
            </div>
          </div>
        </header>

        {/* SEO intro */}
        <section className="text-muted-foreground text-sm leading-relaxed my-5 bg-muted/30 p-5 rounded-xl border border-border">
          <p>
            Encontre <strong>grupos de {model.displayName} no Telegram</strong> com conteúdo exclusivo de <strong>{model.platform}</strong>. 
            Nossa equipe verifica links diariamente para garantir que você tenha acesso aos melhores canais com segurança. 
            Explore a lista abaixo e entre nos grupos mais ativos.
          </p>
        </section>

        {/* Groups grid */}
        <h2 className="text-lg font-extrabold flex items-center gap-2 mt-8 mb-4">
          <span className="w-1 h-5 bg-primary rounded-full inline-block"></span>
          Grupos de {model.displayName} em Destaque
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum grupo encontrado para este modelo no momento.</p>
            <p className="text-sm mt-2">Tente novamente mais tarde.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 mt-3">
            {groups.map((grupo) => (
              <GroupCard key={grupo.id} grupo={grupo as any} hideBadges />
            ))}
          </div>
        )}

        {/* SEO footer */}
        <section className="text-sm leading-relaxed mt-10 pt-5 border-t border-border text-muted-foreground">
          <h3 className="font-bold mb-2">Como entrar nos grupos de {model.displayName}?</h3>
          <p>
            Para entrar em qualquer <strong>canal do Telegram</strong> listado, basta clicar no botão "Entrar". 
            Você será redirecionado para o aplicativo oficial. Todos os grupos de <strong>{model.displayName}</strong> são 
            de acesso gratuito e verificados pelo <strong>Canais18</strong>.
          </p>
        </section>

        {/* FAQ */}
        <section className="my-10">
          <h2 className="text-lg font-extrabold flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-primary rounded-full inline-block"></span>
            Perguntas Frequentes sobre {model.displayName}
          </h2>
          <div className="bg-muted/30 p-5 rounded-xl border border-border space-y-3">
            <details>
              <summary className="cursor-pointer font-bold text-foreground py-2">
                Onde encontrar conteúdo de {model.displayName} no Telegram?
              </summary>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                O Canais18 reúne <strong>{groups.length} grupos verificados</strong> com conteúdo de {model.displayName}. 
                Todos os links são testados diariamente para garantir que estão funcionando.
              </p>
            </details>
            <details>
              <summary className="cursor-pointer font-bold text-foreground py-2">
                O conteúdo de {model.displayName} no Telegram é gratuito?
              </summary>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Sim, todos os grupos de {model.displayName} listados no Canais18 são de acesso gratuito. 
                Basta clicar em "Entrar" para ser redirecionado ao canal ou grupo no Telegram.
              </p>
            </details>
            <details>
              <summary className="cursor-pointer font-bold text-foreground py-2">
                Os links dos grupos de {model.displayName} estão atualizados?
              </summary>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Sim. Nossa equipe verifica diariamente cada link para garantir que estão ativos. 
                Se algum link estiver fora do ar, ele é removido automaticamente.
              </p>
            </details>
          </div>
        </section>

        {/* Other models */}
        <section className="my-10">
          <h2 className="text-lg font-extrabold flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-primary rounded-full inline-block"></span>
            Outros Modelos Populares
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(MODELS)
              .filter(([s]) => s !== slug)
              .slice(0, 15)
              .map(([s, m]) => (
                <Link
                  key={s}
                  to={`/modelo/${s}`}
                  className="bg-muted/30 hover:bg-muted px-4 py-2 rounded-full text-sm text-muted-foreground transition-colors border border-border"
                >
                  {m.displayName}
                </Link>
              ))}
            <Link
              to="/modelos"
              className="bg-primary hover:bg-primary/90 px-4 py-2 rounded-full text-sm text-primary-foreground transition-colors"
            >
              Ver todos
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
