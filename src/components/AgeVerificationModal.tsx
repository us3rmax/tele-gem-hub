import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const AGE_KEY = "age_verified";

const AgeVerificationModal = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const excluded = [
      "/sitemap.xml", "/robots.txt", "/submit", "/privacy", "/terms",
      "/dmca", "/2257", "/removal", "/contato",
      "/auth/login", "/login", "/signin",
      "/auth/register", "/register",
      "/forgot-password",
    ];
    if (!localStorage.getItem(AGE_KEY) && !excluded.includes(window.location.pathname)) {
      setShow(true);
    }
  }, []);

  const handleConfirm = () => {
    localStorage.setItem(AGE_KEY, "true");
    setShow(false);
  };

  const handleExit = () => {
    window.location.href = "https://www.google.com";
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm bg-black/70">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl text-center space-y-6">
        <div className="space-y-2">
          <p className="text-4xl">⚠️</p>
          <h2 className="text-2xl font-bold text-foreground">Conteúdo +18</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Este site contém conteúdo adulto. Você confirma ter 18 anos ou mais e concordar com os{" "}
            <span className="text-primary">Termos de Uso</span>?
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            ✓ Tenho 18+
          </Button>
          <Button
            onClick={handleExit}
            variant="outline"
            className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
          >
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgeVerificationModal;
