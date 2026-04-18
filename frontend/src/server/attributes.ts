import { createServerFn } from "@tanstack/react-start";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import {
  type AttributeType,
  attributeTypeSchema,
  buildAllowedValuesFromInput,
  formatSpotAttributeDisplayLabel,
  normalizeAllowedValues,
  parseJsonArray,
  validateAttributeValue,
} from "@/lib/attribute-helpers";
import { db } from "./db";
import type { AttributeDefinition } from "@/types/api";
import type { AdminAttributeRow } from "@/types/admin";

const updateAdminAttributeSchema = z.object({
  attribute_id: z.number().int().positive(),
  name: z.string().trim().min(1, "Attribute name is required."),
  attribute_type: attributeTypeSchema,
  allowed_values: z.array(z.string().trim().min(1)).optional().default([]),
  number_unit: z.string().trim().max(50).optional().or(z.literal("")),
  min_value: z.string().trim().optional().or(z.literal("")),
  max_value: z.string().trim().optional().or(z.literal("")),
  help_text: z.string().trim().max(255).optional().or(z.literal("")),
  is_active: z.boolean(),
  adminUserId: z.number().int().positive(),
});

type AttributeDefinitionRow = RowDataPacket & {
  attribute_id: number;
  name: string;
  attribute_type: AttributeType;
  allowed_values_json: string | null;
  number_unit: string | null;
  min_value: number | string | null;
  max_value: number | string | null;
  help_text: string | null;
  is_active: 0 | 1 | boolean;
  created_at: string;
  updated_at: string;
};

function toNullableNumber(value: string | undefined) {
  if (!value || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error("Numeric bounds must be valid numbers.");
  }

  return parsed;
}

function normalizeAttributeDefinition(
  row: AttributeDefinitionRow,
): AttributeDefinition {
  return {
    attribute_id: Number(row.attribute_id),
    name: row.name,
    attribute_type: row.attribute_type,
    allowed_values: normalizeAllowedValues(
      row.attribute_type,
      parseJsonArray(row.allowed_values_json),
    ),
    number_unit: row.number_unit,
    min_value: row.min_value === null ? null : Number(row.min_value),
    max_value: row.max_value === null ? null : Number(row.max_value),
    help_text: row.help_text,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function loadAttributeDefinitions(includeInactive: boolean) {
  const [rows] = await db.execute<AttributeDefinitionRow[]>(
    `
    SELECT
      attribute_id,
      name,
      attribute_type,
      allowed_values_json,
      number_unit,
      min_value,
      max_value,
      help_text,
      is_active,
      created_at,
      updated_at
    FROM attribute_menu
    ${includeInactive ? "" : "WHERE is_active = 1"}
    ORDER BY is_active DESC, name ASC, attribute_id ASC
    `,
  );

  return rows.map(normalizeAttributeDefinition);
}

export async function getAttributeDefinitionMap(includeInactive = true) {
  const rows = await loadAttributeDefinitions(includeInactive);
  return new Map(rows.map((row) => [row.attribute_id, row]));
}

export async function createCanonicalAttribute(input: {
  name: string;
  attribute_type: AttributeType;
  allowed_values?: string[];
  number_unit?: string | null;
  min_value?: number | null;
  max_value?: number | null;
  help_text?: string | null;
  adminUserId: number;
  connection?: {
    execute: typeof db.execute;
  };
}) {
  const normalizedName = input.name.trim();
  const normalizedAllowedValues = normalizeAllowedValues(
    input.attribute_type,
    input.allowed_values ?? [],
  );
  const executor = input.connection ?? db;

  const [existingRows] = await executor.execute<AttributeDefinitionRow[]>(
    `
    SELECT
      attribute_id,
      name,
      attribute_type,
      allowed_values_json,
      number_unit,
      min_value,
      max_value,
      help_text,
      is_active,
      created_at,
      updated_at
    FROM attribute_menu
    WHERE LOWER(name) = LOWER(?)
    LIMIT 1
    `,
    [normalizedName],
  );

  if (existingRows.length > 0) {
    return normalizeAttributeDefinition(existingRows[0]);
  }

  const [result] = await executor.execute<ResultSetHeader>(
    `
    INSERT INTO attribute_menu (
      name,
      attribute_type,
      allowed_values_json,
      number_unit,
      min_value,
      max_value,
      help_text,
      is_active,
      created_by_user_id,
      last_updated_by_user_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `,
    [
      normalizedName,
      input.attribute_type,
      normalizedAllowedValues.length > 0
        ? JSON.stringify(normalizedAllowedValues)
        : null,
      input.number_unit?.trim() || null,
      input.min_value ?? null,
      input.max_value ?? null,
      input.help_text?.trim() || null,
      input.adminUserId,
      input.adminUserId,
    ],
  );

  const [rows] = await executor.execute<AttributeDefinitionRow[]>(
    `
    SELECT
      attribute_id,
      name,
      attribute_type,
      allowed_values_json,
      number_unit,
      min_value,
      max_value,
      help_text,
      is_active,
      created_at,
      updated_at
    FROM attribute_menu
    WHERE attribute_id = ?
    LIMIT 1
    `,
    [result.insertId],
  );

  return normalizeAttributeDefinition(rows[0]);
}

export const getAttributeMenu = createServerFn({ method: "GET" }).handler(
  async () => loadAttributeDefinitions(false),
);

export const getAdminAttributes = createServerFn({ method: "GET" }).handler(
  async () => {
    const rows = await loadAttributeDefinitions(true);

    return rows.map<AdminAttributeRow>((row) => ({
      attribute_id: row.attribute_id,
      name: row.name,
      attribute_type: row.attribute_type,
      allowed_values: row.allowed_values,
      number_unit: row.number_unit,
      min_value: row.min_value,
      max_value: row.max_value,
      help_text: row.help_text,
      is_active: row.is_active,
      created_at: row.created_at ?? "",
      updated_at: row.updated_at ?? "",
    }));
  },
);

export const updateAdminAttribute = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof updateAdminAttributeSchema>) =>
    updateAdminAttributeSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const allowedValues = normalizeAllowedValues(
      data.attribute_type,
      data.allowed_values,
    );
    const minValue = toNullableNumber(data.min_value);
    const maxValue = toNullableNumber(data.max_value);

    if (
      minValue !== null &&
      maxValue !== null &&
      minValue > maxValue
    ) {
      throw new Error("Minimum value cannot be greater than maximum value.");
    }

    await db.execute<ResultSetHeader>(
      `
      UPDATE attribute_menu
      SET
        name = ?,
        attribute_type = ?,
        allowed_values_json = ?,
        number_unit = ?,
        min_value = ?,
        max_value = ?,
        help_text = ?,
        is_active = ?,
        last_updated_by_user_id = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE attribute_id = ?
      `,
      [
        data.name.trim(),
        data.attribute_type,
        allowedValues.length > 0 ? JSON.stringify(allowedValues) : null,
        data.number_unit?.trim() || null,
        minValue,
        maxValue,
        data.help_text?.trim() || null,
        data.is_active ? 1 : 0,
        data.adminUserId,
        data.attribute_id,
      ],
    );

    return {
      success: true,
      message: "Attribute updated successfully.",
    };
  });

export { buildAllowedValuesFromInput };
