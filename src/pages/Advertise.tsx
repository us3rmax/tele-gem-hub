import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { useState } from "react";
import MobileSidebar from "@/components/MobileSidebar";

const Advertise = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Anunciar com Banner | Canais18" description="Anuncie seu canal com banner no Canais18 para máxima visibilidade." />
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSort={() => {}} activeSort="" />

      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">📢 Anunciar com Banner</h1>
        <p className="mt-4 text-muted-foreground">Em breve! Entre em contato para mais informações.</p>
      </main>
    </div>
  );
};

export default Advertise;
