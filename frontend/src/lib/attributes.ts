export const ATTRIBUTE_TYPE_OPTIONS = [
  { value: "boolean", label: "Yes / No" },
  { value: "single_choice", label: "Single Choice" },
  { value: "number", label: "Number" },
  { value: "text", label: "Text" },
  { value: "unsure", label: "Unsure" },
] as const;

export type AttributeType = (typeof ATTRIBUTE_TYPE_OPTIONS)[number]["value"];

export function getAttributeTypeLabel(type: string) {
  return (
    ATTRIBUTE_TYPE_OPTIONS.find((option) => option.value === type)?.label ??
    type
  );
}

export function isKnownAttributeType(value: string): value is AttributeType {
  return ATTRIBUTE_TYPE_OPTIONS.some((option) => option.value === value);
}

export function parseJsonArray(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return [];
  }

  try {
    const parsed =
      typeof value === "string" ? JSON.parse(value) : Array.isArray(value) ? value : [];
    return Array.isArray(parsed)
      ? parsed
          .map((item) => String(item).trim())
          .filter((item) => item.length > 0)
      : [];
  } catch {
    return [];
  }
}

export function stringifyJsonArray(values: string[]) {
  return JSON.stringify(
    values.map((value) => value.trim()).filter((value) => value.length > 0),
  );
}

export function parseDelimitedValues(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}
