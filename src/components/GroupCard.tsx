import { CheckCircle, Star, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Grupo } from "@/data/mock";
import { groupPath } from "@/lib/slug";


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
  Putaria: "from-rose-500 to-red-600"
};

function getPlaceholderBg(category: string) {
  return categoryColors[category] || "from-gray-500 to-gray-700";
}

const GroupCard = ({ grupo, hideBadges = false }: {grupo: Grupo;hideBadges?: boolean;}) => {
  const navigate = useNavigate();
  const hasThumbnail = !!grupo.thumbnail_url;

  const handleCardClick = () => {
    navigate(groupPath(grupo));
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">

      {/* Image / Placeholder */}
      <div className="relative h-32 overflow-hidden sm:h-36">
        {hasThumbnail ?
        <img
          src={grupo.thumbnail_url!}
          alt={grupo.name}
          width={400}
          height={144}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
          loading="lazy" /> :


        <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getPlaceholderBg(grupo.category)} transition-transform duration-500 group-hover:scale-110`}>
            <span className="text-3xl font-bold text-white/80">{grupo.name.charAt(0)}</span>
          </div>
        }
        

        {/* Badges */}
        {!hideBadges &&
        <div className="absolute left-2 top-2 flex gap-1.5">
            {grupo.is_premium &&
          <span className="flex items-center gap-0.5 rounded bg-amber-500/90 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                <Star className="h-2.5 w-2.5" /> Premium
              </span>
          }
            {grupo.is_verified &&
          <span className="flex items-center gap-1 rounded-md bg-blue-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                <CheckCircle className="h-3 w-3" /> Verificado
              </span>
          }
          </div>
        }

        
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-card-foreground">{grupo.name}</h3>

        <span className="mt-1.5 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
          {grupo.category}
        </span>

        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            👥 {formatMembers(grupo.member_count)}
          </span>

          <span
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold uppercase text-primary-foreground transition-colors hover:bg-primary/90">

            Entrar <Send className="h-3 w-3 bg-primary" />
          </span>
        </div>
      </div>
    </div>);

};

export default GroupCard;