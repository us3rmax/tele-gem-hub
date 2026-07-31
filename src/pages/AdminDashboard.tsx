import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import MobileSidebar from "@/components/MobileSidebar";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { generateSlug } from "@/lib/slug";

import {
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Loader2,
  Undo2,
  Image as ImageIcon,
  Plus,
  Pencil,
  Trash2,
  LayoutDashboard,
  Upload,
  X,
  ArrowRight,
  FileEdit,
  Star,
  Copy,
  Search,
  BarChart2,
  WifiOff,
  Pencil,
} from "lucide-react";
import SEODashboard from "@/components/admin/SEODashboard";

const CLOUDFLARE_ZONE_ID = "bb4b94d6f93ea90dd6151cb209edfba6"; // Provided by user

const GROUP_CATEGORIES = [
  "geral",
  "putaria",
  "onlyfans",
  "privacy",
  "amadoras",
  "gay",
  "vazados",
  "fetiche",
  "casadas",
  "trans",
  "hentai",
  "celebridades",
  "latina",
  "asiaticas",
  "novinhas",
  "interracial",
  "bdsm",
  "bbw",
  "coroas",
  "negras",
  "lesbicas",
];
const CATEGORY_LABELS: Record<string, string> = {
  geral: "Geral",
  putaria: "Putaria",
  onlyfans: "OnlyFans",
  privacy: "Privacy",
  amadoras: "Amadoras",
  gay: "Gay",
  vazados: "Vazados",
  fetiche: "Fetiche",
  casadas: "Casadas",
  trans: "Trans",
  hentai: "Hentai",
  celebridades: "Celebridades",
  latina: "Latina",
  asiaticas: "Asiáticas",
  novinhas: "Novinhas",
  interracial: "Interracial",
  bdsm: "BDSM",
  bbw: "BBW",
  coroas: "Coroas",
  negras: "Negras",
  lesbicas: "Lésbicas",
};
const SUPABASE_URL_CONST = "https://lymjjozpdsdoloahsyey.supabase.co";
const SUPABASE_ANON_KEY_CONST =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5bWpqb3pwZHNkb2xvYWhzeWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODgxMDQsImV4cCI6MjA4NjU2NDEwNH0.dC2d16T0DHt67rDr4RFuTU4hg79vxj0YUGf91xdxdBs";

// --- Types ---

interface AllGroup {
  id: string;
  name: string;
  category: string;
  thumbnail_url: string | null;
  is_premium: boolean;
  is_pinned: boolean;
  is_verified: boolean;
  member_count: number;
  created_at: string;
  source: string;
  submitted_by: string | null;
  featured: boolean;
}

interface Submission {
  id: string;
  name: string;
  description: string | null;
  category: string;
  telegram_link: string;
  thumbnail_url: string | null;
  submitted_by: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  is_paid: boolean | null;
  payment_type: string | null;
}

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  position: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface EditRequest {
  id: string;
  group_id: string;
  requested_by: string;
  changes: Record<string, string>;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  // joined data
  group?: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    telegram_link: string;
    thumbnail_url: string | null;
  };
  requester_email?: string;
}

// --- Component ---

const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  // URL-driven navigation — useParams substitui useState
  const { mainTab = "grupos", subTab } = useParams<{ mainTab?: string; subTab?: string }>();

  const _subToTab: Record<string, string> = {
    pendentes: "pending",  aprovados: "approved",  rejeitados: "rejected",
    edicoes:   "edits",    premium:   "premium",   todos:      "grupos",
    destaques: "destaques", quebrados: "broken",
  };
  const _tabToSub: Record<string, string> = {
    pending:  "pendentes", approved: "aprovados",  rejected: "rejeitados",
    edits:    "edicoes",   premium:  "premium",    grupos:   "todos",
    destaques: "destaques", broken:   "quebrados",
  };

  const mainSection = (
    mainTab === "categorias"     ? "categorias"    :
    mainTab === "banners"        ? "banners"       :
    mainTab === "seo"            ? "seo"           :
    mainTab === "privacy_models" ? "privacy_models":
    "grupos_section"
  ) as "grupos_section" | "categorias" | "banners" | "seo" | "privacy_models";

  const activeTab =
    mainTab === "grupos"         ? (_subToTab[subTab ?? ""] ?? "pending") :
    mainTab === "banners"        ? "banners"    :
    mainTab === "categorias"     ? "categorias" :
    mainTab === "seo"            ? "seo"        :
    mainTab === "privacy_models" ? "privacy_models" :
    "pending";

  // Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Submission | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Banners state
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteBannerId, setDeleteBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: "",
    image_url: "",
    link_url: "",
    position: "top",
    expires_at: "",
  });
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerPhotoFile, setBannerPhotoFile] = useState<File | null>(null);
  const [bannerPhotoPreview, setBannerPhotoPreview] = useState<string | null>(null);
  const [bannerPhotoError, setBannerPhotoError] = useState<string | null>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);
  const [bannerVideoFile, setBannerVideoFile] = useState<File | null>(null);
  const [bannerVideoPreview, setBannerVideoPreview] = useState<string | null>(null);
  const [bannerVideoError, setBannerVideoError] = useState<string | null>(null);
  const bannerVideoRef = useRef<HTMLInputElement>(null);

  // Manual group creation state
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupSaving, setGroupSaving] = useState(false);
  const [groupPhotoFile, setGroupPhotoFile] = useState<File | null>(null);
  const [groupPhotoPreview, setGroupPhotoPreview] = useState<string | null>(null);
  const groupFileRef = useRef<HTMLInputElement>(null);
  const [groupForm, setGroupForm] = useState({
    name: "",
    category: "",
    telegram_link: "",
    description: "",
    member_count: "",
    is_premium: false,
    is_verified: false,
    featured: false,
  });
  const [groupErrors, setGroupErrors] = useState<Record<string, string>>({});

  // Edit requests state
  const [editRequests, setEditRequests] = useState<EditRequest[]>([]);
  const [editRequestsLoading, setEditRequestsLoading] = useState(false);
  const [editRejectModalOpen, setEditRejectModalOpen] = useState(false);
  const [editRejectTarget, setEditRejectTarget] = useState<EditRequest | null>(null);
  const [editRejectReason, setEditRejectReason] = useState("");

  // Groups tab state
  const [groupsSourceFilter, setGroupsSourceFilter] = useState<"all" | "imported" | "user">("all");
  const [allGroups, setAllGroups] = useState<AllGroup[]>([]);
  const [allGroupsLoading, setAllGroupsLoading] = useState(false);
  const [allGroupsSearch, setAllGroupsSearch] = useState("");
  const allGroupsSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Premium groups state
  interface PremiumGroup {
    id: string;
    name: string;
    category: string;
    thumbnail_url: string | null;
    is_premium: boolean;
    is_pinned: boolean;
    member_count: number;
    created_at: string;
    source: string;
    description: string | null;
    telegram_link: string;
  }
  const [premiumGroups, setPremiumGroups] = useState<PremiumGroup[]>([]);
  const [brokenGroups, setBrokenGroups] = useState<{ id: string; name: string; telegram_link: string }[]>([]);
  const [brokenGroupsLoading, setBrokenGroupsLoading] = useState(false);
  const [brokenLinkEdits, setBrokenLinkEdits] = useState<Record<string, string>>({});
  const [brokenSelected, setBrokenSelected] = useState<Set<string>>(new Set());
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [premiumSearch, setPremiumSearch] = useState("");

  // Edit/Delete group state
  const [editingGroupData, setEditingGroupData] = useState<{
    id: string;
    name: string;
    category: string;
    telegram_link: string;
    description: string | null;
    thumbnail_url: string | null;
    member_count: number;
    is_premium: boolean;
    is_verified: boolean;
  } | null>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  // Categories tab state
  interface CategoryCover {
    slug: string;
    label: string;
    coverUrl: string | null;
    count: number;
  }
  const [categoriesData, setCategoriesData] = useState<CategoryCover[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryUploadingSlug, setCategoryUploadingSlug] = useState<string | null>(null);
  const categoryFileRef = useRef<HTMLInputElement>(null);
  const [categoryUploadTarget, setCategoryUploadTarget] = useState<string | null>(null);
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, authLoading, navigate]);

  // --- Submissions logic ---

  const purgeCloudflareCache = async (urls: string[]) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "purge-cloudflare-cache",
        {
          body: JSON.stringify({ urls }),
          headers: { "Content-Type": "application/json" },
        }
      );
      if (error) {
        console.error("Erro ao purgar cache do Cloudflare:", error);
        toast({ title: "Erro ao purgar cache do Cloudflare", description: error.message, variant: "destructive" });
      } else {
        console.log("Cache do Cloudflare purgado com sucesso:", data);
      }
    } catch (error: any) {
      console.error("Erro ao chamar Edge Function de purga de cache:", error);
      toast({ title: "Erro ao chamar Edge Function de purga de cache", description: error.message, variant: "destructive" });
    }
  };

  const fetchSubmissions = useCallback(async (status: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("group_submissions")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching submissions:", error);
      setSubmissions([]);
    } else {
      const sorted = ((data as Submission[]) || []).sort((a, b) => {
        if (a.is_paid && !b.is_paid) return -1;
        if (!a.is_paid && b.is_paid) return 1;
        return 0;
      });
      setSubmissions(sorted);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user || !isAdmin) return;
    if (activeTab === "banners") {
      fetchBanners();
    } else if (activeTab === "edits") {
      fetchEditRequests();
    } else if (activeTab === "premium") {
      fetchPremiumGroups();
    } else if (activeTab === "grupos") {
      fetchAllGroups();
    } else if (activeTab === "broken") {
      fetchBrokenGroups();
    } else if (activeTab === "categorias") {
      fetchCategories();
    } else if (activeTab === "privacy_models") {
      fetchPrivacyModels();
    } else {
      fetchSubmissions(activeTab);
    }
  }, [activeTab, user, isAdmin, fetchSubmissions]);

  const handleApprove = async (sub: Submission) => {
    setActionLoading(sub.id);
    const uniqueSlug = `${generateSlug(sub.name)}-${sub.id.replace(/-/g, "").slice(0, 8)}`;
    const { error: insertError } = await supabase.from("groups").insert({
      name: sub.name,
      description: sub.description,
      category: sub.category,
      telegram_link: sub.telegram_link,
      thumbnail_url: sub.thumbnail_url,
      slug: uniqueSlug,
      is_premium: false,
      is_verified: false,
      member_count: 0,
      views: 0,
      source: "user",
    } as any);

    if (insertError) {
      toast({ title: "Erro ao aprovar", description: insertError.message, variant: "destructive" });
      setActionLoading(null);
      return;
    }

    const { error: updateError } = await supabase
      .from("group_submissions")
      .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: user!.id })
      .eq("id", sub.id);

    if (updateError) {
      toast({ title: "Erro ao atualizar status", description: updateError.message, variant: "destructive" });
    } else {
      toast({ title: "Canal aprovado e publicado!" });
      setSubmissions((prev) => prev.filter((s) => s.id !== sub.id));
    }
    setActionLoading(null);
  };

  const openRejectModal = (sub: Submission) => {
    setRejectTarget(sub);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.id);

    const { error } = await supabase
      .from("group_submissions")
      .update({
        status: "rejected",
        rejection_reason: rejectReason.trim() || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user!.id,
      })
      .eq("id", rejectTarget.id);

    if (error) {
      toast({ title: "Erro ao rejeitar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Canal rejeitado" });
      setSubmissions((prev) => prev.filter((s) => s.id !== rejectTarget.id));
    }
    setRejectModalOpen(false);
    setRejectTarget(null);
    setActionLoading(null);
  };

  const handleRevert = async (sub: Submission) => {
    setActionLoading(sub.id);
    const { error } = await supabase
      .from("group_submissions")
      .update({ status: "pending", rejection_reason: null, reviewed_at: null, reviewed_by: null })
      .eq("id", sub.id);

    if (error) {
      toast({ title: "Erro ao reverter", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Enviado de volta para pendentes" });
      setSubmissions((prev) => prev.filter((s) => s.id !== sub.id));
    }
    setActionLoading(null);
  };

  // --- Manual Group Creation ---

  const handleGroupPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setGroupErrors((prev) => ({ ...prev, photo: "Imagem deve ter no máximo 2MB" }));
      return;
    }
    if (!file.type.startsWith("image/")) {
      setGroupErrors((prev) => ({ ...prev, photo: "Arquivo deve ser uma imagem" }));
      return;
    }
    setGroupPhotoFile(file);
    setGroupPhotoPreview(URL.createObjectURL(file));
    setGroupErrors((prev) => {
      const { photo, ...rest } = prev;
      return rest;
    });
  };

  const resetGroupModal = () => {
    setGroupForm({
      name: "",
      category: "",
      telegram_link: "",
      description: "",
      member_count: "",
      is_premium: false,
      is_verified: false,
      featured: false,
    });
    setGroupPhotoFile(null);
    setGroupPhotoPreview(null);
    setGroupErrors({});
    setEditingGroupData(null);
    setGroupModalOpen(false);
  };

  const openEditGroupModal = async (groupId: string) => {
    const { data, error } = await supabase
      .from("groups")
      .select("id, name, category, telegram_link, description, thumbnail_url, member_count, is_premium, is_verified, featured, slug")
      .eq("id", groupId)
      .maybeSingle();
    if (error || !data) {
      toast({ title: "Erro ao carregar grupo", variant: "destructive" });
      return;
    }
    setEditingGroupData(data as any);
    setGroupForm({
      name: data.name,
      category: data.category,
      telegram_link: data.telegram_link,
      description: data.description || "",
      member_count: String(data.member_count || ""),
      is_premium: data.is_premium,
      is_verified: data.is_verified,
      featured: data.featured || false,
    });
    setGroupPhotoPreview(data.thumbnail_url || null);
    setGroupPhotoFile(null);
    setGroupErrors({});
    setGroupModalOpen(true);
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroupId) return;
    const { error } = await supabase.from("groups").delete().eq("id", deleteGroupId);
    if (error) {
      toast({ title: "Erro ao excluir grupo", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Grupo excluído!" });
      setPremiumGroups((prev) => prev.filter((g) => g.id !== deleteGroupId));
      setAllGroups((prev) => prev.filter((g) => g.id !== deleteGroupId));
    }
    setDeleteGroupId(null);
  };

  const validateGroupForm = (isAdmin: boolean) => {
    const errors: Record<string, string> = {};
    if (!groupForm.name.trim()) errors.name = "Nome é obrigatório";
    if (!groupForm.category) errors.category = "Categoria é obrigatória";
    if (!groupForm.telegram_link.trim()) {
      errors.telegram_link = "Link é obrigatório";
    } else if (!isAdmin && !groupForm.telegram_link.startsWith("https://t.me/")) {
      errors.telegram_link = "Link deve começar com https://t.me/";
    }
    if (!editingGroupData && !groupPhotoFile) errors.photo = "Foto é obrigatória";
    setGroupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGroupSave = async () => {
    if (!validateGroupForm(isAdmin) || !user) return;
    setGroupSaving(true);

    let publicUrl = editingGroupData?.thumbnail_url || null;

    // Upload photo if new file selected
    if (groupPhotoFile) {
      const ext = groupPhotoFile.name.split(".").pop();
      const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("group-photos")
        .upload(filePath, groupPhotoFile, { contentType: groupPhotoFile.type });

      if (uploadError) {
        toast({ title: "Erro ao enviar foto", description: uploadError.message, variant: "destructive" });
        setGroupSaving(false);
        return;
      }
      publicUrl = supabase.storage.from("group-photos").getPublicUrl(filePath).data.publicUrl;
    }

    const payload: any = {
      name: groupForm.name.trim(),
      category: groupForm.category,
      telegram_link: groupForm.telegram_link.trim(),
      description: groupForm.description.trim(),
      thumbnail_url: publicUrl,
      is_premium: groupForm.is_premium,
      is_verified: groupForm.is_verified,
      featured: groupForm.featured,
      member_count: groupForm.member_count ? parseInt(groupForm.member_count, 10) || 0 : 0,
    };

    if (editingGroupData) {
      const { error } = await supabase.from("groups").update(payload).eq("id", editingGroupData.id);
      if (error) {
        toast({ title: "Erro ao atualizar grupo", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Grupo atualizado com sucesso!" });
        resetGroupModal();
        // Refresh relevant lists
        if (activeTab === "premium") fetchPremiumGroups();
        if (activeTab === "grupos" || activeTab === "destaques") fetchAllGroups();
      }
    } else {
      const { error } = await supabase.from("groups").insert({
        ...payload,
        slug: `${generateSlug(groupForm.name)}-${crypto.randomUUID().split("-")[0]}`,
        views: 0,
        source: "imported",
      });
      if (error) {
        toast({ title: "Erro ao criar grupo", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Grupo adicionado com sucesso!" });
        resetGroupModal();
      }
    }
    setGroupSaving(false);
  };

  // --- Edit Requests logic ---

  const fetchEditRequests = async () => {
    setEditRequestsLoading(true);
    const { data, error } = await supabase
      .from("group_edit_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching edit requests:", error);
      setEditRequests([]);
      setEditRequestsLoading(false);
      return;
    }

    const requests = (data || []) as EditRequest[];

    // Fetch group data and requester emails
    const groupIds = [...new Set(requests.map((r) => r.group_id))];
    const userIds = [...new Set(requests.map((r) => r.requested_by))];

    const [{ data: groupsData }, { data: profilesData }] = await Promise.all([
      groupIds.length > 0
        ? supabase
            .from("groups")
            .select("id, name, description, category, telegram_link, thumbnail_url, slug")
            .in("id", groupIds)
        : Promise.resolve({ data: [] }),
      userIds.length > 0
        ? supabase.from("profiles").select("id, email").in("id", userIds)
        : Promise.resolve({ data: [] }),
    ]);

    const groupMap = new Map((groupsData || []).map((g: any) => [g.id, g]));
    const profileMap = new Map((profilesData || []).map((p: any) => [p.id, p.email]));

    const enriched = requests.map((r) => ({
      ...r,
      group: groupMap.get(r.group_id) || undefined,
      requester_email: profileMap.get(r.requested_by) || "Desconhecido",
    }));

    setEditRequests(enriched);
    setEditRequestsLoading(false);
  };

  const handleApproveEdit = async (req: EditRequest) => {
    if (!req.group || !user) return;
    setActionLoading(req.id);

    // Apply changes to group
    const updatePayload: any = {};
    Object.entries(req.changes).forEach(([key, value]) => {
      updatePayload[key] = value;
    });

    const { error: updateGroupError } = await supabase.from("groups").update(updatePayload).eq("id", req.group_id);

    if (updateGroupError) {
      toast({ title: "Erro ao aplicar alterações", description: updateGroupError.message, variant: "destructive" });
      setActionLoading(null);
      return;
    }

    const { error } = await supabase
      .from("group_edit_requests")
      .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: user.id })
      .eq("id", req.id);

    if (error) {
      toast({ title: "Erro ao atualizar solicitação", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Alterações aprovadas!" });
      setEditRequests((prev) => prev.filter((r) => r.id !== req.id));
    }
    setActionLoading(null);
  };

  const openEditRejectModal = (req: EditRequest) => {
    setEditRejectTarget(req);
    setEditRejectReason("");
    setEditRejectModalOpen(true);
  };

  const handleRejectEdit = async () => {
    if (!editRejectTarget || !user) return;
    setActionLoading(editRejectTarget.id);

    const { error } = await supabase
      .from("group_edit_requests")
      .update({
        status: "rejected",
        rejection_reason: editRejectReason.trim() || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", editRejectTarget.id);

    if (error) {
      toast({ title: "Erro ao rejeitar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Edição rejeitada" });
      setEditRequests((prev) => prev.filter((r) => r.id !== editRejectTarget.id));
    }
    setEditRejectModalOpen(false);
    setEditRejectTarget(null);
    setActionLoading(null);
  };

  // --- All Groups logic ---


  const toggleFeatured = async (group: AllGroup) => {
    const newVal = !group.featured;
    const { error } = await supabase
      .from("groups")
      .update({ featured: newVal })
      .eq("id", group.id);
    if (!error) {
      setAllGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, featured: newVal } : g))
      );
      toast({ title: newVal ? "⭐ Destacado!" : "Destaque removido", duration: 1500 });
    }
  };

  const fetchAllGroups = async (search = "") => {
    setAllGroupsLoading(true);
    let query = supabase
      .from("groups")
      .select(
        "id, name, category, thumbnail_url, is_premium, is_pinned, is_verified, member_count, created_at, source, submitted_by, featured",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (search.trim()) query = query.ilike("name", "%" + search.trim() + "%");
    const { data, error } = await query;
    if (error) {
      console.error("Error fetching all groups:", error);
      setAllGroups([]);
    } else {
      setAllGroups((data as any as AllGroup[]) || []);
    }
    setAllGroupsLoading(false);
  };

  useEffect(() => {
    if (allGroupsSearchTimer.current) clearTimeout(allGroupsSearchTimer.current);
    allGroupsSearchTimer.current = setTimeout(() => fetchAllGroups(allGroupsSearch), 400);
    return () => { if (allGroupsSearchTimer.current) clearTimeout(allGroupsSearchTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allGroupsSearch]);

  const fetchCategories = async () => {
    setCategoriesLoading(true);

    // Lista todos os arquivos category_*.jpg no bucket de uma vez
    const { data: storageFiles } = await supabase.storage.from("thumbnails").list("gruposdotelegram", { limit: 1000 }); // Increased limit to ensure all files are fetched
    console.log("Storage Files:", storageFiles);
    const coverSlugs = new Set<string>();
    GROUP_CATEGORIES.forEach(categorySlug => {
      const found = (storageFiles || []).some(f => {
        console.log(`Processing file: ${f.name}`); // Adicionar este log
        const fileNameWithoutExtension = f.name.replace(/\.[^/.]+$/, "").toLowerCase(); // Converter para minúsculas para comparação
        console.log(`Normalized file name: ${fileNameWithoutExtension}, comparing with categorySlug: ${categorySlug.toLowerCase()}`); // Adicionar este log

        // Check for exact matches of {slug}.jpg or {slug}.webp
        const expectedJpg = `${categorySlug.toLowerCase()}.jpg`;
        const expectedWebp = `${categorySlug.toLowerCase()}.webp`;
        return f.name.toLowerCase() === expectedJpg || f.name.toLowerCase() === expectedWebp;
      });
      if (found) {
        coverSlugs.add(categorySlug);
      }
    });
    console.log("Cover Slugs:", coverSlugs);

    const results = await Promise.all(
      GROUP_CATEGORIES.map(async (slug) => {
        // Se existe no bucket, monta a URL pública
        let coverUrl = null;
        if (coverSlugs.has(slug)) {
          // Prioritize .webp if it exists, otherwise use .jpg
          const webpExists = (storageFiles || []).some(f => f.name.toLowerCase() === `${slug.toLowerCase()}.webp`);
          const fileExtension = webpExists ? 'webp' : 'jpg';
          coverUrl = `${supabase.storage.from("thumbnails").getPublicUrl(`gruposdotelegram/${slug}.${fileExtension}`).data.publicUrl}?t=${new Date().getTime()}`;
        }
        console.log(`Category: ${slug}, Generated Cover URL: ${coverUrl}`);

        // Busca thumb do grupo com mais membros + contagem
        const [topGroup, countResult] = await Promise.all([
          supabase
            .from("groups")
            .select("thumbnail_url")
            .eq("category", slug)
            .not("thumbnail_url", "is", null)
            .order("member_count", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase.from("groups").select("*", { count: "exact", head: true }).eq("category", slug),
        ]);

        return {
          slug,
          label: CATEGORY_LABELS[slug] ?? slug,
          coverUrl,
          topGroupThumb: topGroup.data?.thumbnail_url ?? null,
          count: countResult.count ?? 0,
        };
      }),
    );
    setCategoriesData(results);
    setCategoriesLoading(false);
  };

  const handleCategoryPhotoUpload = async (slug: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo deve ser uma imagem", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem deve ter no máximo 5MB", variant: "destructive" });
      return;
    }
    setCategoryUploadingSlug(slug);
    const fileExtension = file.type === 'image/webp' ? 'webp' : 'jpg';
    const filePath = `gruposdotelegram/${slug}.${fileExtension}`;
    
    // Remove both .jpg and .webp versions to avoid conflicts and ensure clean update
    await supabase.storage.from("thumbnails").remove([`gruposdotelegram/${slug}.jpg`, `gruposdotelegram/${slug}.webp`]);
    
    const { error } = await supabase.storage
      .from("thumbnails")
      .upload(filePath, file, { contentType: file.type, upsert: true });

    if (error) {
      console.error("Erro no upload da categoria:", error);
      toast({ title: "Erro ao fazer upload", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Cover de ${CATEGORY_LABELS[slug]} atualizado!` });
      await fetchCategories();
      await purgeCloudflareCache([coverUrl]); // Purge specific URL
    }
    setCategoryUploadingSlug(null);
  };

  const handleCategoryPhotoRemove = async (slug: string) => {
    setCategoryUploadingSlug(slug);
    const { error } = await supabase.storage.from("thumbnails").remove([`gruposdotelegram/${slug}.jpg`, `gruposdotelegram/${slug}.webp`]);

    if (error) {
      toast({ title: "Erro ao remover foto", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Cover removido — voltando ao automático` });
      await fetchCategories();
      await purgeCloudflareCache([`https://lymjjozpdsdoloahsyey.supabase.co/storage/v1/object/public/thumbnails/gruposdotelegram/${slug}.jpg`, `https://lymjjozpdsdoloahsyey.supabase.co/storage/v1/object/public/thumbnails/gruposdotelegram/${slug}.webp`]); // Purge both possible URLs
    }
    setCategoryUploadingSlug(null);
  };

  // --- Premium Groups logic ---

  const fetchPremiumGroups = async () => {
    setPremiumLoading(true);
    const { data, error } = await supabase
      .from("groups")
      .select(
        "id, name, category, thumbnail_url, is_premium, is_pinned, member_count, created_at, source, description, telegram_link",
      )
      .eq("is_premium", true)
      .order("is_pinned", { ascending: false });
    if (error) {
      console.error("Error fetching premium groups:", error);
      setPremiumGroups([]);
    } else {
      setPremiumGroups((data as PremiumGroup[]) || []);
    }
    setPremiumLoading(false);
  };

  const fetchBrokenGroups = async () => {
    setBrokenGroupsLoading(true);
    const { data, error } = await supabase
      .from("groups")
      .select("id, name, telegram_link")
      .eq("broken", true)
      .order("name");
    if (error) {
      console.error("Error fetching broken groups:", error);
      setBrokenGroups([]);
    } else {
      setBrokenGroups(data || []);
      const edits: Record<string, string> = {};
      (data || []).forEach((g: { id: string; telegram_link: string }) => {
        edits[g.id] = g.telegram_link;
      });
      setBrokenLinkEdits(edits);
    }
    setBrokenGroupsLoading(false);
  };

  const handleSaveBrokenLink = async (groupId: string) => {
    const newLink = brokenLinkEdits[groupId]?.trim();
    if (!newLink) return;
    const { error } = await supabase
      .from("groups")
      .update({ telegram_link: newLink, broken: false })
      .eq("id", groupId);
    if (error) {
      toast({ title: "Erro ao salvar link", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Link atualizado!" });
      setBrokenGroups((prev) => prev.filter((g) => g.id !== groupId));
      setBrokenSelected((prev) => { const s = new Set(prev); s.delete(groupId); return s; });
    }
  };

  const handleSaveBrokenBulk = async () => {
    if (brokenSelected.size === 0) return;
    const updates = Array.from(brokenSelected).map((id) =>
      supabase.from("groups").update({ telegram_link: brokenLinkEdits[id]?.trim(), broken: false }).eq("id", id)
    );
    const results = await Promise.all(updates);
    const failed = results.filter((res) => res.error);
    if (failed.length > 0) {
      toast({ title: `${failed.length} erro(s) ao salvar`, variant: "destructive" });
    } else {
      toast({ title: `${brokenSelected.size} link(s) atualizados!` });
      setBrokenGroups((prev) => prev.filter((g) => !brokenSelected.has(g.id)));
      setBrokenSelected(new Set());
    }
  };

  const handleTogglePremium = async (groupId: string, newValue: boolean) => {
    const { error } = await supabase.from("groups").update({ is_premium: newValue }).eq("id", groupId);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status premium atualizado" });
      if (!newValue) {
        setPremiumGroups((prev) => prev.filter((g) => g.id !== groupId));
      }
    }
  };

  const handleMakePremium = async (subName: string, telegramLink: string) => {
    // Find the group by telegram_link to get its ID
    const { data, error } = await supabase.from("groups").select("id").eq("telegram_link", telegramLink).maybeSingle();
    if (error || !data) {
      toast({ title: "Grupo não encontrado na base", variant: "destructive" });
      return;
    }
    const { error: updateError } = await supabase.from("groups").update({ is_premium: true }).eq("id", data.id);
    if (updateError) {
      toast({ title: "Erro ao promover", description: updateError.message, variant: "destructive" });
    } else {
      toast({ title: "Grupo promovido a premium! ⭐" });
    }
  };

  // --- Banners logic ---

  const fetchBanners = async () => {
    setBannersLoading(true);
    // Use rpc or raw fetch since banners isn't in generated types
    const { data, error } = await supabase
      .from("banners" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching banners:", error);
      setBanners([]);
    } else {
      setBanners((data as any as Banner[]) || []);
    }
    setBannersLoading(false);
  };

  const openBannerModal = (banner?: Banner) => {
    setBannerPhotoFile(null);
    setBannerPhotoError(null);
    setBannerVideoFile(null);
    setBannerVideoPreview(null);
    setBannerVideoError(null);
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({
        title: banner.title,
        image_url: banner.image_url,
        link_url: banner.link_url || "",
        position: banner.position,
        expires_at: banner.expires_at ? banner.expires_at.slice(0, 16) : "",
      });
      setBannerPhotoPreview(banner.image_url);
    } else {
      setEditingBanner(null);
      setBannerForm({ title: "", image_url: "", link_url: "", position: "top", expires_at: "" });
      setBannerPhotoPreview(null);
    }
    setBannerModalOpen(true);
  };

  const handleBannerPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "image/gif" && file.type !== "image/webp") {
      setBannerPhotoError("Apenas arquivos GIF e WebP são permitidos");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setBannerPhotoError("Imagem muito grande (máx 8MB)");
      return;
    }
    setBannerPhotoFile(file);
    setBannerPhotoPreview(URL.createObjectURL(file));
    setBannerPhotoError(null);
  };

  const handleBannerVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setBannerVideoError("Apenas arquivos de vídeo são permitidos");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setBannerVideoError("Vídeo muito grande (máx 20MB)");
      return;
    }
    setBannerVideoFile(file);
    setBannerVideoPreview(URL.createObjectURL(file));
    setBannerVideoError(null);
  };

  const handleBannerSave = async () => {
    if (!bannerForm.title.trim()) {
      toast({ title: "Preencha o título", variant: "destructive" });
      return;
    }
    const isHero = bannerForm.position === "hero";
    // Hero requires video; regular requires image
    if (isHero) {
      if (!editingBanner && !bannerVideoFile) {
        setBannerVideoError("Vídeo é obrigatório para banner hero");
        return;
      }
    } else {
      if (!editingBanner && !bannerPhotoFile) {
        setBannerPhotoError("Imagem é obrigatória");
        return;
      }
    }

    setBannerSaving(true);

    let imageUrl = bannerForm.image_url || "hero-placeholder";

    if (bannerPhotoFile) {
      const ext = bannerPhotoFile.name.split(".").pop();
      const filePath = `public/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("banner-images")
        .upload(filePath, bannerPhotoFile, { contentType: bannerPhotoFile.type });

      if (uploadError) {
        toast({ title: "Erro ao enviar imagem", description: uploadError.message, variant: "destructive" });
        setBannerSaving(false);
        return;
      }
      imageUrl = supabase.storage.from("banner-images").getPublicUrl(filePath).data.publicUrl;
    }

    let videoUrl: string | null = null;
    if (bannerVideoFile) {
      const ext = bannerVideoFile.name.split(".").pop();
      const filePath = `public/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("banner-images")
        .upload(filePath, bannerVideoFile, { contentType: bannerVideoFile.type });

      if (uploadError) {
        toast({ title: "Erro ao enviar vídeo", description: uploadError.message, variant: "destructive" });
        setBannerSaving(false);
        return;
      }
      videoUrl = supabase.storage.from("banner-images").getPublicUrl(filePath).data.publicUrl;
    }

    const payload: any = {
      title: bannerForm.title.trim(),
      image_url: imageUrl,
      link_url: bannerForm.link_url.trim() || null,
      position: bannerForm.position,
      expires_at: bannerForm.expires_at ? new Date(bannerForm.expires_at).toISOString() : null,
      ...(videoUrl && { video_url: videoUrl }),
    };

    if (editingBanner) {
      const { error } = await supabase
        .from("banners" as any)
        .update(payload)
        .eq("id", editingBanner.id);
      if (error) {
        toast({ title: "Erro ao atualizar banner", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Banner atualizado!" });
        setBannerModalOpen(false);
        fetchBanners();
      }
    } else {
      const { error } = await supabase.from("banners" as any).insert(payload);
      if (error) {
        toast({ title: "Erro ao criar banner", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Banner criado!" });
        setBannerModalOpen(false);
        fetchBanners();
      }
    }
    setBannerSaving(false);
  };

  const handleBannerToggle = async (banner: Banner) => {
    const { error } = await supabase
      .from("banners" as any)
      .update({ is_active: !banner.is_active })
      .eq("id", banner.id);
    if (error) {
      toast({ title: "Erro ao alterar status", description: error.message, variant: "destructive" });
    } else {
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...b, is_active: !b.is_active } : b)));
    }
  };

  const handleBannerDelete = async () => {
    if (!deleteBannerId) return;
    const { error } = await supabase
      .from("banners" as any)
      .delete()
      .eq("id", deleteBannerId);
    if (error) {
      toast({ title: "Erro ao excluir banner", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Banner excluído!" });
      setBanners((prev) => prev.filter((b) => b.id !== deleteBannerId));
    }
    setDeleteBannerId(null);
  };

  const handleBannerDuplicate = async (banner: Banner) => {
    const payload: any = {
      title: `${banner.title} (cópia)`,
      image_url: banner.image_url,
      link_url: banner.link_url,
      position: banner.position,
      is_active: false,
      expires_at: null,
    };
    const { error } = await supabase.from("banners" as any).insert(payload);
    if (error) {
      toast({ title: "Erro ao duplicar banner", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Banner duplicado!" });
      fetchBanners();
    }
  };

  const isExpired = (banner: Banner) => (banner.expires_at ? new Date(banner.expires_at) < new Date() : false);

  // --- Helpers ---

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Privacy Models state
  const [privacyModels, setPrivacyModels] = useState<any[]>([]);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [privacySearch, setPrivacySearch] = useState("");
  const [privacySourceFilter, setPrivacySourceFilter] = useState<"all" | "manual" | "imported">("all");

  // Privacy Edit Modal state
  const [privacyEditModalOpen, setPrivacyEditModalOpen] = useState(false);
  const [privacyEditModel, setPrivacyEditModel] = useState<any>(null);
  const [privacyEditForm, setPrivacyEditForm] = useState({
    name: "", profile_name: "", privacy_link: "", gender: "female", is_verified: false,
  });
  const [privacyEditSaving, setPrivacyEditSaving] = useState(false);
  const [privacyEditAvatarFile, setPrivacyEditAvatarFile] = useState<File | null>(null);
  const [privacyEditCoverFile, setPrivacyEditCoverFile] = useState<File | null>(null);
  const [privacyEditMediaFile, setPrivacyEditMediaFile] = useState<File | null>(null);
  const [privacyEditAvatarPreview, setPrivacyEditAvatarPreview] = useState<string | null>(null);
  const [privacyEditCoverPreview, setPrivacyEditCoverPreview] = useState<string | null>(null);
  const [privacyEditMediaPreview, setPrivacyEditMediaPreview] = useState<string | null>(null);

  // Privacy Manual Creation Modal state
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [privacyModalSaving, setPrivacyModalSaving] = useState(false);
  const [privacyForm, setPrivacyForm] = useState({
    name: "",
    profile_name: "",
    privacy_link: "",
    avatar_url: "",
    cover_url: "",
    gender: "",
    is_verified: false,
  });
  const [privacyErrors, setPrivacyErrors] = useState<Record<string, string>>({});
  const [privacyAvatarFile, setPrivacyAvatarFile] = useState<File | null>(null);
  const [privacyCoverFile, setPrivacyCoverFile] = useState<File | null>(null);
  const [privacyMediaFile, setPrivacyMediaFile] = useState<File | null>(null);
  const [privacyAvatarPreview, setPrivacyAvatarPreview] = useState<string | null>(null);
  const [privacyCoverPreview, setPrivacyCoverPreview] = useState<string | null>(null);
  const [privacyMediaPreview, setPrivacyMediaPreview] = useState<string | null>(null);
  const privacyAvatarRef = useRef<HTMLInputElement>(null);
  const privacyCoverRef = useRef<HTMLInputElement>(null);
  const privacyMediaRef = useRef<HTMLInputElement>(null);

  const fetchPrivacyModels = async (search = "") => {
    setPrivacyLoading(true);
    let query = supabase
      .from("privacy_models")
      .select("*")
      .eq("is_active", true)
      .order("ranking", { ascending: true })
      .limit(500);
    if (search.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,profile_name.ilike.%${search.trim()}%`);
    }
    const { data, error } = await query;
    if (error) {
      console.error("Error fetching privacy models:", error);
      setPrivacyModels([]);
    } else {
      setPrivacyModels((data as any[]) || []);
    }
    setPrivacyLoading(false);
  };

  // Toggle featured_type = 'creadora' (⭐ Criadoras em Destaque)
  const togglePrivacyCreadora = async (model: any) => {
    const newFeaturedType = model.featured_type === 'creadora' ? null : 'creadora';
    const { error } = await supabase
      .from("privacy_models")
      .update({ featured: !!newFeaturedType, featured_type: newFeaturedType })
      .eq("id", model.id);
    if (!error) {
      setPrivacyModels((prev) =>
        prev.map((m) => (m.id === model.id ? { ...m, featured: !!newFeaturedType, featured_type: newFeaturedType } : m))
      );
      toast({ title: newFeaturedType ? "Adicionado nas Criadoras em Destaque!" : "Removido das Criadoras em Destaque", duration: 1500 });
    }
  };

  // Toggle featured_type = 'top_creator' (👑 Top Creators)
  const togglePrivacyTopCreator = async (model: any) => {
    const newFeaturedType = model.featured_type === 'top_creator' ? null : 'top_creator';
    const { error } = await supabase
      .from("privacy_models")
      .update({ featured: !!newFeaturedType, featured_type: newFeaturedType })
      .eq("id", model.id);
    if (!error) {
      setPrivacyModels((prev) =>
        prev.map((m) => (m.id === model.id ? { ...m, featured: !!newFeaturedType, featured_type: newFeaturedType } : m))
      );
      toast({ title: newFeaturedType ? "Adicionado nos Top Creators!" : "Removido dos Top Creators", duration: 1500 });
    }
  };

  const togglePrivacyActive = async (model: any) => {
    const { error } = await supabase
      .from("privacy_models")
      .update({ is_active: false })
      .eq("id", model.id);
    if (!error) {
      setPrivacyModels((prev) => prev.filter((m) => m.id !== model.id));
      toast({ title: "Modelo removido do site", duration: 1500 });
    }
  };

  // Manual Privacy Model Creation
  const resetPrivacyModal = () => {
    setPrivacyForm({
      name: "",
      profile_name: "",
      privacy_link: "",
      avatar_url: "",
      cover_url: "",
      gender: "",
      is_verified: false,
    });
    setPrivacyAvatarFile(null);
    setPrivacyCoverFile(null);
    setPrivacyMediaFile(null);
    setPrivacyAvatarPreview(null);
    setPrivacyCoverPreview(null);
    setPrivacyMediaPreview(null);
    setPrivacyErrors({});
    setPrivacyModalOpen(false);
  };

  const validatePrivacyForm = () => {
    const errors: Record<string, string> = {};
    if (!privacyForm.name.trim()) errors.name = "Nome é obrigatório";
    if (!privacyForm.profile_name.trim()) errors.profile_name = "Handle é obrigatório";
    if (!privacyForm.privacy_link.trim()) errors.privacy_link = "Link do Privacy é obrigatório";
    setPrivacyErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePrivacyAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setPrivacyErrors((prev) => ({ ...prev, avatar: "Imagem deve ter no máximo 2MB" }));
      return;
    }
    if (!file.type.startsWith("image/")) {
      setPrivacyErrors((prev) => ({ ...prev, avatar: "Arquivo deve ser uma imagem" }));
      return;
    }
    setPrivacyAvatarFile(file);
    setPrivacyAvatarPreview(URL.createObjectURL(file));
    setPrivacyErrors((prev) => { const { avatar, ...rest } = prev; return rest; });
  };

  const handlePrivacyCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setPrivacyErrors((prev) => ({ ...prev, cover: "Imagem deve ter no máximo 2MB" }));
      return;
    }
    if (!file.type.startsWith("image/")) {
      setPrivacyErrors((prev) => ({ ...prev, cover: "Arquivo deve ser uma imagem" }));
      return;
    }
    setPrivacyCoverFile(file);
    setPrivacyCoverPreview(URL.createObjectURL(file));
    setPrivacyErrors((prev) => { const { cover, ...rest } = prev; return rest; });
  };

  const handlePrivacyMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setPrivacyErrors((prev) => ({ ...prev, media: "Arquivo deve ter no máximo 10MB" }));
      return;
    }
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      setPrivacyErrors((prev) => ({ ...prev, media: "Arquivo deve ser uma imagem ou vídeo" }));
      return;
    }
    setPrivacyMediaFile(file);
    setPrivacyMediaPreview(URL.createObjectURL(file));
    setPrivacyErrors((prev) => { const { media, ...rest } = prev; return rest; });
  };

  const handlePrivacySave = async () => {
    if (!validatePrivacyForm()) return;
    if (!user) return;
    setPrivacyModalSaving(true);

    let avatarUrl: string | null = null;
    let coverUrl: string | null = null;

    // Upload avatar if file selected
    if (privacyAvatarFile) {
      const ext = privacyAvatarFile.name.split(".").pop();
      const avatarPath = `privacy-models/${user.id}/${crypto.randomUUID()}_avatar.${ext}`;
      const { error: avatarUploadError } = await supabase.storage
        .from("privacy-models")
        .upload(avatarPath, privacyAvatarFile, { contentType: privacyAvatarFile.type });
      if (avatarUploadError) {
        toast({ title: "Erro ao enviar foto", description: avatarUploadError.message, variant: "destructive" });
        setPrivacyModalSaving(false);
        return;
      }
      avatarUrl = supabase.storage.from("privacy-models").getPublicUrl(avatarPath).data.publicUrl;
    }

    // Upload cover if file selected
    if (privacyCoverFile) {
      const ext = privacyCoverFile.name.split(".").pop();
      const coverPath = `privacy-models/${user.id}/${crypto.randomUUID()}_cover.${ext}`;
      const { error: coverUploadError } = await supabase.storage
        .from("privacy-models")
        .upload(coverPath, privacyCoverFile, { contentType: privacyCoverFile.type });
      if (coverUploadError) {
        toast({ title: "Erro ao enviar capa", description: coverUploadError.message, variant: "destructive" });
        setPrivacyModalSaving(false);
        return;
      }
      coverUrl = supabase.storage.from("privacy-models").getPublicUrl(coverPath).data.publicUrl;
    }

    // Upload media (video or image) if file selected
    let mediaUrl: string | null = null;
    let mediaType: string = "image";
    if (privacyMediaFile) {
      const ext = privacyMediaFile.name.split(".").pop();
      const mediaPath = `privacy-models/${user.id}/${crypto.randomUUID()}_media.${ext}`;
      const { error: mediaUploadError } = await supabase.storage
        .from("privacy-models")
        .upload(mediaPath, privacyMediaFile, { contentType: privacyMediaFile.type });
      if (mediaUploadError) {
        toast({ title: "Erro ao enviar mídia", description: mediaUploadError.message, variant: "destructive" });
        setPrivacyModalSaving(false);
        return;
      }
      mediaUrl = supabase.storage.from("privacy-models").getPublicUrl(mediaPath).data.publicUrl;
      mediaType = privacyMediaFile.type.startsWith("video/") ? "video" : "image";
    }

    const { error } = await supabase.from("privacy_models").insert({
      name: privacyForm.name.trim(),
      profile_name: privacyForm.profile_name.trim(),
      privacy_link: privacyForm.privacy_link.trim(),
      avatar_url: avatarUrl,
      cover_url: coverUrl,
      gender: privacyForm.gender || null,
      is_verified: privacyForm.is_verified,
      featured: false,
      featured_type: null,
      is_active: true,
      ranking: 999,
      source: "manual",
      media_url: mediaUrl,
      media_type: mediaType,
    });
    if (error) {
      toast({ title: "Erro ao criar modelo", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Modelo adicionado com sucesso!" });
      resetPrivacyModal();
      fetchPrivacyModels();
    }
    setPrivacyModalSaving(false);
  };

  // Open edit modal for a privacy model
  const openPrivacyEdit = (model: any) => {
    setPrivacyEditModel(model);
    setPrivacyEditForm({
      name: model.name || "",
      profile_name: model.profile_name || "",
      privacy_link: model.privacy_link || "",
      gender: model.gender || "female",
      is_verified: model.is_verified || false,
    });
    setPrivacyEditAvatarFile(null);
    setPrivacyEditCoverFile(null);
    setPrivacyEditMediaFile(null);
    setPrivacyEditAvatarPreview(model.avatar_url || null);
    setPrivacyEditCoverPreview(model.cover_url || null);
    setPrivacyEditMediaPreview(model.media_url || null);
    setPrivacyEditModalOpen(true);
  };

  // Handle edit form changes
  const handlePrivacyEditChange = (field: string, value: any) => {
    setPrivacyEditForm((prev) => ({ ...prev, [field]: value }));
  };

  // Handle edit avatar file change
  const handlePrivacyEditAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPrivacyEditAvatarFile(file);
      setPrivacyEditAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Handle edit cover file change
  const handlePrivacyEditCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPrivacyEditCoverFile(file);
      setPrivacyEditCoverPreview(URL.createObjectURL(file));
    }
  };

  // Handle edit media file change
  const handlePrivacyEditMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPrivacyEditMediaFile(file);
      const isVideo = file.type.startsWith("video/");
      setPrivacyEditMediaPreview(isVideo ? URL.createObjectURL(file) : URL.createObjectURL(file));
    }
  };

  // Save privacy model edit
  const handlePrivacyEditSave = async () => {
    if (!privacyEditModel) return;
    setPrivacyEditSaving(true);
    try {
      const updates: any = {
        name: privacyEditForm.name,
        profile_name: privacyEditForm.profile_name,
        privacy_link: privacyEditForm.privacy_link,
        gender: privacyEditForm.gender,
        is_verified: privacyEditForm.is_verified,
      };

      // Upload new avatar if provided
      if (privacyEditAvatarFile) {
        const avatarPath = `avatars/${privacyEditModel.id}/${Date.now()}.${privacyEditAvatarFile.name.split('.').pop()}`;
        const { error: avatarError } = await supabase.storage
          .from("privacy-models")
          .upload(avatarPath, privacyEditAvatarFile);
        if (avatarError) throw avatarError;
        const { data: avatarData } = supabase.storage.from("privacy-models").getPublicUrl(avatarPath);
        updates.avatar_url = avatarData.publicUrl;
      }

      // Upload new cover if provided
      if (privacyEditCoverFile) {
        const coverPath = `covers/${privacyEditModel.id}/${Date.now()}.${privacyEditCoverFile.name.split('.').pop()}`;
        const { error: coverError } = await supabase.storage
          .from("privacy-models")
          .upload(coverPath, privacyEditCoverFile);
        if (coverError) throw coverError;
        const { data: coverData } = supabase.storage.from("privacy-models").getPublicUrl(coverPath);
        updates.cover_url = coverData.publicUrl;
      }

      // Upload new media if provided
      if (privacyEditMediaFile) {
        const isVideo = privacyEditMediaFile.type.startsWith("video/");
        const mediaPath = `media/${privacyEditModel.id}/${Date.now()}.${privacyEditMediaFile.name.split('.').pop()}`;
        const { error: mediaError } = await supabase.storage
          .from("privacy-models")
          .upload(mediaPath, privacyEditMediaFile);
        if (mediaError) throw mediaError;
        const { data: mediaData } = supabase.storage.from("privacy-models").getPublicUrl(mediaPath);
        updates.media_url = mediaData.publicUrl;
        updates.media_type = isVideo ? "video" : "image";
      }

      const { error } = await supabase
        .from("privacy_models")
        .update(updates)
        .eq("id", privacyEditModel.id);
      if (error) throw error;

      setPrivacyEditModalOpen(false);
      setPrivacyModels((prev) => prev.map((m) => m.id === privacyEditModel.id ? { ...m, ...updates } : m));
      toast({ title: "Modelo atualizado com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao atualizar modelo", description: err.message, variant: "destructive" });
    }
    setPrivacyEditSaving(false);
  };

  const filteredPrivacyModels = useMemo(() => {
    let filtered = privacyModels;
    // Source filter
    if (privacySourceFilter === "manual") {
      filtered = filtered.filter((m) => m.source === "manual");
    } else if (privacySourceFilter === "imported") {
      filtered = filtered.filter((m) => m.source !== "manual");
    }
    // Search filter
    if (privacySearch.trim()) {
      const q = privacySearch.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name?.toLowerCase().includes(q) ||
          m.profile_name?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [privacyModels, privacySearch, privacySourceFilter]);

  if (!user || !isAdmin) return null;

  const pendingCount = activeTab === "pending" ? submissions.length : null;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Dashboard Admin | Canais18" description="Painel administrativo." />
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={() => {}} activeSort="" />

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Dashboard Admin</h1>
          <Button size="sm" onClick={() => setGroupModalOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Adicionar Grupo Manualmente
          </Button>
        </div>

        <Tabs value={mainSection} onValueChange={(v) => {
              if (v === "grupos_section") navigate("/admin/grupos/pendentes");
              else if (v === "categorias") navigate("/admin/categorias");
              else if (v === "banners")    navigate("/admin/banners");
              else if (v === "seo")        navigate("/admin/seo/analytics");
              else if (v === "privacy_models") navigate("/admin/privacy_models");
            }}>          <TabsList className="w-full">
            <TabsTrigger value="grupos_section" className="flex-1 gap-2">
              <Search className="h-4 w-4" />
              Grupos
            </TabsTrigger>
            <TabsTrigger value="privacy_models" className="flex-1 gap-2">
              <ExternalLink className="h-4 w-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="categorias" className="flex-1 gap-2">
              <ImageIcon className="h-4 w-4" />
              Categorias
            </TabsTrigger>
            <TabsTrigger value="banners" className="flex-1 gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Banners
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex-1 gap-2">
              <BarChart2 className="h-4 w-4" />
              SEO
            </TabsTrigger>
          </TabsList>


          <TabsContent value="grupos_section" className="mt-4">
            <div className="flex gap-6">
              <nav className="w-44 shrink-0 flex flex-col gap-1 border-r border-border pr-4 pt-1">
                <button
                  onClick={() => navigate("/admin/grupos/pendentes")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === "pending" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
                >
                  <Clock className="h-4 w-4 shrink-0" />
                  <span className="flex-1">Pendentes</span>
                  {pendingCount !== null && pendingCount > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs bg-yellow-600/20 text-yellow-400 border-yellow-600/30">{pendingCount}</Badge>
                  )}
                </button>
                <button
                  onClick={() => navigate("/admin/grupos/aprovados")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === "approved" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
                >
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span className="flex-1">Aprovados</span>
                </button>
                <button
                  onClick={() => navigate("/admin/grupos/rejeitados")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === "rejected" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
                >
                  <XCircle className="h-4 w-4 shrink-0" />
                  <span className="flex-1">Rejeitados</span>
                </button>
                <button
                  onClick={() => navigate("/admin/grupos/edicoes")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === "edits" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
                >
                  <FileEdit className="h-4 w-4 shrink-0" />
                  <span className="flex-1">Edições</span>
                  {editRequests.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs bg-orange-600/20 text-orange-400 border-orange-600/30">{editRequests.length}</Badge>
                  )}
                </button>
                <button
                  onClick={() => navigate("/admin/grupos/premium")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === "premium" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
                >
                  <Star className="h-4 w-4 shrink-0" />
                  <span className="flex-1">Premium</span>
                  {premiumGroups.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs bg-yellow-600/20 text-yellow-400 border-yellow-600/30">{premiumGroups.length}</Badge>
                  )}
                </button>
                <button
                  onClick={() => navigate("/admin/grupos/todos")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === "grupos" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
                >
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="flex-1">Todos os Grupos</span>
                </button>
                <button
                  onClick={() => navigate("/admin/grupos/destaques")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === "destaques" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
                >
                  <Star className="h-4 w-4 shrink-0" />
                  <span className="flex-1">Destaques</span>
                  {allGroups.filter((g) => g.featured).length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs bg-yellow-600/20 text-yellow-400 border-yellow-600/30">{allGroups.filter((g) => g.featured).length}</Badge>
                  )}
                </button>
                <button
                  onClick={() => navigate("/admin/grupos/quebrados")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === "broken" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
                >
                  <WifiOff className="h-4 w-4 shrink-0" />
                  <span className="flex-1">Links Quebrados</span>
                  {brokenGroups.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs bg-red-600/20 text-red-400 border-red-600/30">{brokenGroups.length}</Badge>
                  )}
                </button>
              </nav>
              <div className="flex-1 min-w-0">
                <Tabs value={activeTab} onValueChange={(v) => navigate(`/admin/grupos/${_tabToSub[v] ?? v}`)}>
          {/* Submission tabs */}
          {["pending", "approved", "rejected"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4 space-y-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : submissions.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">
                  {tab === "pending"
                    ? "Nenhum grupo pendente"
                    : tab === "approved"
                      ? "Nenhum grupo aprovado"
                      : "Nenhum grupo rejeitado"}
                </p>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className={`overflow-hidden rounded-xl border bg-card ${sub.is_paid ? "border-yellow-500/50" : "border-border"}`}
                  >
                    <div className="flex gap-4 p-4">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                        {sub.thumbnail_url ? (
                          <img src={sub.thumbnail_url} alt={sub.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-lg font-bold text-foreground">{sub.name}</h3>
                          <div className="flex items-center gap-1.5">
                            {sub.is_paid && (
                              <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 font-bold">
                                💎 PAGO
                              </Badge>
                            )}
                            <Badge variant="outline">{sub.category}</Badge>
                          </div>
                        </div>
                        {sub.is_paid && sub.payment_type && (
                          <p className="text-xs font-medium text-yellow-500">
                            {sub.payment_type === "premium"
                              ? "Premium (Destaque)"
                              : sub.payment_type === "banner"
                                ? "Banner Publicitário"
                                : sub.payment_type}
                          </p>
                        )}
                        {sub.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{sub.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <a
                            href={sub.telegram_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {sub.telegram_link}
                          </a>
                          <span>Enviado: {formatDate(sub.created_at)}</span>
                          {sub.reviewed_at && <span>Revisado: {formatDate(sub.reviewed_at)}</span>}
                        </div>
                        {tab === "rejected" && sub.rejection_reason && (
                          <p className="text-sm text-destructive">Motivo: {sub.rejection_reason}</p>
                        )}
                      </div>
                    </div>
                    {tab === "pending" && (
                      <div className="flex gap-2 border-t border-border px-4 py-3">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(sub)}
                          disabled={actionLoading === sub.id}
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          {actionLoading === sub.id ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-1 h-4 w-4" />
                          )}
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectModal(sub)}
                          disabled={actionLoading === sub.id}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                    {tab === "approved" && (
                      <div className="flex gap-2 border-t border-border px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMakePremium(sub.name, sub.telegram_link)}
                          className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                        >
                          <Star className="mr-1 h-4 w-4" />
                          Tornar Premium
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const { data } = await supabase
                              .from("groups")
                              .select("id")
                              .eq("telegram_link", sub.telegram_link)
                              .maybeSingle();
                            if (data) openEditGroupModal(data.id);
                            else toast({ title: "Grupo não encontrado", variant: "destructive" });
                          }}
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            const { data } = await supabase
                              .from("groups")
                              .select("id")
                              .eq("telegram_link", sub.telegram_link)
                              .maybeSingle();
                            if (data) setDeleteGroupId(data.id);
                            else toast({ title: "Grupo não encontrado", variant: "destructive" });
                          }}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Apagar
                        </Button>
                      </div>
                    )}
                    {tab === "rejected" && (
                      <div className="flex gap-2 border-t border-border px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevert(sub)}
                          disabled={actionLoading === sub.id}
                        >
                          {actionLoading === sub.id ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <Undo2 className="mr-1 h-4 w-4" />
                          )}
                          Reverter para Pendente
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </TabsContent>
          ))}

          {/* Premium Groups tab */}
          <TabsContent value="premium" className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou categoria..."
                value={premiumSearch}
                onChange={(e) => setPremiumSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {premiumGroups.length > 10 && (
              <div className="rounded-lg border-l-4 border-yellow-500 bg-yellow-500/10 p-3 text-sm text-foreground">
                ⚠️ Existem <strong>{premiumGroups.length}</strong> grupos premium. Apenas os{" "}
                <strong>10 mais recentes</strong> aparecem no carrossel da homepage. Considere remover premium dos mais
                antigos.
              </div>
            )}

            {premiumLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : premiumGroups.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">Nenhum grupo premium</p>
            ) : (
              premiumGroups
                .filter((g) => {
                  if (!premiumSearch.trim()) return true;
                  const q = premiumSearch.toLowerCase();
                  return g.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q);
                })
                .map((group, index) => (
                  <div key={group.id} className="overflow-hidden rounded-xl border-2 border-yellow-500/30 bg-card">
                    <div className="flex gap-4 p-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                        {group.thumbnail_url ? (
                          <img src={group.thumbnail_url} alt={group.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground">{group.name}</h3>
                          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">⭐ Premium</Badge>
                          <Badge variant="outline">{group.category}</Badge>
                          {group.is_pinned && (
                            <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">📌 Fixado</Badge>
                          )}
                          {index < 10 ? (
                            <Badge className="bg-green-600/20 text-green-400 border-green-600/30">✓ No Carrossel</Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground border-border">Fora do Carrossel</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{group.member_count} membros</span>
                          <span>Criado: {formatDate(group.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 border-t border-border px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={group.is_premium}
                          onCheckedChange={(val) => handleTogglePremium(group.id, val)}
                        />
                        <span className="text-xs text-muted-foreground">Premium</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={group.is_pinned}
                          onCheckedChange={async (val) => {
                            const { error } = await supabase
                              .from("groups")
                              .update({ is_pinned: !!val } as any)
                              .eq("id", group.id);
                            if (error) {
                              toast({ title: "Erro ao fixar", description: error.message, variant: "destructive" });
                            } else {
                              setPremiumGroups((prev) =>
                                prev.map((g) => (g.id === group.id ? { ...g, is_pinned: !!val } : g)),
                              );
                              toast({ title: val ? "Grupo fixado!" : "Grupo desfixado" });
                            }
                          }}
                        />
                        <span className="text-xs text-muted-foreground">📌 Fixar no carrossel</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => openEditGroupModal(group.id)}>
                        <Pencil className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="ml-auto"
                        onClick={() => handleTogglePremium(group.id, false)}
                      >
                        Remover Premium
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </TabsContent>

          {/* Edit Requests tab */}
          <TabsContent value="edits" className="mt-4 space-y-4">
            {editRequestsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : editRequests.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">Nenhuma edição pendente</p>
            ) : (
              editRequests.map((req) => (
                <div key={req.id} className="overflow-hidden rounded-xl border border-border bg-card">
                  {/* Comparison header */}
                  <div className="grid grid-cols-1 gap-0 md:grid-cols-[1fr_auto_1fr]">
                    {/* Current */}
                    <div className="space-y-2 border-b border-border p-4 md:border-b-0 md:border-r">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Atual</p>
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                          {req.group?.thumbnail_url ? (
                            <img src={req.group.thumbnail_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{req.group?.name || "—"}</p>
                          <Badge variant="outline" className="text-xs">
                            {req.group?.category || "—"}
                          </Badge>
                        </div>
                      </div>
                      {req.group?.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{req.group.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground truncate">{req.group?.telegram_link}</p>
                    </div>

                    {/* Arrow */}
                    <div className="hidden items-center px-2 md:flex">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>

                    {/* Requested */}
                    <div className="space-y-2 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Solicitado</p>
                      {/* Photo comparison */}
                      {req.changes.thumbnail_url && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Nova Foto:</p>
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-yellow-500">
                            <img src={req.changes.thumbnail_url} alt="Nova" className="h-full w-full object-cover" />
                          </div>
                        </div>
                      )}
                      <div className="space-y-1.5">
                        {req.changes.name ? (
                          <p className="rounded bg-yellow-500/10 px-2 py-0.5 text-sm font-semibold text-foreground">
                            {req.changes.name}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Sem alteração no nome</p>
                        )}
                        {req.changes.category ? (
                          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                            {req.changes.category}
                          </Badge>
                        ) : null}
                        {req.changes.description ? (
                          <p className="rounded bg-yellow-500/10 px-2 py-0.5 text-xs text-foreground line-clamp-2">
                            {req.changes.description}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">Sem alteração na descrição</p>
                        )}
                        {req.changes.telegram_link ? (
                          <p className="rounded bg-yellow-500/10 px-2 py-0.5 text-xs text-foreground truncate">
                            {req.changes.telegram_link}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Meta + Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        Solicitado por: <strong className="text-foreground">{req.requester_email}</strong>
                      </span>
                      <span>{formatDate(req.created_at)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveEdit(req)}
                        disabled={actionLoading === req.id}
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        {actionLoading === req.id ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-1 h-4 w-4" />
                        )}
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openEditRejectModal(req)}
                        disabled={actionLoading === req.id}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Grupos tab */}
          <TabsContent value="grupos" className="mt-4 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={allGroupsSearch}
                  onChange={(e) => setAllGroupsSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {(["all", "imported", "user"] as const).map((f) => {
                const count = f === "all" ? allGroups.length : allGroups.filter((g) => g.source === f).length;
                const labels = { all: "Todos", imported: "📥 Importados", user: "👤 Usuários" };
                return (
                  <button
                    key={f}
                    onClick={() => setGroupsSourceFilter(f)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      groupsSourceFilter === f
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {labels[f]}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                        groupsSourceFilter === f
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {allGroupsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {allGroups
                    .filter((g) => groupsSourceFilter === "all" || g.source === groupsSourceFilter)
                    .slice(0, 50)
                    .map((group) => (
                      <div
                        key={group.id}
                        className="flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-card p-3"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                          {group.thumbnail_url ? (
                            <img src={group.thumbnail_url} alt={group.name} className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="text-sm font-semibold text-foreground truncate">{group.name}</h3>
                            {group.is_premium && (
                              <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-[10px]">
                                ⭐
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px]">
                              {group.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{group.member_count} membros</p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className={`h-8 px-2 ${group.featured ? "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10" : ""}`}
                            onClick={() => toggleFeatured(group)}
                            title={group.featured ? "Remover destaque" : "Destacar grupo"}
                          >
                            <Star className={`h-3 w-3 ${group.featured ? "fill-yellow-500 text-yellow-500" : ""}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => openEditGroupModal(group.id)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 px-2"
                            onClick={() => setDeleteGroupId(group.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
                {allGroups.filter((g) => groupsSourceFilter === "all" || g.source === groupsSourceFilter).length === 0 && <p className="py-12 text-center text-muted-foreground">Nenhum grupo encontrado.</p>}
                <p className="text-xs text-center text-muted-foreground">
                  Mostrando primeiros 50 resultados. Use a busca para filtrar.
                </p>
              </>
            )}
          </TabsContent>

          {/* Destaques tab */}
          <TabsContent value="destaques" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">Criadoras em Destaque</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  As criadoras destacadas aparecem na seção "Criadoras em Destaque" da página /modelos.
                  Marque até 16 grupos como destaque.
                </p>
              </div>
            </div>

            {allGroupsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : allGroups.filter((g) => g.featured).length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Star className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">Nenhuma criadora em destaque.</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Vá em "Todos os Grupos" e clique no ícone de estrela (⭐) ao lado de um grupo para marcá-lo como destaque.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {allGroups.filter((g) => g.featured).map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center gap-3 overflow-hidden rounded-xl border border-yellow-500/30 bg-card p-3"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                      {group.thumbnail_url ? (
                        <img src={group.thumbnail_url} alt={group.name} className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold text-foreground truncate">{group.name}</h3>
                        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-[10px]">
                          ⭐ Destaque
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{group.member_count} membros</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                      onClick={() => toggleFeatured(group)}
                    >
                      <Star className="h-3 w-3 fill-yellow-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

            {/* Links Quebrados tab */}
            <TabsContent value="broken" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground">Links Quebrados</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Grupos com telegram_link retornando 404/403/timeout. Corrija ou remova.
                  </p>
                </div>
                {brokenSelected.size > 0 && (
                  <Button size="sm" onClick={handleSaveBrokenBulk} className="gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Salvar {brokenSelected.size} selecionados
                  </Button>
                )}
              </div>

              {brokenGroupsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : brokenGroups.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <p className="text-sm">Nenhum link quebrado encontrado.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card/50">
                    <Checkbox
                      checked={brokenSelected.size === brokenGroups.length && brokenGroups.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) setBrokenSelected(new Set(brokenGroups.map((g) => g.id)));
                        else setBrokenSelected(new Set());
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      Selecionar todos ({brokenGroups.length} grupos)
                    </span>
                  </div>
                  {brokenGroups.map((group) => (
                    <div
                      key={group.id}
                      className={`flex flex-col gap-2 rounded-xl border p-3 transition-colors ${
                        brokenSelected.has(group.id) ? "border-primary/40 bg-primary/5" : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          className="mt-0.5"
                          checked={brokenSelected.has(group.id)}
                          onCheckedChange={(checked) => {
                            setBrokenSelected((prev) => {
                              const s = new Set(prev);
                              if (checked) s.add(group.id); else s.delete(group.id);
                              return s;
                            });
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">{group.name}</p>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                            <WifiOff className="h-3 w-3 text-red-400 shrink-0" />
                            {group.telegram_link}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pl-6">
                        <Input
                          value={brokenLinkEdits[group.id] ?? group.telegram_link}
                          onChange={(e) =>
                            setBrokenLinkEdits((prev) => ({ ...prev, [group.id]: e.target.value }))
                          }
                          placeholder="Novo link do Telegram..."
                          className="h-8 text-xs font-mono"
                        />
                        <Button
                          size="sm"
                          className="h-8 shrink-0"
                          disabled={!brokenLinkEdits[group.id]?.trim() || brokenLinkEdits[group.id] === group.telegram_link}
                          onClick={() => handleSaveBrokenLink(group.id)}
                        >
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

                </Tabs>
              </div>
            </div>
          </TabsContent>

          {/* Banners tab */}
          {/* Categorias tab */}
          <TabsContent value="categorias" className="mt-4 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Fotos dos Cards de Categorias</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Todas as capas são gerenciadas manualmente. Se nenhuma foto for definida, o sistema exibe um ícone padrão.
              </p>
            </div>

            {categoriesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categoriesData.map((cat) => {
                  const displayThumb = cat.coverUrl;
                  
                  return (
                    <div key={cat.slug} className="overflow-hidden rounded-xl border border-border bg-card">
                      {/* Preview */}
                      <div className="relative h-32 w-full overflow-hidden bg-secondary">
                        {displayThumb ? (
                          <img src={displayThumb} alt={cat.label} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-3 flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{cat.label}</span>
                        </div>
                        <span className="absolute bottom-2 right-3 text-xs text-white/70">{cat.count} grupos</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 p-3">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id={`cat-upload-${cat.slug}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCategoryPhotoUpload(cat.slug, file);
                            e.target.value = "";
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          disabled={categoryUploadingSlug === cat.slug}
                          onClick={() => document.getElementById(`cat-upload-${cat.slug}`)?.click()}
                        >
                          {categoryUploadingSlug === cat.slug ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Upload className="mr-1 h-3 w-3" />
                          )}
                          {cat.coverUrl ? "Trocar foto" : "Definir foto"}
                        </Button>
                        {cat.coverUrl && (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={categoryUploadingSlug === cat.slug}
                            onClick={() => handleCategoryPhotoRemove(cat.slug)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
          <TabsContent value="banners" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Gerenciar Banners</h2>
              <Button size="sm" onClick={() => openBannerModal()}>
                <Plus className="mr-1 h-4 w-4" />
                Adicionar Banner
              </Button>
            </div>

            {bannersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : banners.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">Nenhum banner cadastrado.</p>
            ) : (
              banners.map((banner) => {
                const expired = isExpired(banner);
                return (
                  <div key={banner.id} className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="flex gap-4 p-4">
                      {/* Image preview */}
                      <div className="flex h-24 w-48 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-bold text-foreground">{banner.title}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {banner.position}
                            </Badge>
                            {expired ? (
                              <Badge className="bg-red-600/20 text-red-400 border-red-600/30">Expirado</Badge>
                            ) : banner.is_active ? (
                              <Badge className="bg-green-600/20 text-green-400 border-green-600/30">Ativo</Badge>
                            ) : (
                              <Badge className="bg-muted text-muted-foreground border-border">Inativo</Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {banner.link_url && (
                            <a
                              href={banner.link_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Link
                            </a>
                          )}
                          <span>Expira: {banner.expires_at ? formatDate(banner.expires_at) : "Sem expiração"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 border-t border-border px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={banner.is_active && !expired}
                          onCheckedChange={() => handleBannerToggle(banner)}
                          disabled={expired}
                        />
                        <span className="text-xs text-muted-foreground">
                          {expired ? "Expirado" : banner.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                      <div className="ml-auto flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openBannerModal(banner)}>
                          <Pencil className="mr-1 h-3 w-3" />
                          Editar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleBannerDuplicate(banner)}>
                          <Copy className="mr-1 h-3 w-3" />
                          Duplicar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteBannerId(banner.id)}>
                          <Trash2 className="mr-1 h-3 w-3" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="seo" className="mt-4">
            <SEODashboard />
          </TabsContent>

          {/* Privacy Models tab */}
          <TabsContent value="privacy_models" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Gerenciar Modelos Privacy</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Controle os perfis do Privacy exibidos na página /modelos. ⭐ = Criadoras em Destaque | 👑 = Top Creators
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {privacyModels.length} modelos
                </Badge>
                <Button
                  onClick={() => setPrivacyModalOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  size="sm"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Adicionar Modelo
                </Button>
              </div>
            </div>

            {/* Source Filter */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={privacySourceFilter === "all" ? "default" : "outline"}
                onClick={() => setPrivacySourceFilter("all")}
                className="text-xs"
              >
                Todos
              </Button>
              <Button
                size="sm"
                variant={privacySourceFilter === "manual" ? "default" : "outline"}
                onClick={() => setPrivacySourceFilter("manual")}
                className="text-xs"
              >
                Manuais
              </Button>
              <Button
                size="sm"
                variant={privacySourceFilter === "imported" ? "default" : "outline"}
                onClick={() => setPrivacySourceFilter("imported")}
                className="text-xs"
              >
                Importados
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou @perfil..."
                value={privacySearch}
                onChange={(e) => setPrivacySearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {privacyLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredPrivacyModels.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">Nenhum modelo encontrado.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filteredPrivacyModels.map((model) => (
                  <div
                    key={model.id}
                    className={`flex items-center gap-3 overflow-hidden rounded-xl border p-3 transition-colors ${
                      model.featured
                        ? "border-yellow-500/30 bg-card"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                      <img
                        src={model.avatar_url}
                        alt={model.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold text-foreground truncate">{model.name}</h3>
                        {model.featured_type === 'creadora' && (
                          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-[10px]">
                            ⭐ Destaque
                          </Badge>
                        )}
                        {model.featured_type === 'top_creator' && (
                          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[10px]">
                            👑 Top Creator
                          </Badge>
                        )}
                        {model.is_verified && (
                          <CheckCircle className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">@{model.profile_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <a
                          href={model.privacy_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                        >
                          <ExternalLink className="h-2.5 w-2.5" />
                          Privacy
                        </a>
                        <span className="text-[10px] text-muted-foreground">Ranking #{model.ranking}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {/* ✏️ Edit */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 hover:border-blue-500 hover:text-blue-500"
                        onClick={() => openPrivacyEdit(model)}
                        title="Editar modelo"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {/* ⭐ Toggle Criadora em Destaque */}
                      <Button
                        size="sm"
                        variant="outline"
                        className={`h-8 w-8 p-0 ${
                          model.featured_type === 'creadora'
                            ? "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                            : "hover:border-yellow-500 hover:text-yellow-500"
                        }`}
                        onClick={() => togglePrivacyCreadora(model)}
                        title="Fixar em Criadoras em Destaque"
                      >
                        <Star className={`h-3.5 w-3.5 ${model.featured_type === 'creadora' ? "fill-yellow-500" : ""}`} />
                      </Button>
                      {/* 👑 Toggle Top Creator */}
                      <Button
                        size="sm"
                        variant="outline"
                        className={`h-8 w-8 p-0 ${
                          model.featured_type === 'top_creator'
                            ? "border-amber-500 text-amber-500 hover:bg-amber-500/10"
                            : "hover:border-amber-500 hover:text-amber-500"
                        }`}
                        onClick={() => togglePrivacyTopCreator(model)}
                        title="Fixar em Top Creators"
                      >
                        <span className="text-sm font-bold">👑</span>
                      </Button>
                      {/* 🗑️ Remove */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 border-red-300 text-red-400 hover:bg-red-500/10 hover:border-red-500 hover:text-red-500"
                        onClick={() => togglePrivacyActive(model)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!privacyLoading && filteredPrivacyModels.length > 0 && (
              <p className="text-xs text-center text-muted-foreground">
                Mostrando {filteredPrivacyModels.length} de {privacyModels.length} modelos.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Canal</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Rejeitando: <strong>{rejectTarget?.name}</strong>
            </p>
            <Textarea
              placeholder="Motivo da rejeição (opcional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading !== null}>
              {actionLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Banner Add/Edit Modal */}
      <Dialog open={bannerModalOpen} onOpenChange={setBannerModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Editar Banner" : "Criar Banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="banner-title">Título *</Label>
              <Input
                id="banner-title"
                value={bannerForm.title}
                onChange={(e) => setBannerForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Título do banner"
              />
            </div>
            <div className="space-y-2">
              <Label>Imagem do Banner * (GIF ou WebP)</Label>
              <div
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 transition-colors hover:border-primary/50"
                onClick={() => bannerFileRef.current?.click()}
              >
                {bannerPhotoPreview ? (
                  <div className="relative w-full">
                    <img
                      src={bannerPhotoPreview}
                      alt="Preview"
                      className="max-h-[120px] w-full rounded-lg object-contain"
                    />
                    <button
                      type="button"
                      className="absolute right-1 top-1 rounded-full bg-background/80 p-1 hover:bg-background"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBannerPhotoFile(null);
                        setBannerPhotoPreview(editingBanner ? editingBanner.image_url : null);
                        if (bannerFileRef.current) bannerFileRef.current.value = "";
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Clique para selecionar imagem</span>
                  </>
                )}
              </div>
              <input
                ref={bannerFileRef}
                type="file"
                accept="image/gif,image/webp"
                className="hidden"
                onChange={handleBannerPhotoChange}
              />
              <p className="text-xs text-muted-foreground">
                Recomendado: 728x90px (desktop) ou 320x50px (mobile). Máx 8MB.
              </p>
              {bannerPhotoError && <p className="text-xs text-destructive">{bannerPhotoError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="banner-link">URL do Link (opcional)</Label>
              <Input
                id="banner-link"
                value={bannerForm.link_url}
                onChange={(e) => setBannerForm((f) => ({ ...f, link_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Posição</Label>
              <Select value={bannerForm.position} onValueChange={(v) => setBannerForm((f) => ({ ...f, position: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="middle">Middle</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="hero">Hero Topo (Vídeo)</SelectItem>
                  <SelectItem value="hero_middle">Hero Meio (Vídeo)</SelectItem>
                  <SelectItem value="hero_bottom">Hero Baixo (Vídeo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {bannerForm.position === "hero" && (
              <div className="space-y-2">
                <Label>Vídeo do Banner * (MP4, WebM)</Label>
                <div
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 transition-colors hover:border-primary/50"
                  onClick={() => bannerVideoRef.current?.click()}
                >
                  {bannerVideoPreview ? (
                    <div className="relative w-full">
                      <video
                        src={bannerVideoPreview}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="max-h-[120px] w-full rounded-lg object-contain"
                      />
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-full bg-background/80 p-1 hover:bg-background"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBannerVideoFile(null);
                          setBannerVideoPreview(null);
                          if (bannerVideoRef.current) bannerVideoRef.current.value = "";
                        }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Clique para selecionar vídeo</span>
                    </>
                  )}
                </div>
                <input
                  ref={bannerVideoRef}
                  type="file"
                  accept="video/mp4,video/webm"
                  className="hidden"
                  onChange={handleBannerVideoChange}
                />
                <p className="text-xs text-muted-foreground">Máx 20MB. O vídeo rodará em loop no banner.</p>
                {bannerVideoError && <p className="text-xs text-destructive">{bannerVideoError}</p>}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="banner-expires">Data de Expiração (opcional)</Label>
              <Input
                id="banner-expires"
                type="datetime-local"
                value={bannerForm.expires_at}
                onChange={(e) => setBannerForm((f) => ({ ...f, expires_at: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBannerModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBannerSave} disabled={bannerSaving}>
              {bannerSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              {editingBanner ? "Salvar" : "Criar Banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteBannerId} onOpenChange={(open) => !open && setDeleteBannerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O banner será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBannerDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Group Confirmation */}
      <AlertDialog open={!!deleteGroupId} onOpenChange={(open) => !open && setDeleteGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O grupo será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Edit Modal */}
      <Dialog open={editRejectModalOpen} onOpenChange={setEditRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Edição</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Rejeitando edição do grupo: <strong>{editRejectTarget?.group?.name}</strong>
            </p>
            <Textarea
              placeholder="Motivo da rejeição (opcional)"
              value={editRejectReason}
              onChange={(e) => setEditRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRejectModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRejectEdit} disabled={actionLoading !== null}>
              {actionLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Group Creation Modal */}
      <Dialog
        open={groupModalOpen}
        onOpenChange={(open) => {
          if (!open) resetGroupModal();
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGroupData ? "Editar Grupo" : "Adicionar Grupo Manualmente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Canal *</Label>
              <Input
                value={groupForm.name}
                onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome do canal"
              />
              {groupErrors.name && <p className="text-xs text-destructive">{groupErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={groupForm.category} onValueChange={(v) => setGroupForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {groupErrors.category && <p className="text-xs text-destructive">{groupErrors.category}</p>}
            </div>

            <div className="space-y-2">
              <Label>Link do Telegram *</Label>
              <Input
                value={groupForm.telegram_link}
                onChange={(e) => setGroupForm((f) => ({ ...f, telegram_link: e.target.value }))}
                placeholder="https://t.me/seucanalaqui"
              />
              {groupErrors.telegram_link && <p className="text-xs text-destructive">{groupErrors.telegram_link}</p>}
            </div>

            <div className="space-y-2">
              <Label>Número de Membros</Label>
              <Input
                type="number"
                value={groupForm.member_count}
                onChange={(e) => setGroupForm((f) => ({ ...f, member_count: e.target.value }))}
                placeholder="Ex: 5000"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Textarea
                value={groupForm.description}
                onChange={(e) => setGroupForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Descreva o conteúdo do canal"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Foto do Canal *</Label>
              <input
                ref={groupFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleGroupPhotoChange}
              />
              {groupPhotoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={groupPhotoPreview}
                    alt="Preview"
                    className="h-24 w-24 rounded-lg border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setGroupPhotoFile(null);
                      setGroupPhotoPreview(null);
                    }}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => groupFileRef.current?.click()}>
                  <Upload className="mr-1 h-4 w-4" />
                  Selecionar foto
                </Button>
              )}
              {groupErrors.photo && <p className="text-xs text-destructive">{groupErrors.photo}</p>}
            </div>

            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="group-premium"
                  checked={groupForm.is_premium}
                  onCheckedChange={(v) => setGroupForm((f) => ({ ...f, is_premium: !!v }))}
                />
                <Label htmlFor="group-premium" className="cursor-pointer text-sm">
                  💎 Premium
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="group-featured"
                  checked={groupForm.featured}
                  onCheckedChange={(v) => setGroupForm((f) => ({ ...f, featured: !!v }))}
                />
                <Label htmlFor="group-featured" className="cursor-pointer text-sm">
                  ⭐ Em Destaque (aparece na /modelos)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="group-verified"
                  checked={groupForm.is_verified}
                  onCheckedChange={(v) => setGroupForm((f) => ({ ...f, is_verified: !!v }))}
                />
                <Label htmlFor="group-verified" className="cursor-pointer text-sm">
                  ✓ Verificado
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetGroupModal}>
              Cancelar
            </Button>
            <Button
              onClick={handleGroupSave}
              disabled={groupSaving}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {groupSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              {editingGroupData ? "Salvar Alterações" : "Adicionar Grupo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Privacy Model Manual Creation Dialog */}
      <Dialog open={privacyModalOpen} onOpenChange={setPrivacyModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Modelo Privacy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={privacyForm.name}
                onChange={(e) => setPrivacyForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Gaby Lopez"
              />
              {privacyErrors.name && <p className="text-xs text-destructive">{privacyErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Handle / @perfil *</Label>
              <Input
                value={privacyForm.profile_name}
                onChange={(e) => setPrivacyForm((f) => ({ ...f, profile_name: e.target.value }))}
                placeholder="Ex: gabylopez"
              />
              {privacyErrors.profile_name && <p className="text-xs text-destructive">{privacyErrors.profile_name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Link do Privacy *</Label>
              <Input
                value={privacyForm.privacy_link}
                onChange={(e) => setPrivacyForm((f) => ({ ...f, privacy_link: e.target.value }))}
                placeholder="https://privacy.com.br/profile/gabylopez"
              />
              {privacyErrors.privacy_link && <p className="text-xs text-destructive">{privacyErrors.privacy_link}</p>}
            </div>

            <div className="space-y-2">
              <Label>Foto (Avatar)</Label>
              <div className="flex items-center gap-3">
                <input
                  ref={privacyAvatarRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePrivacyAvatarChange}
                />
                {privacyAvatarPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={privacyAvatarPreview}
                      alt="Avatar preview"
                      className="h-20 w-20 rounded-full border-2 border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPrivacyAvatarFile(null);
                        setPrivacyAvatarPreview(null);
                      }}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={() => privacyAvatarRef.current?.click()}>
                    <Upload className="mr-1 h-4 w-4" />
                    Selecionar foto
                  </Button>
                )}
              </div>
              {privacyErrors.avatar && <p className="text-xs text-destructive">{privacyErrors.avatar}</p>}
            </div>

            <div className="space-y-2">
              <Label>Capa (opcional)</Label>
              <div className="flex items-center gap-3">
                <input
                  ref={privacyCoverRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePrivacyCoverChange}
                />
                {privacyCoverPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={privacyCoverPreview}
                      alt="Cover preview"
                      className="h-16 w-28 rounded-lg border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPrivacyCoverFile(null);
                        setPrivacyCoverPreview(null);
                      }}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={() => privacyCoverRef.current?.click()}>
                    <Upload className="mr-1 h-4 w-4" />
                    Selecionar capa
                  </Button>
                )}
              </div>
              {privacyErrors.cover && <p className="text-xs text-destructive">{privacyErrors.cover}</p>}
            </div>

            <div className="space-y-2">
              <Label>Vídeo ou Imagem para Destaque</Label>
              <p className="text-xs text-muted-foreground">Aparece no card "⭐ Criadoras em Destaque" como mídia principal (em loop)</p>
              <div className="flex items-center gap-3">
                <input
                  ref={privacyMediaRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  className="hidden"
                  onChange={handlePrivacyMediaChange}
                />
                {privacyMediaPreview ? (
                  <div className="relative inline-block">
                    {privacyMediaFile?.type.startsWith("video/") ? (
                      <video
                        src={privacyMediaPreview}
                        muted
                        loop
                        autoPlay
                        playsInline
                        className="h-32 w-52 rounded-lg border border-border object-cover"
                      />
                    ) : (
                      <img
                        src={privacyMediaPreview}
                        alt="Media preview"
                        className="h-32 w-52 rounded-lg border border-border object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setPrivacyMediaFile(null);
                        setPrivacyMediaPreview(null);
                      }}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={() => privacyMediaRef.current?.click()}>
                    <Upload className="mr-1 h-4 w-4" />
                    Selecionar vídeo ou imagem
                  </Button>
                )}
              </div>
              {privacyErrors.media && <p className="text-xs text-destructive">{privacyErrors.media}</p>}
            </div>

            <div className="space-y-2">
              <Label>Gênero</Label>
              <Select value={privacyForm.gender} onValueChange={(v) => setPrivacyForm((f) => ({ ...f, gender: v === "none" ? "" : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não informado</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="NB">Não-binário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="privacy-verified"
                checked={privacyForm.is_verified}
                onCheckedChange={(v) => setPrivacyForm((f) => ({ ...f, is_verified: !!v }))}
              />
              <Label htmlFor="privacy-verified" className="cursor-pointer text-sm">
                ✓ Verificado
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetPrivacyModal}>
              Cancelar
            </Button>
            <Button
              onClick={handlePrivacySave}
              disabled={privacyModalSaving}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {privacyModalSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Adicionar Modelo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Privacy Edit Modal */}
      <Dialog open={privacyEditModalOpen} onOpenChange={setPrivacyEditModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Modelo Privacy</DialogTitle>
          </DialogHeader>
          {privacyEditModel && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={privacyEditForm.name}
                  onChange={(e) => handlePrivacyEditChange("name", e.target.value)}
                  placeholder="Nome da modelo"
                />
              </div>
              <div className="space-y-2">
                <Label>Handle / @perfil *</Label>
                <Input
                  value={privacyEditForm.profile_name}
                  onChange={(e) => handlePrivacyEditChange("profile_name", e.target.value)}
                  placeholder="handle"
                />
              </div>
              <div className="space-y-2">
                <Label>Link do Privacy *</Label>
                <Input
                  value={privacyEditForm.privacy_link}
                  onChange={(e) => handlePrivacyEditChange("privacy_link", e.target.value)}
                  placeholder="https://privacy.com.br/profile/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Foto (Avatar)</Label>
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-secondary">
                    {privacyEditAvatarPreview ? (
                      <img src={privacyEditAvatarPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 m-auto mt-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="sm" variant="outline" type="button" onClick={() => document.getElementById("edit-avatar-input")?.click()}>
                      <Upload className="mr-1 h-3 w-3" /> Nova Foto
                    </Button>
                    <input id="edit-avatar-input" type="file" accept="image/*" className="hidden" onChange={handlePrivacyEditAvatarChange} />
                    {privacyEditAvatarFile && (
                      <Button size="sm" variant="ghost" onClick={() => { setPrivacyEditAvatarFile(null); setPrivacyEditAvatarPreview(null); }}>Remover</Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Capa (opcional)</Label>
                <div className="flex items-center gap-3">
                  <div className="h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    {privacyEditCoverPreview ? (
                      <img src={privacyEditCoverPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 m-auto mt-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="sm" variant="outline" type="button" onClick={() => document.getElementById("edit-cover-input")?.click()}>
                      <Upload className="mr-1 h-3 w-3" /> Nova Capa
                    </Button>
                    <input id="edit-cover-input" type="file" accept="image/*" className="hidden" onChange={handlePrivacyEditCoverChange} />
                    {privacyEditCoverFile && (
                      <Button size="sm" variant="ghost" onClick={() => { setPrivacyEditCoverFile(null); setPrivacyEditCoverPreview(null); }}>Remover</Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Vídeo ou Imagem para Destaque</Label>
                <div className="flex items-center gap-3">
                  <div className="h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    {privacyEditMediaPreview ? (
                      privacyEditMediaFile?.type.startsWith("video/") ? (
                        <video src={privacyEditMediaPreview} autoPlay loop muted playsInline className="h-full w-full object-cover" />
                      ) : (
                        <img src={privacyEditMediaPreview} alt="" className="h-full w-full object-cover" />
                      )
                    ) : (
                      <ImageIcon className="h-6 w-6 m-auto mt-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="sm" variant="outline" type="button" onClick={() => document.getElementById("edit-media-input")?.click()}>
                      <Upload className="mr-1 h-3 w-3" /> Mídia
                    </Button>
                    <input id="edit-media-input" type="file" accept="image/*,video/mp4,video/webm" className="hidden" onChange={handlePrivacyEditMediaChange} />
                    {privacyEditMediaFile && (
                      <Button size="sm" variant="ghost" onClick={() => { setPrivacyEditMediaFile(null); setPrivacyEditMediaPreview(null); }}>Remover</Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Gênero</Label>
                <Select value={privacyEditForm.gender} onValueChange={(v) => handlePrivacyEditChange("gender", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Feminino</SelectItem>
                    <SelectItem value="male">Masculino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-verified"
                  checked={privacyEditForm.is_verified}
                  onChange={(e) => handlePrivacyEditChange("is_verified", e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="edit-verified">Verificado</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrivacyEditModalOpen(false)}>Cancelar</Button>
            <Button onClick={handlePrivacyEditSave} disabled={privacyEditSaving}>
              {privacyEditSaving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
              ) : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
