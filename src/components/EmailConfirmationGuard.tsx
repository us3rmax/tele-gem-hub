import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Mail, RefreshCw } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Props {
  user: User;
  children: React.ReactNode;
}

const EmailConfirmationGuard = ({ user, children }: Props) => {
  const { toast } = useToast();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const isConfirmed = !!user.email_confirmed_at;

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email!,
    });
    setResending(false);

    if (error) {
      toast({ title: "Erro ao reenviar", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Email reenviado!", description: "Verifique sua caixa de entrada." });
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (isConfirmed) return <>{children}</>;

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-border bg-card p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/10">
        <AlertTriangle className="h-7 w-7 text-yellow-500" />
      </div>
      <h2 className="text-lg font-bold text-foreground">Confirme seu email</h2>
      <p className="text-sm text-muted-foreground">
        Enviamos um link de confirmação para{" "}
        <span className="font-medium text-foreground">{user.email}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        Verifique sua caixa de entrada e spam. Após confirmar, recarregue esta página.
      </p>
      <Button
        variant="outline"
        onClick={handleResend}
        disabled={resending || cooldown > 0}
        className="gap-2"
      >
        {resending ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar email"}
      </Button>
    </div>
  );
};

export default EmailConfirmationGuard;
