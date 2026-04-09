import { createServerFn } from "@tanstack/react-start";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { db } from "./db";

const getSpotReviewsSchema = z.object({
  spotId: z.number().int().positive(),
});

const createReviewSchema = z.object({
  spotId: z.number().int().positive(),
  userId: z.number().int().positive(),
  rating: z.number().min(0.5).max(5).multipleOf(0.5),
  review: z.string().trim().max(4000).optional().or(z.literal("")),
});

type GetSpotReviewsInput = z.infer<typeof getSpotReviewsSchema>;
type CreateReviewInput = z.infer<typeof createReviewSchema>;

type ExistingRow = RowDataPacket & {
  id: number;
};

type ReviewRow = RowDataPacket & {
  review_id: number;
  spot_id: number;
  user_id: number;
  rating: number | string;
  review: string | null;
  created_at: string;
  reviewer_name: string;
};

function normalizeReview(row: ReviewRow) {
  const rating = Number(row.rating);

  if (Number.isNaN(rating)) {
    throw new Error("Review rating could not be parsed.");
  }

  return {
    ...row,
    rating,
  };
}

export const getSpotReviews = createServerFn({ method: "GET" })
  .inputValidator((input: GetSpotReviewsInput) =>
    getSpotReviewsSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const [rows] = await db.execute<ReviewRow[]>(
      `
      SELECT
        r.review_id,
        r.spot_id,
        r.user_id,
        r.rating,
        r.review,
        r.created_at,
        u.display_name AS reviewer_name
      FROM reviews r
      INNER JOIN users u ON r.user_id = u.user_id
      WHERE r.spot_id = ?
        AND u.is_active = 1
        AND u.deleted_at IS NULL
      ORDER BY r.created_at DESC, r.review_id DESC
      `,
      [data.spotId],
    );

    return rows.map(normalizeReview);
  });

export const createReview = createServerFn({ method: "POST" })
  .inputValidator((input: CreateReviewInput) => createReviewSchema.parse(input))
  .handler(async ({ data }) => {
    const trimmedReview = data.review?.trim() || null;

    const [spotRows] = await db.execute<ExistingRow[]>(
      `SELECT spot_id AS id FROM spots WHERE spot_id = ? LIMIT 1`,
      [data.spotId],
    );

    if (spotRows.length === 0) {
      throw new Error("Spot not found.");
    }

    const [userRows] = await db.execute<ExistingRow[]>(
      `
      SELECT user_id AS id
      FROM users
      WHERE user_id = ?
        AND is_active = 1
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [data.userId],
    );

    if (userRows.length === 0) {
      throw new Error("You must be logged in with an active account to leave a review.");
    }

    const [result] = await db.execute<ResultSetHeader>(
      `
      INSERT INTO reviews (spot_id, user_id, rating, review)
      VALUES (?, ?, ?, ?)
      `,
      [data.spotId, data.userId, data.rating, trimmedReview],
    );

    const [rows] = await db.execute<ReviewRow[]>(
      `
      SELECT
        r.review_id,
        r.spot_id,
        r.user_id,
        r.rating,
        r.review,
        r.created_at,
        u.display_name AS reviewer_name
      FROM reviews r
      INNER JOIN users u ON r.user_id = u.user_id
      WHERE r.review_id = ?
      LIMIT 1
      `,
      [result.insertId],
    );

    if (rows.length === 0) {
      throw new Error("Review created, but it could not be reloaded.");
    }

    return {
      success: true,
      review: normalizeReview(rows[0]),
      message: "Review submitted successfully.",
    };
  });
