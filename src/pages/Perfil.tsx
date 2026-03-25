import { ArrowLeft, LogOut, Pencil, Save, Crown, Watch, Smartphone } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { ExpandableSection } from "@/components/ExpandableSection";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function Perfil() {
  const { user, isReady, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ display_name: "", weight: "", height: "", goal: "", bio: "" });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      if (data) {
        setForm({
          display_name: data.display_name || "",
          weight: data.weight?.toString() || "",
          height: data.height?.toString() || "",
          goal: data.goal || "hypertrophy",
          bio: data.bio || "",
        });
      }
      return data;
    },
    enabled: isReady && !!user,
  });

  const { data: workoutCount } = useQuery({
    queryKey: ["workout-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("workout_logs").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
      return count || 0;
    },
    enabled: isReady && !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async () => {
      await supabase.from("profiles").update({
        display_name: form.display_name,
        weight: form.weight ? Number(form.weight) : null,
        height: form.height ? Number(form.height) : null,
        goal: form.goal,
        bio: form.bio,
      }).eq("user_id", user!.id);
    },
    onSuccess: () => {
      toast.success("Perfil atualizado!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditing(false);
    },
  });

  if (!isReady) return null;
  if (!user) return <Navigate to="/" replace />;

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const goalLabels: Record<string, string> = {
    hypertrophy: "Hipertrofia",
    cutting: "Cutting",
    bulking: "Bulking",
    health: "Saúde Geral",
    performance: "Performance",
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="gradient-primary px-4 pt-6 pb-12 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <Link to="/dashboard"><ArrowLeft className="h-5 w-5 text-primary-foreground" /></Link>
          <h1 className="text-lg font-bold font-display text-primary-foreground">Meu Perfil</h1>
          <button onClick={handleLogout} className="text-primary-foreground/70 hover:text-primary-foreground">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground text-2xl font-bold font-display mb-2">
            {profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <h2 className="text-lg font-bold text-primary-foreground">{profile?.display_name}</h2>
          <p className="text-xs text-primary-foreground/70">Nível {profile?.level || 1} • {profile?.xp || 0} XP</p>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-4">
        <div className="bg-card rounded-xl shadow-card p-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xl font-bold font-display text-foreground">{workoutCount}</p>
            <p className="text-xs text-muted-foreground">Treinos</p>
          </div>
          <div>
            <p className="text-xl font-bold font-display text-foreground">{profile?.streak_days || 0}</p>
            <p className="text-xs text-muted-foreground">Streak</p>
          </div>
          <div>
            <p className="text-xl font-bold font-display text-foreground">{profile?.level || 1}</p>
            <p className="text-xs text-muted-foreground">Nível</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/planos" className="bg-card rounded-xl p-4 flex items-center gap-3 hover:ring-1 hover:ring-primary/30 transition-all">
            <Crown className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm font-bold text-foreground">Planos</p>
              <p className="text-[10px] text-muted-foreground">Upgrade para Pro</p>
            </div>
          </Link>
          <div className="bg-card rounded-xl p-4 flex items-center gap-3 opacity-60">
            <Watch className="h-5 w-5 text-info" />
            <div>
              <p className="text-sm font-bold text-foreground">Dispositivos</p>
              <p className="text-[10px] text-muted-foreground">Em breve</p>
            </div>
          </div>
        </div>

        <ExpandableSection icon={<Pencil className="h-5 w-5" />} title="Informações Pessoais" subtitle={editing ? "Editando..." : "Toque para editar"}>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Nome</label>
              <Input disabled={!editing} value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Peso (kg)</label>
                <Input type="number" disabled={!editing} value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Altura (cm)</label>
                <Input type="number" disabled={!editing} value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className="bg-secondary border-border" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Objetivo</label>
              <select disabled={!editing} value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                {Object.entries(goalLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Bio</label>
              <Input disabled={!editing} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Conte sobre você..." className="bg-secondary border-border" />
            </div>
            {editing ? (
              <Button onClick={() => updateProfile.mutate()} className="w-full gradient-primary text-primary-foreground" disabled={updateProfile.isPending}>
                <Save className="h-4 w-4 mr-1" /> {updateProfile.isPending ? "Salvando..." : "Salvar"}
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setEditing(true)} className="w-full bg-secondary border-border">
                <Pencil className="h-4 w-4 mr-1" /> Editar Perfil
              </Button>
            )}
          </div>
        </ExpandableSection>
      </div>

      <BottomNav />
    </div>
  );
}
