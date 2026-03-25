import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface QuickStatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  accent?: "primary" | "accent" | "info" | "success";
  onClick?: () => void;
}

const accentMap = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
};

export function QuickStatCard({ icon, label, value, accent = "primary", onClick }: QuickStatCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "bg-card rounded-lg shadow-card p-4 flex flex-col items-center gap-2 transition-all hover:shadow-elevated active:scale-95 w-full text-center",
        onClick && "cursor-pointer"
      )}
    >
      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", accentMap[accent])}>
        {icon}
      </div>
      <span className="text-lg font-bold font-display text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </button>
  );
}
