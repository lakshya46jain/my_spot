import { createServerFn } from "@tanstack/react-start";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import type { PoolConnection } from "mysql2/promise";
import {
  type AttributeType,
  attributeTypeSchema,
  formatSpotAttributeDisplayLabel,
  normalizeAllowedValues,
  parseJsonArray,
  validateAttributeValue,
} from "@/lib/attribute-helpers";
import {
  HIERARCHY_TYPES,
  type HierarchyType,
  getAllowedParentHierarchyTypes,
  hierarchyTypeRequiresParent,
} from "@/lib/hierarchy";
import type { SpotAttribute } from "@/types/api";
import { db } from "./db";
import { deleteFilesFromFirebaseStorage } from "./firebase-admin";

const spotStatusSchema = z.enum(["active", "inactive", "pending"]);
const hierarchyTypeSchema = z.enum(
  HIERARCHY_TYPES.map((type) => type.value) as [HierarchyType, ...HierarchyType[]],
);
const meridiemSchema = z.enum(["AM", "PM"]);
const optionalMeridiemSchema = z.union([meridiemSchema, z.literal("")]);
const dayOfWeekSchema = z.enum([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]);

const timeRangeSchema = z.object({
  openHour: z.string().trim(),
  openMinute: z.string().trim(),
  openMeridiem: optionalMeridiemSchema,
  closeHour: z.string().trim(),
  closeMinute: z.string().trim(),
  closeMeridiem: optionalMeridiemSchema,
});

const dayHoursSchema = z.object({
  day: dayOfWeekSchema,
  closed: z.boolean(),
  timeRanges: z.array(timeRangeSchema),
  notes: z.string().max(255).optional().default(""),
});

const customAttributeInputSchema = z.object({
  name: z.string().trim().min(1, "Attribute name is required."),
  attribute_type: attributeTypeSchema,
  value: z.string().trim().min(1, "Attribute value is required."),
  notes: z.string().trim().max(255).optional().or(z.literal("")),
  suggested_allowed_values: z.array(z.string().trim().min(1)).optional().default([]),
});

const selectedAttributeInputSchema = z.object({
  attribute_id: z.number().int().positive(),
  value: z.string().trim().min(1, "Attribute value is required."),
  notes: z.string().trim().max(255).optional().or(z.literal("")),
});

const attributeReviewSchema = z.object({
  spot_attribute_id: z.number().int().positive(),
  decision: z.enum(["approve_existing", "approve_new", "reject"]),
  attribute_id: z.number().int().positive().optional(),
  name: z.string().trim().optional().or(z.literal("")),
  attribute_type: attributeTypeSchema.optional(),
  allowed_values: z.array(z.string().trim().min(1)).optional().default([]),
  number_unit: z.string().trim().max(50).optional().or(z.literal("")),
  min_value: z.string().trim().optional().or(z.literal("")),
  max_value: z.string().trim().optional().or(z.literal("")),
  help_text: z.string().trim().max(255).optional().or(z.literal("")),
  value: z.string().trim().min(1, "Attribute value is required."),
  notes: z.string().trim().max(255).optional().or(z.literal("")),
  rejection_reason: z.string().trim().max(255).optional().or(z.literal("")),
});

const createSpotSchema = z.object({
  userId: z.number().int().positive(),
  parent_spot_id: z.number().int().positive().nullable().optional(),
  hierarchy_type: hierarchyTypeSchema,
  spot_name: z.string().trim().min(1, "Spot name is required."),
  spot_type: z.string().trim().min(1, "Spot type is required."),
  short_description: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().min(1, "Location is required."),
  latitude: z.string().trim().min(1, "Location coordinates are required."),
  longitude: z.string().trim().min(1, "Location coordinates are required."),
  status: spotStatusSchema.default("pending"),
  operatingHours: z.array(dayHoursSchema).optional().default([]),
  selectedAttributes: z.array(selectedAttributeInputSchema).optional().default([]),
  customAttributes: z.array(customAttributeInputSchema).optional().default([]),
});

type CreateSpotInput = z.infer<typeof createSpotSchema>;

const updateSpotSchema = z.object({
  spotId: z.number().int().positive(),
  parent_spot_id: z.number().int().positive().nullable().optional(),
  hierarchy_type: hierarchyTypeSchema.optional(),
  spot_name: z.string().trim().optional(),
  spot_type: z.string().trim().optional(),
  short_description: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  latitude: z.string().trim().optional().or(z.literal("")),
  longitude: z.string().trim().optional().or(z.literal("")),
  status: spotStatusSchema.optional(),
  operatingHours: z.array(dayHoursSchema).optional(),
  adminUserId: z.number().int().positive().optional(),
  attributeReviews: z.array(attributeReviewSchema).optional(),
});

type UpdateSpotInput = z.infer<typeof updateSpotSchema>;

const deleteSpotSchema = z.object({
  spotId: z.number().int().positive(),
});

type DeleteSpotInput = z.infer<typeof deleteSpotSchema>;

const deleteSpotMediaSchema = z.object({
  spotId: z.number().int().positive(),
  mediaId: z.number().int().positive(),
});

type DeleteSpotMediaInput = z.infer<typeof deleteSpotMediaSchema>;

const getSpotSchema = z.object({
  spotId: z.number().int().positive(),
});

type GetSpotInput = z.infer<typeof getSpotSchema>;

const getParentSpotOptionsSchema = z.object({
  hierarchyType: hierarchyTypeSchema,
  excludeSpotId: z.number().int().positive().optional(),
});

type GetParentSpotOptionsInput = z.infer<typeof getParentSpotOptionsSchema>;

const searchSpotsSchema = z.object({
  query: z.string().trim().optional().default(""),
  latitude: z.number().finite().optional(),
  longitude: z.number().finite().optional(),
  radiusMiles: z.number().positive().max(100).optional().default(5),
  viewerUserId: z.number().int().positive().optional(),
});

type SearchSpotsInput = z.infer<typeof searchSpotsSchema>;

type SpotRow = RowDataPacket & {
  spot_id: number;
  parent_spot_id: number | null;
  hierarchy_type: HierarchyType;
  spot_name: string;
  spot_type: string;
  short_description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "active" | "inactive" | "pending";
  created_at: string;
  last_modified: string | null;
  creator_name: string;
  creator_avatar_url: string | null;
  user_id: number;
  average_rating: number | string | null;
  review_count: number;
  primary_media_url: string | null;
  media_count: number;
  attribute_badges_raw?: string | null;
  distance_miles?: number | null;
  is_favorited?: 0 | 1 | boolean | null;
};

type ExistingSpotRow = RowDataPacket & {
  spot_id: number;
  parent_spot_id?: number | null;
  hierarchy_type?: HierarchyType;
  status?: "active" | "inactive" | "pending";
};

type SpotRelationshipRow = RowDataPacket & {
  spot_id: number;
  spot_name: string;
  hierarchy_type: HierarchyType;
  spot_type: string;
  status?: "active" | "inactive" | "pending";
};

type SpotHoursRow = RowDataPacket & {
  hours_id: number;
  spot_id: number;
  days_of_week: z.infer<typeof dayOfWeekSchema>;
  open_time: string | null;
  close_time: string | null;
  notes: string | null;
};

type SpotHoursPayload = {
  day: z.infer<typeof dayOfWeekSchema>;
  open_time: string | null;
  close_time: string | null;
  notes: string | null;
};

type SpotMediaRow = RowDataPacket & {
  media_id: number;
  media_url: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  width: number | null;
  height: number | null;
  sort_order: number;
  is_primary: 0 | 1 | boolean;
};

type SpotAttributeRow = RowDataPacket & {
  spot_attribute_id: number;
  attribute_id: number | null;
  attribute_name: string | null;
  attribute_type: AttributeType | null;
  allowed_values_json: string | null;
  number_unit: string | null;
  min_value: number | string | null;
  max_value: number | string | null;
  is_active: 0 | 1 | boolean | null;
  value: string | null;
  notes: string | null;
  submitted_name: string | null;
  submitted_type: AttributeType | null;
  submitted_value: string | null;
  submitted_notes: string | null;
  submitted_allowed_values_json: string | null;
  moderation_status: "approved" | "pending" | "rejected";
  moderation_reason: string | null;
  reviewed_at: string | null;
  reviewed_by_user_id: number | null;
};

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

type CanonicalAttributeDefinition = {
  attribute_id: number;
  name: string;
  attribute_type: AttributeType;
  allowed_values: string[];
  number_unit: string | null;
  min_value: number | null;
  max_value: number | null;
  help_text: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function toMySqlTime(
  hour: string,
  minute: string,
  meridiem: z.infer<typeof meridiemSchema>,
) {
  let parsedHour = Number.parseInt(hour, 10);

  if (Number.isNaN(parsedHour) || parsedHour < 1 || parsedHour > 12) {
    throw new Error("Operating hours include an invalid hour value.");
  }

  if (meridiem === "AM" && parsedHour === 12) {
    parsedHour = 0;
  } else if (meridiem === "PM" && parsedHour !== 12) {
    parsedHour += 12;
  }

  return `${String(parsedHour).padStart(2, "0")}:${minute}:00`;
}

function timeToMinutes(
  hour: string,
  minute: string,
  meridiem: z.infer<typeof meridiemSchema>,
) {
  const mysqlTime = toMySqlTime(hour, minute, meridiem);
  const [hours, minutes] = mysqlTime.split(":");

  return Number(hours) * 60 + Number(minutes);
}

function normalizeSpotHours(rows: SpotHoursRow[]): SpotHoursPayload[] {
  return rows.map((row) => ({
    day: row.days_of_week,
    open_time: row.open_time,
    close_time: row.close_time,
    notes: row.notes,
  }));
}

function isBlankTimeRange(range: z.infer<typeof timeRangeSchema>) {
  return (
    range.openHour === "" &&
    range.openMinute === "" &&
    range.openMeridiem === "" &&
    range.closeHour === "" &&
    range.closeMinute === "" &&
    range.closeMeridiem === ""
  );
}

function buildSpotHoursRows(operatingHours: z.infer<typeof dayHoursSchema>[]) {
  return operatingHours.flatMap((dayHours) => {
    if (dayHours.closed || dayHours.timeRanges.length === 0) {
      return [];
    }

    const trimmedNotes = dayHours.notes.trim();

    return dayHours.timeRanges.map((range) => {
      if (isBlankTimeRange(range)) {
        return null;
      }

      if (
        range.openHour === "" ||
        range.openMinute === "" ||
        range.openMeridiem === "" ||
        range.closeHour === "" ||
        range.closeMinute === "" ||
        range.closeMeridiem === ""
      ) {
        throw new Error(
          `${dayHours.day} must have both opening and closing times set, or be left blank.`,
        );
      }

      const openMinutes = timeToMinutes(
        range.openHour,
        range.openMinute,
        range.openMeridiem,
      );
      const closeMinutes = timeToMinutes(
        range.closeHour,
        range.closeMinute,
        range.closeMeridiem,
      );

      if (closeMinutes <= openMinutes) {
        throw new Error(
          `${dayHours.day} has a closing time that must be after the opening time.`,
        );
      }

      return {
        day: dayHours.day,
        open_time: toMySqlTime(
          range.openHour,
          range.openMinute,
          range.openMeridiem,
        ),
        close_time: toMySqlTime(
          range.closeHour,
          range.closeMinute,
          range.closeMeridiem,
        ),
        notes: trimmedNotes || null,
      };
    }).filter((range): range is {
      day: z.infer<typeof dayOfWeekSchema>;
      open_time: string;
      close_time: string;
      notes: string | null;
    } => range !== null);
  });
}

function parseNullableDecimal(value?: string) {
  if (!value || value.trim() === "") return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error("Latitude/longitude must be valid numbers.");
  }
  return parsed;
}

function parseRequiredDecimal(value: string, fieldLabel: string) {
  const parsed = parseNullableDecimal(value);

  if (parsed === null) {
    throw new Error(`${fieldLabel} is required.`);
  }

  return parsed;
}

async function validateSpotHierarchy(
  connection: PoolConnection,
  params: {
    spotId?: number;
    hierarchyType: HierarchyType;
    parentSpotId: number | null;
    requireResolvedParent?: boolean;
  },
) {
  const {
    spotId,
    hierarchyType,
    parentSpotId,
    requireResolvedParent = true,
  } = params;
  const allowedParentTypes = getAllowedParentHierarchyTypes(hierarchyType);

  if (
    requireResolvedParent &&
    hierarchyTypeRequiresParent(hierarchyType) &&
    parentSpotId === null
  ) {
    throw new Error(`${hierarchyType} spots must belong to a parent location.`);
  }

  if (!hierarchyTypeRequiresParent(hierarchyType) && parentSpotId !== null) {
    throw new Error(`${hierarchyType} spots cannot be placed inside another spot.`);
  }

  if (parentSpotId === null) {
    return;
  }

  if (spotId !== undefined && parentSpotId === spotId) {
    throw new Error("A spot cannot be its own parent.");
  }

  const [parentRows] = await connection.execute<ExistingSpotRow[]>(
    `
    SELECT spot_id, hierarchy_type
    FROM spots
    WHERE spot_id = ?
      AND status = 'active'
    LIMIT 1
    `,
    [parentSpotId],
  );

  if (parentRows.length === 0 || !parentRows[0].hierarchy_type) {
    throw new Error("Choose an existing approved parent location.");
  }

  if (!allowedParentTypes.includes(parentRows[0].hierarchy_type)) {
    throw new Error(
      `${hierarchyType} spots can only belong to ${allowedParentTypes.join(" or ")} locations.`,
    );
  }

  if (spotId === undefined) {
    return;
  }

  let currentParentId: number | null = parentSpotId;

  while (currentParentId !== null) {
    if (currentParentId === spotId) {
      throw new Error("This parent would create a hierarchy loop.");
    }

    const [rows] = await connection.execute<ExistingSpotRow[]>(
      `
      SELECT parent_spot_id
      FROM spots
      WHERE spot_id = ?
      LIMIT 1
      `,
      [currentParentId],
    );

    currentParentId = rows[0]?.parent_spot_id ?? null;
  }
}

function normalizeSpot(row: SpotRow) {
  return {
    ...row,
    average_rating:
      row.average_rating === null ? null : Number(row.average_rating),
    review_count: Number(row.review_count ?? 0),
    distance_miles:
      row.distance_miles === undefined || row.distance_miles === null
        ? row.distance_miles
        : Number(row.distance_miles),
    media_count: Number(row.media_count ?? 0),
    is_favorited: Boolean(row.is_favorited),
    attribute_badges: row.attribute_badges_raw
      ? row.attribute_badges_raw
          .split("||")
          .map((badge) => badge.trim())
          .filter((badge) => badge.length > 0)
      : [],
  };
}

function normalizeSpotMedia(row: SpotMediaRow) {
  return {
    ...row,
    media_id: Number(row.media_id),
    file_size_bytes: Number(row.file_size_bytes),
    width: row.width === null ? null : Number(row.width),
    height: row.height === null ? null : Number(row.height),
    sort_order: Number(row.sort_order),
    is_primary: Boolean(row.is_primary),
  };
}

function parseOptionalNumber(value?: string) {
  if (!value || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error("Number limits must be valid numbers.");
  }

  return parsed;
}

function normalizeSpotAttribute(row: SpotAttributeRow): SpotAttribute {
  const attributeType = row.attribute_type ?? row.submitted_type ?? "unsure";
  const attributeName = row.attribute_name ?? row.submitted_name;
  const value = row.value ?? row.submitted_value ?? "";

  return {
    spot_attribute_id: Number(row.spot_attribute_id),
    attribute_id: row.attribute_id === null ? null : Number(row.attribute_id),
    attribute_name: attributeName,
    attribute_type: attributeType,
    value,
    notes: row.notes,
    moderation_status: row.moderation_status,
    moderation_reason: row.moderation_reason,
    submitted_name: row.submitted_name,
    submitted_type: row.submitted_type,
    submitted_value: row.submitted_value,
    submitted_notes: row.submitted_notes,
    submitted_allowed_values:
      row.submitted_type === null
        ? []
        : normalizeAllowedValues(
            row.submitted_type,
            parseJsonArray(row.submitted_allowed_values_json),
          ),
    reviewed_at: row.reviewed_at,
    reviewed_by_user_id:
      row.reviewed_by_user_id === null ? null : Number(row.reviewed_by_user_id),
    allowed_values:
      row.attribute_type === null
        ? []
        : normalizeAllowedValues(
            row.attribute_type,
            parseJsonArray(row.allowed_values_json),
          ),
    number_unit: row.number_unit,
    min_value: row.min_value === null ? null : Number(row.min_value),
    max_value: row.max_value === null ? null : Number(row.max_value),
    is_active:
      row.is_active === null || row.is_active === undefined
        ? null
        : Boolean(row.is_active),
    display_label: attributeName
      ? formatSpotAttributeDisplayLabel(attributeName, attributeType, value)
      : value,
  };
}

function normalizeCanonicalAttributeDefinition(
  row: AttributeDefinitionRow,
): CanonicalAttributeDefinition {
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

async function getAttributeDefinitionMap(
  includeInactive = true,
  executor: PoolConnection | typeof db = db,
) {
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
    ${includeInactive ? "" : "WHERE is_active = 1"}
    ORDER BY is_active DESC, name ASC, attribute_id ASC
    `,
  );

  const normalizedRows = rows.map(normalizeCanonicalAttributeDefinition);
  return new Map(normalizedRows.map((row) => [row.attribute_id, row]));
}

async function createCanonicalAttribute(input: {
  name: string;
  attribute_type: AttributeType;
  allowed_values?: string[];
  number_unit?: string | null;
  min_value?: number | null;
  max_value?: number | null;
  help_text?: string | null;
  adminUserId: number;
  connection: PoolConnection;
}) {
  const normalizedName = input.name.trim();
  const normalizedAllowedValues = normalizeAllowedValues(
    input.attribute_type,
    input.allowed_values ?? [],
  );

  const [existingRows] = await input.connection.execute<AttributeDefinitionRow[]>(
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
    return normalizeCanonicalAttributeDefinition(existingRows[0]);
  }

  const [result] = await input.connection.execute<ResultSetHeader>(
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

  const [rows] = await input.connection.execute<AttributeDefinitionRow[]>(
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

  return normalizeCanonicalAttributeDefinition(rows[0]);
}

async function loadSpotAttributeRows(
  executor: PoolConnection | typeof db,
  spotId: number,
) {
  const [rows] = await executor.execute<SpotAttributeRow[]>(
    `
    SELECT
      sa.spot_attribute_id,
      sa.attribute_id,
      am.name AS attribute_name,
      am.attribute_type,
      am.allowed_values_json,
      am.number_unit,
      am.min_value,
      am.max_value,
      am.is_active,
      sa.value,
      sa.notes,
      sa.submitted_name,
      sa.submitted_type,
      sa.submitted_value,
      sa.submitted_notes,
      sa.submitted_allowed_values_json,
      sa.moderation_status,
      sa.moderation_reason,
      sa.reviewed_at,
      sa.reviewed_by_user_id
    FROM spot_attributes sa
    LEFT JOIN attribute_menu am ON sa.attribute_id = am.attribute_id
    WHERE sa.spot_id = ?
    ORDER BY sa.spot_attribute_id ASC
    `,
    [spotId],
  );

  return rows.map(normalizeSpotAttribute);
}

async function insertSpotAttributeRows(
  connection: PoolConnection,
  spotId: number,
  selectedAttributes: CreateSpotInput["selectedAttributes"],
  customAttributes: CreateSpotInput["customAttributes"],
) {
  const attributeDefinitions = await getAttributeDefinitionMap(false);
  const existingAttributeIds = new Set<number>();

  for (const attribute of selectedAttributes) {
    if (existingAttributeIds.has(attribute.attribute_id)) {
      throw new Error("Each attribute can only be used once per spot.");
    }

    const definition = attributeDefinitions.get(attribute.attribute_id);
    if (!definition || !definition.is_active) {
      throw new Error("One of the selected attributes is no longer available.");
    }

    const normalizedValue = validateAttributeValue({
      name: definition.name,
      attributeType: definition.attribute_type,
      value: attribute.value,
      allowedValues: definition.allowed_values,
      minValue: definition.min_value,
      maxValue: definition.max_value,
    });

    await connection.execute<ResultSetHeader>(
      `
      INSERT INTO spot_attributes (
        attribute_id,
        spot_id,
        value,
        notes,
        submitted_value,
        submitted_notes,
        moderation_status
      )
      VALUES (?, ?, ?, ?, ?, ?, 'approved')
      `,
      [
        definition.attribute_id,
        spotId,
        normalizedValue,
        attribute.notes?.trim() || null,
        normalizedValue,
        attribute.notes?.trim() || null,
      ],
    );

    existingAttributeIds.add(attribute.attribute_id);
  }

  const customNames = new Set<string>();
  for (const attribute of customAttributes) {
    const normalizedName = attribute.name.trim();
    const duplicateKey = normalizedName.toLowerCase();
    if (customNames.has(duplicateKey)) {
      throw new Error("Custom attributes can only be proposed once per spot.");
    }
    customNames.add(duplicateKey);

    const normalizedAllowedValues =
      attribute.attribute_type === "single_choice"
        ? normalizeAllowedValues(
            "single_choice",
            attribute.suggested_allowed_values ?? [],
          )
        : [];
    const normalizedValue = validateAttributeValue({
      name: normalizedName,
      attributeType: attribute.attribute_type,
      value: attribute.value,
      allowedValues: normalizedAllowedValues,
    });

    await connection.execute<ResultSetHeader>(
      `
      INSERT INTO spot_attributes (
        attribute_id,
        spot_id,
        value,
        notes,
        submitted_name,
        submitted_type,
        submitted_value,
        submitted_notes,
        submitted_allowed_values_json,
        moderation_status
      )
      VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `,
      [
        spotId,
        normalizedValue,
        attribute.notes?.trim() || null,
        normalizedName,
        attribute.attribute_type,
        normalizedValue,
        attribute.notes?.trim() || null,
        normalizedAllowedValues.length > 0
          ? JSON.stringify(normalizedAllowedValues)
          : null,
      ],
    );
  }
}

async function applyAttributeReviews(
  connection: PoolConnection,
  spotId: number,
  adminUserId: number,
  reviews: NonNullable<UpdateSpotInput["attributeReviews"]>,
) {
  const existingRows = await loadSpotAttributeRows(connection, spotId);
  const rowMap = new Map(existingRows.map((row) => [row.spot_attribute_id, row]));
  const attributeDefinitions = await getAttributeDefinitionMap(true);
  const usedAttributeIds = new Set<number>();

  for (const row of existingRows) {
    if (
      row.moderation_status !== "rejected" &&
      row.attribute_id !== null
    ) {
      usedAttributeIds.add(row.attribute_id);
    }
  }

  for (const review of reviews) {
    const existingRow = rowMap.get(review.spot_attribute_id);
    if (!existingRow) {
      throw new Error("One of the pending spot attributes could not be found.");
    }

    if (review.decision === "reject") {
      await connection.execute<ResultSetHeader>(
        `
        UPDATE spot_attributes
        SET
          moderation_status = 'rejected',
          moderation_reason = ?,
          reviewed_at = CURRENT_TIMESTAMP,
          reviewed_by_user_id = ?
        WHERE spot_attribute_id = ?
          AND spot_id = ?
        `,
        [
          review.rejection_reason?.trim() || "Rejected during moderation.",
          adminUserId,
          review.spot_attribute_id,
          spotId,
        ],
      );
      continue;
    }

    let definition =
      review.attribute_id !== undefined
        ? attributeDefinitions.get(review.attribute_id)
        : undefined;

    if (review.decision === "approve_new") {
      if (!review.name?.trim() || !review.attribute_type) {
        throw new Error("New approved attributes need a name and type.");
      }

      const minValue = parseOptionalNumber(review.min_value);
      const maxValue = parseOptionalNumber(review.max_value);
      if (
        minValue !== null &&
        maxValue !== null &&
        minValue > maxValue
      ) {
        throw new Error("Minimum value cannot be greater than maximum value.");
      }

      definition = await createCanonicalAttribute({
        name: review.name,
        attribute_type: review.attribute_type,
        allowed_values: review.allowed_values,
        number_unit: review.number_unit?.trim() || null,
        min_value: minValue,
        max_value: maxValue,
        help_text: review.help_text?.trim() || null,
        adminUserId,
        connection,
      });
      attributeDefinitions.set(definition.attribute_id, definition);
    }

    if (!definition) {
      throw new Error("Approved attributes must map to an existing definition.");
    }

    if (!definition.is_active) {
      throw new Error(`${definition.name} is inactive and cannot be assigned.`);
    }

    if (
      existingRow.attribute_id !== definition.attribute_id &&
      usedAttributeIds.has(definition.attribute_id)
    ) {
      throw new Error("Each attribute can only be used once per spot.");
    }

    const normalizedValue = validateAttributeValue({
      name: definition.name,
      attributeType: definition.attribute_type,
      value: review.value,
      allowedValues: definition.allowed_values,
      minValue: definition.min_value,
      maxValue: definition.max_value,
    });

    if (existingRow.attribute_id !== null) {
      usedAttributeIds.delete(existingRow.attribute_id);
    }
    usedAttributeIds.add(definition.attribute_id);

    await connection.execute<ResultSetHeader>(
      `
      UPDATE spot_attributes
      SET
        attribute_id = ?,
        value = ?,
        notes = ?,
        moderation_status = 'approved',
        moderation_reason = NULL,
        reviewed_at = CURRENT_TIMESTAMP,
        reviewed_by_user_id = ?
      WHERE spot_attribute_id = ?
        AND spot_id = ?
      `,
      [
        definition.attribute_id,
        normalizedValue,
        review.notes?.trim() || null,
        adminUserId,
        review.spot_attribute_id,
        spotId,
      ],
    );
  }
}

export const getSpots = createServerFn({ method: "GET" }).handler(async () => {
  const [rows] = await db.execute<SpotRow[]>(
    `
    SELECT
      s.spot_id,
      s.parent_spot_id,
      s.hierarchy_type,
      s.spot_name,
      s.spot_type,
      s.short_description,
      s.address,
      s.latitude,
      s.longitude,
      s.status,
      s.created_at,
      s.last_modified,
      s.user_id,
      u.display_name AS creator_name,
      u.avatar_url AS creator_avatar_url,
      AVG(r.rating) AS average_rating,
      COUNT(r.review_id) AS review_count,
      (
        SELECT sm.media_url
        FROM spot_media sm
        WHERE sm.spot_id = s.spot_id
          AND sm.deleted_at IS NULL
        ORDER BY sm.is_primary DESC, sm.sort_order ASC, sm.media_id ASC
        LIMIT 1
      ) AS primary_media_url,
      (
        SELECT COUNT(*)
        FROM spot_media sm
        WHERE sm.spot_id = s.spot_id
          AND sm.deleted_at IS NULL
      ) AS media_count
      ,
      (
        SELECT GROUP_CONCAT(attribute_label SEPARATOR '||')
        FROM (
          SELECT
            CASE
              WHEN am.attribute_type = 'boolean' AND sa.value = 'Yes' THEN am.name
              WHEN am.attribute_type = 'boolean' THEN CONCAT(am.name, ': ', sa.value)
              ELSE CONCAT(am.name, ': ', sa.value)
            END AS attribute_label
          FROM spot_attributes sa
          INNER JOIN attribute_menu am ON sa.attribute_id = am.attribute_id
          WHERE sa.spot_id = s.spot_id
            AND sa.moderation_status = 'approved'
          ORDER BY sa.spot_attribute_id ASC
          LIMIT 3
        ) AS attribute_labels
      ) AS attribute_badges_raw
    FROM spots s
    JOIN users u ON s.user_id = u.user_id
    LEFT JOIN reviews r ON s.spot_id = r.spot_id
      AND r.deleted_at IS NULL
    WHERE s.status = 'active'
    GROUP BY
      s.spot_id,
      s.parent_spot_id,
      s.hierarchy_type,
      s.spot_name,
      s.spot_type,
      s.short_description,
      s.address,
      s.latitude,
      s.longitude,
      s.status,
      s.created_at,
      s.last_modified,
      s.user_id,
      u.display_name,
      u.avatar_url
    ORDER BY s.created_at DESC
    `,
  );

  return rows.map(normalizeSpot);
});

export const getParentSpotOptions = createServerFn({ method: "GET" })
  .inputValidator((input: GetParentSpotOptionsInput) =>
    getParentSpotOptionsSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const allowedParentTypes = getAllowedParentHierarchyTypes(data.hierarchyType);

    if (allowedParentTypes.length === 0) {
      return [];
    }

    const placeholders = allowedParentTypes.map(() => "?").join(", ");
    const params: Array<string | number> = [...allowedParentTypes];
    let excludeSql = "";

    if (data.excludeSpotId !== undefined) {
      excludeSql = "AND spot_id <> ?";
      params.push(data.excludeSpotId);
    }

    const [rows] = await db.execute<SpotRelationshipRow[]>(
      `
      SELECT
        spot_id,
        spot_name,
        hierarchy_type,
        spot_type,
        status
      FROM spots
      WHERE status = 'active'
        AND hierarchy_type IN (${placeholders})
        ${excludeSql}
      ORDER BY
        FIELD(hierarchy_type, 'building', 'floor', 'room', 'standalone'),
        spot_name ASC
      `,
      params,
    );

    return rows;
  });

export const searchSpots = createServerFn({ method: "POST" })
  .inputValidator((input: SearchSpotsInput) => searchSpotsSchema.parse(input))
  .handler(async ({ data }) => {
    const hasCoordinates =
      data.latitude !== undefined && data.longitude !== undefined;
    const hasQuery = data.query.trim().length > 0;

    const distanceSql = hasCoordinates
      ? `
        3959 * ACOS(
          LEAST(
            1,
            COS(RADIANS(?)) * COS(RADIANS(s.latitude)) *
            COS(RADIANS(s.longitude) - RADIANS(?)) +
            SIN(RADIANS(?)) * SIN(RADIANS(s.latitude))
          )
        )
      `
      : "NULL";

    const params: unknown[] = [];
    if (hasCoordinates) {
      params.push(data.latitude, data.longitude, data.latitude);
    }

    const favoriteJoin = data.viewerUserId
      ? `
      LEFT JOIN favorites f
        ON s.spot_id = f.spot_id
        AND f.user_id = ?
      `
      : "";

    if (data.viewerUserId) {
      params.push(data.viewerUserId);
    }

    let sql = `
      SELECT
        s.spot_id,
        s.parent_spot_id,
        s.hierarchy_type,
        s.spot_name,
        s.spot_type,
        s.short_description,
        s.address,
        s.latitude,
        s.longitude,
        s.status,
        s.created_at,
        s.last_modified,
        s.user_id,
        u.display_name AS creator_name,
        u.avatar_url AS creator_avatar_url,
        AVG(r.rating) AS average_rating,
        COUNT(r.review_id) AS review_count,
        (
          SELECT sm.media_url
          FROM spot_media sm
          WHERE sm.spot_id = s.spot_id
            AND sm.deleted_at IS NULL
          ORDER BY sm.is_primary DESC, sm.sort_order ASC, sm.media_id ASC
          LIMIT 1
        ) AS primary_media_url,
        (
          SELECT COUNT(*)
          FROM spot_media sm
          WHERE sm.spot_id = s.spot_id
            AND sm.deleted_at IS NULL
        ) AS media_count,
        (
          SELECT GROUP_CONCAT(attribute_label SEPARATOR '||')
          FROM (
            SELECT
              CASE
                WHEN am.attribute_type = 'boolean' AND sa.value = 'Yes' THEN am.name
                WHEN am.attribute_type = 'boolean' THEN CONCAT(am.name, ': ', sa.value)
                ELSE CONCAT(am.name, ': ', sa.value)
              END AS attribute_label
            FROM spot_attributes sa
            INNER JOIN attribute_menu am ON sa.attribute_id = am.attribute_id
            WHERE sa.spot_id = s.spot_id
              AND sa.moderation_status = 'approved'
            ORDER BY sa.spot_attribute_id ASC
            LIMIT 3
          ) AS attribute_labels
        ) AS attribute_badges_raw,
        ${data.viewerUserId ? "MAX(CASE WHEN f.user_id IS NULL THEN 0 ELSE 1 END)" : "0"} AS is_favorited,
        ${distanceSql} AS distance_miles
      FROM spots s
      JOIN users u ON s.user_id = u.user_id
      ${favoriteJoin}
      LEFT JOIN reviews r ON s.spot_id = r.spot_id
        AND r.deleted_at IS NULL
      WHERE 1 = 1
        AND s.status = 'active'
    `;

    if (hasQuery) {
      sql += `
        AND (
          s.spot_name LIKE ?
          OR s.spot_type LIKE ?
          OR s.address LIKE ?
        )
      `;

      const searchTerm = `%${data.query.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (hasCoordinates) {
      sql += `
        AND s.latitude IS NOT NULL
        AND s.longitude IS NOT NULL
      `;
      sql += `
        GROUP BY
          s.spot_id,
          s.parent_spot_id,
          s.hierarchy_type,
          s.spot_name,
          s.spot_type,
          s.short_description,
          s.address,
          s.latitude,
          s.longitude,
          s.status,
          s.created_at,
          s.last_modified,
          s.user_id,
          u.display_name,
          u.avatar_url
        HAVING distance_miles <= ?
      `;
      params.push(data.radiusMiles);
      sql += `
        ORDER BY distance_miles ASC, s.created_at DESC
      `;
    } else {
      sql += `
        GROUP BY
          s.spot_id,
          s.parent_spot_id,
          s.hierarchy_type,
          s.spot_name,
          s.spot_type,
          s.short_description,
          s.address,
          s.latitude,
          s.longitude,
          s.status,
          s.created_at,
          s.last_modified,
          s.user_id,
          u.display_name,
          u.avatar_url
        ORDER BY s.created_at DESC
      `;
    }

    const [rows] = await db.execute<SpotRow[]>(sql, params as (string | number | null)[]);
    return rows.map(normalizeSpot);
  });

export const getSpot = createServerFn({ method: "GET" })
  .inputValidator((input: GetSpotInput) => getSpotSchema.parse(input))
  .handler(async ({ data }) => {
    const [rows] = await db.execute<SpotRow[]>(
      `
      SELECT
        s.spot_id,
        s.parent_spot_id,
        s.hierarchy_type,
        s.spot_name,
        s.spot_type,
        s.short_description,
        s.address,
        s.latitude,
        s.longitude,
        s.status,
        s.created_at,
        s.last_modified,
        s.user_id,
        u.display_name AS creator_name,
        u.avatar_url AS creator_avatar_url,
        AVG(r.rating) AS average_rating,
        COUNT(r.review_id) AS review_count,
        (
          SELECT sm.media_url
          FROM spot_media sm
          WHERE sm.spot_id = s.spot_id
            AND sm.deleted_at IS NULL
          ORDER BY sm.is_primary DESC, sm.sort_order ASC, sm.media_id ASC
          LIMIT 1
        ) AS primary_media_url,
        (
          SELECT COUNT(*)
          FROM spot_media sm
          WHERE sm.spot_id = s.spot_id
            AND sm.deleted_at IS NULL
        ) AS media_count
      FROM spots s
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN reviews r ON s.spot_id = r.spot_id
        AND r.deleted_at IS NULL
      WHERE s.spot_id = ?
      GROUP BY
        s.spot_id,
        s.parent_spot_id,
        s.hierarchy_type,
        s.spot_name,
        s.spot_type,
        s.short_description,
        s.address,
        s.latitude,
        s.longitude,
        s.status,
        s.created_at,
        s.last_modified,
        s.user_id,
        u.display_name,
        u.avatar_url
      LIMIT 1
      `,
      [data.spotId],
    );

    if (rows.length === 0) {
      throw new Error("Spot not found.");
    }

    const [hoursRows] = await db.execute<SpotHoursRow[]>(
      `
      SELECT
        hours_id,
        spot_id,
        days_of_week,
        open_time,
        close_time,
        notes
      FROM spot_hours
      WHERE spot_id = ?
      ORDER BY
        FIELD(
          days_of_week,
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday'
        ),
        open_time ASC,
        close_time ASC,
        hours_id ASC
      `,
      [data.spotId],
    );

    const [mediaRows] = await db.execute<SpotMediaRow[]>(
      `
      SELECT
        media_id,
        media_url,
        storage_path,
        file_name,
        mime_type,
        file_size_bytes,
        width,
        height,
        sort_order,
        is_primary
      FROM spot_media
      WHERE spot_id = ?
        AND deleted_at IS NULL
      ORDER BY is_primary DESC, sort_order ASC, media_id ASC
      `,
      [data.spotId],
    );

    const normalizedSpot = normalizeSpot(rows[0]);
    const [parentRows] =
      normalizedSpot.parent_spot_id === null
        ? [[] as SpotRelationshipRow[]]
        : await db.execute<SpotRelationshipRow[]>(
            `
            SELECT
              spot_id,
              spot_name,
              hierarchy_type,
              spot_type
            FROM spots
            WHERE spot_id = ?
            LIMIT 1
            `,
            [normalizedSpot.parent_spot_id],
          );

    const [childRows] = await db.execute<SpotRelationshipRow[]>(
      `
      SELECT
        spot_id,
        spot_name,
        hierarchy_type,
        spot_type,
        status
      FROM spots
      WHERE parent_spot_id = ?
        AND status = 'active'
      ORDER BY
        FIELD(hierarchy_type, 'building', 'floor', 'room', 'standalone'),
        spot_name ASC
      `,
      [data.spotId],
    );

    const attributes = await loadSpotAttributeRows(db, data.spotId);

    return {
      ...normalizedSpot,
      operating_hours: normalizeSpotHours(hoursRows),
      media: mediaRows.map(normalizeSpotMedia),
      attributes,
      parent_spot: parentRows[0] ?? null,
      child_spots: childRows,
    };
  });

export const deleteSpotMedia = createServerFn({ method: "POST" })
  .inputValidator((input: DeleteSpotMediaInput) =>
    deleteSpotMediaSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [existingRows] = await connection.execute<
        Array<RowDataPacket & { media_id: number; is_primary: 0 | 1 }>
      >(
        `
        SELECT media_id, is_primary
        FROM spot_media
        WHERE media_id = ?
          AND spot_id = ?
          AND deleted_at IS NULL
        LIMIT 1
        `,
        [data.mediaId, data.spotId],
      );

      if (existingRows.length === 0) {
        throw new Error("Photo not found for this spot.");
      }

      await connection.execute<ResultSetHeader>(
        `
        UPDATE spot_media
        SET
          deleted_at = CURRENT_TIMESTAMP,
          is_primary = 0
        WHERE media_id = ?
          AND spot_id = ?
        `,
        [data.mediaId, data.spotId],
      );

      if (existingRows[0].is_primary === 1) {
        const [nextRows] = await connection.execute<
          Array<RowDataPacket & { media_id: number }>
        >(
          `
          SELECT media_id
          FROM spot_media
          WHERE spot_id = ?
            AND deleted_at IS NULL
          ORDER BY sort_order ASC, media_id ASC
          LIMIT 1
          `,
          [data.spotId],
        );

        if (nextRows.length > 0) {
          await connection.execute<ResultSetHeader>(
            `
            UPDATE spot_media
            SET is_primary = CASE WHEN media_id = ? THEN 1 ELSE 0 END
            WHERE spot_id = ?
              AND deleted_at IS NULL
            `,
            [nextRows[0].media_id, data.spotId],
          );
        }
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return {
      success: true,
      message: "Photo removed successfully.",
    };
  });

export const createSpot = createServerFn({ method: "POST" })
  .inputValidator((input: CreateSpotInput) => createSpotSchema.parse(input))
  .handler(async ({ data }) => {
    const latitude = parseRequiredDecimal(data.latitude, "Latitude");
    const longitude = parseRequiredDecimal(data.longitude, "Longitude");
    const hoursRows = buildSpotHoursRows(data.operatingHours);
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      await validateSpotHierarchy(connection, {
        hierarchyType: data.hierarchy_type,
        parentSpotId: data.parent_spot_id ?? null,
        requireResolvedParent: data.status === "active",
      });

      const [result] = await connection.execute<ResultSetHeader>(
        `
        INSERT INTO spots (
          parent_spot_id,
          hierarchy_type,
          spot_name,
          spot_type,
          short_description,
          address,
          latitude,
          longitude,
          user_id,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          data.parent_spot_id ?? null,
          data.hierarchy_type,
          data.spot_name.trim(),
          data.spot_type.trim(),
          data.short_description?.trim() || null,
          data.address.trim(),
          latitude,
          longitude,
          data.userId,
          data.status,
        ],
      );

      if (hoursRows.length > 0) {
        const placeholders = hoursRows.map(() => "(?, ?, ?, ?, ?)").join(", ");
        const values = hoursRows.flatMap((row) => [
          result.insertId,
          row.day,
          row.open_time,
          row.close_time,
          row.notes,
        ]);

        await connection.execute(
          `
          INSERT INTO spot_hours (
            spot_id,
            days_of_week,
            open_time,
            close_time,
            notes
          )
          VALUES ${placeholders}
          `,
          values,
        );
      }

      await insertSpotAttributeRows(
        connection,
        result.insertId,
        data.selectedAttributes,
        data.customAttributes,
      );

      await connection.commit();

      return {
        success: true,
        spotId: result.insertId,
        message: "Spot created successfully.",
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });

export const updateSpot = createServerFn({ method: "POST" })
  .inputValidator((input: UpdateSpotInput) => updateSpotSchema.parse(input))
  .handler(async ({ data }) => {
    const [existing] = await db.execute<ExistingSpotRow[]>(
      `
      SELECT spot_id, parent_spot_id, hierarchy_type
      , status
      FROM spots
      WHERE spot_id = ?
      LIMIT 1
      `,
      [data.spotId],
    );

    if (existing.length === 0) {
      throw new Error("Spot not found.");
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.spot_name !== undefined) {
      updates.push("spot_name = ?");
      values.push(data.spot_name.trim());
    }

    if (data.spot_type !== undefined) {
      updates.push("spot_type = ?");
      values.push(data.spot_type.trim());
    }

    if (data.hierarchy_type !== undefined) {
      updates.push("hierarchy_type = ?");
      values.push(data.hierarchy_type);
    }

    if (data.parent_spot_id !== undefined) {
      updates.push("parent_spot_id = ?");
      values.push(data.parent_spot_id);
    }

    if (data.short_description !== undefined) {
      updates.push("short_description = ?");
      values.push(data.short_description.trim() || null);
    }

    if (data.address !== undefined) {
      updates.push("address = ?");
      values.push(data.address.trim() || null);
    }

    if (data.latitude !== undefined) {
      updates.push("latitude = ?");
      values.push(parseNullableDecimal(data.latitude));
    }

    if (data.longitude !== undefined) {
      updates.push("longitude = ?");
      values.push(parseNullableDecimal(data.longitude));
    }

    if (data.status !== undefined) {
      updates.push("status = ?");
      values.push(data.status);
    }

    const replaceHours = data.operatingHours !== undefined;
    const hoursRows = replaceHours ? buildSpotHoursRows(data.operatingHours ?? []) : [];
    const replaceAttributes = data.attributeReviews !== undefined;

    updates.push("last_modified = CURRENT_TIMESTAMP");
    values.push(data.spotId);

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const nextHierarchyType = data.hierarchy_type ?? existing[0].hierarchy_type;
      const nextParentSpotId =
        data.parent_spot_id !== undefined
          ? data.parent_spot_id
          : existing[0].parent_spot_id ?? null;
      const nextStatus = data.status ?? existing[0].status;

      if (!nextHierarchyType) {
        throw new Error("Hierarchy type is required.");
      }

      await validateSpotHierarchy(connection, {
        spotId: data.spotId,
        hierarchyType: nextHierarchyType,
        parentSpotId: nextParentSpotId,
        requireResolvedParent: nextStatus === "active",
      });

      await connection.execute<ResultSetHeader>(
        `UPDATE spots SET ${updates.join(", ")} WHERE spot_id = ?`,
        values as (string | number | null)[],
      );

      if (replaceHours) {
        await connection.execute(`DELETE FROM spot_hours WHERE spot_id = ?`, [
          data.spotId,
        ]);

        if (hoursRows.length > 0) {
          const placeholders = hoursRows.map(() => "(?, ?, ?, ?, ?)").join(", ");
          const hourValues = hoursRows.flatMap((row) => [
            data.spotId,
            row.day,
            row.open_time,
            row.close_time,
            row.notes,
          ]);

          await connection.execute(
            `
            INSERT INTO spot_hours (
              spot_id,
              days_of_week,
              open_time,
              close_time,
              notes
            )
            VALUES ${placeholders}
            `,
            hourValues,
          );
        }
      }

      if (replaceAttributes) {
        if (!data.adminUserId) {
          throw new Error("Admin user is required to review spot attributes.");
        }

        await applyAttributeReviews(
          connection,
          data.spotId,
          data.adminUserId,
          data.attributeReviews ?? [],
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return {
      success: true,
      message: "Spot updated successfully.",
    };
  });

export const deleteSpot = createServerFn({ method: "POST" })
  .inputValidator((input: DeleteSpotInput) => deleteSpotSchema.parse(input))
  .handler(async ({ data }) => {
    const connection = await db.getConnection();
    let mediaPathsToDelete: string[] = [];

    try {
      await connection.beginTransaction();

      const [existing] = await connection.execute<ExistingSpotRow[]>(
        `SELECT spot_id FROM spots WHERE spot_id = ? LIMIT 1`,
        [data.spotId],
      );

      if (existing.length === 0) {
        throw new Error("Spot not found.");
      }

      const [mediaRows] = await connection.execute<
        Array<RowDataPacket & { storage_path: string | null }>
      >(
        `
        SELECT storage_path
        FROM spot_media
        WHERE spot_id = ?
        `,
        [data.spotId],
      );

      mediaPathsToDelete = mediaRows
        .map((row) => row.storage_path)
        .filter((path): path is string => Boolean(path));

      await connection.execute(`DELETE FROM content_report WHERE spot_id = ?`, [
        data.spotId,
      ]);

      await connection.execute(
        `
        DELETE cr
        FROM content_report cr
        INNER JOIN reviews r ON cr.review_id = r.review_id
        WHERE r.spot_id = ?
        `,
        [data.spotId],
      );

      await connection.execute(`DELETE FROM favorites WHERE spot_id = ?`, [
        data.spotId,
      ]);

      await connection.execute(`DELETE FROM spot_media WHERE spot_id = ?`, [
        data.spotId,
      ]);

      await connection.execute(`DELETE FROM spot_hours WHERE spot_id = ?`, [
        data.spotId,
      ]);

      await connection.execute(
        `DELETE FROM spot_attributes WHERE spot_id = ?`,
        [data.spotId],
      );

      await connection.execute(`DELETE FROM reviews WHERE spot_id = ?`, [
        data.spotId,
      ]);

      await connection.execute(`DELETE FROM spots WHERE spot_id = ?`, [
        data.spotId,
      ]);

      await connection.commit();

      await deleteFilesFromFirebaseStorage(mediaPathsToDelete);

      return {
        success: true,
        message: "Spot deleted successfully.",
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });
