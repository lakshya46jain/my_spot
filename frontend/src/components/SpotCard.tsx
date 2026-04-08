import {
  MapPin,
  Eye,
  Pencil,
  Trash2,
  ImageOff,
  Coffee,
  BookOpen,
  Trees,
  UtensilsCrossed,
  Building2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/StarRating";
import type { Spot } from "@/types/api";

const SPOT_TYPE_ICONS: Record<string, React.ReactNode> = {
  cafe: <Coffee className="h-3.5 w-3.5" />,
  library: <BookOpen className="h-3.5 w-3.5" />,
  park: <Trees className="h-3.5 w-3.5" />,
  restaurant: <UtensilsCrossed className="h-3.5 w-3.5" />,
  office: <Building2 className="h-3.5 w-3.5" />,
};

const SPOT_TYPE_LABELS: Record<string, string> = {
  cafe: "Café",
  library: "Library",
  park: "Park",
  restaurant: "Restaurant",
  office: "Office",
};

// TODO: fetch real attributes from backend (spot_attributes table)
const PLACEHOLDER_ATTRIBUTES = ["WiFi", "Quiet"];

interface SpotCardProps {
  spot: Spot;
  isOwner?: boolean;
  isLoggedIn?: boolean;
  onDelete?: (spotId: number) => void;
  onEdit?: (spotId: number) => void;
  onViewDetails?: (spotId: number) => void;
}

export function SpotCard({
  spot,
  isOwner = false,
  isLoggedIn = false,
  onDelete,
  onEdit,
  onViewDetails,
}: SpotCardProps) {
  const typeIcon = SPOT_TYPE_ICONS[spot.spot_type] ?? (
    <MoreHorizontal className="h-3.5 w-3.5" />
  );
  const typeLabel = SPOT_TYPE_LABELS[spot.spot_type] ?? spot.spot_type;

  // TODO: fetch real aggregated rating value from reviews table
  const placeholderRating = 0;

  return (
    <div className="group rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
      {/* Image Area */}
      <div className="relative h-44 bg-warm-100 flex items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center gap-2 text-warm-400">
          <ImageOff className="h-10 w-10" />
          <span className="text-xs font-medium">Photo coming soon</span>
        </div>
        {/* TODO: connect spot media carousel to spot_media API */}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-warm-500">{typeIcon}</span>
          <span className="text-xs font-medium text-muted-foreground capitalize">
            {typeLabel}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-base font-semibold text-foreground leading-snug truncate mb-1">
          {spot.spot_name}
        </h3>

        {/* Location */}
        {spot.address && (
          <div className="flex items-center gap-1.5 mb-2">
            <MapPin className="h-3 w-3 text-warm-400 shrink-0" />
            <p className="text-xs text-muted-foreground truncate">
              {spot.address}
            </p>
          </div>
        )}

        {/* Attributes */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {PLACEHOLDER_ATTRIBUTES.map((attr) => (
            <span
              key={attr}
              className="px-2 py-0.5 rounded-full bg-warm-50 text-warm-500 text-[10px] font-medium border border-warm-100"
            >
              {attr}
            </span>
          ))}
          {/* TODO: fetch real attributes from backend */}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <StarRating rating={placeholderRating} size="sm" />
          <span className="text-xs text-muted-foreground">
            {placeholderRating > 0
              ? placeholderRating.toFixed(1)
              : "No ratings yet"}
          </span>
        </div>

        {/* Spacer to push actions to bottom */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="border-t border-border pt-3 flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onViewDetails?.(spot.spot_id)}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            View
          </Button>
          {/* TODO: Restrict edit visibility to owner/admin when full role logic is wired */}
          {(isOwner || isLoggedIn) && (
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-8 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onEdit?.(spot.spot_id)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          )}
          {/* TODO: Restrict delete visibility to owner/admin when full role logic is wired */}
          {(isOwner || isLoggedIn) && (
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete?.(spot.spot_id)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
