import { useState, useEffect, useCallback } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, Link2, Calendar, Send, Pencil, AlertTriangle, Image as ImageIcon } from "lucide-react";
import EmailConfirmationGuard from "@/components/EmailConfirmationGuard";

const GROUP_CATEGORIES = ["Novinhas", "Amadoras", "Cornos", "Onlyfans", "Vazados", "Lésbicas", "Pack", "Putaria"];

interface UserGroup {
  id: string;
  name: string;
  description: string | null;
  category: string;
  telegram_link: string;
  thumbnail_url: string | null;
  views: number;
  clicks_count: number;
  is_premium: boolean;
  is_verified: boolean;
  created_at: string;
}

interface EditRequest {
  id: string;
  group_id: string;
  status: string;
}

const MyGroups = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [pendingEdits, setPendingEdits] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", category: "", telegram_link: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/login?returnUrl=/my-groups");
    }
  }, [user, authLoading, navigate]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Fetch groups submitted by user (via submitted_by column)
    const { data: directGroups } = await supabase
      .from("groups")
      .select("id, name, description, category, telegram_link, thumbnail_url, views, clicks_count, is_premium, is_verified, created_at")
      .eq("submitted_by", user.id);

    // Also fetch from approved submissions to find groups by telegram_link
    const { data: approvedSubs } = await supabase
      .from("group_submissions")
      .select("telegram_link")
      .eq("submitted_by", user.id)
      .eq("status", "approved");

    let allGroups: UserGroup[] = (directGroups as UserGroup[]) || [];

    if (approvedSubs && approvedSubs.length > 0) {
      const links = approvedSubs.map((s) => s.telegram_link);
      const existingIds = new Set(allGroups.map((g) => g.telegram_link));
      const missingLinks = links.filter((l) => !existingIds.has(l));

      if (missingLinks.length > 0) {
        const { data: extraGroups } = await supabase
          .from("groups")
          .select("id, name, description, category, telegram_link, thumbnail_url, views, clicks_count, is_premium, is_verified, created_at")
          .in("telegram_link", missingLinks);

        if (extraGroups) {
          allGroups = [...allGroups, ...(extraGroups as UserGroup[])];
        }
      }
    }

    setGroups(allGroups);

    // Fetch pending edit requests for these groups
    if (allGroups.length > 0) {
      const groupIds = allGroups.map((g) => g.id);
      const { data: edits } = await supabase
        .from("group_edit_requests")
        .select("id, group_id, status")
        .in("group_id", groupIds)
        .eq("status", "pending");

      const pendingMap: Record<string, boolean> = {};
      (edits || []).forEach((e: EditRequest) => {
        pendingMap[e.group_id] = true;
      });
      setPendingEdits(pendingMap);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const openEditModal = (group: UserGroup) => {
    setEditingGroup(group);
    setEditForm({
      name: group.name,
      description: group.description || "",
      category: group.category,
      telegram_link: group.telegram_link,
    });
    setEditPhotoFile(null);
    setEditPhotoPreview(null);
    setEditModalOpen(true);
  };

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Imagem deve ter no máximo 2MB", variant: "destructive" });
      return;
    }
    setEditPhotoFile(file);
    setEditPhotoPreview(URL.createObjectURL(file));
  };

  const handleEditSubmit = async () => {
    if (!editingGroup || !user) return;
    setEditSaving(true);

    const changes: Record<string, string | null> = {};
    if (editForm.name !== editingGroup.name) changes.name = editForm.name;
    if (editForm.description !== (editingGroup.description || "")) changes.description = editForm.description;
    if (editForm.category !== editingGroup.category) changes.category = editForm.category;
    if (editForm.telegram_link !== editingGroup.telegram_link) changes.telegram_link = editForm.telegram_link;

    // Upload new photo if selected
    if (editPhotoFile) {
      const ext = editPhotoFile.name.split(".").pop();
      const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("group-photos")
        .upload(filePath, editPhotoFile, { contentType: editPhotoFile.type });

      if (uploadError) {
        toast({ title: "Erro ao enviar foto", description: uploadError.message, variant: "destructive" });
        setEditSaving(false);
        return;
      }

      const publicUrl = supabase.storage.from("group-photos").getPublicUrl(filePath).data.publicUrl;
      changes.thumbnail_url = publicUrl;
    }

    if (Object.keys(changes).length === 0) {
      toast({ title: "Nenhuma alteração detectada", variant: "destructive" });
      setEditSaving(false);
      return;
    }

    const { error } = await supabase.from("group_edit_requests").insert({
      group_id: editingGroup.id,
      requested_by: user.id,
      changes,
      status: "pending",
    });

    if (error) {
      toast({ title: "Erro ao enviar solicitação", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Solicitação enviada! Aguarde aprovação." });
      setPendingEdits((prev) => ({ ...prev, [editingGroup.id]: true }));
      setEditModalOpen(false);
    }
    setEditSaving(false);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Meus Grupos | TGIndex" description="Acompanhe o desempenho dos seus canais." />
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={() => {}} activeSort="" />

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meus Grupos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe o desempenho dos seus canais</p>
        </div>

        <EmailConfirmationGuard user={user}>
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-lg text-muted-foreground">Você ainda não tem grupos aprovados</p>
            <Button onClick={() => navigate("/submit")}>
              <Send className="mr-2 h-4 w-4" />
              Enviar Primeiro Grupo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex gap-4 p-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                    {group.thumbnail_url ? (
                      <img src={group.thumbnail_url} alt={group.name} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-lg font-bold text-foreground">{group.name}</h3>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {group.is_premium && (
                          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 font-bold">⭐ Premium</Badge>
                        )}
                        {pendingEdits[group.id] && (
                          <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">✏️ Edição Pendente</Badge>
                        )}
                        <Badge variant="outline">{group.category}</Badge>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span className="font-semibold text-foreground">{group.views}</span> visualizações
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Link2 className="h-4 w-4" />
                        <span className="font-semibold text-foreground">{group.clicks_count}</span> cliques
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(group.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end border-t border-border px-4 py-3">
                  {pendingEdits[group.id] ? (
                    <p className="text-xs text-orange-500">Você já tem uma solicitação de edição pendente para este grupo</p>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => openEditModal(group)}>
                      <Pencil className="mr-1 h-3 w-3" />
                      Solicitar Edição
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </EmailConfirmationGuard>
      </main>

      {/* Edit Request Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Solicitar Edição</DialogTitle>
          </DialogHeader>

          <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              ⚠️ IMPORTANTE: Alterações precisam ser aprovadas por um administrador antes de aparecerem no site.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {/* Photo upload */}
            <div className="space-y-2">
              <Label>Nova Foto do Canal (opcional)</Label>
              {editingGroup?.thumbnail_url && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Foto Atual:</p>
                  <img src={editingGroup.thumbnail_url} alt="Atual" className="h-16 w-16 rounded-lg object-cover" />
                </div>
              )}
              {editPhotoPreview && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Nova Foto:</p>
                  <img src={editPhotoPreview} alt="Nova" className="h-16 w-16 rounded-lg object-cover border-2 border-yellow-500" />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handleEditPhotoChange}
              />
              <p className="text-xs text-muted-foreground">Máx 2MB</p>
            </div>

            <div className="space-y-2">
              <Label>Nome do Canal</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={editForm.category} onValueChange={(v) => setEditForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Link do Telegram</Label>
              <Input
                value={editForm.telegram_link}
                onChange={(e) => setEditForm((f) => ({ ...f, telegram_link: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditSubmit} disabled={editSaving}>
              {editSaving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyGroups;
