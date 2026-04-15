import { cn } from "@/lib/utils";

type StatusType = "active" | "inactive" | "pending" | "resolved" | "dismissed" | "open" | "deleted";

const statusStyles: Record<StatusType, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive: "bg-warm-200 text-warm-700 border-warm-300",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  resolved: "bg-sky-100 text-sky-700 border-sky-200",
  dismissed: "bg-warm-100 text-warm-500 border-warm-200",
  open: "bg-rose-100 text-rose-700 border-rose-200",
  deleted: "bg-red-100 text-red-600 border-red-200",
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        statusStyles[status] ?? "bg-muted text-muted-foreground border-border",
        className
      )}
    >
      {status}
    </span>
  );
}
