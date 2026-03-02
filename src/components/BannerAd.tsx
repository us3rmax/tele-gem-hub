import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import HeroBanner from "@/components/HeroBanner";
import { useBannersForPosition } from "@/hooks/use-banners";

interface BannerAdProps {
  position?: "top" | "middle" | "bottom";
}

const BannerAd = ({ position = "top" }: BannerAdProps) => {
  const { banners, heroBanner, loading } = useBannersForPosition(position);

  const handleClick = (bannerId: string) => {
    supabase.rpc("increment_banner_clicks" as never, { banner_id: bannerId } as never).then(() => {}, () => {});
  };

  if (loading) {
    const count = position === "bottom" ? 3 : position === "top" ? 2 : 1;
    return (
      <div className={`grid gap-2 ${count === 1 ? "grid-cols-1" : count === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (heroBanner) {
    return (
      <HeroBanner
        id={heroBanner.id}
        title={heroBanner.title}
        video_url={heroBanner.video_url!}
        link_url={heroBanner.link_url}
      />
    );
  }

  if (banners.length === 0) {
    return (
      <div className="flex h-[50px] w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 sm:h-[90px]">
        <span className="text-xs text-muted-foreground">Espaço disponível para anúncio</span>
      </div>
    );
  }

  const cols = banners.length === 1 ? "grid-cols-1" : banners.length === 2 ? "grid-cols-2" : "grid-cols-3";

  const renderBanner = (banner: typeof banners[0]) => {
    const image = (
      <div className="relative w-full overflow-hidden rounded-xl">
        <img
          src={banner.image_url}
          alt={banner.title}
          className="aspect-square w-full object-cover"
          loading="lazy"
          width={400}
          height={400}
        />
      </div>
    );

    if (banner.link_url) {
      return (
        <a
          key={banner.id}
          href={banner.link_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleClick(banner.id)}
          className="block w-full"
        >
          {image}
        </a>
      );
    }

    return (
      <div key={banner.id} className="w-full">
        {image}
      </div>
    );
  };

  return (
    <div className={`grid gap-2 ${cols}`}>
      {banners.map((b) => renderBanner(b))}
    </div>
  );
};

export default BannerAd;
