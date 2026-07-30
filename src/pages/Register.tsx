import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Eye, EyeOff, Check } from "lucide-react";
import logo from "@/assets/logo.png";

const TURNSTILE_SITE_KEY = "0x4AAAAAACeD94GpcENqZjWY";
const TURNSTILE_TIMEOUT_MS = 10000;

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setTurnstileReady(true);
    }, TURNSTILE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleTurnstileSuccess = useCallback((token: string) => {
    setTurnstileToken(token);
    setTurnstileReady(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    if (turnstileToken) {
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

    toast({
      title: "Conta criada!",
      description: "Verifique seu email para confirmar o cadastro antes de fazer login.",
    });
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SEO title="Criar Conta | Canais18" description="Crie sua conta grátis no Canais18 e gerencie seus grupos e canais do Telegram." />

      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-primary/10">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
          <img src={logo} alt="Canais18" className="w-48 h-auto mb-8 opacity-90" />
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">
            Crie sua conta grátis
          </h2>
          <p className="text-muted-foreground text-center text-lg max-w-md">
            Junte-se à comunidade e gerencie seus grupos do Telegram em um só lugar.
          </p>
          <div className="mt-12 space-y-4 w-full max-w-sm">
            {[
              "Envie e gerencie seus grupos",
              "Receba atualizações sobre seu canal",
              "Acesso a ferramentas exclusivas",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-card/50 backdrop-blur-sm border border-border p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
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

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Criar Conta</h1>
            <p className="text-muted-foreground">
              Preencha os dados abaixo para se registrar
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

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 pr-10 h-11"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10 h-11"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <Turnstile
              ref={turnstileRef}
              siteKey={TURNSTILE_SITE_KEY}
              onSuccess={handleTurnstileSuccess}
              onError={() => setTurnstileReady(true)}
              onExpire={() => { setTurnstileToken(null); setTurnstileReady(true); }}
              options={{ size: "invisible" }}
            />

            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading} size="lg">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Criando conta...
                </span>
              ) : "Criar Conta"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/auth/login" className="text-primary font-medium hover:text-primary/80 hover:underline">
              Entrar
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground/60">
            Ao criar conta, você concorda com os{" "}
            <Link to="/terms" className="hover:underline">Termos de Uso</Link>{" "}
            e{" "}
            <Link to="/privacy" className="hover:underline">Política de Privacidade</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
