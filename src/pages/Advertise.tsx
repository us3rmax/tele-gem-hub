import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { useState } from "react";
import MobileSidebar from "@/components/MobileSidebar";

const CONTACT_EMAIL = "tggrupos@proton.me";

const Advertise = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Anunciar no Canais18 | Banners e Parcerias" description="Anuncie seu canal ou marca no Canais18. Banners em destaque para máxima visibilidade." />
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={() => {}} activeSort="" />

      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Anunciar no Canais18</h1>
          <p className="mt-4 text-muted-foreground">
            Oferecemos banners em destaque na homepage e páginas de categorias para máxima visibilidade do seu canal ou marca.
          </p>
          <p className="mt-4 text-muted-foreground">
            Para solicitar um espaço publicitário, entre em contato:
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-3 inline-block text-lg font-bold text-primary hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
          <p className="mt-2 text-xs text-muted-foreground">
            Respondemos em até 5 dias úteis.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Advertise;
