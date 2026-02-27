import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { supabase } from "@/integrations/supabase/client";

const TURNSTILE_SITE_KEY = "0x4AAAAAACeD94GpcENqZjWY";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!turnstileToken) {
      setError("Falha na verificação de segurança. Recarregue a página.");
      return;
    }

    setLoading(true);

    // Verify turnstile token server-side
    const { data: verification } = await supabase.functions.invoke("verify-turnstile", {
      body: { token: turnstileToken },
    });

    if (!verification?.success) {
      setError("Falha na verificação de segurança. Tente novamente.");
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setLoading(false);
      return;
    }

    const { error, session } = await signUp(email, password);
    if (error) {
      const msg = error.message.toLowerCase().includes("rate limit")
        ? "Você foi verificado! Tente novamente em 1 minuto."
        : error.message;
      setError(msg);
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setLoading(false);
      return;
    }

    if (session) {
      toast({ title: "Conta criada com sucesso!" });
      navigate("/");
      return;
    }

    // Email confirmation is enabled — don't try auto-login
    toast({
      title: "Conta criada!",
      description: "Verifique seu email para confirmar o cadastro antes de fazer login.",
    });
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SEO title="Criar Conta | Canais18" description="Crie sua conta gratuitamente." />
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            <span className="text-primary">TG</span>Index
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Crie sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Turnstile
            ref={turnstileRef}
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={setTurnstileToken}
            onError={() => setTurnstileToken(null)}
            onExpire={() => setTurnstileToken(null)}
            options={{ size: "invisible" }}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando..." : "Criar Conta"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/auth/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
