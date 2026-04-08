import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRate?: (rating: number) => void;
  className?: string;
}

const SIZES = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function StarRating({
  rating,
  maxStars = 5,
  size = "sm",
  interactive = false,
  onRate,
  className,
}: StarRatingProps) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starIndex = i + 1;
        const fillPercent = Math.min(Math.max(rating - i, 0), 1) * 100;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(starIndex)}
            className={cn(
              "relative p-0 border-0 bg-transparent",
              interactive && "cursor-pointer hover:scale-110 transition-transform",
              !interactive && "cursor-default",
            )}
            aria-label={interactive ? `Rate ${starIndex} star${starIndex > 1 ? "s" : ""}` : undefined}
          >
            {/* Empty star (background) */}
            <Star className={cn(SIZES[size], "text-warm-200")} />
            {/* Filled star (overlay with clip) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercent}%` }}
            >
              <Star className={cn(SIZES[size], "text-amber-400 fill-amber-400")} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
