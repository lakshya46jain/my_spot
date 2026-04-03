import { createServerFn } from "@tanstack/react-start";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { db } from "./db";

const updateProfileSchema = z.object({
  userId: z.number().int().positive(),
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters."),
  email: z.string().trim().email("Please enter a valid email address."),
});

type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

type ExistingUserRow = RowDataPacket & {
  user_id: number;
};

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator((input: UpdateProfileInput) =>
    updateProfileSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const normalizedEmail = data.email.trim().toLowerCase();
    const fullName = data.fullName.trim();

    const [existingUsers] = await db.execute<ExistingUserRow[]>(
      `
      SELECT user_id
      FROM users
      WHERE email = ?
        AND user_id <> ?
        AND is_active = 1
      LIMIT 1
      `,
      [normalizedEmail, data.userId],
    );

    if (existingUsers.length > 0) {
      throw new Error("Another account is already using this email.");
    }

    await db.execute<ResultSetHeader>(
      `
      UPDATE users
      SET display_name = ?, email = ?
      WHERE user_id = ?
      `,
      [fullName, normalizedEmail, data.userId],
    );

    return {
      success: true,
      user: {
        userId: data.userId,
        displayName: fullName,
        email: normalizedEmail,
      },
      message: "Profile updated successfully.",
    };
  });
