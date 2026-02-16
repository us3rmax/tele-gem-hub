import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star, Users } from "lucide-react";
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

const AUTOPLAY_INTERVAL = 1500;
const RESUME_DELAY = 2000;

const PremiumCarousel = ({ grupos }: { grupos: Grupo[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scroll = useCallback((dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 210;
    if (dir === "right") {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 5) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: amount, behavior: "smooth" });
      }
    } else {
      if (el.scrollLeft <= 5) {
        el.scrollTo({ left: el.scrollWidth - el.clientWidth, behavior: "smooth" });
      } else {
        el.scrollBy({ left: -amount, behavior: "smooth" });
      }
    }
  }, []);

  // Autoplay
  useEffect(() => {
    if (paused || grupos.length <= 1) return;
    const id = setInterval(() => scroll("right"), AUTOPLAY_INTERVAL);
    return () => clearInterval(id);
  }, [paused, scroll, grupos.length]);

  const handleInteractionStart = useCallback(() => {
    setPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }, []);

  const handleInteractionEnd = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setPaused(false), RESUME_DELAY);
  }, []);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

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
          <button onClick={() => { handleInteractionStart(); scroll("left"); handleInteractionEnd(); }} className="rounded-lg bg-secondary p-1.5 text-muted-foreground transition-colors hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => { handleInteractionStart(); scroll("right"); handleInteractionEnd(); }} className="rounded-lg bg-secondary p-1.5 text-muted-foreground transition-colors hover:text-foreground">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
        onMouseEnter={handleInteractionStart}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
      >
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
                  <img src={grupo.thumbnail_url} alt={grupo.name} width={200} height={112} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                ) : (
                  <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient} transition-transform duration-500 group-hover:scale-110`}>
                    <span className="text-2xl font-bold text-white/80">{grupo.name.charAt(0)}</span>
                  </div>
                )}
                
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
