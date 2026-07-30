import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { proxyPrivacyImage } from "./use-privacy-models";

export interface FreePrivacyModel {
  id: number;
  name: string;
  profile_name: string;
  is_verified: boolean;
  gender: string | null;
  avatar_url: string;
  cover_url: string | null;
  privacy_link: string;
  ranking: number;
  featured: boolean;
  is_active: boolean;
  is_free: boolean;
  created_at?: string;
}

export interface FreePrivacyModelWithProxy extends FreePrivacyModel {
  proxied_avatar: string;
  proxied_cover: string | null;
}

async function fetchFreePrivacyModels(): Promise<FreePrivacyModel[]> {
  const { data, error } = await supabase
    .from("privacy_free_models")
    .select("*")
    .eq("is_active", true)
    .eq("is_free", true)
    .order("ranking", { ascending: true })
    .limit(30);

  if (error) throw error;
  return (data as FreePrivacyModel[]) || [];
}

export function useFreePrivacyModels() {
  return useQuery({
    queryKey: ["free-privacy-models"],
    queryFn: fetchFreePrivacyModels,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    select: (data) =>
      data.map((m) => ({
        ...m,
        proxied_avatar: proxyPrivacyImage(m.avatar_url) || m.avatar_url,
        proxied_cover: proxyPrivacyImage(m.cover_url),
      })) as FreePrivacyModelWithProxy[],
  });
}
