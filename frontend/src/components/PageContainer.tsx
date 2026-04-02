import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}

export function PageContainer({ children, className, narrow }: PageContainerProps) {
  return (
    <div className={cn(
      "min-h-screen bg-background pr-20",
      className
    )}>
      <div className={cn(
        "mx-auto px-6 py-10",
        narrow ? "max-w-xl" : "max-w-5xl"
      )}>
        {children}
      </div>
    </div>
  );
}
