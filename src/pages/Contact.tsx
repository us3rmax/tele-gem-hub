import { useState } from "react";
import { Send, User, Mail, MessageSquare } from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileSidebar from "@/components/MobileSidebar";
import { toast } from "@/hooks/use-toast";

const assuntos = ["Consulta", "Remoção de conteúdo", "Reportar grupo", "Parceria", "Outro"];

const Contact = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sort, setSort] = useState("recentes");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [assunto, setAssunto] = useState("Consulta");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const isValid = name.trim().length > 0 && email.includes("@") && message.trim().length >= 50;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSending(true);
    // Simulate sending
    setTimeout(() => {
      setSending(false);
      toast({ title: "Solicitação enviada!", description: "Sua mensagem será revisada em breve." });
      setName("");
      setEmail("");
      setAssunto("Consulta");
      setMessage("");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={setSort} activeSort={sort} />

      <main className="mx-auto max-w-xl space-y-4 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contate-nos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Bem-vindo a nossa página de contato.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-5">
          {/* Nome */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <User className="h-4 w-4" /> Nome completo
            </label>
            <input
              type="text"
              placeholder="Seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Mail className="h-4 w-4" /> E-mail
            </label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {/* Assunto */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageSquare className="h-4 w-4" /> Assunto
            </label>
            <select
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              {assuntos.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <MessageSquare className="h-4 w-4" /> Mensagem
              </label>
              <span className="text-xs text-muted-foreground">{message.length} / 1000</span>
            </div>
            <textarea
              placeholder="Descreva com suas palavras qual a sua solicitação"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
              rows={5}
              className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">
              Mínimo de 50 caracteres. Sua mensagem será revisada antes de respondermos.
            </p>
          </div>

          <button
            type="submit"
            disabled={!isValid || sending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            {sending ? "Enviando..." : "Enviar Solicitação"}
          </button>
        </form>
      </main>
    </div>
  );
};

export default Contact;
