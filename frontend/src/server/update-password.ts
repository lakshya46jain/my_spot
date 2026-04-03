import { createServerFn } from "@tanstack/react-start";
import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { db } from "./db";

const updatePasswordSchema = z
  .object({
    userId: z.number().int().positive(),
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmNewPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmNewPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmNewPassword"],
        message: "New passwords do not match.",
      });
    }
  });

type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

type UserPasswordRow = RowDataPacket & {
  user_id: number;
  password_hash: string;
};

export const updatePassword = createServerFn({ method: "POST" })
  .inputValidator((input: UpdatePasswordInput) =>
    updatePasswordSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const [rows] = await db.execute<UserPasswordRow[]>(
      `
      SELECT user_id, password_hash
      FROM users
      WHERE user_id = ?
      LIMIT 1
      `,
      [data.userId],
    );

    if (rows.length === 0) {
      throw new Error("User account not found.");
    }

    const user = rows[0];

    const currentPasswordMatches = await bcrypt.compare(
      data.currentPassword,
      user.password_hash,
    );

    if (!currentPasswordMatches) {
      throw new Error("Current password is incorrect.");
    }

    const newPasswordHash = await bcrypt.hash(data.newPassword, 10);

    await db.execute<ResultSetHeader>(
      `
      UPDATE users
      SET password_hash = ?
      WHERE user_id = ?
      `,
      [newPasswordHash, data.userId],
    );

    return {
      success: true,
      message: "Password updated successfully.",
    };
  });
