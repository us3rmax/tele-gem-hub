import { mockAnuncios } from "@/data/mock";

const BannerAd = () => {
  const ad = mockAnuncios.find((a) => a.ativo && a.posicao === "topo");
  if (!ad) return null;

  return (
    <a
      href={ad.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-2xl border border-border"
    >
      <img
        src={ad.imagem_url}
        alt={ad.titulo}
        className="h-[180px] w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-[220px] lg:h-[250px]"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 p-4 sm:p-6">
        <p className="text-sm font-medium text-white/70">Anúncio</p>
        <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">{ad.titulo}</h2>
        <span className="mt-2 inline-block rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-colors group-hover:bg-primary/90">
          Saiba mais →
        </span>
      </div>
    </a>
  );
};

export default BannerAd;
