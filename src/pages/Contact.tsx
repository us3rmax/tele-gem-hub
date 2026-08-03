import Navbar from "@/components/Navbar";
import MobileSidebar from "@/components/MobileSidebar";
import SEO from "@/components/SEO";
import { useState } from "react";

const CONTACT_EMAIL = "tggrupos@proton.me";

const Contact = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sort, setSort] = useState("recentes");

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Contato | Canais18" description="Entre em contato com a equipe Canais18." />
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={setSort} activeSort={sort} />

      <main className="mx-auto max-w-xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contato</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Para qualquer assunto — suporte, remoção de links, DMCA, parcerias ou denúncias — entre em contato pelo email abaixo.
          </p>
        </div>

        {/* Contact Email */}
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <p className="text-sm text-muted-foreground">Envie sua mensagem para:</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-2 inline-block text-lg font-bold text-primary hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
          <p className="mt-3 text-xs text-muted-foreground">
            Respondemos em até 5 dias úteis.
          </p>
        </div>

        {/* Motivos para Contato */}
        <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          <h2 className="mb-3 text-base font-semibold text-foreground">Quando entrar em contato:</h2>
          <ul className="space-y-2">
            <li>📌 Solicitar remoção de um grupo/canal listado</li>
            <li>📌 Reportar conteúdo ilegal ou impróprio</li>
            <li>📌 Violação de direitos autorais (DMCA)</li>
            <li>📌 Dúvidas sobre a plataforma</li>
            <li>📌 Parcerias e publicidade</li>
            <li>📌 Questões legais ou de privacidade</li>
          </ul>
        </div>

        {/* FAQ */}
        <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          <h2 className="mb-3 text-base font-semibold text-foreground">Perguntas Frequentes</h2>
          <div className="space-y-2">
            {[
              { q: "Quanto tempo leva para aprovar meu grupo?", a: "24-48 horas em média." },
              { q: "Posso editar meu grupo depois de aprovado?", a: "Sim, mas edições passam por nova aprovação." },
              { q: "Como faço para anunciar no site?", a: "Envie email para o endereço acima." },
              { q: "Meu grupo foi rejeitado, por quê?", a: "Verifique o email associado à sua conta, enviamos o motivo." },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-lg border border-border bg-background p-3">
                <p className="font-medium text-foreground">{q}</p>
                <p className="mt-0.5 text-xs">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;
