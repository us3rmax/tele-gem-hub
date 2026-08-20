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
import EmailConfirmationGuard from "@/components/EmailConfirmationGuard";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import ImageCropModal from "@/components/ImageCropModal";

const TURNSTILE_SITE_KEY = "0x4AAAAAACeD94GpcENqZjWY";

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
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPromo, setSelectedPromo] = useState<"premium" | "express" | null>(null);
  const [botError, setBotError] = useState(false);
  const [isBotAdmin, setIsBotAdmin] = useState(false);
  const [verifyingBot, setVerifyingBot] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);

  // Estados para o Pagamento
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pixData, setPixData] = useState<{ qr_code_base64: string; pix_copia_cola: string; id: string } | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'error'>('pending');

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

    // Open cropper instead of setting directly
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    setErrors((prev) => { const { photo, ...rest } = prev; return rest; });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropComplete = (blob: Blob) => {
    const croppedFile = new File([blob], "photo.jpg", { type: "image/jpeg" });
    setPhotoFile(croppedFile);
    const preview = URL.createObjectURL(blob);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(preview);
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
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

    if (!turnstileToken) {
      toast({ title: "Falha na verificação de segurança", description: "Recarregue a página.", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    // Verify turnstile token server-side
    const { data: verification } = await supabase.functions.invoke("verify-turnstile", {
      body: { token: turnstileToken },
    });

    if (!verification?.success) {
      toast({ title: "Falha na verificação", description: "Tente novamente.", variant: "destructive" });
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setSubmitting(false);
      return;
    }

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
      insertPayload.payment_amount = selectedPromo === "premium" ? 29.9 : 5.99;
      insertPayload.payment_status = "pending";
    }

    const { data: submissionData, error } = await supabase
      .from("group_submissions")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Se tiver pagamento selecionado, gera o PIX
    if (selectedPromo && submissionData) {
      setPaymentLoading(true);
      setShowPaymentModal(true);
      
      try {
        const { data: paymentResponse, error: paymentError } = await supabase.functions.invoke("payment-handler", {
          body: {
            submissionId: submissionData.id,
            amount: selectedPromo === "premium" ? 29.9 : 5.99,
            description: `Canais18 - ${selectedPromo === "premium" ? "Destaque Semanal" : "Aprovação Imediata"}`
          },
          method: 'POST',
          headers: {
            // A função espera a rota /create-pix
          }
        });

        // Como a URL na função usa pathname.endsWith('/create-pix'), 
        // precisamos garantir que a chamada atinja esse endpoint.
        // O invoke do supabase-js não permite mudar o path facilmente, 
        // então vamos usar fetch direto se necessário, ou ajustar a função.
        // Vou usar fetch direto para garantir o path.
        
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-handler/create-pix`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            submissionId: submissionData.id,
            amount: selectedPromo === "premium" ? 29.9 : 5.99,
            description: `Canais18 - ${selectedPromo === "premium" ? "Destaque Semanal" : "Aprovação Imediata"}`
          })
        });

        const pixResult = await response.json();

        if (pixResult.success) {
          // A AtenasPay pode retornar como qr_code ou qr_code_base64
          const qrCode = pixResult.transaction.qr_code_base64 || pixResult.transaction.qr_code;
          
          setPixData({
            qr_code_base64: qrCode,
            pix_copia_cola: pixResult.transaction.pix_copia_cola,
            id: pixResult.transaction.id
          });
          
          // Inicia polling para verificar pagamento
          const interval = setInterval(async () => {
            const { data: sub } = await supabase
              .from("group_submissions")
              .select("payment_status")
              .eq("id", submissionData.id)
              .single();
            
            if (sub?.payment_status === "paid") {
              setPaymentStatus("paid");
              clearInterval(interval);
              toast({ title: "Pagamento Confirmado!", description: "Seu grupo já foi aprovado e está no ar." });
              setTimeout(() => {
                setShowPaymentModal(false);
                resetForm();
              }, 3000);
            }
          }, 5000);

          // Limpa intervalo após 15 minutos
          setTimeout(() => clearInterval(interval), 15 * 60 * 1000);
        } else {
          throw new Error(pixResult.error || "Erro ao gerar PIX");
        }
      } catch (err: any) {
        toast({ title: "Erro no pagamento", description: err.message, variant: "destructive" });
        setPaymentStatus("error");
      } finally {
        setPaymentLoading(false);
      }
    } else {
      toast({ title: "Canal enviado!", description: "Aguarde aprovação manual." });
      resetForm();
    }
    
    setSubmitting(false);
  };

  const resetForm = () => {
    setName("");
    setCategory("");
    setTelegramLink("");
    setDescription("");
    removePhoto();
    setErrors({});
    setSelectedPromo(null);
    turnstileRef.current?.reset();
    setTurnstileToken(null);
    fetchSubmissions();
    supabase.functions.invoke("notify-admin", { method: "POST" }).catch(() => {});
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
            Siga os passos abaixo para cadastrar seu canal e divulgar automaticamente
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">Preencha os dados do seu canal abaixo para começar.</p>
        </div>

        {!user.email_confirmed_at && (
          <div className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-500" />
            <p className="text-sm text-yellow-200">
              Confirme seu email antes de enviar um grupo. Verifique sua caixa de entrada.
            </p>
          </div>
        )}

        <EmailConfirmationGuard user={user}>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-6">
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
            <div className="flex gap-2">
              <Input 
                id="telegram_link" 
                value={telegramLink} 
                onChange={(e) => {
                  const val = e.target.value;
                  setTelegramLink(val);
                  setBotError(val.trim().toLowerCase().endsWith("_bot"));
                  setIsBotAdmin(false); // Reseta ao mudar o link
                }} 
                placeholder="https://t.me/seu_canal" 
              />
              {selectedPromo !== "premium" && (
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={async () => {
                    if (!telegramLink.startsWith("https://t.me/")) {
                      toast({ title: "Link inválido", description: "Use o formato https://t.me/nome_do_grupo", variant: "destructive" });
                      return;
                    }
                    setVerifyingBot(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("verify-bot-admin", {
                        body: { telegramLink }
                      });
                      if (error) throw error;
                      if (data.isAdmin) {
                        setIsBotAdmin(true);
                        toast({ title: "✅ Bot Verificado!", description: "Agora você pode enviar seu grupo." });
                      } else {
                        toast({ title: "❌ Bot não é Admin", description: data.message, variant: "destructive" });
                      }
                    } catch (err: any) {
                      toast({ title: "Erro na verificação", description: "Certifique-se que o bot é admin e tente novamente.", variant: "destructive" });
                    } finally {
                      setVerifyingBot(false);
                    }
                  }}
                  disabled={verifyingBot || botError || !telegramLink.trim()}
                  className={isBotAdmin ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {verifyingBot ? <Loader2 className="h-4 w-4 animate-spin" /> : isBotAdmin ? <CheckCircle className="h-4 w-4" /> : "Verificar Bot"}
                </Button>
              )}
            </div>
            {botError && <p className="text-xs text-destructive">❌ Não é permitido envio de bots. Envie um grupo ou canal.</p>}
            {isBotAdmin && <p className="text-xs text-green-500 font-medium">✅ Bot administrador detectado!</p>}
            {errors.telegramLink && !botError && <p className="text-xs text-destructive">{errors.telegramLink}</p>}
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
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Opções de Destaque e Aprovação
              </h3>
              <p className="text-sm text-muted-foreground">Acelere o crescimento do seu canal</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Plano Express */}
              <button
                type="button"
                onClick={() => setSelectedPromo(selectedPromo === "express" ? null : "express")}
                className={`relative flex flex-col rounded-xl border-2 p-4 text-left transition-all ${
                  selectedPromo === "express"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="mb-2 text-2xl">⚡</div>
                <h4 className="font-bold text-foreground">Aprovação Imediata</h4>
                <p className="text-lg font-bold text-primary">R$ 5,99</p>
                <ul className="mt-2 flex-1 space-y-1 text-xs text-muted-foreground">
                  <li>✓ Pule a fila de espera</li>
                  <li>✓ Aprovação e postagem imediata</li>
                </ul>
                <div className="mt-4 flex items-center gap-2">
                  <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${selectedPromo === "express" ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                    {selectedPromo === "express" && <span className="text-[10px] text-white">✓</span>}
                  </div>
                  <span className="text-xs font-medium text-foreground">Selecionar</span>
                </div>
              </button>

              {/* Plano Premium */}
              <button
                type="button"
                onClick={() => setSelectedPromo(selectedPromo === "premium" ? null : "premium")}
                className={`relative flex flex-col rounded-xl border-2 p-4 text-left transition-all ${
                  selectedPromo === "premium"
                    ? "border-yellow-500 bg-yellow-500/10"
                    : "border-border hover:border-yellow-500/50"
                }`}
              >
                <div className="absolute -right-2 -top-2 rounded-full bg-yellow-500 px-2 py-0.5 text-[10px] font-bold text-black">
                  MELHOR VALOR
                </div>
                <div className="mb-2 text-2xl">⭐</div>
                <h4 className="font-bold text-foreground">Destaque Semanal</h4>
                <p className="text-lg font-bold text-yellow-500">R$ 29,90<span className="text-xs font-normal text-muted-foreground">/semana</span></p>
                <ul className="mt-2 flex-1 space-y-1 text-xs text-muted-foreground">
                  <li>✓ <strong>Aprovação Imediata</strong></li>
                  <li>✓ Carrossel de destaques (1 semana)</li>
                  <li>✓ Badge 'Premium' dourado</li>
                  <li>✓ <strong>10x mais visualizações</strong></li>
                  <li>✓ 🚀 <strong>Não precisa adicionar o bot</strong></li>
                </ul>
                <div className="mt-4 flex items-center gap-2">
                  <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${selectedPromo === "premium" ? "border-yellow-500 bg-yellow-500" : "border-muted-foreground"}`}>
                    {selectedPromo === "premium" && <span className="text-[10px] text-white">✓</span>}
                  </div>
                  <span className="text-xs font-medium text-foreground">Selecionar</span>
                </div>
              </button>
            </div>

            {selectedPromo && (
              <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3 border border-border">
                <span className="text-sm font-medium text-foreground">Total a pagar:</span>
                <span className="text-xl font-bold text-foreground">
                  {selectedPromo === "premium" ? "R$ 29,90" : "R$ 5,99"}
                </span>
              </div>
            )}

            <Button 
              type="button" 
              variant="ghost" 
              className="w-full text-xs text-muted-foreground hover:text-primary" 
              onClick={() => navigate("/advertise")}
            >
              📢 Quer máxima visibilidade? Anuncie com banner →
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Ao enviar, você confirma que o conteúdo não viola leis brasileiras. Conteúdo ilegal será denunciado às autoridades e ao Telegram.
          </p>

          <Turnstile
            ref={turnstileRef}
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={setTurnstileToken}
            onError={() => setTurnstileToken(null)}
            onExpire={() => setTurnstileToken(null)}
            options={{ size: "invisible" }}
          />

          {/* Telegram Bot Instructions - Only shown if not premium */}
          {selectedPromo !== "premium" && (
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                <Clock className="h-5 w-5 text-primary" />
                Passo Obrigatório para Planos Grátis/Express
              </h2>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Para validar seu grupo e permitir divulgações automáticas, você deve adicionar nosso bot como <strong>Administrador</strong>:
                </p>
                <Button 
                  type="button"
                  className="w-full gap-2 bg-[#229ED9] hover:bg-[#229ED9]/90 text-white"
                  onClick={() => window.open("https://t.me/canais18_bot?startgroup=true", "_blank")}
                >
                  <Send className="h-4 w-4" />
                  Adicionar @canais18_bot como Admin
                </Button>
                <div className="rounded-lg bg-yellow-500/10 p-3 text-[10px] text-yellow-200 border border-yellow-500/20">
                  <p>⚠️ <strong>Atenção:</strong> Se o bot não for administrador, seu grupo será rejeitado automaticamente. </p>
                </div>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className={`w-full ${!isBotAdmin && selectedPromo !== "premium" ? "opacity-50 cursor-not-allowed" : ""}`} 
            disabled={submitting || botError || !user.email_confirmed_at || (!isBotAdmin && selectedPromo !== "premium")}
          >
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
            ) : !isBotAdmin && selectedPromo !== "premium" ? (
              <><AlertTriangle className="mr-2 h-4 w-4" />Adicione o Bot como Admin Primeiro</>
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
        </EmailConfirmationGuard>
      </main>

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {/* Modal de Pagamento PIX */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-card p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">Pagamento via PIX</h3>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 text-center">
              {paymentLoading ? (
                <div className="flex flex-col items-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="mt-4 text-sm text-muted-foreground">Gerando seu QR Code...</p>
                </div>
              ) : paymentStatus === 'paid' ? (
                <div className="flex flex-col items-center py-8 text-green-500">
                  <CheckCircle className="h-20 w-20" />
                  <h4 className="mt-4 text-2xl font-bold">Pagamento Confirmado!</h4>
                  <p className="text-sm text-muted-foreground">Seu grupo já está ativo no site.</p>
                </div>
              ) : pixData ? (
                <>
                  <div className="mx-auto flex aspect-square w-64 items-center justify-center rounded-2xl bg-white p-4">
                    <img 
                      src={pixData.qr_code_base64?.startsWith('data:image') 
                        ? pixData.qr_code_base64 
                        : `data:image/png;base64,${pixData.qr_code_base64}`} 
                      alt="QR Code PIX" 
                      className="h-full w-full"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Escaneie o QR Code ou copie o código abaixo:</p>
                    <div className="flex items-center gap-2 rounded-xl bg-secondary p-2">
                      <code className="flex-1 truncate text-left text-xs text-muted-foreground px-2">
                        {pixData.pix_copia_cola}
                      </code>
                      <Button 
                        size="sm" 
                        variant="primary"
                        onClick={() => {
                          navigator.clipboard.writeText(pixData.pix_copia_cola);
                          toast({ title: "Copiado!", description: "Código PIX copiado para a área de transferência." });
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 py-2 text-xs text-primary font-medium">
                    <Clock className="h-3 w-3 animate-pulse" />
                    Aguardando confirmação do pagamento...
                  </div>
                </>
              ) : (
                <div className="py-12 text-destructive">
                  <XCircle className="mx-auto h-12 w-12" />
                  <p className="mt-4">Ocorreu um erro ao gerar o pagamento. Tente novamente.</p>
                </div>
              )}
            </div>

            <p className="mt-8 text-center text-[10px] text-muted-foreground">
              Pagamento processado com segurança via AtenasPay.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmitGroup;
