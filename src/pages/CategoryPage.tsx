import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import MobileSidebar from "@/components/MobileSidebar";
import BannerAd from "@/components/BannerAd";
import GroupCard from "@/components/GroupCard";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { Grupo } from "@/data/mock";

const ALL_CATEGORIES = [
  "Novinhas",
  "Amadoras",
  "Cornos",
  "Onlyfans",
  "Vazados",
  "Lésbicas",
  "Pack",
  "Putaria",
];

// Normalize slug to match DB category (capitalize first letter)
function slugToCategory(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();
}

const CategoryPage = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const category = slugToCategory(slug);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .ilike("category", category)
        .order("member_count", { ascending: false });

      if (!error && data) {
        setGrupos(data as Grupo[]);
      }
      setLoading(false);
    };

    fetchGroups();
  }, [category]);

  const canonicalUrl = `https://www.canais18.com/categoria/${slug}`;
  const seoTitle = `${category} Telegram - Canais e Grupos | Canais18`;
  const seoDescription = `Encontre os melhores canais telegram ${category.toLowerCase()}. ${grupos.length > 0 ? `${grupos.length} grupos` : "Grupos"} verificados e atualizados. Acesse grátis!`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: seoTitle,
    description: seoDescription,
    url: canonicalUrl,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Canais18", item: "https://www.canais18.com" },
        { "@type": "ListItem", position: 2, name: category, item: canonicalUrl },
      ],
    },
  };

  const otherCategories = ALL_CATEGORIES.filter(
    (c) => c.toLowerCase() !== slug.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={`${slug} telegram, canais telegram ${slug}, grupos telegram ${slug}, telegram ${slug} brasil`}
        canonicalUrl={canonicalUrl}
        jsonLd={jsonLd}
      />

      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSort={() => {}}
        activeSort=""
      />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Canais18
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{category}</span>
        </nav>

        {/* Hero */}
        <section className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            Canais Telegram {category} - Melhores Grupos Verificados
          </h1>
          {!loading && (
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{grupos.length}</span> grupos encontrados
            </p>
          )}
        </section>

        <BannerAd position="top" />

        {/* Groups Grid */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">🔥 Grupos em Destaque</h2>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
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
                <GroupCard key={grupo.id} grupo={grupo} hideBadges />
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-muted-foreground">
              Nenhum grupo encontrado para esta categoria.
            </p>
          )}
        </section>

        <BannerAd position="bottom" />

        {/* Other Categories */}
        <section className="space-y-4 border-t border-border pt-6">
          <h2 className="text-xl font-bold text-foreground">📂 Outras Categorias</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {otherCategories.map((cat) => (
              <Link
                key={cat}
                to={`/categoria/${cat.toLowerCase()}`}
                className="rounded-xl border border-border bg-card p-4 text-center font-semibold text-foreground transition-colors hover:bg-card/80 hover:border-primary/40"
              >
                {cat}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default CategoryPage;
