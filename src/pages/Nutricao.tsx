import { ArrowLeft, Apple, Coffee, Sun, Moon, Plus, Loader2 } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { ExpandableSection } from "@/components/ExpandableSection";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const mealTypes = [
  { key: "breakfast", label: "Café da Manhã", icon: <Coffee className="h-5 w-5" /> },
  { key: "lunch", label: "Almoço", icon: <Sun className="h-5 w-5" /> },
  { key: "snack", label: "Lanche", icon: <Apple className="h-5 w-5" /> },
  { key: "dinner", label: "Jantar", icon: <Moon className="h-5 w-5" /> },
];

export default function Nutricao() {
  const { user, isReady } = useAuth();
  const queryClient = useQueryClient();
  const [addingType, setAddingType] = useState<string | null>(null);
  const [form, setForm] = useState({ food_name: "", calories: "", protein: "", carbs: "", fat: "" });

  const today = new Date().toISOString().split("T")[0];

  const { data: todayMeals } = useQuery({
    queryKey: ["meals-today", user?.id, today],
    queryFn: async () => {
      const { data } = await supabase.from("meal_logs").select("*").eq("user_id", user!.id).gte("logged_at", `${today}T00:00:00`).lte("logged_at", `${today}T23:59:59`).order("logged_at");
      return data || [];
    },
    enabled: isReady && !!user,
  });

  const addMeal = useMutation({
    mutationFn: async () => {
      if (!addingType || !form.food_name) return;
      await supabase.from("meal_logs").insert({
        user_id: user!.id,
        meal_type: addingType,
        food_name: form.food_name,
        calories: Number(form.calories) || 0,
        protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0,
        fat: Number(form.fat) || 0,
      });
    },
    onSuccess: () => {
      toast.success("Refeição registrada!");
      queryClient.invalidateQueries({ queryKey: ["meals-today"] });
      queryClient.invalidateQueries({ queryKey: ["meal-count"] });
      setAddingType(null);
      setForm({ food_name: "", calories: "", protein: "", carbs: "", fat: "" });
    },
  });

  if (!isReady) return null;
  if (!user) return <Navigate to="/" replace />;

  const totalCals = todayMeals?.reduce((sum, m) => sum + Number(m.calories), 0) || 0;
  const totalProtein = todayMeals?.reduce((sum, m) => sum + Number(m.protein), 0) || 0;
  const totalCarbs = todayMeals?.reduce((sum, m) => sum + Number(m.carbs), 0) || 0;
  const totalFat = todayMeals?.reduce((sum, m) => sum + Number(m.fat), 0) || 0;

  const macroData = [
    { name: "Proteína", value: totalProtein, color: "hsl(155, 65%, 38%)" },
    { name: "Carbos", value: totalCarbs, color: "hsl(28, 85%, 55%)" },
    { name: "Gordura", value: totalFat, color: "hsl(210, 70%, 52%)" },
  ].filter((d) => d.value > 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Link to="/dashboard"><ArrowLeft className="h-5 w-5 text-muted-foreground" /></Link>
          <h1 className="text-xl font-bold font-display text-foreground">Nutrição</h1>
        </div>
      </div>

      {/* Macro Summary */}
      <div className="px-4 mb-4">
        <div className="bg-card rounded-lg shadow-card p-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24">
              {macroData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={macroData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={2}>
                      {macroData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full rounded-full border-4 border-muted flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Vazio</span>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-2xl font-bold font-display text-foreground">{totalCals} <span className="text-sm font-normal text-muted-foreground">kcal</span></p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-sm font-bold text-primary">{totalProtein}g</p><p className="text-[10px] text-muted-foreground">Proteína</p></div>
                <div><p className="text-sm font-bold text-accent">{totalCarbs}g</p><p className="text-[10px] text-muted-foreground">Carbos</p></div>
                <div><p className="text-sm font-bold text-info">{totalFat}g</p><p className="text-[10px] text-muted-foreground">Gordura</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {mealTypes.map((type) => {
          const meals = todayMeals?.filter((m) => m.meal_type === type.key) || [];
          return (
            <ExpandableSection key={type.key} icon={type.icon} title={type.label} subtitle={`${meals.length} item(s) • ${meals.reduce((s, m) => s + Number(m.calories), 0)} kcal`}>
              <div className="space-y-2">
                {meals.map((m) => (
                  <div key={m.id} className="flex justify-between items-center text-sm">
                    <span className="text-foreground">{m.food_name}</span>
                    <span className="text-muted-foreground">{m.calories} kcal</span>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => setAddingType(type.key)} className="w-full mt-2 gap-1">
                  <Plus className="h-4 w-4" /> Adicionar
                </Button>
              </div>
            </ExpandableSection>
          );
        })}
      </div>

      <Dialog open={!!addingType} onOpenChange={() => setAddingType(null)}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Adicionar Alimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Alimento</label>
              <Input value={form.food_name} onChange={(e) => setForm({ ...form, food_name: e.target.value })} placeholder="Ex: Frango grelhado" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Calorias</label><Input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">Proteína (g)</label><Input type="number" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">Carbos (g)</label><Input type="number" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">Gordura (g)</label><Input type="number" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} /></div>
            </div>
            <Button onClick={() => addMeal.mutate()} className="w-full gradient-primary text-primary-foreground" disabled={addMeal.isPending}>
              {addMeal.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
