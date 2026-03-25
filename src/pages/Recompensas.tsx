import { ArrowLeft, Trophy, Medal, Flame, Dumbbell, UtensilsCrossed, Crown, Star, Heart, Gift, Music, Pill, Percent, Award } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { ExpandableSection } from "@/components/ExpandableSection";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const rewardIcons: Record<string, React.ReactNode> = {
  badge: <Award className="h-5 w-5" />,
  spotify: <Music className="h-5 w-5" />,
  supplement: <Pill className="h-5 w-5" />,
  discount: <Percent className="h-5 w-5" />,
  premium: <Crown className="h-5 w-5" />,
};

const rewardColors: Record<string, string> = {
  badge: "bg-primary/10 text-primary border-primary/20",
  spotify: "bg-success/10 text-success border-success/20",
  supplement: "bg-accent/10 text-accent border-accent/20",
  discount: "bg-info/10 text-info border-info/20",
  premium: "bg-warning/10 text-warning border-warning/20",
};

export default function Recompensas() {
  const { user, isReady } = useAuth();

  const { data: achievements } = useQuery({
    queryKey: ["achievements-all"],
    queryFn: async () => {
      const { data } = await supabase.from("achievements").select("*");
      return data || [];
    },
    enabled: isReady && !!user,
  });

  const { data: userAchievements } = useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_achievements").select("*").eq("user_id", user!.id);
      return data || [];
    },
    enabled: isReady && !!user,
  });

  const { data: allProfiles } = useQuery({
    queryKey: ["all-profiles-ranking"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*");
      if (!profiles) return [];
      const results = await Promise.all(
        profiles.map(async (p) => {
          const { count: workouts } = await supabase.from("workout_logs").select("*", { count: "exact", head: true }).eq("user_id", p.user_id);
          const { count: meals } = await supabase.from("meal_logs").select("*", { count: "exact", head: true }).eq("user_id", p.user_id);
          const points = (workouts || 0) * 10 + (meals || 0) * 5 + (p.xp || 0);
          return { ...p, workouts: workouts || 0, meals: meals || 0, points };
        })
      );
      return results.sort((a, b) => b.points - a.points);
    },
    enabled: isReady && !!user,
  });

  if (!isReady) return null;
  if (!user) return <Navigate to="/" replace />;

  const unlockedIds = new Set(userAchievements?.map((ua) => ua.achievement_id) || []);
  const myRank = allProfiles?.findIndex((p) => p.user_id === user.id) ?? -1;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Link to="/dashboard"><ArrowLeft className="h-5 w-5 text-muted-foreground" /></Link>
          <h1 className="text-xl font-bold font-display text-foreground">Recompensas & Ranking</h1>
        </div>
      </div>

      {/* Ranking */}
      <div className="px-4 mb-4">
        <ExpandableSection icon={<Trophy className="h-5 w-5" />} title="Ranking Global" subtitle={myRank >= 0 ? `Você está em #${myRank + 1}` : "Carregando..."} defaultOpen>
          <div className="space-y-2">
            {allProfiles?.slice(0, 10).map((p, i) => (
              <div key={p.user_id} className={cn("flex items-center gap-3 p-2 rounded-lg", p.user_id === user.id && "bg-primary/5 border border-primary/20")}>
                <span className={cn("text-sm font-bold w-6 text-center", i === 0 && "text-warning", i === 1 && "text-muted-foreground", i === 2 && "text-accent")}>
                  {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.display_name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.workouts} treinos • {p.meals} refeições</p>
                </div>
                <span className="text-sm font-bold text-primary">{p.points} pts</span>
              </div>
            ))}
          </div>
        </ExpandableSection>
      </div>

      {/* Rewards */}
      <div className="px-4 space-y-3">
        <h2 className="text-sm font-bold font-display text-foreground">🎁 Recompensas Disponíveis</h2>
        <div className="space-y-2">
          {achievements?.filter((a) => a.reward_type && a.reward_type !== "badge").map((ach) => {
            const unlocked = unlockedIds.has(ach.id);
            return (
              <div key={ach.id} className={cn("bg-card rounded-lg shadow-card p-4 border-l-4 transition-all", rewardColors[ach.reward_type || "badge"], unlocked && "opacity-100", !unlocked && "opacity-70")}>
                <div className="flex items-center gap-3">
                  <div className="shrink-0">{rewardIcons[ach.reward_type || "badge"]}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{ach.reward_value}</p>
                    <p className="text-xs text-muted-foreground">{ach.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Necessário: {ach.required_count}x • {ach.xp_reward} XP</p>
                  </div>
                  {unlocked ? (
                    <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-full">✓ Conquistado</span>
                  ) : (
                    <Gift className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <h2 className="text-sm font-bold font-display text-foreground pt-2">🏆 Conquistas</h2>
        <div className="grid grid-cols-2 gap-2">
          {achievements?.map((ach) => {
            const unlocked = unlockedIds.has(ach.id);
            return (
              <div key={ach.id} className={cn("bg-card rounded-lg shadow-card p-3 text-center transition-all", unlocked ? "ring-2 ring-primary/30" : "opacity-60")}>
                <div className="text-2xl mb-1">{unlocked ? "⭐" : "🔒"}</div>
                <p className="text-xs font-bold text-foreground">{ach.name}</p>
                <p className="text-[10px] text-muted-foreground">{ach.xp_reward} XP</p>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
