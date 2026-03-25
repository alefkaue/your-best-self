import { Dumbbell, Flame, Heart, Target, ChevronRight, UtensilsCrossed, Bot, Trophy, TrendingUp, Droplets, Moon, Activity } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { QuickStatCard } from "@/components/QuickStatCard";
import { ExpandableSection } from "@/components/ExpandableSection";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from "recharts";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const quickActions = [
  { to: "/treinos", icon: Dumbbell, label: "Iniciar Treino", color: "primary" as const },
  { to: "/nutricao", icon: UtensilsCrossed, label: "Registrar Refeição", color: "accent" as const },
  { to: "/assistente", icon: Bot, label: "Perguntar à IA", color: "info" as const },
  { to: "/recompensas", icon: Trophy, label: "Recompensas", color: "success" as const },
];

const healthMetricTypes = [
  { key: "heart_rate", label: "Batimentos", icon: Heart, unit: "bpm", color: "#ef4444" },
  { key: "glucose", label: "Glicose", icon: Activity, unit: "mg/dL", color: "#f59e0b" },
  { key: "sleep", label: "Sono", icon: Moon, unit: "horas", color: "#6366f1" },
  { key: "hydration", label: "Hidratação", icon: Droplets, unit: "litros", color: "#06b6d4" },
];

export default function Dashboard() {
  const { user, isReady } = useAuth();
  const [healthDialog, setHealthDialog] = useState<string | null>(null);
  const [metricValue, setMetricValue] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
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

  const { data: mealCount } = useQuery({
    queryKey: ["meal-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("meal_logs").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
      return count || 0;
    },
    enabled: isReady && !!user,
  });

  const { data: healthMetrics, refetch: refetchHealth } = useQuery({
    queryKey: ["health-metrics", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("health_metrics").select("*").eq("user_id", user!.id).order("logged_at", { ascending: false }).limit(100);
      return data || [];
    },
    enabled: isReady && !!user,
  });

  if (!isReady) return null;
  if (!user) return <Navigate to="/" replace />;

  const getLatestMetric = (type: string) => {
    const metric = healthMetrics?.find((m) => m.metric_type === type);
    return metric ? `${metric.value}` : "--";
  };

  const getMetricHistory = (type: string) => {
    return (healthMetrics?.filter((m) => m.metric_type === type) || [])
      .slice(0, 7)
      .reverse()
      .map((m) => ({
        date: new Date(m.logged_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        value: Number(m.value),
      }));
  };

  const addMetric = async (type: string) => {
    if (!metricValue) return;
    const meta = healthMetricTypes.find((m) => m.key === type)!;
    await supabase.from("health_metrics").insert({
      user_id: user.id,
      metric_type: type,
      value: Number(metricValue),
      unit: meta.unit,
    });
    toast.success("Métrica registrada!");
    setMetricValue("");
    setHealthDialog(null);
    refetchHealth();
  };

  const xpProgress = profile ? ((profile.xp || 0) % 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="gradient-primary px-5 pt-8 pb-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-primary-foreground/70 text-sm">Olá,</p>
            <h1 className="text-xl font-bold font-display text-primary-foreground">{profile?.display_name || "Atleta"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-primary-foreground/20 rounded-full px-3 py-1 flex items-center gap-1">
              <Flame className="h-4 w-4 text-primary-foreground" />
              <span className="text-xs font-bold text-primary-foreground">{profile?.streak_days || 0} dias</span>
            </div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="bg-primary-foreground/20 rounded-full h-2 overflow-hidden">
          <div className="bg-primary-foreground h-full rounded-full transition-all duration-500" style={{ width: `${xpProgress}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-primary-foreground/60">Nível {profile?.level || 1}</span>
          <span className="text-[10px] text-primary-foreground/60">{profile?.xp || 0} XP</span>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <QuickStatCard icon={<Dumbbell className="h-5 w-5" />} label="Treinos" value={String(workoutCount || 0)} accent="primary" />
          <QuickStatCard icon={<UtensilsCrossed className="h-5 w-5" />} label="Refeições" value={String(mealCount || 0)} accent="accent" />
        </div>

        {/* Health Metrics - Expandable */}
        <h2 className="text-sm font-bold font-display text-foreground pt-2">Métricas de Saúde</h2>
        <p className="text-xs text-muted-foreground -mt-3">Toque para ver o histórico</p>

        <div className="grid grid-cols-2 gap-3">
          {healthMetricTypes.map((metric) => (
            <QuickStatCard
              key={metric.key}
              icon={<metric.icon className="h-5 w-5" />}
              label={metric.label}
              value={getLatestMetric(metric.key)}
              accent={metric.key === "heart_rate" ? "accent" : metric.key === "glucose" ? "accent" : metric.key === "sleep" ? "info" : "primary"}
              onClick={() => setHealthDialog(metric.key)}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <h2 className="text-sm font-bold font-display text-foreground pt-2">Ações Rápidas</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link key={action.to} to={action.to} className="bg-card rounded-lg shadow-card p-4 flex items-center gap-3 hover:shadow-elevated transition-all active:scale-95">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${action.color === 'primary' ? 'bg-primary/10 text-primary' : action.color === 'accent' ? 'bg-accent/10 text-accent' : action.color === 'info' ? 'bg-info/10 text-info' : 'bg-success/10 text-success'}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-foreground">{action.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
            </Link>
          ))}
        </div>
      </div>

      {/* Health Metric Dialog */}
      <Dialog open={!!healthDialog} onOpenChange={() => setHealthDialog(null)}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {healthMetricTypes.find((m) => m.key === healthDialog)?.label || "Métrica"}
            </DialogTitle>
          </DialogHeader>
          {healthDialog && (
            <div className="space-y-4">
              {getMetricHistory(healthDialog).length > 0 ? (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getMetricHistory(healthDialog)}>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke={healthMetricTypes.find((m) => m.key === healthDialog)?.color} strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro ainda. Adicione sua primeira métrica!</p>
              )}
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={`Valor em ${healthMetricTypes.find((m) => m.key === healthDialog)?.unit}`}
                  value={metricValue}
                  onChange={(e) => setMetricValue(e.target.value)}
                />
                <Button onClick={() => addMetric(healthDialog)} className="gradient-primary text-primary-foreground shrink-0">
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
