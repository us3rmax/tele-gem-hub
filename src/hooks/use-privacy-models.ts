import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  is_active: boolean;
  created_at?: string;
}

async function fetchPrivacyModels(search?: string, perPage: number = 50): Promise<{
  models: PrivacyModel[];
  totalCount: number;
}> {
  let query = supabase
    .from("privacy_models")
    .select("*", { count: "exact" })
    .eq("is_active", true);

  if (search) {
    query = query.or(`name.ilike.%${search}%,profile_name.ilike.%${search}%`);
  }

  query = query.order("ranking", { ascending: true });
  query = query.limit(perPage);

  const { data, error, count } = await query;
  if (error) throw error;
  return { models: (data as PrivacyModel[]) || [], totalCount: count || 0 };
}

async function fetchFeaturedPrivacyModels(): Promise<PrivacyModel[]> {
  const { data, error } = await supabase
    .from("privacy_models")
    .select("*")
    .eq("featured", true)
    .eq("is_active", true)
    .order("ranking", { ascending: true })
    .limit(16);

  if (error) throw error;
  return (data as PrivacyModel[]) || [];
}

export function usePrivacyModels(search?: string, perPage: number = 50) {
  return useQuery({
    queryKey: ["privacy-models", search, perPage],
    queryFn: () => fetchPrivacyModels(search, perPage),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useFeaturedPrivacyModels() {
  return useQuery({
    queryKey: ["featured-privacy-models"],
    queryFn: fetchFeaturedPrivacyModels,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
