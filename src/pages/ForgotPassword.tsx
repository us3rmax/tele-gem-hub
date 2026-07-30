import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://www.canais18.com/auth/login",
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <SEO
        title="Recuperar Senha | Canais18"
        description="Recupere sua senha do Canais18 enviando um email de redefinição."
      />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logo} alt="Canais18" className="max-w-[180px] w-full h-auto mx-auto object-contain" />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
          <h1 className="text-2xl font-bold text-foreground text-center mb-2">
            Recuperar Senha
          </h1>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground">
                Enviamos um link de redefinição para seu email.
              </p>
              <p className="text-xs text-muted-foreground/60">
                Confira sua caixa de entrada e a pasta de spam.
              </p>

              <div className="space-y-3 pt-2">
                <Button
                  onClick={() => { setSent(false); setError(""); }}
                  variant="outline"
                  className="w-full h-11 bg-white/5 border-white/10 text-foreground hover:bg-white/10"
                >
                  Enviar outro email
                </Button>

                <Link to="/auth/login" className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground text-center text-sm mb-6">
                Informe seu email para receber o link de recuperação
              </p>

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-start gap-2 mb-4">
                  <span className="mt-0.5">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground/80">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-11 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground/60"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading} size="lg">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Enviando...
                    </span>
                  ) : "Enviar Link"}
                </Button>
              </form>

              <Link to="/auth/login" className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline mt-6">
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
