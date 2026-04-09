import { createServerFn } from "@tanstack/react-start";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { db } from "./db";

const createReportSchema = z
  .object({
    userId: z.number().int().positive(),
    type: z.enum(["spot", "review"]),
    spotId: z.number().int().positive().optional(),
    reviewId: z.number().int().positive().optional(),
    reason: z.string().trim().min(1, "Reason is required.").max(100),
    details: z.string().trim().max(5000).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.type === "spot" && !data.spotId) {
      ctx.addIssue({
        code: "custom",
        path: ["spotId"],
        message: "Spot ID is required for a spot report.",
      });
    }

    if (data.type === "review" && !data.reviewId) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewId"],
        message: "Review ID is required for a review report.",
      });
    }
  });

type CreateReportInput = z.infer<typeof createReportSchema>;

type ExistingRow = RowDataPacket & {
  id: number;
};

export const createReport = createServerFn({ method: "POST" })
  .inputValidator((input: CreateReportInput) => createReportSchema.parse(input))
  .handler(async ({ data }) => {
    const trimmedDetails = data.details?.trim() || null;

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
      throw new Error("You must be signed in with an active account to submit a report.");
    }

    if (data.type === "spot") {
      const [spotRows] = await db.execute<ExistingRow[]>(
        `SELECT spot_id AS id FROM spots WHERE spot_id = ? LIMIT 1`,
        [data.spotId],
      );

      if (spotRows.length === 0) {
        throw new Error("Spot not found.");
      }
    } else {
      const [reviewRows] = await db.execute<ExistingRow[]>(
        `SELECT review_id AS id FROM reviews WHERE review_id = ? LIMIT 1`,
        [data.reviewId],
      );

      if (reviewRows.length === 0) {
        throw new Error("Review not found.");
      }
    }

    await db.execute<ResultSetHeader>(
      `
      INSERT INTO content_report (
        user_id,
        review_id,
        spot_id,
        reason,
        details,
        status
      )
      VALUES (?, ?, ?, ?, ?, 'open')
      `,
      [
        data.userId,
        data.type === "review" ? data.reviewId ?? null : null,
        data.type === "spot" ? data.spotId ?? null : null,
        data.reason.trim(),
        trimmedDetails,
      ],
    );

    return {
      success: true,
      message: "Report submitted successfully.",
    };
  });
