import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, title, subtitle, footer, className }: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background pr-20 px-4">
      <div className={cn(
        "w-full max-w-md rounded-2xl bg-card border border-border p-8 shadow-lg",
        className
      )}>
        <div className="mb-6 text-center">
          <Link to="/" className="inline-block mb-4">
            <span className="text-2xl font-display text-primary tracking-tight">MySpot</span>
          </Link>
          <h1 className="text-2xl font-display text-foreground">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}
