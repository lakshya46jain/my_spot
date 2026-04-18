import { z } from "zod";
import {
  ATTRIBUTE_TYPE_OPTIONS,
  type AttributeType,
  parseDelimitedValues,
  parseJsonArray,
} from "@/lib/attributes";

export const attributeTypeSchema = z.enum(
  ATTRIBUTE_TYPE_OPTIONS.map((option) => option.value) as [
    AttributeType,
    ...AttributeType[],
  ],
);

export type AttributeValidationPayload = {
  name: string;
  attributeType: AttributeType;
  value: string;
  allowedValues?: string[];
  minValue?: number | null;
  maxValue?: number | null;
};

export function normalizeAllowedValues(
  attributeType: AttributeType,
  values: string[],
) {
  if (attributeType === "boolean") {
    return ["Yes", "No"];
  }

  if (attributeType !== "single_choice") {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push(trimmed);
  }

  if (normalized.length === 0) {
    throw new Error("Single-choice attributes must include at least one allowed value.");
  }

  return normalized;
}

export function formatSpotAttributeDisplayLabel(
  name: string,
  attributeType: AttributeType,
  value: string,
) {
  if (attributeType === "boolean") {
    return value === "Yes" ? name : `${name}: No`;
  }

  return `${name}: ${value}`;
}

export function validateAttributeValue({
  name,
  attributeType,
  value,
  allowedValues = [],
  minValue = null,
  maxValue = null,
}: AttributeValidationPayload) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error(`${name} requires a value.`);
  }

  if (attributeType === "boolean") {
    if (!["Yes", "No"].includes(trimmedValue)) {
      throw new Error(`${name} must be either Yes or No.`);
    }
    return trimmedValue;
  }

  if (attributeType === "single_choice") {
    if (!allowedValues.includes(trimmedValue)) {
      throw new Error(`${name} must use one of the allowed choices.`);
    }
    return trimmedValue;
  }

  if (attributeType === "number") {
    const parsed = Number(trimmedValue);
    if (Number.isNaN(parsed)) {
      throw new Error(`${name} must be a valid number.`);
    }
    if (minValue !== null && parsed < minValue) {
      throw new Error(`${name} must be at least ${minValue}.`);
    }
    if (maxValue !== null && parsed > maxValue) {
      throw new Error(`${name} must be at most ${maxValue}.`);
    }
    return trimmedValue;
  }

  return trimmedValue;
}

export function buildAllowedValuesFromInput(
  attributeType: AttributeType,
  allowedValuesInput: string | string[],
) {
  const values = Array.isArray(allowedValuesInput)
    ? allowedValuesInput
    : parseDelimitedValues(allowedValuesInput);

  return normalizeAllowedValues(attributeType, values);
}

export { parseDelimitedValues, parseJsonArray };
