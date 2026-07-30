import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SEO from "@/components/SEO";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";

const TURNSTILE_SITE_KEY = "0x4AAAAAACeD94GpcENqZjWY";
const TURNSTILE_TIMEOUT_MS = 8000;

const Login = () => {
  const [searchParams] = useSearchParams();
  const prefillEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileTimedOut, setTurnstileTimedOut] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const returnUrl = searchParams.get("returnUrl") || "/";
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (prefillEmail && passwordRef.current) {
      passwordRef.current.focus();
    }
  }, [prefillEmail]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTurnstileTimedOut(true);
    }, TURNSTILE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleTurnstileSuccess = useCallback((token: string) => {
    setTurnstileToken(token);
    setTurnstileTimedOut(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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

    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setLoading(false);
    } else {
      navigate(returnUrl);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SEO title="Entrar | Canais18" description="Faça login na sua conta do Canais18 para gerenciar seus grupos e canais do Telegram." />

      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-primary/10">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
          <img src={logo} alt="Canais18" className="w-48 h-auto mb-8 opacity-90" />
          <h2 className="text-3xl font-bold text-foreground text-center mb-4">
            Bem-vindo ao Canais18
          </h2>
          <p className="text-muted-foreground text-center text-lg max-w-md">
            Gerencie seus grupos, envie novos canais e acompanhe suas publicações em um só lugar.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-sm">
            <div className="rounded-xl bg-card/50 backdrop-blur-sm border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">+10k</p>
              <p className="text-xs text-muted-foreground mt-1">Grupos disponíveis</p>
            </div>
            <div className="rounded-xl bg-card/50 backdrop-blur-sm border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">+5k</p>
              <p className="text-xs text-muted-foreground mt-1">Canais verificados</p>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <img src={logo} alt="Canais18" className="w-20 h-auto mx-auto mb-4" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Entrar</h1>
            <p className="text-muted-foreground">
              Acesse sua conta para continuar
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:text-primary/80 hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 pr-10 h-11"
                  autoComplete="current-password"
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

            <Turnstile
              ref={turnstileRef}
              siteKey={TURNSTILE_SITE_KEY}
              onSuccess={handleTurnstileSuccess}
              onError={() => setTurnstileTimedOut(true)}
              onExpire={() => { setTurnstileToken(null); setTurnstileTimedOut(true); }}
              options={{ size: "invisible" }}
            />

            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading} size="lg">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Entrando...
                </span>
              ) : "Entrar"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground">OU</span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/auth/register" className="text-primary font-medium hover:text-primary/80 hover:underline">
              Criar conta grátis
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground/60">
            Ao entrar, você concorda com os{" "}
            <Link to="/terms" className="hover:underline">Termos de Uso</Link>{" "}
            e{" "}
            <Link to="/privacy" className="hover:underline">Política de Privacidade</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
