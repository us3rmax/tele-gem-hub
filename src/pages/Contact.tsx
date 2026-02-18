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

        {/* Info Section */}
        <div className="space-y-6 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          <div>
            <h2 className="mb-3 text-base font-semibold text-foreground">📧 Emails por Departamento</h2>
            <div className="space-y-3">
              {[
                { dept: "Suporte Geral", email: "suporte@canais18.com", desc: "Dúvidas, problemas técnicos, sugestões" },
                { dept: "Remoção de Links", email: "removal@canais18.com", desc: "Solicitar remoção de grupos/canais listados" },
                { dept: "Direitos Autorais (DMCA)", email: "dmca@canais18.com", desc: "Violações de copyright, propriedade intelectual" },
                { dept: "Denúncias de Conteúdo", email: "report@canais18.com", desc: "Conteúdo ilegal, CSAM, violações graves" },
                { dept: "Compliance / Legal", email: "compliance@canais18.com", desc: "Questões legais, conformidade 2257" },
                { dept: "Privacidade", email: "privacy@canais18.com", desc: "LGPD, dados pessoais, privacidade" },
                { dept: "Parcerias / Publicidade", email: "ads@canais18.com", desc: "Anunciar no site, parcerias comerciais" },
                { dept: "Imprensa", email: "press@canais18.com", desc: "Jornalistas, mídia, entrevistas" },
              ].map(({ dept, email: deptEmail, desc }) => (
                <div key={deptEmail} className="rounded-lg border border-border bg-background p-3">
                  <p className="font-medium text-foreground">{dept}</p>
                  <p className="text-primary">{deptEmail}</p>
                  <p className="text-xs">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-base font-semibold text-foreground">⏱️ Tempo de Resposta</h2>
            <ul className="space-y-1">
              <li>🚨 <strong className="text-foreground">Emergências (conteúdo ilegal):</strong> 2-6 horas</li>
              <li>📧 <strong className="text-foreground">Suporte geral:</strong> 24-48 horas</li>
              <li>📝 <strong className="text-foreground">Outras solicitações:</strong> 2-5 dias úteis</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-base font-semibold text-foreground">💬 Telegram (Suporte Rápido)</h2>
            <ul className="space-y-1">
              <li><strong className="text-foreground">Grupo de Suporte:</strong> @Canais18Suporte</li>
              <li><strong className="text-foreground">Bot de Ajuda:</strong> @Canais18Bot</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-base font-semibold text-foreground">❓ Perguntas Frequentes</h2>
            <div className="space-y-2">
              {[
                { q: "Quanto tempo leva para aprovar meu grupo?", a: "24-48 horas em média" },
                { q: "Posso editar meu grupo depois de aprovado?", a: "Sim, mas edições passam por nova aprovação" },
                { q: "Como faço para anunciar no site?", a: "Acesse /advertise ou envie email para ads@canais18.com" },
                { q: "Meu grupo foi rejeitado, por quê?", a: "Verifique seu email, enviamos o motivo da rejeição" },
                { q: "Como faço upgrade para Premium?", a: "Acesse \"Meus Grupos\" e selecione a opção Premium" },
              ].map(({ q, a }) => (
                <div key={q} className="rounded-lg border border-border bg-background p-3">
                  <p className="font-medium text-foreground">"{q}"</p>
                  <p className="mt-0.5 text-xs">→ {a}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-base font-semibold text-foreground">📱 Redes Sociais</h2>
            <ul className="space-y-1">
              <li><strong className="text-foreground">Telegram:</strong> @Canais18Oficial</li>
              <li><strong className="text-foreground">Twitter/X:</strong> @Canais18</li>
            </ul>
          </div>

          <p className="border-t border-border pt-4 text-center text-xs">
            <strong className="text-foreground">Respondemos todos os emails.</strong> Se não recebeu resposta em 5 dias úteis, verifique spam ou envie novamente.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Contact;
