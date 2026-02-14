import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  position: string;
  is_active: boolean;
  expires_at: string | null;
  clicks: number;
}

interface BannerAdProps {
  position?: "top" | "middle" | "bottom";
}

const BannerAd = ({ position = "top" }: BannerAdProps) => {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanner = async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("position", position);

      if (data && data.length > 0) {
        const selected = data[Math.floor(Math.random() * data.length)] as Banner;
        setBanner(selected);
      }
      setLoading(false);
    };

    fetchBanner();
  }, [position]);

  const handleClick = () => {
    if (banner?.id) {
      supabase.rpc("increment_banner_clicks" as never, { banner_id: banner.id } as never).then(() => {}, () => {});
    }
  };

  if (loading) {
    return <Skeleton className="h-[50px] w-full rounded-xl sm:h-[90px]" />;
  }

  if (!banner) {
    return (
      <div className="flex h-[50px] w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 sm:h-[90px]">
        <span className="text-xs text-muted-foreground">Espaço disponível para anúncio</span>
      </div>
    );
  }

  const image = (
    <div className="relative w-full overflow-hidden rounded-xl">
      <img
        src={banner.image_url}
        alt={banner.title}
        className="h-[50px] w-full object-cover sm:h-[90px]"
        loading="lazy"
      />
      <span className="absolute right-2 top-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white/70">
        Anúncio
      </span>
    </div>
  );

  if (banner.link_url) {
    return (
      <a
        href={banner.link_url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="block"
      >
        {image}
      </a>
    );
  }

  return image;
};

export default BannerAd;
