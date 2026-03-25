import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Informe seu email");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Email de recuperação enviado!");
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 pt-6 pb-8 flex flex-col">
      <Link to="/" className="text-muted-foreground mb-6 inline-flex items-center gap-1 text-sm hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <h1 className="text-2xl font-bold font-display text-foreground mb-2">Recuperar Senha</h1>
      <p className="text-sm text-muted-foreground mb-6">Enviaremos um link para redefinir sua senha</p>

      {sent ? (
        <div className="bg-primary/10 rounded-lg p-4 text-center">
          <p className="text-sm text-primary font-medium">Email enviado! Verifique sua caixa de entrada.</p>
        </div>
      ) : (
        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
            <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground h-12">
            {loading ? <Loader2 className="animate-spin" /> : "Enviar Link"}
          </Button>
        </form>
      )}
    </div>
  );
}
