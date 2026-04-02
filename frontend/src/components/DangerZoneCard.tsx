import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface DangerZoneCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function DangerZoneCard({
  title = "Danger Zone",
  description = "Irreversible actions. Please proceed with caution.",
  children,
  className,
}: DangerZoneCardProps) {
  return (
    <div className={cn(
      "rounded-2xl border border-destructive/30 bg-destructive/5 p-6",
      className
    )}>
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-destructive">{title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
