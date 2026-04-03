import { cn } from "@/lib/utils";

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function SectionCard({ children, title, description, className }: SectionCardProps) {
  return (
    <div className={cn("rounded-2xl bg-card border border-border p-6 shadow-sm", className)}>
      {(title || description) && (
        <div className="mb-5">
          {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
