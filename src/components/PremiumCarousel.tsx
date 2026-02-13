import { useRef } from "react";
import { ChevronLeft, ChevronRight, Star, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Grupo } from "@/data/mock";

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

const PremiumCarousel = ({ grupos }: { grupos: Grupo[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 260;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (grupos.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            ⭐ Grupos em destaque
          </h2>
          <p className="text-xs text-muted-foreground">Mais bem avaliados</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => scroll("left")} className="rounded-lg bg-secondary p-1.5 text-muted-foreground transition-colors hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => scroll("right")} className="rounded-lg bg-secondary p-1.5 text-muted-foreground transition-colors hover:text-foreground">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {grupos.map((grupo) => {
          const gradient = categoryColors[grupo.category] || "from-gray-500 to-gray-700";
          return (
            <div
              key={grupo.id}
              onClick={() => window.open(grupo.telegram_link, "_blank")}
              className="group shrink-0 cursor-pointer overflow-hidden rounded-xl border border-amber-500/30 bg-card transition-all duration-300 hover:border-amber-500/60 hover:shadow-lg hover:shadow-amber-500/10"
              style={{ width: 200 }}
            >
              <div className="relative h-28 overflow-hidden">
                {grupo.thumbnail_url ? (
                  <img src={grupo.thumbnail_url} alt={grupo.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                ) : (
                  <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient} transition-transform duration-500 group-hover:scale-110`}>
                    <span className="text-2xl font-bold text-white/80">{grupo.name.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  <Star className="h-3 w-3" /> Premium
                </span>
              </div>
              <div className="p-2.5">
                <h3 className="line-clamp-1 text-xs font-semibold text-card-foreground">{grupo.name}</h3>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Users className="h-3 w-3" /> {formatMembers(grupo.member_count)}
                  </span>
                  <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-bold uppercase text-primary-foreground">
                    Entrar
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PremiumCarousel;
