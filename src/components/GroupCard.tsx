import { Users, CheckCircle } from "lucide-react";
import type { Grupo } from "@/data/mock";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function formatMembers(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toString();
}

const GroupCard = ({ grupo }: { grupo: Grupo }) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      {/* Image */}
      <div className="relative h-32 overflow-hidden sm:h-36">
        <img
          src={grupo.imagem_url}
          alt={grupo.nome}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />

        {/* Badges */}
        <div className="absolute left-2 top-2 flex gap-1.5">
          {grupo.premium && (
            <span className="rounded-md bg-premium px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
              Premium
            </span>
          )}
          {grupo.hot && (
            <span className="rounded-md bg-hot px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Hot 🔥
            </span>
          )}
        </div>

        <span className="absolute right-2 top-2 text-xs text-white/70">{timeAgo(grupo.criado_em)}</span>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-1.5">
          <h3 className="line-clamp-1 flex-1 text-sm font-semibold text-card-foreground">{grupo.nome}</h3>
          {grupo.verificado && <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-verified" />}
        </div>

        <span className="mt-1.5 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
          {grupo.categoria}
        </span>

        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {formatMembers(grupo.membros)}
          </span>

          <a
            href={grupo.link_telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Entrar
          </a>
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
