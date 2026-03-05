import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Grupo } from "@/data/mock";

const PER_PAGE_MOBILE = 20;
const PER_PAGE_DESKTOP = 24;

interface UseGroupsParams {
  sort: string;
  search: string;
  page: number;
  perPage: number;
}

async function fetchPremiumGroups(): Promise<Grupo[]> {
  const { data } = await supabase.from("groups").select("*").eq("is_premium", true).limit(50);
  if (!data) return [];
  const pinned = (data as any[]).filter((g) => g.is_pinned);
  const unpinned = (data as any[]).filter((g) => !g.is_pinned).sort(() => Math.random() - 0.5);
  return [...pinned, ...unpinned].slice(0, 10) as Grupo[];
}

async function fetchGroups({ sort, search, page, perPage }: UseGroupsParams) {
  let countQuery = supabase.from("groups").select("*", { count: "exact", head: true });
  if (!search) countQuery = countQuery.eq("is_premium", false);
  if (search) countQuery = countQuery.ilike("name", `%${search}%`);
  const { count } = await countQuery;

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase.from("groups").select("*");
  if (!search) query = query.eq("is_premium", false);
  if (search) query = query.ilike("name", `%${search}%`);

  switch (sort) {
    case "vistos":
      query = query.order("views", { ascending: false });
      break;
    case "votados":
      query = query.order("member_count", { ascending: false });
      break;
    case "hot":
    default:
      query = query.order("created_at", { ascending: false });
  }

  query = query.range(from, to);
  const { data, error } = await query;
  if (error) throw error;
  return { groups: (data as Grupo[]) || [], totalCount: count || 0 };
}

export function usePremiumGroups() {
  return useQuery({
    queryKey: ["premium-groups"],
    queryFn: fetchPremiumGroups,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useGroups(params: UseGroupsParams) {
  return useQuery({
    queryKey: ["groups", params.sort, params.search, params.page, params.perPage],
    queryFn: () => fetchGroups(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useGroupDetail(groupId: string | undefined) {
  return useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      if (!groupId) throw new Error("No ID");
      const { data, error } = await supabase.from("groups").select("*").eq("id", groupId).maybeSingle();
      if (error) throw error;
      return data as Grupo | null;
    },
    enabled: !!groupId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useRelatedGroups(category: string | undefined, excludeId: string | undefined) {
  return useQuery({
    queryKey: ["related-groups", category, excludeId],
    queryFn: async () => {
      if (!category || !excludeId) return [];
      const { data } = await supabase.from("groups").select("*").eq("category", category).neq("id", excludeId).limit(8);
      return ((data as Grupo[]) || []).sort(() => Math.random() - 0.5);
    },
    enabled: !!category && !!excludeId,
    staleTime: 2 * 60 * 1000,
  });
}

export { PER_PAGE_MOBILE, PER_PAGE_DESKTOP };
