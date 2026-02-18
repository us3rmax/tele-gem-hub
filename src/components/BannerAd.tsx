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
      // Check for hero/video banner matching this position
      const heroPosition = position === "top" ? "hero" : `hero_${position}`;
      const { data: heroData } = await supabase
        .from("banners")
        .select("*")
        .eq("position", heroPosition)
        .eq("is_active", true);

      if (heroData && heroData.length > 0) {
        const selected = heroData[Math.floor(Math.random() * heroData.length)] as Banner;
        if (selected.video_url) {
          setHeroBanner(selected);
          setLoading(false);
          return;
        }
      }

      // Regular banners
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("position", position)
        .eq("is_active", true);

      if (data && data.length > 0) {
        if (position === "bottom") {
          setBanners(data as Banner[]);
        } else {
          const shuffled = [...data].sort(() => Math.random() - 0.5);
          if (position === "top") {
            setBanners(shuffled.slice(0, 2) as Banner[]);
          } else {
            setBanners(shuffled.slice(0, 1) as Banner[]);
          }
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
    if (position === "top") {
      return (
        <div className="flex flex-row gap-2">
          <Skeleton className="aspect-square w-1/2 rounded-xl" />
          <Skeleton className="aspect-square w-1/2 rounded-xl" />
        </div>
      );
    }
    if (position === "bottom") {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="hidden aspect-square w-full rounded-xl lg:block" />
        </div>
      );
    }
    return <Skeleton className="aspect-square w-full rounded-xl" />;
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
          className="aspect-square w-full object-cover"
        />
      </div>
    );

    const sizeClass = banners.length > 1 && position !== "bottom"
      ? "flex-1 min-w-0"
      : "w-full";

    if (banner.link_url) {
      return (
        <a
          key={banner.id}
          href={banner.link_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleClick(banner.id)}
          className={`block ${sizeClass}`}
        >
          {image}
        </a>
      );
    }

    return (
      <div key={banner.id} className={sizeClass}>
        {image}
      </div>
    );
  };

  if (position === "bottom") {
    const cols = banners.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
    return (
      <div className={`grid grid-cols-1 gap-4 ${cols}`}>
        {banners.map((b) => renderBanner(b, true))}
      </div>
    );
  }

  if (banners.length > 1) {
    return (
      <div className="flex flex-row gap-2">
        {banners.map((b) => renderBanner(b, true))}
      </div>
    );
  }

  return renderBanner(banners[0], true);
};

export default BannerAd;
