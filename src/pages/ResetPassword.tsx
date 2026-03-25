import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      navigate("/");
    }
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Senha deve ter no mínimo 6 caracteres");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha atualizada!");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 pt-12 pb-8 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold font-display text-foreground mb-2">Nova Senha</h1>
      <p className="text-sm text-muted-foreground mb-6">Digite sua nova senha</p>
      <form onSubmit={handleReset} className="flex flex-col gap-4 w-full max-w-sm">
        <Input type="password" placeholder="Nova senha (mínimo 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground h-12">
          {loading ? <Loader2 className="animate-spin" /> : "Redefinir Senha"}
        </Button>
      </form>
    </div>
  );
}
