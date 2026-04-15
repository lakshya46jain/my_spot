import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  className?: string;
}

export function MetricCard({ label, value, icon, trend, className }: MetricCardProps) {
  return (
    <div className={cn("rounded-2xl bg-card border border-border p-5 shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              {trend.direction === "up" && <TrendingUp className="h-3 w-3 text-emerald-600" />}
              {trend.direction === "down" && <TrendingDown className="h-3 w-3 text-rose-600" />}
              {trend.direction === "flat" && <Minus className="h-3 w-3 text-muted-foreground" />}
              <span className={cn(
                trend.direction === "up" && "text-emerald-600",
                trend.direction === "down" && "text-rose-600",
                trend.direction === "flat" && "text-muted-foreground",
              )}>
                {trend.value}
              </span>
            </div>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warm-100">
          {icon}
        </div>
      </div>
    </div>
  );
}
