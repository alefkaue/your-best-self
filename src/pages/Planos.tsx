import { ArrowLeft, Check, Crown, Zap, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    description: "Comece sua jornada",
    features: [
      "Registro de treinos básico",
      "Registro de refeições",
      "Métricas de saúde manuais",
      "Assistente IA (5 msgs/dia)",
      "Ranking global",
    ],
    cta: "Plano Atual",
    disabled: true,
    accent: false,
  },
  {
    name: "Pro",
    price: "R$ 29,90",
    period: "/mês",
    description: "Para atletas dedicados",
    features: [
      "Tudo do Free",
      "IA ilimitada com análise de fotos",
      "Planos de treino personalizados",
      "Conexão com relógios inteligentes",
      "Métricas avançadas (SPO2, HRV)",
      "Recompensas exclusivas",
      "Suporte prioritário",
    ],
    cta: "Assinar Pro",
    disabled: false,
    accent: true,
    badge: "MAIS POPULAR",
  },
  {
    name: "Elite",
    price: "R$ 59,90",
    period: "/mês",
    description: "Performance máxima",
    features: [
      "Tudo do Pro",
      "Coach IA dedicado 24/7",
      "Integração n8n personalizada",
      "Planos nutricionais com IA",
      "Acesso a suplementos com desconto",
      "Spotify Premium incluso",
      "Sessões com profissionais",
      "Relatórios mensais detalhados",
    ],
    cta: "Assinar Elite",
    disabled: false,
    accent: false,
    badge: "PREMIUM",
  },
];

export default function Planos() {
  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Link to="/perfil"><ArrowLeft className="h-5 w-5 text-muted-foreground" /></Link>
          <h1 className="text-xl font-bold font-display text-foreground">Planos</h1>
        </div>
        <p className="text-xs text-muted-foreground ml-7">Escolha o melhor plano para seus objetivos</p>
      </div>

      <div className="px-4 space-y-4">
        {plans.map((plan) => (
          <div key={plan.name} className={cn("bg-card rounded-xl p-5 relative overflow-hidden", plan.accent && "ring-2 ring-primary")}>
            {plan.badge && (
              <span className={cn(
                "absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full",
                plan.accent ? "gradient-primary text-primary-foreground" : "bg-accent/20 text-accent"
              )}>
                {plan.badge}
              </span>
            )}
            <div className="flex items-center gap-2 mb-1">
              {plan.name === "Free" && <Zap className="h-5 w-5 text-muted-foreground" />}
              {plan.name === "Pro" && <Star className="h-5 w-5 text-primary" />}
              {plan.name === "Elite" && <Crown className="h-5 w-5 text-accent" />}
              <h2 className="text-lg font-bold font-display text-foreground">{plan.name}</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>
            <div className="mb-4">
              <span className="text-3xl font-bold text-foreground">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.period}</span>
            </div>
            <ul className="space-y-2 mb-4">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button disabled={plan.disabled} className={cn("w-full h-11 font-semibold", plan.accent ? "gradient-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80")}>
              {plan.cta}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
