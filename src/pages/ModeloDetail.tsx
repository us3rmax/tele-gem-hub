import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import GroupCard from "@/components/GroupCard";
import MobileSidebar from "@/components/MobileSidebar";
import BannerAd from "@/components/BannerAd";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, ExternalLink } from "lucide-react";

const EDGE_FUNC_URL = "https://lymjjozpdsdoloahsyey.functions.supabase.co/image-proxy";

function proxyImage(url: string | null): string | null {
  if (!url) return null;
  if (!url.includes("image.privacy.com.br")) return url;
  return `${EDGE_FUNC_URL}?url=${encodeURIComponent(url)}`;
}

interface PrivacyModelData {
  id: number;
  name: string;
  profile_name: string;
  is_verified: boolean;
  avatar_url: string;
  cover_url: string | null;
  privacy_link: string;
  ranking: number;
  media_url: string | null;
  media_type: string;
}

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

const MODELS: Record<string, { displayName: string; platform: string; description: string; seoTitle: string; seoDescription: string; keywords: string }> = {
  "ester-muniz": {
    displayName: "Ester Muniz",
    platform: "Privacy",
    description: "Ester Muniz no Telegram — encontre previas gratis, fotos e grupos com conteudo exclusivo da criadora @Esttermuniz no Privacy. Links verificados e atualizados diariamente.",
    seoTitle: "Ester Muniz Privacy — Previas Gratis, Fotos e Grupos Telegram | Canais18",
    seoDescription: "Encontre previas gratis de Ester Muniz no Telegram. Grupos verificados com conteudo exclusivo da criadora @Esttermuniz no Privacy. Links atualizados diariamente.",
    keywords: "ester muniz privacy, ester muniz telegram, ester muniz previas gratis, ester muniz fotos, ester muniz leaked, ester muniz grupos telegram",
  },
  "jaianelimma": {
    displayName: "Jaiane Lima",
    platform: "Privacy",
    description: "Jaiane Lima no Telegram — encontre previas gratis, fotos e grupos com conteudo exclusivo da criadora @jaianelimma no Privacy. Links verificados e atualizados diariamente.",
    seoTitle: "Jaiane Lima Privacy — Previas Gratis, Fotos e Grupos Telegram | Canais18",
    seoDescription: "Encontre previas gratis de Jaiane Lima no Telegram. Grupos verificados com conteudo exclusivo da criadora @jaianelimma no Privacy. Links atualizados diariamente.",
    keywords: "jaiane lima privacy, jaiane lima telegram, jaiane lima previas gratis, jaiane lima fotos, jaiane lima leaked, jaiane lima grupos telegram",
  },
  "bad-mi": {
    displayName: "Bad Mi (MC Mirella)",
    platform: "Privacy",
    description: "Bad Mi (MC Mirella) no Telegram — encontre previas gratis, fotos e grupos com conteudo exclusivo da criadora @badmi no Privacy. Links verificados e atualizados diariamente.",
    seoTitle: "Bad Mi MC Mirella Privacy — Previas Gratis, Fotos e Grupos Telegram | Canais18",
    seoDescription: "Encontre previas gratis de Bad Mi (MC Mirella) no Telegram. Grupos verificados com conteudo exclusivo da criadora @badmi no Privacy. Links atualizados diariamente.",
    keywords: "bad mi privacy, mc mirella privacy, bad mi telegram, bad mi previas gratis, bad mi fotos, bad mi leaked, bad mi grupos telegram, mc mirella telegram",
  },
  "nayzinha": { displayName: "Nayzinha", platform: "Privacy", description: "Nayzinha — conteudo exclusivo vazado do Privacy no Telegram. Grupos verificados com material da criadora.", seoTitle: "Nayzinha Telegram — Previas e Grupos | Canais18", seoDescription: "Nayzinha Telegram — conteudo exclusivo do Privacy no Telegram. Grupos verificados.", keywords: "nayzinha telegram, nayzinha privacy, nayzinha previas" },
  "dra-sophia": { displayName: "Dra. Sophia", platform: "Privacy", description: "Dra. Sophia — conteudo exclusivo vazado do Privacy no Telegram. Grupos verificados com material da criadora.", seoTitle: "Dra. Sophia Telegram — Previas e Grupos | Canais18", seoDescription: "Dra. Sophia Telegram — conteudo exclusivo do Privacy no Telegram. Grupos verificados.", keywords: "dra sophia telegram, dra sophia privacy, dra sophia previas" },
  "bia-albina": { displayName: "Bia Albina", platform: "Privacy", description: "Bia Albina — conteudo exclusivo vazado do Privacy no Telegram. Grupos verificados com material da criadora.", seoTitle: "Bia Albina Telegram — Previas e Grupos | Canais18", seoDescription: "Bia Albina Telegram — conteudo exclusivo do Privacy no Telegram. Grupos verificados.", keywords: "bia albina telegram, bia albina privacy, bia albina previas" },
  "michele-umezu": { displayName: "Michele Umezu", platform: "Privacy", description: "Michele Umezu — conteudo exclusivo vazado do Privacy no Telegram. Grupos verificados.", seoTitle: "Michele Umezu Telegram — Previas e Grupos | Canais18", seoDescription: "Michele Umezu Telegram — conteudo exclusivo do Privacy no Telegram. Grupos verificados.", keywords: "michele umezu telegram, michele umezu privacy, michele umezu previas" },
  "cosvickye": { displayName: "Cosvickye", platform: "Erome", description: "Cosvickye — conteudo do Erome disponivel no Telegram. Grupos verificados.", seoTitle: "Cosvickye Telegram — Grupos e Canais | Canais18", seoDescription: "Cosvickye Telegram — conteudo do Erome disponivel no Telegram. Grupos verificados.", keywords: "cosvickye telegram, cosvickye erome" },
  "privacy-bad-mi": { displayName: "Bad Mi", platform: "Privacy", description: "Bad Mi — conteudo exclusivo vazado do Privacy no Telegram. Grupos verificados.", seoTitle: "Bad Mi Telegram — Previas e Grupos | Canais18", seoDescription: "Bad Mi Telegram — conteudo exclusivo do Privacy no Telegram. Grupos verificados.", keywords: "bad mi telegram, bad mi privacy" },
  "erome-nicole-rodrigues": { displayName: "Nicole Rodrigues", platform: "Erome", description: "Nicole Rodrigues — conteudo do Erome disponivel no Telegram. Grupos verificados.", seoTitle: "Nicole Rodrigues Telegram — Grupos e Canais | Canais18", seoDescription: "Nicole Rodrigues Telegram — conteudo do Erome disponivel no Telegram.", keywords: "nicole rodrigues telegram, nicole rodrigues erome" },
  "nyvi-estephan": { displayName: "Nyvi Estephan", platform: "Erome", description: "Nyvi Estephan — conteudo do Erome disponivel no Telegram. Grupos verificados.", seoTitle: "Nyvi Estephan Telegram — Grupos e Canais | Canais18", seoDescription: "Nyvi Estephan Telegram — conteudo do Erome disponivel no Telegram.", keywords: "nyvi estephan telegram, nyvi estephan erome" },
  "jenifer-novaki": { displayName: "Jenifer Novaki", platform: "Privacy", description: "Jenifer Novaki — conteudo exclusivo vazado do Privacy no Telegram. Grupos verificados.", seoTitle: "Jenifer Novaki Telegram — Previas e Grupos | Canais18", seoDescription: "Jenifer Novaki Telegram — conteudo exclusivo do Privacy no Telegram.", keywords: "jenifer novaki telegram, jenifer novaki privacy" },
  "camila-prado": { displayName: "Camila Prado", platform: "Privacy", description: "Camila Prado — conteudo exclusivo vazado do Privacy no Telegram. Grupos verificados.", seoTitle: "Camila Prado Telegram — Previas e Grupos | Canais18", seoDescription: "Camila Prado Telegram — conteudo exclusivo do Privacy no Telegram.", keywords: "camila prado telegram, camila prado privacy" },
  "mae-e-filha": { displayName: "Mae e Filha", platform: "Erome", description: "Mae e Filha — conteudo do Erome disponivel no Telegram. Grupos verificados.", seoTitle: "Mae e Filha Telegram — Grupos e Canais | Canais18", seoDescription: "Mae e Filha Telegram — conteudo do Erome disponivel no Telegram.", keywords: "mae e filha telegram" },
  "erome-juliana-silva": { displayName: "Juliana Silva", platform: "Erome", description: "Juliana Silva — conteudo do Erome disponivel no Telegram. Grupos verificados.", seoTitle: "Juliana Silva Telegram — Grupos e Canais | Canais18", seoDescription: "Juliana Silva Telegram — conteudo do Erome disponivel no Telegram.", keywords: "juliana silva telegram" },
  "erome-gostosa": { displayName: "Gostosa", platform: "Erome", description: "Gostosa — conteudo do Erome disponivel no Telegram. Grupos verificados.", seoTitle: "Gostosa Telegram — Grupos e Canais | Canais18", seoDescription: "Gostosa Telegram — conteudo do Erome disponivel no Telegram.", keywords: "gostosa telegram" },
  "erome-privacy": { displayName: "Privacy Erome", platform: "Erome", description: "Privacy Erome — conteudo disponivel no Telegram. Grupos verificados.", seoTitle: "Privacy Erome Telegram — Grupos e Canais | Canais18", seoDescription: "Privacy Erome Telegram — conteudo disponivel no Telegram.", keywords: "privacy erome telegram" },
  "nayara": { displayName: "Nayara", platform: "Erome", description: "Nayara — conteudo do Erome disponivel no Telegram. Grupos verificados.", seoTitle: "Nayara Telegram — Grupos e Canais | Canais18", seoDescription: "Nayara Telegram — conteudo do Erome disponivel no Telegram.", keywords: "nayara telegram" },
  "privacy-display-apk": { displayName: "Display APK", platform: "Privacy", description: "Display APK — conteudo exclusivo vazado do Privacy no Telegram. Grupos verificados.", seoTitle: "Display APK Telegram — Previas e Grupos | Canais18", seoDescription: "Display APK Telegram — conteudo exclusivo do Privacy no Telegram.", keywords: "display apk telegram" },
};

// Fallback: try to find model in privacy_models DB
async function findModelInDB(slug: string): Promise<PrivacyModelData | null> {
  const modelName = slug.replace(/-/g, " ");
  const profileName = slug;

  // Try exact profile_name match
  const { data: byProfile } = await supabase
    .from("privacy_models")
    .select("id, name, profile_name, is_verified, avatar_url, cover_url, privacy_link, ranking, media_url, media_type")
    .eq("profile_name", profileName)
    .eq("is_active", true)
    .maybeSingle();

  if (byProfile) return byProfile as PrivacyModelData;

  // Try ilike on name
  const { data: byName } = await supabase
    .from("privacy_models")
    .select("id, name, profile_name, is_verified, avatar_url, cover_url, privacy_link, ranking, media_url, media_type")
    .ilike("name", `%${modelName}%`)
    .eq("is_active", true)
    .maybeSingle();

  return byName as PrivacyModelData | null;
}

export default function ModeloDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [privacyModel, setPrivacyModel] = useState<PrivacyModelData | null>(null);

  const model = useMemo(() => {
    if (!slug) return null;
    const m = MODELS[slug];
    if (m) return m;
    return {
      displayName: slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      platform: "Telegram",
      description: `Conteudo de ${slug.replace(/-/g, " ")} no Telegram. Grupos verificados.`,
      seoTitle: `${slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())} Telegram — Grupos e Canais | Canais18`,
      seoDescription: `${slug.replace(/-/g, " ")} Telegram — grupos verificados com conteudo.`,
      keywords: slug.replace(/-/g, " ") + " telegram",
    };
  }, [slug]);

  // Fetch Privacy model data from DB
  useEffect(() => {
    if (!slug) return;
    findModelInDB(slug).then(setPrivacyModel);
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function fetchGroups() {
      setLoading(true);
      try {
        const modelName = slug.replace(/-/g, " ");
        const categoryPrefix = `modelo_${slug.replace(/-/g, "_")}`;

        // Attempt 1: search by category prefix
        const { data: data1 } = await supabase
          .from("groups")
          .select("id, slug, name, telegram_link, description, member_count, thumbnail_url, category")
          .eq("hidden", false)
          .not("thumbnail_url", "is", null)
          .eq("category", categoryPrefix)
          .order("member_count", { ascending: false })
          .limit(30);

        if (data1 && data1.length > 0) {
          if (!cancelled) { setGroups(data1 as Group[]); return; }
        }

        // Attempt 2: search by name
        const { data: data2 } = await supabase
          .from("groups")
          .select("id, slug, name, telegram_link, description, member_count, thumbnail_url, category")
          .eq("hidden", false)
          .not("thumbnail_url", "is", null)
          .ilike("name", `%${modelName}%`)
          .order("member_count", { ascending: false })
          .limit(30);

        if (data2 && data2.length > 0) {
          if (!cancelled) { setGroups(data2 as Group[]); return; }
        }

        // Fallback: groups from platform category
        const fallbackCategory = "privacy";
        const { data: data3 } = await supabase
          .from("groups")
          .select("id, slug, name, telegram_link, description, member_count, thumbnail_url, category")
          .eq("hidden", false)
          .not("thumbnail_url", "is", null)
          .eq("category", fallbackCategory)
          .order("member_count", { ascending: false })
          .limit(20);

        if (!cancelled) setGroups(data3 || data1 || data2 || []);
      } catch (e) {
        console.error("Erro ao buscar grupos do modelo:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchGroups();
    return () => { cancelled = true; };
  }, [slug]);

  if (!slug || !model) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Modelo nao encontrado.</p>
      </div>
    );
  }

  const h1 = model.seoTitle.replace(" | Canais18", "");
  const canonicalUrl = `https://www.canais18.com/modelo/${slug}`;
  const totalMembers = groups.reduce((sum, g) => sum + (g.member_count || 0), 0);
  const proxiedAvatar = proxyImage(privacyModel?.avatar_url || null);
  const proxiedCover = proxyImage(privacyModel?.cover_url || null);
  const privacyLink = privacyModel?.privacy_link || null;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.canais18.com/#website",
        "name": "Canais18",
        "url": "https://www.canais18.com",
        "description": "Maior diretorio de grupos e canais adultos do Telegram no Brasil.",
        "inLanguage": "pt-BR",
      },
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        "url": canonicalUrl,
        "name": model.seoTitle,
        "description": model.seoDescription,
        "isPartOf": { "@id": "https://www.canais18.com/#website" },
        "about": {
          "@type": "Person",
          "name": model.displayName,
          "url": privacyLink || canonicalUrl,
          "image": proxiedAvatar || undefined,
        },
      },
      {
        "@type": "Person",
        "@id": `${canonicalUrl}#person`,
        "name": model.displayName,
        "description": `${model.displayName} — criadora de conteudo adulto no Privacy. Encontre grupos do Telegram com conteudo exclusivo.`,
        "url": privacyLink || canonicalUrl,
        "image": proxiedAvatar || undefined,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.canais18.com" },
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
        "name": `Onde encontrar conteudo de ${model.displayName} no Telegram?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `O Canais18 reune ${groups.length} grupos verificados com conteudo de ${model.displayName}. Todos os links sao testados diariamente.`
        }
      },
      {
        "@type": "Question",
        "name": `O conteudo de ${model.displayName} e gratuito?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Sim, todos os grupos de ${model.displayName} listados no Canais18 sao de acesso gratuito. Basta clicar em "Entrar" para acessar.`
        }
      },
      {
        "@type": "Question",
        "name": `Como acessar o perfil oficial de ${model.displayName} no Privacy?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": privacyLink 
            ? `O perfil oficial de ${model.displayName} no Privacy esta disponivel em ${privacyLink}. O Canais18 oferece acesso direto ao perfil verificado.`
            : `Voce pode buscar o perfil oficial de ${model.displayName} diretamente na plataforma Privacy.`
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={model.seoTitle}
        description={model.seoDescription}
        keywords={model.keywords}
        canonicalUrl={canonicalUrl}
        jsonLd={jsonLd}
        faqJsonLd={faqJsonLd}
      />

      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="max-w-[1100px] mx-auto px-4 pt-20 pb-10">
        {/* Hero with model photo */}
        <header className="relative mb-8 overflow-hidden rounded-2xl border border-border/30 bg-card">
          {/* Cover photo or gradient */}
          <div className="relative h-40 sm:h-52 overflow-hidden">
            {proxiedCover ? (
              <img
                src={proxiedCover}
                alt={`${model.displayName} Privacy`}
                className="w-full h-full object-cover"
                loading="eager"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary/30 to-primary/10" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          </div>

          {/* Avatar + Info overlay */}
          <div className="relative -mt-16 sm:-mt-20 px-6 pb-6">
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div className="shrink-0">
                {proxiedAvatar ? (
                  <img
                    src={proxiedAvatar}
                    alt={`${model.displayName}`}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-background shadow-xl"
                    loading="eager"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-primary/20 flex items-center justify-center border-4 border-background shadow-xl">
                    <span className="text-3xl sm:text-4xl font-bold text-primary">{model.displayName.charAt(0)}</span>
                  </div>
                )}
              </div>

              {/* Name + verified */}
              <div className="flex-1 pb-1">
                <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  {model.displayName}
                  {model.is_verified && <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />}
                </h1>
                {privacyModel && (
                  <p className="text-primary font-semibold text-sm">@{privacyModel.profile_name}</p>
                )}
              </div>
            </div>

            {/* Privacy link button */}
            {privacyLink && (
              <a
                href={privacyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 rounded-xl bg-[#00AFF0] text-white text-sm font-bold shadow-lg hover:bg-[#009AD6] transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Ver no Privacy
              </a>
            )}
          </div>
        </header>

        {/* Stats bar */}
        <div className="flex gap-3 justify-center mb-8 flex-wrap">
          <div className="bg-card px-5 py-3 rounded-xl border border-border">
            <strong className="text-primary text-xl">{groups.length}</strong>
            <span className="text-muted-foreground text-xs ml-2">grupos</span>
          </div>
          <div className="bg-card px-5 py-3 rounded-xl border border-border">
            <strong className="text-primary text-xl">{totalMembers.toLocaleString("pt-BR")}</strong>
            <span className="text-muted-foreground text-xs ml-2">membros</span>
          </div>
          <div className="bg-card px-5 py-3 rounded-xl border border-border">
            <strong className="text-primary text-xl">{model.platform}</strong>
            <span className="text-muted-foreground text-xs ml-2">plataforma</span>
          </div>
        </div>

        {/* SEO intro text */}
        <section className="text-muted-foreground text-sm leading-relaxed mb-8 bg-muted/30 p-5 rounded-xl border border-border">
          <p>
            Encontre <strong>grupos de {model.displayName} no Telegram</strong> com conteudo exclusivo de <strong>{model.platform}</strong>.
            Nossa equipe verifica links diariamente para garantir que voce tenha acesso aos melhores canais com seguranca.
            {privacyLink && ` Tambem oferecemos acesso direto ao perfil oficial de ${model.displayName} no Privacy.`}
            Explore a lista abaixo e entre nos grupos mais ativos.
          </p>
        </section>

        {/* Groups grid */}
        {groups.length > 0 && (
          <>
            <h2 className="text-lg font-extrabold flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-primary rounded-full inline-block"></span>
              Grupos de {model.displayName} em Destaque
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {groups.map((grupo) => (
                  <GroupCard key={grupo.id} grupo={grupo as any} hideBadges />
                ))}
              </div>
            )}

            <BannerAd position="middle" />
          </>
        )}

        {loading && groups.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum grupo encontrado para este modelo no momento.</p>
            <p className="text-sm mt-2">Tente novamente mais tarde.</p>
          </div>
        )}

        {/* SEO footer */}
        <section className="text-sm leading-relaxed mt-10 pt-5 border-t border-border text-muted-foreground">
          <h3 className="font-bold mb-2">Como entrar nos grupos de {model.displayName}?</h3>
          <p>
            Para entrar em qualquer <strong>canal do Telegram</strong> listado, basta clicar no botao "Entrar".
            Voce sera redirecionado para o aplicativo oficial. Todos os grupos de <strong>{model.displayName}</strong> sao
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
                Onde encontrar conteudo de {model.displayName} no Telegram?
              </summary>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                O Canais18 reune <strong>{groups.length} grupos verificados</strong> com conteudo de {model.displayName}.
                Todos os links sao testados diariamente para garantir que estao funcionando.
              </p>
            </details>
            <details>
              <summary className="cursor-pointer font-bold text-foreground py-2">
                O conteudo de {model.displayName} no Telegram e gratuito?
              </summary>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Sim, todos os grupos de {model.displayName} listados no Canais18 sao de acesso gratuito.
                Basta clicar em "Entrar" para ser redirecionado ao canal ou grupo no Telegram.
              </p>
            </details>
            {privacyLink && (
              <details>
                <summary className="cursor-pointer font-bold text-foreground py-2">
                  Como acessar o perfil oficial de {model.displayName} no Privacy?
                </summary>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  O perfil oficial de {model.displayName} esta disponivel no Privacy. Voce pode acessar diretamente
                  clicando no botao "Ver no Privacy" acima, ou buscar por <strong>@{privacyModel?.profile_name}</strong> na plataforma.
                </p>
              </details>
            )}
            <details>
              <summary className="cursor-pointer font-bold text-foreground py-2">
                Os links dos grupos de {model.displayName} estao atualizados?
              </summary>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Sim. Nossa equipe verifica diariamente cada link para garantir que estao ativos.
                Se algum link estiver fora do ar, ele e removido automaticamente.
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
              .slice(0, 12)
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
