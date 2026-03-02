import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

async function fetchAllBanners(): Promise<Banner[]> {
  const { data } = await supabase
    .from("banners")
    .select("*")
    .eq("is_active", true);
  return (data as Banner[]) || [];
}

export function useAllBanners() {
  return useQuery({
    queryKey: ["banners"],
    queryFn: fetchAllBanners,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

export function useBannersForPosition(position: "top" | "middle" | "bottom") {
  const { data: allBanners, isLoading } = useAllBanners();

  if (!allBanners) return { banners: [], heroBanner: null, loading: isLoading };

  const heroPosition = position === "top" ? "hero" : `hero_${position}`;
  const heroes = allBanners.filter((b) => b.position === heroPosition && b.video_url);
  
  if (heroes.length > 0) {
    const selected = heroes[Math.floor(Math.random() * heroes.length)];
    return { banners: [], heroBanner: selected, loading: false };
  }

  const positionBanners = allBanners.filter((b) => b.position === position);
  let selected: Banner[];

  if (position === "bottom") {
    selected = positionBanners;
  } else {
    const shuffled = [...positionBanners].sort(() => Math.random() - 0.5);
    selected = position === "top" ? shuffled.slice(0, 2) : shuffled.slice(0, 1);
  }

  return { banners: selected, heroBanner: null, loading: false };
}

export type { Banner };
