import {
  Coffee,
  BookOpen,
  Trees,
  UtensilsCrossed,
  Building2,
  MoreHorizontal,
} from "lucide-react";

export const SPOT_TYPES = [
  { value: "cafe", label: "Café", icon: Coffee },
  { value: "library", label: "Library", icon: BookOpen },
  { value: "park", label: "Park", icon: Trees },
  { value: "restaurant", label: "Restaurant", icon: UtensilsCrossed },
  { value: "office", label: "Office", icon: Building2 },
  { value: "other", label: "Other", icon: MoreHorizontal },
] as const;

const SPOT_TYPE_LABELS = new Map(
  SPOT_TYPES.map((spotType) => [spotType.value, spotType.label]),
);

export function getSpotTypeLabel(value: string) {
  return SPOT_TYPE_LABELS.get(
    value as (typeof SPOT_TYPES)[number]["value"],
  ) ?? value;
}
