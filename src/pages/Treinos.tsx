import { Dumbbell, Swords, Timer, Zap, ArrowLeft, Plus, X, Check, ChevronRight, Bike, PersonStanding, Target } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { ExpandableSection } from "@/components/ExpandableSection";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const workoutCategories = [
  {
    name: "Musculação & Força",
    icon: <Dumbbell className="h-5 w-5" />,
    modalities: [
      { name: "Musculação", exercises: ["Supino", "Agachamento", "Levantamento Terra", "Rosca Direta", "Leg Press", "Desenvolvimento", "Pulldown"] },
      { name: "Powerlifting", exercises: ["Supino Competição", "Agachamento Competição", "Terra Competição", "Acessórios de Força"] },
      { name: "Calistenia", exercises: ["Flexões", "Barras", "Muscle-up", "Handstand", "Pistol Squat", "L-sit"] },
    ],
  },
  {
    name: "Lutas",
    icon: <Swords className="h-5 w-5" />,
    modalities: [
      { name: "Jiu-Jitsu", exercises: ["Guard Pass Drills", "Kimura Flows", "Shrimping", "Open Guard", "Takedowns"] },
      { name: "Boxe / Striking", exercises: ["Sombra", "Saco de Pancada", "Sparring", "Pads", "Footwork Drills"] },
      { name: "Muay Thai", exercises: ["Clinch", "Low Kicks", "Combinações", "Defesa", "Condicionamento"] },
      { name: "Wrestling", exercises: ["Single Leg", "Double Leg", "Sprawl", "Scrambles", "Pummeling"] },
    ],
  },
  {
    name: "Cardio & Resistência",
    icon: <Timer className="h-5 w-5" />,
    modalities: [
      { name: "HIIT", exercises: ["Tabata", "EMOM", "AMRAP", "Circuito", "Sprints"] },
      { name: "Corrida", exercises: ["Leve", "Intervalado", "Longa Distância", "Fartlek", "Tempo Run"] },
      { name: "Ciclismo", exercises: ["Indoor", "Outdoor", "Intervalado", "Subida", "Recuperação"] },
      { name: "Natação", exercises: ["Crawl", "Costas", "Peito", "Intervalado", "Técnica"] },
    ],
  },
  {
    name: "Esportes",
    icon: <Target className="h-5 w-5" />,
    modalities: [
      { name: "Basquete", exercises: ["Treino de Arremesso", "Drills", "Jogo", "Condicionamento", "Fundamentos"] },
      { name: "Tênis", exercises: ["Rally", "Saque", "Jogo", "Footwork", "Drills"] },
      { name: "Futebol", exercises: ["Treino Técnico", "Jogo", "Condicionamento", "Finalizações", "Passes"] },
      { name: "Vôlei", exercises: ["Saque", "Cortada", "Bloqueio", "Jogo", "Levantamento"] },
    ],
  },
  {
    name: "Mobilidade & Bem-estar",
    icon: <PersonStanding className="h-5 w-5" />,
    modalities: [
      { name: "Yoga", exercises: ["Vinyasa", "Hatha", "Ashtanga", "Yin", "Restaurativo"] },
      { name: "Alongamento", exercises: ["Dinâmico", "Estático", "PNF", "Foam Rolling", "Mobilidade Articular"] },
      { name: "Pilates", exercises: ["Solo", "Reformer", "Core", "Full Body", "Postura"] },
    ],
  },
];

export default function Treinos() {
  const { user, isReady } = useAuth();
  const queryClient = useQueryClient();
  const [logDialog, setLogDialog] = useState<{ category: string; modality: string; exercise: string } | null>(null);
  const [logForm, setLogForm] = useState({ duration: "", sets: "", reps: "", weight: "", notes: "" });

  const { data: todayWorkouts } = useQuery({
    queryKey: ["today-workouts", user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase.from("workout_logs").select("*").eq("user_id", user!.id).gte("logged_at", `${today}T00:00:00`).order("logged_at", { ascending: false });
      return data || [];
    },
    enabled: isReady && !!user,
  });

  const addWorkout = useMutation({
    mutationFn: async () => {
      if (!logDialog) return;
      await supabase.from("workout_logs").insert({
        user_id: user!.id,
        category: logDialog.category,
        modality: logDialog.modality,
        exercise_name: logDialog.exercise,
        duration_min: logForm.duration ? Number(logForm.duration) : null,
        sets: logForm.sets ? Number(logForm.sets) : null,
        reps: logForm.reps ? Number(logForm.reps) : null,
        weight_kg: logForm.weight ? Number(logForm.weight) : null,
        notes: logForm.notes || null,
      });
    },
    onSuccess: () => {
      toast.success("Treino registrado! +10 XP 💪");
      queryClient.invalidateQueries({ queryKey: ["today-workouts"] });
      queryClient.invalidateQueries({ queryKey: ["workout-count"] });
      setLogDialog(null);
      setLogForm({ duration: "", sets: "", reps: "", weight: "", notes: "" });
    },
  });

  if (!isReady) return null;
  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Link to="/dashboard"><ArrowLeft className="h-5 w-5 text-muted-foreground" /></Link>
          <h1 className="text-xl font-bold font-display text-foreground">Treinos</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-7">Escolha sua modalidade e registre</p>
      </div>

      {/* Today's summary */}
      {todayWorkouts && todayWorkouts.length > 0 && (
        <div className="px-4 mb-4">
          <div className="bg-primary/10 rounded-lg p-3">
            <p className="text-xs font-medium text-primary mb-1">Hoje: {todayWorkouts.length} exercício(s)</p>
            <div className="flex flex-wrap gap-1">
              {todayWorkouts.map((w) => (
                <span key={w.id} className="text-[10px] bg-primary/20 text-primary rounded-full px-2 py-0.5">{w.exercise_name}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 space-y-3">
        {workoutCategories.map((cat) => (
          <ExpandableSection key={cat.name} icon={cat.icon} title={cat.name} subtitle={`${cat.modalities.length} modalidades`}>
            <div className="space-y-3">
              {cat.modalities.map((mod) => (
                <div key={mod.name}>
                  <p className="text-xs font-bold text-foreground mb-2">{mod.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {mod.exercises.map((ex) => (
                      <button
                        key={ex}
                        onClick={() => setLogDialog({ category: cat.name, modality: mod.name, exercise: ex })}
                        className="text-xs bg-secondary text-secondary-foreground rounded-full px-3 py-1.5 hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ExpandableSection>
        ))}
      </div>

      {/* Log Dialog */}
      <Dialog open={!!logDialog} onOpenChange={() => setLogDialog(null)}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Registrar: {logDialog?.exercise}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">{logDialog?.category} → {logDialog?.modality}</p>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="text-xs text-muted-foreground">Duração (min)</label>
              <Input type="number" value={logForm.duration} onChange={(e) => setLogForm({ ...logForm, duration: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Séries</label>
              <Input type="number" value={logForm.sets} onChange={(e) => setLogForm({ ...logForm, sets: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Repetições</label>
              <Input type="number" value={logForm.reps} onChange={(e) => setLogForm({ ...logForm, reps: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Peso (kg)</label>
              <Input type="number" value={logForm.weight} onChange={(e) => setLogForm({ ...logForm, weight: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Observações</label>
            <Input value={logForm.notes} onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })} placeholder="Ex: carga leve, foco em forma" />
          </div>
          <Button onClick={() => addWorkout.mutate()} className="w-full gradient-primary text-primary-foreground" disabled={addWorkout.isPending}>
            {addWorkout.isPending ? "Salvando..." : "Registrar Treino"}
          </Button>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
