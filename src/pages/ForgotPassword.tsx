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
    <div className="flex min-h-screen bg-background">
      <SEO title="Recuperar Senha | Canais18" description="Recupere sua senha do Canais18 enviando um email de redefinição." />

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-primary/10">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
          <img src={logo} alt="Canais18" className="w-48 h-auto mb-8 opacity-90" />
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">
            Recuperar Senha
          </h2>
          <p className="text-muted-foreground text-center text-lg max-w-md">
            Enviamos um link de redefinição para seu email. Confira sua caixa de entrada.
          </p>
        </div>
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center">
            <img src={logo} alt="Canais18" className="w-20 h-auto mx-auto mb-4" />
          </div>

          {sent ? (
            <>
              <div className="space-y-2 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Email Enviado!</h1>
                <p className="text-muted-foreground">
                  Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Não recebeu? Verifique sua pasta de spam ou tente novamente.
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => { setSent(false); setError(""); }}
                  variant="outline"
                  className="w-full h-11"
                >
                  Enviar outro email
                </Button>

                <Link to="/auth/login" className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o login
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Recuperar Senha</h1>
                <p className="text-muted-foreground">
                  Informe seu email para receber o link de recuperação
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-start gap-2">
                    <span className="mt-0.5">⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-11"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading} size="lg">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Enviando...
                    </span>
                  ) : "Enviar Link"}
                </Button>
              </form>

              <Link to="/auth/login" className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline">
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
