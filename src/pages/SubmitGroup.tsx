import { useState, useEffect } from "react";
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
import { Send, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

const CATEGORIES = [
  "Amadoras", "Cornos", "Coroas", "Lésbicas", "Novinhas", "Nudes",
  "Onlyfans", "Outros", "Pack", "Putaria", "Sexo", "Swing", "Trans", "Vazados",
];

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

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [telegramLink, setTelegramLink] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (description.length > 500) errs.description = "Máximo de 500 caracteres";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;

    setSubmitting(true);
    const { error } = await supabase.from("group_submissions").insert({
      name: name.trim(),
      category,
      telegram_link: telegramLink.trim(),
      description: description.trim() || null,
      thumbnail_url: thumbnailUrl.trim() || null,
      submitted_by: user.id,
    });

    if (error) {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Canal enviado!",
        description: "Aguarde aprovação (24-48h)",
      });
      setName("");
      setCategory("");
      setTelegramLink("");
      setDescription("");
      setThumbnailUrl("");
      setErrors({});
      fetchSubmissions();

      // Fire-and-forget: notify admin if pending threshold reached
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
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Enviar Canal para Aprovação</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu canal será revisado antes de aparecer no site
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Canal *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do seu canal"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
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
            <Input
              id="telegram_link"
              value={telegramLink}
              onChange={(e) => setTelegramLink(e.target.value)}
              placeholder="https://t.me/seu_canal"
            />
            {errors.telegramLink && <p className="text-xs text-destructive">{errors.telegramLink}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição <span className="text-muted-foreground">(opcional, máx. 500 caracteres)</span></Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva seu canal..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail_url">Foto do Canal <span className="text-muted-foreground">(URL, opcional)</span></Label>
            <Input
              id="thumbnail_url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://exemplo.com/foto.jpg"
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
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
