import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import HeroBanner from "@/components/HeroBanner";

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  position: string;
  is_active: boolean;
  expires_at: string | null;
  clicks: number;
  video_url: string | null;
}

interface BannerAdProps {
  position?: "top" | "middle" | "bottom";
}

const BannerAd = ({ position = "top" }: BannerAdProps) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [heroBanner, setHeroBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      if (position === "top") {
        // First check for hero banner
        const { data: heroData } = await supabase
          .from("banners")
          .select("*")
          .eq("position", "hero")
          .eq("is_active", true);

        if (heroData && heroData.length > 0) {
          const selected = heroData[Math.floor(Math.random() * heroData.length)] as Banner;
          if (selected.video_url) {
            setHeroBanner(selected);
            setLoading(false);
            return;
          }
        }
      }

      // Regular banners
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("position", position)
        .eq("is_active", true);

      if (data && data.length > 0) {
        if (position === "top" && data.length >= 3) {
          const shuffled = [...data].sort(() => Math.random() - 0.5);
          setBanners(shuffled.slice(0, 3) as Banner[]);
        } else if (position === "top" && data.length === 2) {
          setBanners([...data].sort(() => Math.random() - 0.5) as Banner[]);
        } else {
          const selected = data[Math.floor(Math.random() * data.length)] as Banner;
          setBanners([selected]);
        }
      }
      setLoading(false);
    };

    fetchBanners();
  }, [position]);

  const handleClick = (bannerId: string) => {
    supabase.rpc("increment_banner_clicks" as never, { banner_id: bannerId } as never).then(() => {}, () => {});
  };

  if (loading) {
    return position === "top" ? (
      <div className="flex flex-row gap-2">
        <Skeleton className="aspect-square w-1/3 rounded-xl" />
        <Skeleton className="aspect-square w-1/3 rounded-xl" />
        <Skeleton className="aspect-square w-1/3 rounded-xl" />
      </div>
    ) : (
      <Skeleton className="h-[50px] w-full rounded-xl sm:h-[90px]" />
    );
  }

  // Hero video banner takes priority
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

  const renderBanner = (banner: Banner, isSquare: boolean) => {
    const image = (
      <div className="relative w-full overflow-hidden rounded-xl">
        <img
          src={banner.image_url}
          alt={banner.title}
          className={isSquare ? "aspect-square w-full object-cover" : "h-[50px] w-full object-cover sm:h-[90px]"}
        />
        <span className="absolute right-2 top-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white/70">
          Anúncio
        </span>
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
          className={`block ${banners.length > 1 ? "flex-1 min-w-0" : "w-full"}`}
        >
          {image}
        </a>
      );
    }

    return (
      <div key={banner.id} className={banners.length > 1 ? "flex-1 min-w-0" : "w-full"}>
        {image}
      </div>
    );
  };

  const isSquareLayout = position === "top" && banners.length > 1;

  if (banners.length > 1) {
    return (
      <div className="flex flex-row gap-2">
        {banners.map((b) => renderBanner(b, true))}
      </div>
    );
  }

  return renderBanner(banners[0], isSquareLayout);
};

export default BannerAd;
