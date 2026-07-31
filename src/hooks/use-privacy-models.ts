import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const EDGE_FUNC_URL = "https://lymjjozpdsdoloahsyey.functions.supabase.co/image-proxy";

/**
 * Proxy a Privacy image URL through our edge function.
 * Privacy images are protected by CloudFront Lambda and return 403 for external requests.
 * Our edge function fetches them server-side with proper headers and returns the image.
 */
export function proxyPrivacyImage(url: string | null): string | null {
  if (!url) return null;
  if (!url.includes("image.privacy.com.br")) return url;
  return `${EDGE_FUNC_URL}?url=${encodeURIComponent(url)}`;
}

export interface PrivacyModel {
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
  featured_type: string | null; // 'creadora' | 'top_creator' | null
  is_active: boolean;
  created_at?: string;
}

/** Extended model with proxied image URLs */
export interface PrivacyModelWithProxy extends PrivacyModel {
  proxied_avatar: string;
  proxied_cover: string | null;
}

async function fetchPrivacyModels(search?: string, perPage: number = 50, filterFree?: boolean, excludeFeatured?: boolean): Promise<{
  models: PrivacyModel[];
  totalCount: number;
}> {
  let query = supabase
    .from("privacy_models")
    .select("*", { count: "exact" })
    .eq("is_active", true);

  // filterFree: true = only free (ranking >= 900), false = only premium (ranking < 900), undefined = all
  if (filterFree !== undefined) {
    query = filterFree
      ? query.gte("ranking", 900)
      : query.lt("ranking", 900);
  }

  if (excludeFeatured) {
    query = query.eq("featured", false);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,profile_name.ilike.%${search}%`);
  }

  query = query.order("ranking", { ascending: true });
  query = query.limit(perPage);

  const { data, error, count } = await query;
  if (error) throw error;
  return { models: (data as PrivacyModel[]) || [], totalCount: count || 0 };
}

/** Fetch featured models with featured_type = 'top_creator' (👑 Top Creators section) */
async function fetchFeaturedPrivacyModels(): Promise<PrivacyModel[]> {
  const { data, error } = await supabase
    .from("privacy_models")
    .select("*")
    .eq("featured", true)
    .eq("featured_type", "top_creator")
    .eq("is_active", true)
    .order("ranking", { ascending: true })
    .limit(16);

  if (error) throw error;
  return (data as PrivacyModel[]) || [];
}

/** Fetch featured models with featured_type = 'creadora' (⭐ Criadoras em Destaque section - Privacy models) */
async function fetchCreadoraPrivacyModels(): Promise<PrivacyModel[]> {
  const { data, error } = await supabase
    .from("privacy_models")
    .select("*")
    .eq("featured", true)
    .eq("featured_type", "creadora")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data as PrivacyModel[]) || [];
}

export function usePrivacyModels(search?: string, perPage: number = 50, filterFree?: boolean, excludeFeatured?: boolean) {
  return useQuery({
    queryKey: ["privacy-models", search, perPage, filterFree, excludeFeatured],
    queryFn: () => fetchPrivacyModels(search, perPage, filterFree, excludeFeatured),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    select: (data) => ({
      ...data,
      models: data.models.map((m) => ({
        ...m,
        proxied_avatar: proxyPrivacyImage(m.avatar_url) || m.avatar_url,
        proxied_cover: proxyPrivacyImage(m.cover_url),
      })) as PrivacyModelWithProxy[],
    }),
  });
}

export function useFeaturedPrivacyModels() {
  return useQuery({
    queryKey: ["featured-privacy-models"],
    queryFn: fetchFeaturedPrivacyModels,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    select: (data) =>
      data.map((m) => ({
        ...m,
        proxied_avatar: proxyPrivacyImage(m.avatar_url) || m.avatar_url,
        proxied_cover: proxyPrivacyImage(m.cover_url),
      })) as PrivacyModelWithProxy[],
  });
}

export function useCreadoraPrivacyModels() {
  return useQuery({
    queryKey: ["creadora-privacy-models"],
    queryFn: fetchCreadoraPrivacyModels,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    select: (data) =>
      data.map((m) => ({
        ...m,
        proxied_avatar: proxyPrivacyImage(m.avatar_url) || m.avatar_url,
        proxied_cover: proxyPrivacyImage(m.cover_url),
      })) as PrivacyModelWithProxy[],
  });
}
