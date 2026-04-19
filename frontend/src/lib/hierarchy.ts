export const HIERARCHY_TYPES = [
  {
    value: "standalone",
    label: "Standalone",
    description: "A top-level spot that is not inside another location.",
  },
  {
    value: "building",
    label: "Building",
    description: "A top-level location that can contain floors or rooms.",
  },
  {
    value: "floor",
    label: "Floor",
    description: "A floor that must belong to a building.",
  },
  {
    value: "room",
    label: "Room",
    description: "A room that can belong to a floor or directly to a building.",
  },
] as const;

export type HierarchyType = (typeof HIERARCHY_TYPES)[number]["value"];

const HIERARCHY_TYPE_LABELS = new Map(
  HIERARCHY_TYPES.map((type) => [type.value, type.label]),
);

export function getHierarchyTypeLabel(value: string) {
  return HIERARCHY_TYPE_LABELS.get(value as HierarchyType) ?? value;
}

export function getAllowedParentHierarchyTypes(
  hierarchyType: HierarchyType,
): HierarchyType[] {
  switch (hierarchyType) {
    case "floor":
      return ["building"];
    case "room":
      return ["building", "floor"];
    default:
      return [];
  }
}

export function hierarchyTypeRequiresParent(hierarchyType: HierarchyType) {
  return hierarchyType === "floor" || hierarchyType === "room";
}
