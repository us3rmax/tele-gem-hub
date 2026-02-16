import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import MobileSidebar from "@/components/MobileSidebar";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Send, Clock, CheckCircle, XCircle, Loader2, Upload, X, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const CATEGORIES = [
  "Amadoras", "Cornos", "Coroas", "Lésbicas", "Novinhas", "Nudes",
  "Onlyfans", "Outros", "Pack", "Putaria", "Sexo", "Swing", "Trans", "Vazados",
];

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface Submission {
  id: string;
  name: string;
  category: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

const SubmitGroup = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [telegramLink, setTelegramLink] = useState("");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPromo, setSelectedPromo] = useState<"premium" | "banner" | null>(null);
  const [rulesAccepted, setRulesAccepted] = useState(false);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchSubmissions();
  }, [user]);

  const fetchSubmissions = async () => {
    setLoadingSubs(true);
    const { data } = await supabase
      .from("group_submissions")
      .select("id, name, category, status, rejection_reason, created_at")
      .eq("submitted_by", user!.id)
      .order("created_at", { ascending: false });
    setSubmissions((data as Submission[]) || []);
    setLoadingSubs(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, photo: "Formato inválido. Use JPG, PNG ou WebP." }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, photo: "Arquivo muito grande. Máximo 2MB." }));
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErrors((prev) => {
      const { photo, ...rest } = prev;
      return rest;
    });
  };

  const removePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Nome do canal é obrigatório";
    if (!category) errs.category = "Selecione uma categoria";
    if (!telegramLink.trim()) {
      errs.telegramLink = "Link do Telegram é obrigatório";
    } else if (!telegramLink.startsWith("https://t.me/")) {
      errs.telegramLink = "Link deve começar com https://t.me/";
    } else if (telegramLink.endsWith("_bot")) {
      errs.telegramLink = "Links de bots não são permitidos";
    }
    if (!photoFile) errs.photo = "Foto é obrigatória";
    if (!description.trim()) {
      errs.description = "Descrição é obrigatória";
    } else if (description.trim().length < 50) {
      errs.description = "Descrição deve ter no mínimo 50 caracteres";
    } else if (description.length > 500) {
      errs.description = "Máximo de 500 caracteres";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `${user!.id}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("group-photos")
      .upload(filePath, file, { contentType: file.type });

    if (error) {
      toast({ title: "Erro ao enviar foto", description: error.message, variant: "destructive" });
      return null;
    }

    const { data: urlData } = supabase.storage.from("group-photos").getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user || !photoFile) return;

    setSubmitting(true);

    const photoUrl = await uploadPhoto(photoFile);
    if (!photoUrl) {
      setSubmitting(false);
      return;
    }

    const insertPayload: any = {
      name: name.trim(),
      category,
      telegram_link: telegramLink.trim(),
      description: description.trim(),
      thumbnail_url: photoUrl,
      submitted_by: user.id,
    };

    if (selectedPromo) {
      insertPayload.is_paid = true;
      insertPayload.payment_type = selectedPromo;
      insertPayload.payment_amount = selectedPromo === "premium" ? 29.9 : 49.9;
      insertPayload.payment_status = "pending";
    }

    const { error } = await supabase.from("group_submissions").insert(insertPayload);

    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    } else {
      const successMsg = selectedPromo
        ? "Grupo enviado! Você receberá instruções de pagamento por email."
        : "Aguarde aprovação (24-48h)";
      toast({ title: "Canal enviado!", description: successMsg });
      setName("");
      setCategory("");
      setTelegramLink("");
      setDescription("");
      removePhoto();
      setErrors({});
      setSelectedPromo(null);
      fetchSubmissions();
      supabase.functions.invoke("notify-admin", { method: "POST" }).catch(() => {});
    }
    setSubmitting(false);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-600/20 text-green-400 border-green-600/30"><CheckCircle className="mr-1 h-3 w-3" />Aprovado</Badge>;
      case "rejected":
        return <Badge className="bg-red-600/20 text-red-400 border-red-600/30"><XCircle className="mr-1 h-3 w-3" />Rejeitado</Badge>;
      default:
        return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30"><Clock className="mr-1 h-3 w-3" />Pendente</Badge>;
    }
  };

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
      <SEO title="Enviar Canal | Canais18" description="Envie seu canal do Telegram para aprovação." />
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={() => {}} activeSort="" />

      <main className="mx-auto max-w-xl space-y-8 px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Enviar Canal para Aprovação</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu canal será revisado antes de aparecer no site
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-6">
          {/* Content Policy Disclaimer */}
          <div className="rounded-lg border-l-4 border-red-500 bg-red-500/10 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <h3 className="font-bold text-foreground">⚠️ Regras Importantes</h3>
            </div>

            <div className="space-y-2 text-sm text-foreground">
              <div>
                <p className="font-semibold text-red-400">🚫 PROIBIDO:</p>
                <ul className="ml-4 mt-1 space-y-0.5 text-muted-foreground list-disc">
                  <li>Fotos explícitas na imagem do grupo (capa/thumbnail)</li>
                  <li>Conteúdo ilegal (menores de idade, violência extrema, etc)</li>
                  <li>Links para conteúdo que viole leis brasileiras</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-green-400">✅ PERMITIDO:</p>
                <ul className="ml-4 mt-1 space-y-0.5 text-muted-foreground list-disc">
                  <li>Conteúdo adulto consensual entre adultos (+18)</li>
                  <li>Fotos sugestivas (sem nudez explícita na capa)</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-yellow-400">⚖️ IMPORTANTE:</p>
                <ul className="ml-4 mt-1 space-y-0.5 text-muted-foreground list-disc">
                  <li>Todos os links são analisados pela nossa equipe</li>
                  <li>Conteúdo ilegal resultará em:</li>
                  <ul className="ml-4 space-y-0.5 list-disc">
                    <li>Rejeição imediata do grupo</li>
                    <li>Denúncia às autoridades</li>
                    <li>Denúncia na plataforma Telegram</li>
                    <li>Bloqueio permanente da sua conta</li>
                  </ul>
                </ul>
              </div>

              <p className="text-xs text-muted-foreground pt-1 italic">
                Ao enviar, você confirma que o conteúdo está em conformidade com as leis brasileiras.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome do Canal *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do seu canal" />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram_link">Link do Telegram *</Label>
            <Input id="telegram_link" value={telegramLink} onChange={(e) => setTelegramLink(e.target.value)} placeholder="https://t.me/seu_canal" />
            {errors.telegramLink && <p className="text-xs text-destructive">{errors.telegramLink}</p>}
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Foto do Canal *</Label>
            {photoPreview ? (
              <div className="relative inline-block">
                <img src={photoPreview} alt="Preview" className="h-32 w-32 rounded-xl border border-border object-cover" />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:opacity-80"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-32 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Upload className="h-5 w-5" />
                Clique para enviar foto (JPG, PNG, WebP — máx 2MB)
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            {errors.photo && <p className="text-xs text-destructive">{errors.photo}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição * <span className="text-muted-foreground">(mín. 50 / máx. 500 caracteres)</span></Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o conteúdo do canal (mínimo 50 caracteres)"
              rows={3}
              maxLength={500}
            />
            <p className={`text-xs text-right ${description.trim().length < 50 ? "text-muted-foreground" : "text-green-500"}`}>
              {description.trim().length}/50
            </p>
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          {/* Promotion Options */}
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <div>
              <h3 className="text-base font-bold text-foreground">💎 Opções de Destaque <span className="text-xs font-normal text-muted-foreground">(Opcional)</span></h3>
              <p className="text-xs text-muted-foreground">Aumente a visibilidade do seu canal</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Premium Card */}
              <button
                type="button"
                onClick={() => setSelectedPromo(selectedPromo === "premium" ? null : "premium")}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  selectedPromo === "premium"
                    ? "border-yellow-500 bg-yellow-500/10"
                    : "border-border hover:border-yellow-500/50"
                }`}
              >
                <div className="mb-2 text-2xl">⭐</div>
                <h4 className="font-bold text-foreground">Canal em Destaque</h4>
                <p className="text-lg font-bold text-yellow-500">R$ 29,90<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>✓ Aparece no carrossel de destaques</li>
                  <li>✓ Badge 'Premium' dourado</li>
                  <li>✓ Prioridade nas buscas</li>
                  <li>✓ 3x mais visualizações</li>
                </ul>
                <div className="mt-3 flex items-center gap-2">
                  <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${selectedPromo === "premium" ? "border-yellow-500 bg-yellow-500" : "border-muted-foreground"}`}>
                    {selectedPromo === "premium" && <span className="text-[10px] text-white">✓</span>}
                  </div>
                  <span className="text-xs font-medium text-foreground">Adicionar Destaque</span>
                </div>
              </button>

              {/* Banner Card */}
              <button
                type="button"
                onClick={() => setSelectedPromo(selectedPromo === "banner" ? null : "banner")}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  selectedPromo === "banner"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="mb-2 text-2xl">📢</div>
                <h4 className="font-bold text-foreground">Banner Publicitário</h4>
                <p className="text-lg font-bold text-primary">R$ 49,90<span className="text-xs font-normal text-muted-foreground">/semana</span></p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>✓ Banner no topo do site</li>
                  <li>✓ Milhares de visualizações</li>
                  <li>✓ Link direto para seu canal</li>
                  <li>✓ Máxima visibilidade</li>
                </ul>
                <div className="mt-3 flex items-center gap-2">
                  <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${selectedPromo === "banner" ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                    {selectedPromo === "banner" && <span className="text-[10px] text-white">✓</span>}
                  </div>
                  <span className="text-xs font-medium text-foreground">Adicionar Banner</span>
                </div>
              </button>
            </div>

            {selectedPromo && (
              <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-2">
                <span className="text-sm font-medium text-foreground">Total:</span>
                <span className="text-lg font-bold text-foreground">
                  R$ {selectedPromo === "premium" ? "29,90" : "49,90"}
                </span>
              </div>
            )}
          </div>

          {/* Rules acceptance checkbox */}
          <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-4">
            <Checkbox
              id="rules-accepted"
              checked={rulesAccepted}
              onCheckedChange={(checked) => setRulesAccepted(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="rules-accepted" className="text-sm font-medium text-foreground cursor-pointer leading-snug">
              ✅ Li e concordo com as regras acima
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={submitting || !rulesAccepted}>
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
            ) : (
              <><Send className="mr-2 h-4 w-4" />Enviar Canal</>
            )}
          </Button>
        </form>

        {/* My Submissions */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Meus Envios</h2>

          {loadingSubs ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : submissions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Você ainda não enviou nenhum canal.</p>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">{sub.category}</p>
                    {sub.status === "rejected" && sub.rejection_reason && (
                      <p className="mt-1 text-xs text-destructive">Motivo: {sub.rejection_reason}</p>
                    )}
                  </div>
                  {statusBadge(sub.status)}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default SubmitGroup;
