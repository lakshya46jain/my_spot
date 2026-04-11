import { createServerFn } from "@tanstack/react-start";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { db } from "./db";

const spotStatusSchema = z.enum(["active", "inactive", "pending"]);
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

const createSpotSchema = z.object({
  userId: z.number().int().positive(),
  spot_name: z.string().trim().min(1, "Spot name is required."),
  spot_type: z.string().trim().min(1, "Spot type is required."),
  short_description: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().min(1, "Location is required."),
  latitude: z.string().trim().min(1, "Location coordinates are required."),
  longitude: z.string().trim().min(1, "Location coordinates are required."),
  status: spotStatusSchema.default("pending"),
  operatingHours: z.array(dayHoursSchema).optional().default([]),
});

type CreateSpotInput = z.infer<typeof createSpotSchema>;

const updateSpotSchema = z.object({
  spotId: z.number().int().positive(),
  spot_name: z.string().trim().optional(),
  spot_type: z.string().trim().optional(),
  short_description: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  latitude: z.string().trim().optional().or(z.literal("")),
  longitude: z.string().trim().optional().or(z.literal("")),
  status: spotStatusSchema.optional(),
  operatingHours: z.array(dayHoursSchema).optional(),
});

type UpdateSpotInput = z.infer<typeof updateSpotSchema>;

const deleteSpotSchema = z.object({
  spotId: z.number().int().positive(),
});

type DeleteSpotInput = z.infer<typeof deleteSpotSchema>;

const getSpotSchema = z.object({
  spotId: z.number().int().positive(),
});

type GetSpotInput = z.infer<typeof getSpotSchema>;

const searchSpotsSchema = z.object({
  query: z.string().trim().optional().default(""),
  latitude: z.number().finite().optional(),
  longitude: z.number().finite().optional(),
  radiusMiles: z.number().positive().max(100).optional().default(5),
});

type SearchSpotsInput = z.infer<typeof searchSpotsSchema>;

type SpotRow = RowDataPacket & {
  spot_id: number;
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
  user_id: number;
  average_rating: number | string | null;
  review_count: number;
  distance_miles?: number | null;
};

type ExistingSpotRow = RowDataPacket & {
  spot_id: number;
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
  };
}

export const getSpots = createServerFn({ method: "GET" }).handler(async () => {
  const [rows] = await db.execute<SpotRow[]>(
    `
    SELECT
      s.spot_id,
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
      AVG(r.rating) AS average_rating,
      COUNT(r.review_id) AS review_count
    FROM spots s
    JOIN users u ON s.user_id = u.user_id
    WHERE s.status = 'active'
    LEFT JOIN reviews r ON s.spot_id = r.spot_id
    GROUP BY
      s.spot_id,
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
      u.display_name
    ORDER BY s.created_at DESC
    `,
  );

  return rows.map(normalizeSpot);
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

    let sql = `
      SELECT
        s.spot_id,
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
        AVG(r.rating) AS average_rating,
        COUNT(r.review_id) AS review_count,
        ${distanceSql} AS distance_miles
      FROM spots s
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN reviews r ON s.spot_id = r.spot_id
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
          u.display_name
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
          u.display_name
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
        AVG(r.rating) AS average_rating,
        COUNT(r.review_id) AS review_count
      FROM spots s
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN reviews r ON s.spot_id = r.spot_id
      WHERE s.spot_id = ?
      GROUP BY
        s.spot_id,
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
        u.display_name
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

    return {
      ...normalizeSpot(rows[0]),
      operating_hours: normalizeSpotHours(hoursRows),
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

      const [result] = await connection.execute<ResultSetHeader>(
        `
        INSERT INTO spots (
          spot_name,
          spot_type,
          short_description,
          address,
          latitude,
          longitude,
          user_id,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
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
      `SELECT spot_id FROM spots WHERE spot_id = ? LIMIT 1`,
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
    const hoursRows = replaceHours ? buildSpotHoursRows(data.operatingHours) : [];

    updates.push("last_modified = CURRENT_TIMESTAMP");
    values.push(data.spotId);

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

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

    try {
      await connection.beginTransaction();

      const [existing] = await connection.execute<ExistingSpotRow[]>(
        `SELECT spot_id FROM spots WHERE spot_id = ? LIMIT 1`,
        [data.spotId],
      );

      if (existing.length === 0) {
        throw new Error("Spot not found.");
      }

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
