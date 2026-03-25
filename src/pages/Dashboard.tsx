import { Flame, ChevronRight, UtensilsCrossed, Bot, Dumbbell, Trophy, Settings, Footprints, Check, Gift, Clock, Star } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { ProgressRing } from "@/components/ProgressRing";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const weekDays = ["S", "T", "Q", "Q", "S", "S", "D"];

export default function Dashboard() {
  const { user, isReady } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: isReady && !!user,
  });

  const { data: todayMeals } = useQuery({
    queryKey: ["today-meals", user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase.from("meal_logs").select("*").eq("user_id", user!.id).gte("logged_at", today);
      return data || [];
    },
    enabled: isReady && !!user,
  });

  const { data: todayWorkouts } = useQuery({
    queryKey: ["today-workouts", user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase.from("workout_logs").select("*").eq("user_id", user!.id).gte("logged_at", today);
      return data || [];
    },
    enabled: isReady && !!user,
  });

  const { data: healthMetrics } = useQuery({
    queryKey: ["health-latest", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("health_metrics").select("*").eq("user_id", user!.id).order("logged_at", { ascending: false }).limit(50);
      return data || [];
    },
    enabled: isReady && !!user,
  });

  if (!isReady) return null;
  if (!user) return <Navigate to="/" replace />;

  const totalCalories = todayMeals?.reduce((s, m) => s + (m.calories || 0), 0) || 0;
  const totalExerciseMin = todayWorkouts?.reduce((s, w) => s + (w.duration_min || 0), 0) || 0;
  const hydration = Number(healthMetrics?.find(m => m.metric_type === "hydration")?.value || 0);
  const calorieGoal = 2200;
  const exerciseGoal = 52;
  const stepsGoal = 10000;
  const steps = 8400;
  const overallProgress = Math.round(((totalCalories / calorieGoal) * 33 + (totalExerciseMin / exerciseGoal) * 33 + (steps / stepsGoal) * 34));
  const xpCurrent = profile?.xp || 2450;
  const xpForLevel = 3000;
  const level = profile?.level || 12;
  const streak = profile?.streak_days || 7;
  const displayName = profile?.display_name || "Atleta";

  const missions = [
    { icon: Footprints, label: "10.000 passos", xp: 50, progress: steps / stepsGoal, done: steps >= stepsGoal },
    { icon: Dumbbell, label: "30 min exercício", xp: 75, progress: Math.min(totalExerciseMin / 30, 1), done: totalExerciseMin >= 30 },
    { icon: Check, label: `${hydration.toFixed(1)}L de água`, xp: 30, progress: hydration / 2, done: hydration >= 2, claimable: hydration >= 2 },
    { icon: Flame, label: "500 kcal queimadas", xp: 60, progress: Math.min(totalCalories / 500, 1), done: totalCalories >= 500 },
    { icon: Gift, label: "Bônus: Complete todas", xp: 200, progress: 0, done: false, subtitle: "Recompensa especial na loja" },
  ];

  const agenda = [
    { time: "06:30", title: "Corrida Matinal", subtitle: "5K ao ar livre", icon: Dumbbell, color: "bg-primary/10 text-primary" },
    { time: "08:00", title: "Café da Manhã", subtitle: `Ovos + aveia · ${todayMeals?.[0]?.calories || 420} kcal`, icon: UtensilsCrossed, color: "bg-accent/10 text-accent" },
    { time: "12:00", title: "Almoço", subtitle: `Frango + arroz · ${todayMeals?.[1]?.calories || 680} kcal`, icon: UtensilsCrossed, color: "bg-info/10 text-info" },
  ];

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-5 pt-6 pb-2 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs">{greet()}</p>
          <h1 className="text-xl font-bold font-display text-foreground">{displayName}</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/recompensas" className="h-9 w-9 rounded-full bg-card flex items-center justify-center text-muted-foreground hover:text-primary">
            <Trophy className="h-4 w-4" />
          </Link>
          <Link to="/perfil" className="h-9 w-9 rounded-full bg-card flex items-center justify-center text-muted-foreground hover:text-primary">
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Level & XP */}
      <div className="mx-4 bg-card rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-full gradient-accent flex items-center justify-center">
            <Star className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-accent">GUERREIRO</span>
              <span className="text-xs text-muted-foreground">{xpCurrent.toLocaleString()} / {xpForLevel.toLocaleString()} XP</span>
            </div>
            <p className="text-xs text-muted-foreground">Nível {level}</p>
          </div>
        </div>
        <div className="bg-secondary rounded-full h-2 overflow-hidden">
          <div className="h-full rounded-full gradient-primary transition-all duration-500" style={{ width: `${(xpCurrent / xpForLevel) * 100}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">Próximo: <span className="text-primary font-bold">{xpForLevel - xpCurrent} XP</span> para nível {level + 1}</span>
          <span className="text-[10px] text-primary font-bold">2x streak ativo</span>
        </div>
      </div>

      {/* Streak */}
      <div className="mx-4 bg-card rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Flame className="h-5 w-5 text-accent" />
          <div>
            <span className="text-2xl font-bold text-foreground">{streak}</span>
            <span className="text-sm text-muted-foreground ml-1">dias seguidos</span>
          </div>
        </div>
        <p className="text-xs text-primary mb-3">🔥 2x multiplicador ativo</p>
        <div className="flex justify-between">
          {weekDays.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">{d}</span>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${i < streak ? "bg-primary/20" : "bg-secondary"}`}>
                {i < streak && <Flame className="h-4 w-4 text-primary" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Ring */}
      <div className="flex flex-col items-center py-4">
        <ProgressRing progress={Math.min(overallProgress, 100)} size={180} strokeWidth={12}>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{Math.min(overallProgress, 100)}%</p>
            <p className="text-xs text-muted-foreground">Progresso</p>
          </div>
        </ProgressRing>
        <div className="flex gap-8 mt-4">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">🔥 CALORIAS</p>
            <p className="text-sm font-bold"><span className="text-accent">{totalCalories}</span>/{calorieGoal}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">💪 EXERCÍCIO</p>
            <p className="text-sm font-bold"><span className="text-primary">{totalExerciseMin}</span>/{exerciseGoal} min</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">👟 PASSOS</p>
            <p className="text-sm font-bold"><span className="text-info">{(steps / 1000).toFixed(1)}k</span>/10k</p>
          </div>
        </div>
        <p className="text-xs text-primary mt-2">
          Faltam <span className="font-bold">{Math.max(exerciseGoal - totalExerciseMin, 0)} min</span> para fechar seu anel de Exercício
        </p>
      </div>

      {/* Missions */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold font-display text-foreground">Missões Diárias</h2>
          <span className="text-xs text-primary">{missions.filter(m => m.done).length}/{missions.length} completas</span>
        </div>
        <div className="space-y-2">
          {missions.map((m, i) => (
            <div key={i} className={`bg-card rounded-xl p-4 ${m.done ? "border border-primary/30" : ""}`}>
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${m.done ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                  <m.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{m.label}</p>
                  {m.subtitle && <p className="text-[10px] text-muted-foreground">{m.subtitle}</p>}
                </div>
                <span className="text-xs font-bold text-primary">+{m.xp} XP</span>
                {m.claimable && (
                  <button className="text-xs font-bold text-primary-foreground gradient-primary px-3 py-1 rounded-full">Coletar</button>
                )}
              </div>
              {!m.subtitle && (
                <div className="mt-2 bg-secondary rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${m.progress * 100}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Agenda */}
      <div className="px-4 mb-4">
        <h2 className="text-sm font-bold font-display text-foreground mb-3">Agenda de Hoje</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {agenda.map((a, i) => (
            <div key={i} className="bg-card rounded-xl p-3 min-w-[140px] shrink-0">
              <div className={`h-8 w-8 rounded-lg ${a.color} flex items-center justify-center mb-2`}>
                <a.icon className="h-4 w-4" />
              </div>
              <p className="text-[10px] text-muted-foreground">{a.time}</p>
              <p className="text-sm font-bold text-foreground">{a.title}</p>
              <p className="text-[10px] text-muted-foreground">{a.subtitle}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Coach Insight */}
      <div className="mx-4 mb-6 bg-card rounded-xl p-4 flex items-start gap-3">
        <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center shrink-0">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Insight do Coach</p>
          <p className="text-xs text-muted-foreground">Sua vitalidade está excelente. Uma corrida leve fecharia todos os seus anéis hoje.</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
