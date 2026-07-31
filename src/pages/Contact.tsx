import { useState } from "react";
import Navbar from "@/components/Navbar";
import MobileSidebar from "@/components/MobileSidebar";
import SEO from "@/components/SEO";

const Contact = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sort, setSort] = useState("recentes");

  return (
    <div className="flex flex-1 flex-col bg-background">
      <SEO title="Contato | Canais18" description="Entre em contato com nossa equipe." />
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={setSort} activeSort={sort} />

      <main className="mx-auto max-w-xl space-y-4 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contate-nos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Bem-vindo a nossa página de contato.</p>
        </div>

        {/* Contact Info */}
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

          <p className="border-t border-border pt-4 text-center text-xs">
            <strong className="text-foreground">Respondemos todos os emails.</strong> Se não recebeu resposta em 5 dias úteis, verifique spam ou envie novamente.
          </p>
        </div>

        {/* FAQ */}
        <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          <h2 className="mb-3 text-base font-semibold text-foreground">❓ Perguntas Frequentes</h2>
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
      </main>
    </div>
  );
};

export default Contact;
