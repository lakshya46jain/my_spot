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

const updateReviewSchema = z.object({
  reviewId: z.number().int().positive(),
  userId: z.number().int().positive(),
  rating: z.number().min(0.5).max(5).multipleOf(0.5),
  review: z.string().trim().max(4000).optional().or(z.literal("")),
});

const deleteReviewSchema = z.object({
  reviewId: z.number().int().positive(),
  userId: z.number().int().positive(),
});

type GetSpotReviewsInput = z.infer<typeof getSpotReviewsSchema>;
type CreateReviewInput = z.infer<typeof createReviewSchema>;
type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
type DeleteReviewInput = z.infer<typeof deleteReviewSchema>;

type ExistingRow = RowDataPacket & {
  id: number;
};

type ReviewOwnershipRow = RowDataPacket & {
  review_id: number;
  user_id: number;
  deleted_at: string | null;
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
        AND r.deleted_at IS NULL
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
      `
      SELECT spot_id AS id
      FROM spots
      WHERE spot_id = ?
        AND status = 'active'
      LIMIT 1
      `,
      [data.spotId],
    );

    if (spotRows.length === 0) {
      throw new Error("Reviews can only be added to active spots.");
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
      throw new Error(
        "You must be logged in with an active account to leave a review.",
      );
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
        AND r.deleted_at IS NULL
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

export const updateReview = createServerFn({ method: "POST" })
  .inputValidator((input: UpdateReviewInput) => updateReviewSchema.parse(input))
  .handler(async ({ data }) => {
    const trimmedReview = data.review?.trim() || null;

    const [reviewRows] = await db.execute<ReviewOwnershipRow[]>(
      `
      SELECT review_id, user_id, deleted_at
      FROM reviews
      WHERE review_id = ?
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [data.reviewId],
    );

    if (reviewRows.length === 0) {
      throw new Error("Review not found.");
    }

    if (reviewRows[0].user_id !== data.userId) {
      throw new Error("You can only edit your own reviews.");
    }

    await db.execute<ResultSetHeader>(
      `
      UPDATE reviews
      SET rating = ?, review = ?
      WHERE review_id = ?
      `,
      [data.rating, trimmedReview, data.reviewId],
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
        AND r.deleted_at IS NULL
      LIMIT 1
      `,
      [data.reviewId],
    );

    if (rows.length === 0) {
      throw new Error("Review updated, but it could not be reloaded.");
    }

    return {
      success: true,
      review: normalizeReview(rows[0]),
      message: "Review updated successfully.",
    };
  });

export const deleteReview = createServerFn({ method: "POST" })
  .inputValidator((input: DeleteReviewInput) => deleteReviewSchema.parse(input))
  .handler(async ({ data }) => {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [reviewRows] = await connection.execute<ReviewOwnershipRow[]>(
        `
        SELECT review_id, user_id, deleted_at
        FROM reviews
        WHERE review_id = ?
        LIMIT 1
        `,
        [data.reviewId],
      );

      if (reviewRows.length === 0) {
        throw new Error("Review not found.");
      }

      if (reviewRows[0].user_id !== data.userId) {
        throw new Error("You can only delete your own reviews.");
      }

      if (reviewRows[0].deleted_at !== null) {
        throw new Error("Review has already been deleted.");
      }

      await connection.execute<ResultSetHeader>(
        `
        UPDATE reviews
        SET
          deleted_at = CURRENT_TIMESTAMP,
          deletion_note = 'Removed by author'
        WHERE review_id = ?
        `,
        [data.reviewId],
      );

      await connection.execute<ResultSetHeader>(
        `
        UPDATE content_report
        SET
          status = 'resolved',
          resolved_at = CURRENT_TIMESTAMP,
          resolution_note = COALESCE(
            resolution_note,
            'Review removed by author.'
          )
        WHERE review_id = ?
          AND status = 'open'
        `,
        [data.reviewId],
      );

      await connection.commit();

      return {
        success: true,
        message: "Review deleted successfully.",
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });
