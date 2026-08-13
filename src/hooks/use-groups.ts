import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Grupo } from "@/data/mock";

const PER_PAGE_MOBILE = 20;
const PER_PAGE_DESKTOP = 24;
const PER_PAGE = 20;
const PHOTO_PRIORITY_PAGES = 5;

interface UseGroupsParams {
  sort: string;
  search: string;
  page: number;
  perPage: number;
}

async function fetchFeaturedGroups(): Promise<Grupo[]> {
  const { data } = await supabase
    .from("groups")
    .select("*")
    .eq("featured", true)
    .or("hidden.is.null,hidden.eq.false")
    .order("created_at", { ascending: false })
    .limit(16);
  return (data as Grupo[]) || [];
}

async function fetchPremiumGroups(): Promise<Grupo[]> {
  const { data } = await supabase
    .from("groups")
    .select("*")
    .eq("featured", true)
    .or("hidden.is.null,hidden.eq.false")
    .order("created_at", { ascending: false })
    .limit(20);
  return (data as Grupo[]) || [];
}

async function fetchGroups({ sort, search, page, perPage }: UseGroupsParams) {
  const from = (page - 1) * perPage;

  // ── Em alta: score = views + clicks_count + member_count (últimos 30 dias) ──
  if (sort === "hot") {
    const { data, error } = await (supabase as any).rpc("get_hot_groups", {
      p_limit: perPage,
      p_offset: from,
      p_search: search || null,
    });
    if (error) throw error;
    const rows = (data as any[]) || [];
    const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;
    return {
      groups: rows.map(({ total_count, ...g }: any) => g) as Grupo[],
      totalCount,
    };
  }

  // ── Outros filtros ────────────────────────────────────────────────────────
  let countQuery = supabase.from("groups").select("*", { count: "exact", head: true });
  if (!search) countQuery = countQuery.eq("is_premium", false);
  if (search) countQuery = countQuery.ilike("name", `%${search}%`);
  countQuery = countQuery.or("hidden.is.null,hidden.eq.false");
  const { count } = await countQuery;

  let query = supabase.from("groups").select("*");
  if (!search) query = query.eq("is_premium", false);
  if (search) query = query.ilike("name", `%${search}%`);
  query = query.or("hidden.is.null,hidden.eq.false");

  // Nas primeiras 5 páginas, priorizar grupos com thumbnail
  if (page <= PHOTO_PRIORITY_PAGES) {
    // Order: has_thumbnail DESC first, then by the requested sort
    switch (sort) {
      case "vistos":
        query = query.order("has_thumbnail", { ascending: false }).order("views", { ascending: false });
        break;
      case "votados":
        query = query.order("has_thumbnail", { ascending: false }).order("member_count", { ascending: false });
        break;
      case "recentes":
      default:
        query = query.order("has_thumbnail", { ascending: false }).order("created_at", { ascending: false });
    }
  } else {
    // Páginas após a 5a, ordem normal
    switch (sort) {
      case "vistos":
        query = query.order("views", { ascending: false });
        break;
      case "votados":
        query = query.order("member_count", { ascending: false });
        break;
      case "recentes":
      default:
        query = query.order("created_at", { ascending: false });
    }
  }

  const to = from + perPage - 1;
  query = query.range(from, to);
  const { data, error } = await query;
  if (error) throw error;
  return { groups: (data as Grupo[]) || [], totalCount: count || 0 };
}

export function useFeaturedGroups() {
  return useQuery({
    queryKey: ["featured-groups"],
    queryFn: fetchFeaturedGroups,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
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

export function useGroupDetail(slugParam: string | undefined) {
  return useQuery({
    queryKey: ["group", slugParam],
    queryFn: async () => {
      if (!slugParam) throw new Error("No slug");
      
      const { data: bySlug } = await supabase
        .from("groups")
        .select("*")
        .eq("slug", slugParam)
        .maybeSingle();
      
      if (bySlug) return bySlug as Grupo;

      const shortMatch = slugParam.match(/([a-f0-9]{8})$/);
      if (shortMatch) {
        const { data: byShortId } = await supabase
          .from("groups")
          .select("*")
          .ilike("slug", `%-${shortMatch[1]}`)
          .maybeSingle();
        if (byShortId) return byShortId as Grupo;
      }

      const fullMatch = slugParam.match(/([a-f0-9]{32})$/);
      if (fullMatch) {
        const hex = fullMatch[1];
        const uuid = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
        const { data: byId } = await supabase
          .from("groups")
          .select("*")
          .eq("id", uuid)
          .maybeSingle();
        if (byId) return byId as Grupo | null;
      }
      
      return null;
    },
    enabled: !!slugParam,
    staleTime: 2 * 60 * 1000,
  });
}

export function useRelatedGroups(category: string | undefined, excludeId: string | undefined) {
  return useQuery({
    queryKey: ["related-groups", category, excludeId],
    queryFn: async () => {
      if (!category || !excludeId) return [];
      const { data } = await supabase
        .from("groups")
        .select("*")
        .eq("category", category)
        .neq("id", excludeId)
        .or("hidden.is.null,hidden.eq.false")
        .limit(8);
      return ((data as Grupo[]) || []).sort(() => Math.random() - 0.5);
    },
    enabled: !!category && !!excludeId,
    staleTime: 2 * 60 * 1000,
  });
}

export { PER_PAGE_MOBILE, PER_PAGE_DESKTOP };
