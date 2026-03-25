import { Heart, Activity, Wind, Droplets, Moon, UtensilsCrossed, TrendingUp, Plus } from "lucide-react";
import { Navigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const metricTypes = [
  { key: "glucose", label: "GLICOSE", icon: Activity, unit: "mg/dL", color: "#22d3ee", statusLabel: "Normal", statusColor: "bg-primary/20 text-primary" },
  { key: "heart_rate", label: "FC REPOUSO", icon: Heart, unit: "bpm", color: "#ef4444", statusLabel: "Atlético", statusColor: "bg-info/20 text-info" },
  { key: "spo2", label: "SPO2", icon: Wind, unit: "%", color: "#a78bfa", statusLabel: "Ótimo", statusColor: "bg-primary/20 text-primary" },
  { key: "hydration", label: "HIDRATAÇÃO", icon: Droplets, unit: "L", color: "#06b6d4", statusLabel: "", statusColor: "bg-info/20 text-info" },
];

export default function Saude() {
  const { user, isReady } = useAuth();
  const queryClient = useQueryClient();
  const [dialogMetric, setDialogMetric] = useState<string | null>(null);
  const [metricValue, setMetricValue] = useState("");

  const { data: healthMetrics } = useQuery({
    queryKey: ["health-all", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("health_metrics").select("*").eq("user_id", user!.id).order("logged_at", { ascending: false }).limit(200);
      return data || [];
    },
    enabled: isReady && !!user,
  });

  const { data: todayMeals } = useQuery({
    queryKey: ["today-meals-saude", user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase.from("meal_logs").select("*").eq("user_id", user!.id).gte("logged_at", today);
      return data || [];
    },
    enabled: isReady && !!user,
  });

  if (!isReady) return null;
  if (!user) return <Navigate to="/" replace />;

  const getLatest = (type: string) => healthMetrics?.find(m => m.metric_type === type);
  const getHistory = (type: string) =>
    (healthMetrics?.filter(m => m.metric_type === type) || []).slice(0, 7).reverse().map(m => ({
      date: new Date(m.logged_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      value: Number(m.value),
    }));

  const totalCal = todayMeals?.reduce((s, m) => s + (m.calories || 0), 0) || 0;
  const totalProtein = todayMeals?.reduce((s, m) => s + (m.protein || 0), 0) || 0;
  const totalCarbs = todayMeals?.reduce((s, m) => s + (m.carbs || 0), 0) || 0;
  const totalFat = todayMeals?.reduce((s, m) => s + (m.fat || 0), 0) || 0;

  const proteinGoal = 160, carbsGoal = 280, fatGoal = 70;

  const addMetric = async () => {
    if (!metricValue || !dialogMetric) return;
    const meta = metricTypes.find(m => m.key === dialogMetric)!;
    await supabase.from("health_metrics").insert({ user_id: user.id, metric_type: dialogMetric, value: Number(metricValue), unit: meta.unit });
    toast.success("Registrado!");
    setMetricValue("");
    setDialogMetric(null);
    queryClient.invalidateQueries({ queryKey: ["health-all"] });
  };

  const hydrationLatest = getLatest("hydration");
  const hydrationPct = hydrationLatest ? Math.round((Number(hydrationLatest.value) / 3) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-xl font-bold font-display text-foreground">Saúde</h1>
        <p className="text-xs text-muted-foreground">Seus sinais vitais unificados</p>
      </div>

      {/* Nutrition Summary Card */}
      <div className="mx-4 bg-card rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Nutrição</span>
          </div>
          <span className="text-lg font-bold text-foreground">{totalCal.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">kcal</span></span>
        </div>
        <div className="space-y-3">
          {[
            { label: "Proteína", value: totalProtein, goal: proteinGoal, color: "bg-info" },
            { label: "Carboidratos", value: totalCarbs, goal: carbsGoal, color: "bg-primary" },
            { label: "Gordura", value: totalFat, goal: fatGoal, color: "bg-destructive" },
          ].map(macro => (
            <div key={macro.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground font-medium">{macro.label}</span>
                <span className="text-muted-foreground">{macro.value}g / {macro.goal}g</span>
              </div>
              <div className="bg-secondary rounded-full h-2 overflow-hidden">
                <div className={`${macro.color} h-full rounded-full transition-all`} style={{ width: `${Math.min((macro.value / macro.goal) * 100, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Health Metric Cards - 2x2 Grid */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-4">
        {metricTypes.map(mt => {
          const latest = getLatest(mt.key);
          const val = latest ? Number(latest.value) : 0;
          return (
            <button key={mt.key} onClick={() => setDialogMetric(mt.key)} className="bg-card rounded-xl p-4 text-left hover:ring-1 hover:ring-primary/30 transition-all">
              <div className="flex items-center gap-1.5 mb-2">
                <mt.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium tracking-wide">{mt.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {val || "--"}
                <span className="text-xs text-muted-foreground font-normal ml-1">{mt.unit}</span>
              </p>
              {mt.key === "hydration" ? (
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 inline-block", mt.statusColor)}>{hydrationPct}%</span>
              ) : mt.statusLabel ? (
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 inline-block", mt.statusColor)}>{mt.statusLabel}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Sleep Card */}
      <div className="mx-4 bg-card rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Moon className="h-4 w-4 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium tracking-wide">SONO</span>
        </div>
        {(() => {
          const sleepHistory = getHistory("sleep");
          const latestSleep = getLatest("sleep");
          return (
            <>
              <p className="text-2xl font-bold text-foreground mb-1">
                {latestSleep ? Number(latestSleep.value).toFixed(1) : "--"}
                <span className="text-xs text-muted-foreground font-normal ml-1">horas</span>
              </p>
              {sleepHistory.length > 0 && (
                <div className="h-24 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sleepHistory}>
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(215 12% 55%)" }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ background: "hsl(220 20% 12%)", border: "1px solid hsl(220 15% 20%)", borderRadius: 8, fontSize: 12 }} />
                      <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: "#6366f1" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Metric Detail Dialog */}
      <Dialog open={!!dialogMetric} onOpenChange={() => setDialogMetric(null)}>
        <DialogContent className="max-w-sm mx-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">{metricTypes.find(m => m.key === dialogMetric)?.label}</DialogTitle>
          </DialogHeader>
          {dialogMetric && (
            <div className="space-y-4">
              {getHistory(dialogMetric).length > 0 ? (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getHistory(dialogMetric)}>
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215 12% 55%)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(215 12% 55%)" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "hsl(220 20% 12%)", border: "1px solid hsl(220 15% 20%)", borderRadius: 8, fontSize: 12 }} />
                      <Line type="monotone" dataKey="value" stroke={metricTypes.find(m => m.key === dialogMetric)?.color} strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro ainda.</p>
              )}
              <div className="flex gap-2">
                <Input type="number" placeholder={`Valor em ${metricTypes.find(m => m.key === dialogMetric)?.unit}`} value={metricValue} onChange={e => setMetricValue(e.target.value)} className="bg-secondary border-border" />
                <Button onClick={addMetric} className="gradient-primary text-primary-foreground shrink-0">
                  <Plus className="h-4 w-4 mr-1" /> Salvar
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
