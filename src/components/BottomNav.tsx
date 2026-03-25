import { Home, Heart, Dumbbell, Bot, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Início" },
  { to: "/saude", icon: Heart, label: "Saúde" },
  { to: "/treinos", icon: Dumbbell, label: "Treinos" },
  { to: "/assistente", icon: Bot, label: "Coach" },
  { to: "/perfil", icon: User, label: "Perfil" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors text-muted-foreground",
                isActive && "text-primary"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
