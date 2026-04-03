import {
  MapPin,
  Clock,
  Heart,
  Flag,
  Pencil,
  Trash2,
  Eye,
  Star,
  Coffee,
  BookOpen,
  Trees,
  UtensilsCrossed,
  Building2,
  MoreHorizontal,
  ImageOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Spot } from "@/types/api";

const SPOT_TYPE_ICONS: Record<string, React.ReactNode> = {
  cafe: <Coffee className="h-4 w-4" />,
  library: <BookOpen className="h-4 w-4" />,
  park: <Trees className="h-4 w-4" />,
  restaurant: <UtensilsCrossed className="h-4 w-4" />,
  office: <Building2 className="h-4 w-4" />,
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

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
    <MoreHorizontal className="h-4 w-4" />
  );

  return (
    <div className="group rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
      {/* Image Area */}
      <div className="relative h-48 bg-warm-100 flex items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center gap-2 text-warm-400">
          <ImageOff className="h-10 w-10" />
          <span className="text-xs font-medium">Photo coming soon</span>
        </div>
        {/* TODO: Replace with actual spot image from spot_media table */}

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="secondary"
            className={`text-xs font-medium backdrop-blur-sm ${
              spot.status === "active"
                ? "bg-green-100/90 text-green-800 border-green-200"
                : spot.status === "pending"
                  ? "bg-yellow-100/90 text-yellow-800 border-yellow-200"
                  : "bg-muted/90 text-muted-foreground"
            }`}
          >
            {spot.status}
          </Badge>
        </div>

        {/* Quick actions overlay */}
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* TODO: Wire favorite toggle to backend favorites table */}
          <button
            className="p-2 rounded-full bg-card/90 backdrop-blur-sm text-muted-foreground hover:text-destructive transition-colors shadow-sm"
            title="Save to favorites"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement favorite toggle with backend
            }}
          >
            <Heart className="h-4 w-4" />
          </button>
          {/* TODO: Wire report action to content_report table */}
          <button
            className="p-2 rounded-full bg-card/90 backdrop-blur-sm text-muted-foreground hover:text-warm-600 transition-colors shadow-sm"
            title="Report this spot"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement report modal with backend
            }}
          >
            <Flag className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Type + Name */}
        <div className="flex items-start gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-warm-500">{typeIcon}</span>
              <span className="text-xs font-medium text-muted-foreground capitalize">
                {spot.spot_type}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground truncate leading-tight">
              {spot.spot_name}
            </h3>
          </div>
        </div>

        {/* Description */}
        {spot.short_description ? (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {spot.short_description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/60 italic mb-3">
            No description yet
          </p>
        )}

        {/* Address */}
        {spot.address && (
          <div className="flex items-center gap-1.5 mb-3">
            <MapPin className="h-3.5 w-3.5 text-warm-400 shrink-0" />
            <p className="text-xs text-muted-foreground truncate">
              {/* TODO: Restrict exact address visibility for guest users */}
              {spot.address}
            </p>
          </div>
        )}

        {/* Rating placeholder */}
        <div className="flex items-center gap-1 mb-3">
          <Star className="h-3.5 w-3.5 text-warm-300" />
          <span className="text-xs text-muted-foreground/60">
            Ratings coming soon
          </span>
          {/* TODO: Replace with aggregated review rating from reviews table */}
        </div>

        {/* Attribute chips placeholder */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="px-2 py-0.5 rounded-full bg-warm-50 text-warm-500 text-[10px] font-medium border border-warm-100">
            WiFi
          </span>
          <span className="px-2 py-0.5 rounded-full bg-warm-50 text-warm-500 text-[10px] font-medium border border-warm-100">
            Quiet
          </span>
          <span className="px-2 py-0.5 rounded-full bg-warm-50 text-warm-400/60 text-[10px] font-medium border border-warm-100/60 italic">
            + more soon
          </span>
          {/* TODO: Replace with real attributes from spot_attributes table */}
        </div>

        {/* Hours placeholder */}
        <div className="flex items-center gap-1.5 mb-4 text-xs text-muted-foreground/60">
          <Clock className="h-3.5 w-3.5" />
          <span>Hours info coming soon</span>
          {/* TODO: Replace with real hours from spot_hours table */}
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-3">
          {/* Uploader info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-warm-200 flex items-center justify-center text-xs font-semibold text-warm-700">
                {getInitials(spot.creator_name)}
              </div>
              <div>
                <p className="text-xs font-medium text-foreground leading-tight">
                  {spot.creator_name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(spot.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Card actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
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
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    onEdit?.(spot.spot_id);
                    // TODO: Implement edit spot flow — navigate to edit page or open edit modal
                  }}
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
                  className="h-8 px-2.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete?.(spot.spot_id)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
