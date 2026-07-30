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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);

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

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${returnUrl}`,
      },
    });
    if (error) {
      setError(error.message);
    }
    setGoogleLoading(false);
  };

  const handleTelegramLogin = async () => {
    setTelegramLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "telegram",
      options: {
        redirectTo: `${window.location.origin}${returnUrl}`,
      },
    });
    if (error) {
      setError(error.message);
    }
    setTelegramLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <SEO
        title="Entrar | Canais18"
        description="Faça login no Canais18 para descobrir os melhores grupos e canais do Telegram."
      />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logo} alt="Canais18" className="max-w-[180px] w-full h-auto mx-auto object-contain" />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
          <h1 className="text-2xl font-bold text-foreground text-center mb-2">
            Entrar no Canais18
          </h1>
          <p className="text-muted-foreground text-center text-sm mb-6">
            Entre para descobrir grupos incríveis
          </p>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-start gap-2 mb-4">
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading || telegramLoading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors px-4 py-3.5 text-sm font-medium text-foreground disabled:opacity-50"
            >
              {googleLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Entrar com Google
            </button>

            <button
              onClick={handleTelegramLogin}
              disabled={googleLoading || telegramLoading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors px-4 py-3.5 text-sm font-medium text-foreground disabled:opacity-50"
            >
              {telegramLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <svg className="h-5 w-5 text-[#2AABEE]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              )}
              Entrar com Telegram
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background/80 px-3 text-xs text-muted-foreground">ou entre com email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground/80">Senha</Label>
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
                  className="pl-10 pr-10 h-11 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground/60"
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

            <Button type="submit" className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading} size="lg">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Entrando...
                </span>
              ) : "Entrar"}
            </Button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Não tem conta?{" "}
            <Link to="/auth/register" className="text-primary font-medium hover:text-primary/80 hover:underline">
              Criar conta grátis
            </Link>
          </p>
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          Ao entrar, você concorda com os{" "}
          <Link to="/terms" className="hover:underline text-primary/70">Termos de Uso</Link>{" "}
          e{" "}
          <Link to="/privacy" className="hover:underline text-primary/70">Política de Privacidade</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
