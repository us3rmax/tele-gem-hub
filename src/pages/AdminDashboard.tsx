import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
} from "lucide-react";

const GROUP_CATEGORIES = ["Novinhas", "Amadoras", "Cornos", "Onlyfans", "Vazados", "Lésbicas", "Pack", "Putaria"];

// --- Types ---

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

// --- Component ---

const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

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
    is_premium: false,
    is_verified: false,
  });
  const [groupErrors, setGroupErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, authLoading, navigate]);

  // --- Submissions logic ---

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
    } else {
      fetchSubmissions(activeTab);
    }
  }, [activeTab, user, isAdmin, fetchSubmissions]);

  const handleApprove = async (sub: Submission) => {
    setActionLoading(sub.id);
    const { error: insertError } = await supabase.from("groups").insert({
      name: sub.name,
      description: sub.description,
      category: sub.category,
      telegram_link: sub.telegram_link,
      thumbnail_url: sub.thumbnail_url,
      is_premium: false,
      is_verified: false,
      member_count: 0,
      views: 0,
    });

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
    setGroupErrors((prev) => { const { photo, ...rest } = prev; return rest; });
  };

  const resetGroupModal = () => {
    setGroupForm({ name: "", category: "", telegram_link: "", description: "", is_premium: false, is_verified: false });
    setGroupPhotoFile(null);
    setGroupPhotoPreview(null);
    setGroupErrors({});
    setGroupModalOpen(false);
  };

  const validateGroupForm = () => {
    const errors: Record<string, string> = {};
    if (!groupForm.name.trim()) errors.name = "Nome é obrigatório";
    if (!groupForm.category) errors.category = "Categoria é obrigatória";
    if (!groupForm.telegram_link.trim()) {
      errors.telegram_link = "Link é obrigatório";
    } else if (!groupForm.telegram_link.startsWith("https://t.me/")) {
      errors.telegram_link = "Link deve começar com https://t.me/";
    } else if (groupForm.telegram_link.toLowerCase().endsWith("_bot")) {
      errors.telegram_link = "Links de bots não são permitidos";
    }
    if (groupForm.description.length < 50) errors.description = "Descrição deve ter no mínimo 50 caracteres";
    if (!groupPhotoFile) errors.photo = "Foto é obrigatória";
    setGroupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGroupSave = async () => {
    if (!validateGroupForm() || !user) return;
    setGroupSaving(true);

    // Upload photo
    const ext = groupPhotoFile!.name.split(".").pop();
    const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("group-photos")
      .upload(filePath, groupPhotoFile!, { contentType: groupPhotoFile!.type });

    if (uploadError) {
      toast({ title: "Erro ao enviar foto", description: uploadError.message, variant: "destructive" });
      setGroupSaving(false);
      return;
    }

    const publicUrl = supabase.storage.from("group-photos").getPublicUrl(filePath).data.publicUrl;

    const { error } = await supabase.from("groups").insert({
      name: groupForm.name.trim(),
      category: groupForm.category,
      telegram_link: groupForm.telegram_link.trim(),
      description: groupForm.description.trim(),
      thumbnail_url: publicUrl,
      is_premium: groupForm.is_premium,
      is_verified: groupForm.is_verified,
      member_count: 0,
      views: 0,
    });

    if (error) {
      toast({ title: "Erro ao criar grupo", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Grupo adicionado com sucesso!" });
      resetGroupModal();
    }
    setGroupSaving(false);
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
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({
        title: banner.title,
        image_url: banner.image_url,
        link_url: banner.link_url || "",
        position: banner.position,
        expires_at: banner.expires_at ? banner.expires_at.slice(0, 16) : "",
      });
    } else {
      setEditingBanner(null);
      setBannerForm({ title: "", image_url: "", link_url: "", position: "top", expires_at: "" });
    }
    setBannerModalOpen(true);
  };

  const handleBannerSave = async () => {
    if (!bannerForm.title.trim() || !bannerForm.image_url.trim()) {
      toast({ title: "Preencha título e URL da imagem", variant: "destructive" });
      return;
    }

    setBannerSaving(true);
    const payload: any = {
      title: bannerForm.title.trim(),
      image_url: bannerForm.image_url.trim(),
      link_url: bannerForm.link_url.trim() || null,
      position: bannerForm.position,
      expires_at: bannerForm.expires_at ? new Date(bannerForm.expires_at).toISOString() : null,
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
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, is_active: !b.is_active } : b))
      );
    }
  };

  const handleBannerDelete = async () => {
    if (!deleteBannerId) return;
    const { error } = await supabase.from("banners" as any).delete().eq("id", deleteBannerId);
    if (error) {
      toast({ title: "Erro ao excluir banner", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Banner excluído!" });
      setBanners((prev) => prev.filter((b) => b.id !== deleteBannerId));
    }
    setDeleteBannerId(null);
  };

  const isExpired = (banner: Banner) =>
    banner.expires_at ? new Date(banner.expires_at) < new Date() : false;

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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1 gap-2">
              <Clock className="h-4 w-4" />
              Pendentes
              {pendingCount !== null && pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1 bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex-1 gap-2">
              <CheckCircle className="h-4 w-4" />
              Aprovados
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex-1 gap-2">
              <XCircle className="h-4 w-4" />
              Rejeitados
            </TabsTrigger>
            <TabsTrigger value="banners" className="flex-1 gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Banners
            </TabsTrigger>
          </TabsList>

          {/* Submission tabs */}
          {["pending", "approved", "rejected"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4 space-y-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : submissions.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">
                  {tab === "pending" ? "Nenhum grupo pendente" : tab === "approved" ? "Nenhum grupo aprovado" : "Nenhum grupo rejeitado"}
                </p>
              ) : (
                submissions.map((sub) => (
                  <div key={sub.id} className={`overflow-hidden rounded-xl border bg-card ${sub.is_paid ? 'border-yellow-500/50' : 'border-border'}`}>
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
                            {sub.payment_type === 'premium' ? 'Premium (Destaque)' : sub.payment_type === 'banner' ? 'Banner Publicitário' : sub.payment_type}
                          </p>
                        )}
                        {sub.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{sub.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <a href={sub.telegram_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
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
                        <Button size="sm" onClick={() => handleApprove(sub)} disabled={actionLoading === sub.id} className="bg-green-600 text-white hover:bg-green-700">
                          {actionLoading === sub.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4" />}
                          Aprovar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => openRejectModal(sub)} disabled={actionLoading === sub.id}>
                          <XCircle className="mr-1 h-4 w-4" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                    {tab === "rejected" && (
                      <div className="flex gap-2 border-t border-border px-4 py-3">
                        <Button size="sm" variant="outline" onClick={() => handleRevert(sub)} disabled={actionLoading === sub.id}>
                          {actionLoading === sub.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Undo2 className="mr-1 h-4 w-4" />}
                          Reverter para Pendente
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </TabsContent>
          ))}

          {/* Banners tab */}
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
                            <Badge variant="outline" className="capitalize">{banner.position}</Badge>
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
                            <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                              <ExternalLink className="h-3 w-3" />
                              Link
                            </a>
                          )}
                          <span>
                            Expira: {banner.expires_at ? formatDate(banner.expires_at) : "Sem expiração"}
                          </span>
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
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancelar</Button>
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
              <Label htmlFor="banner-image">URL da Imagem *</Label>
              <Input
                id="banner-image"
                value={bannerForm.image_url}
                onChange={(e) => setBannerForm((f) => ({ ...f, image_url: e.target.value }))}
                placeholder="https://..."
              />
              {bannerForm.image_url && (
                <img src={bannerForm.image_url} alt="Preview" className="mt-2 max-w-[200px] rounded-lg border border-border" />
              )}
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
                </SelectContent>
              </Select>
            </div>
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
            <Button variant="outline" onClick={() => setBannerModalOpen(false)}>Cancelar</Button>
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
            <AlertDialogAction onClick={handleBannerDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manual Group Creation Modal */}
      <Dialog open={groupModalOpen} onOpenChange={(open) => { if (!open) resetGroupModal(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Grupo Manualmente</DialogTitle>
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
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
              <Label>Descrição *</Label>
              <Textarea
                value={groupForm.description}
                onChange={(e) => setGroupForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Descreva o conteúdo do canal (mínimo 50 caracteres)"
                rows={3}
              />
              <div className="flex items-center justify-between">
                {groupErrors.description && <p className="text-xs text-destructive">{groupErrors.description}</p>}
                <span className={`ml-auto text-xs ${groupForm.description.length >= 50 ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {groupForm.description.length}/50
                </span>
              </div>
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
                  <img src={groupPhotoPreview} alt="Preview" className="h-24 w-24 rounded-lg border border-border object-cover" />
                  <button
                    type="button"
                    onClick={() => { setGroupPhotoFile(null); setGroupPhotoPreview(null); }}
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
                <Label htmlFor="group-premium" className="cursor-pointer text-sm">⭐ Colocar em destaque (Premium)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="group-verified"
                  checked={groupForm.is_verified}
                  onCheckedChange={(v) => setGroupForm((f) => ({ ...f, is_verified: !!v }))}
                />
                <Label htmlFor="group-verified" className="cursor-pointer text-sm">✓ Verificado</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetGroupModal}>Cancelar</Button>
            <Button onClick={handleGroupSave} disabled={groupSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {groupSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Adicionar Grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
