import { createServerFn } from "@tanstack/react-start";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { db } from "./db";

const spotStatusSchema = z.enum(["active", "inactive", "pending"]);

const createSpotSchema = z.object({
  userId: z.number().int().positive(),
  spot_name: z.string().trim().min(1, "Spot name is required."),
  spot_type: z.string().trim().min(1, "Spot type is required."),
  short_description: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  latitude: z.string().trim().optional().or(z.literal("")),
  longitude: z.string().trim().optional().or(z.literal("")),
  status: spotStatusSchema.default("active"),
});

const updateSpotSchema = z.object({
  spotId: z.number().int().positive(),
  spot_name: z.string().trim().optional(),
  spot_type: z.string().trim().optional(),
  short_description: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  latitude: z.string().trim().optional().or(z.literal("")),
  longitude: z.string().trim().optional().or(z.literal("")),
  status: spotStatusSchema.optional(),
});

const deleteSpotSchema = z.object({
  spotId: z.number().int().positive(),
});

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
};

type ExistingSpotRow = RowDataPacket & {
  spot_id: number;
};

function parseNullableDecimal(value?: string) {
  if (!value || value.trim() === "") return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error("Latitude/longitude must be valid numbers.");
  }
  return parsed;
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
      u.display_name AS creator_name
    FROM spots s
    JOIN users u ON s.user_id = u.user_id
    ORDER BY s.created_at DESC
    `,
  );

  return rows;
});

export const getSpot = createServerFn({ method: "GET" }).handler(
  async ({ data }) => {
    const parsed = z
      .object({
        spotId: z.number().int().positive(),
      })
      .parse(data);

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
        u.display_name AS creator_name
      FROM spots s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.spot_id = ?
      LIMIT 1
      `,
      [data.spotId],
    );

    if (rows.length === 0) {
      throw new Error("Spot not found.");
    }

    return rows[0];
  },
);

export const createSpot = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const parsed = createSpotSchema.parse(data);

    const latitude = parseNullableDecimal(parsed.latitude);
    const longitude = parseNullableDecimal(parsed.longitude);

    const [result] = await db.execute<ResultSetHeader>(
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
        parsed.spot_name.trim(),
        parsed.spot_type.trim(),
        parsed.short_description?.trim() || null,
        parsed.address?.trim() || null,
        latitude,
        longitude,
        parsed.userId,
        parsed.status,
      ],
    );

    return {
      success: true,
      spotId: result.insertId,
      message: "Spot created successfully.",
    };
  },
);

export const updateSpot = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const parsed = updateSpotSchema.parse(data);

    const [existing] = await db.execute<ExistingSpotRow[]>(
      `SELECT spot_id FROM spots WHERE spot_id = ? LIMIT 1`,
      [parsed.spotId],
    );

    if (existing.length === 0) {
      throw new Error("Spot not found.");
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (parsed.spot_name !== undefined) {
      updates.push("spot_name = ?");
      values.push(parsed.spot_name.trim());
    }

    if (parsed.spot_type !== undefined) {
      updates.push("spot_type = ?");
      values.push(parsed.spot_type.trim());
    }

    if (parsed.short_description !== undefined) {
      updates.push("short_description = ?");
      values.push(parsed.short_description.trim() || null);
    }

    if (parsed.address !== undefined) {
      updates.push("address = ?");
      values.push(parsed.address.trim() || null);
    }

    if (parsed.latitude !== undefined) {
      updates.push("latitude = ?");
      values.push(parseNullableDecimal(parsed.latitude));
    }

    if (parsed.longitude !== undefined) {
      updates.push("longitude = ?");
      values.push(parseNullableDecimal(parsed.longitude));
    }

    if (parsed.status !== undefined) {
      updates.push("status = ?");
      values.push(parsed.status);
    }

    updates.push("last_modified = CURRENT_TIMESTAMP");
    values.push(parsed.spotId);

    await db.execute<ResultSetHeader>(
      `
      UPDATE spots
      SET ${updates.join(", ")}
      WHERE spot_id = ?
      `,
      values,
    );

    return {
      success: true,
      message: "Spot updated successfully.",
    };
  },
);

export const deleteSpot = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const parsed = deleteSpotSchema.parse(data);

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [existing] = await connection.execute<ExistingSpotRow[]>(
        `SELECT spot_id FROM spots WHERE spot_id = ? LIMIT 1`,
        [parsed.spotId],
      );

      if (existing.length === 0) {
        throw new Error("Spot not found.");
      }

      await connection.execute(`DELETE FROM content_report WHERE spot_id = ?`, [
        parsed.spotId,
      ]);

      await connection.execute(
        `
        DELETE cr
        FROM content_report cr
        INNER JOIN reviews r ON cr.review_id = r.review_id
        WHERE r.spot_id = ?
        `,
        [parsed.spotId],
      );

      await connection.execute(`DELETE FROM favorites WHERE spot_id = ?`, [
        parsed.spotId,
      ]);

      await connection.execute(`DELETE FROM spot_media WHERE spot_id = ?`, [
        parsed.spotId,
      ]);

      await connection.execute(`DELETE FROM spot_hours WHERE spot_id = ?`, [
        parsed.spotId,
      ]);

      await connection.execute(
        `DELETE FROM spot_attributes WHERE spot_id = ?`,
        [parsed.spotId],
      );

      await connection.execute(`DELETE FROM reviews WHERE spot_id = ?`, [
        parsed.spotId,
      ]);

      await connection.execute(`DELETE FROM spots WHERE spot_id = ?`, [
        parsed.spotId,
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
  },
);
