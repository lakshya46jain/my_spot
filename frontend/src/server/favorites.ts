import { createServerFn } from "@tanstack/react-start";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { db } from "./db";

const favoritesUserSchema = z.object({
  userId: z.number().int().positive(),
});

const favoriteMutationSchema = z.object({
  userId: z.number().int().positive(),
  spotId: z.number().int().positive(),
});

type FavoritesUserInput = z.infer<typeof favoritesUserSchema>;
type FavoriteMutationInput = z.infer<typeof favoriteMutationSchema>;

type FavoriteSpotRow = RowDataPacket & {
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
  creator_avatar_url: string | null;
  user_id: number;
  average_rating: number | string | null;
  review_count: number;
  primary_media_url: string | null;
  media_count: number;
  favorited_at?: string | null;
};

type ExistingUserRow = RowDataPacket & {
  user_id: number;
};

type ExistingSpotRow = RowDataPacket & {
  spot_id: number;
  status: "active" | "inactive" | "pending";
};

function normalizeFavoriteSpot(row: FavoriteSpotRow) {
  return {
    ...row,
    average_rating:
      row.average_rating === null ? null : Number(row.average_rating),
    review_count: Number(row.review_count ?? 0),
    media_count: Number(row.media_count ?? 0),
    is_favorited: true,
    favorited_at: row.favorited_at ?? null,
  };
}

async function assertUserExists(userId: number) {
  const [rows] = await db.execute<ExistingUserRow[]>(
    `SELECT user_id FROM users WHERE user_id = ? LIMIT 1`,
    [userId],
  );

  if (rows.length === 0) {
    throw new Error("User not found.");
  }
}

async function assertActiveSpotExists(spotId: number) {
  const [rows] = await db.execute<ExistingSpotRow[]>(
    `SELECT spot_id, status FROM spots WHERE spot_id = ? LIMIT 1`,
    [spotId],
  );

  if (rows.length === 0) {
    throw new Error("Spot not found.");
  }

  if (rows[0].status !== "active") {
    throw new Error("Only active spots can be favorited.");
  }
}

export const getFavoriteSpots = createServerFn({ method: "GET" })
  .inputValidator((input: FavoritesUserInput) => favoritesUserSchema.parse(input))
  .handler(async ({ data }) => {
    await assertUserExists(data.userId);

    const [rows] = await db.execute<FavoriteSpotRow[]>(
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
        f.created_at AS favorited_at
      FROM favorites f
      JOIN spots s ON f.spot_id = s.spot_id
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN reviews r ON s.spot_id = r.spot_id
        AND r.deleted_at IS NULL
      WHERE f.user_id = ?
        AND s.status = 'active'
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
        u.display_name,
        u.avatar_url,
        f.created_at
      ORDER BY f.created_at DESC
      `,
      [data.userId],
    );

    return rows.map(normalizeFavoriteSpot);
  });

export const addFavoriteSpot = createServerFn({ method: "POST" })
  .inputValidator((input: FavoriteMutationInput) =>
    favoriteMutationSchema.parse(input),
  )
  .handler(async ({ data }) => {
    await assertUserExists(data.userId);
    await assertActiveSpotExists(data.spotId);

    const [result] = await db.execute<ResultSetHeader>(
      `
      INSERT IGNORE INTO favorites (user_id, spot_id)
      VALUES (?, ?)
      `,
      [data.userId, data.spotId],
    );

    return {
      success: true,
      isFavorited: true,
      message:
        result.affectedRows > 0
          ? "Spot added to favorites."
          : "Spot is already in your favorites.",
    };
  });

export const removeFavoriteSpot = createServerFn({ method: "POST" })
  .inputValidator((input: FavoriteMutationInput) =>
    favoriteMutationSchema.parse(input),
  )
  .handler(async ({ data }) => {
    await assertUserExists(data.userId);

    await db.execute<ResultSetHeader>(
      `
      DELETE FROM favorites
      WHERE user_id = ? AND spot_id = ?
      `,
      [data.userId, data.spotId],
    );

    return {
      success: true,
      isFavorited: false,
      message: "Spot removed from favorites.",
    };
  });
