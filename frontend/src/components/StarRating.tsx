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
  function handleRate(
    event: React.MouseEvent<HTMLButtonElement>,
    starIndex: number,
  ) {
    if (!interactive) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const clickOffset = event.clientX - bounds.left;
    const isLeftHalf = clickOffset < bounds.width / 2;
    const selectedRating = isLeftHalf ? starIndex - 0.5 : starIndex;

    onRate?.(selectedRating);
  }

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starIndex = i + 1;
        const fillPercent = Math.min(Math.max(rating - i, 0), 1) * 100;
        const nextHalfStep = starIndex - 0.5;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={(event) => handleRate(event, starIndex)}
            className={cn(
              "relative p-0 border-0 bg-transparent",
              interactive && "cursor-pointer hover:scale-110 transition-transform",
              !interactive && "cursor-default",
            )}
            aria-label={
              interactive
                ? `Rate ${nextHalfStep} or ${starIndex} stars`
                : undefined
            }
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
