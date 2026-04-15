import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminSectionShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  backLabel?: string;
}

export function AdminSectionShell({
  title,
  subtitle,
  children,
  backLabel = "Back to Dashboard",
}: AdminSectionShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4 mr-1" />
              {backLabel}
            </Link>
          </Button>
          <h1 className="text-3xl font-display text-foreground">{title}</h1>
          {subtitle && <p className="mt-1.5 text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
