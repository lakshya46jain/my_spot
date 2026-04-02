import { cn } from "@/lib/utils";
import { Construction } from "lucide-react";

interface PlaceholderShellProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PlaceholderShell({ title, description, icon, children, className }: PlaceholderShellProps) {
  return (
    <div className={cn("space-y-8", className)}>
      <div>
        <h1 className="text-3xl font-display text-foreground">{title}</h1>
        <p className="mt-2 text-muted-foreground max-w-lg">{description}</p>
      </div>

      {children}

      <div className="rounded-2xl border-2 border-dashed border-warm-300 bg-warm-50 p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warm-200">
          {icon || <Construction className="h-7 w-7 text-warm-500" />}
        </div>
        <h3 className="text-lg font-semibold text-warm-700">Coming in the next phase</h3>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
          This feature is planned and will be available in a future update. The foundation is in place for a smooth rollout.
        </p>
      </div>
    </div>
  );
}
