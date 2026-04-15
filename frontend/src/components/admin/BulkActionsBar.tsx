import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface BulkAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline";
}

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: BulkAction[];
}

export function BulkActionsBar({ selectedCount, onClearSelection, actions }: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
      <span className="text-sm font-medium text-foreground">
        {selectedCount} selected
      </span>
      <div className="flex items-center gap-2 ml-auto">
        {actions.map((action) => (
          <Button
            key={action.label}
            size="sm"
            variant={action.variant ?? "outline"}
            onClick={action.onClick}
            className="rounded-lg"
          >
            {action.label}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={onClearSelection} className="rounded-lg">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
