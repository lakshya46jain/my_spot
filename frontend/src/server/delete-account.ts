import { createServerFn } from "@tanstack/react-start";
import type { ResultSetHeader } from "mysql2";
import { z } from "zod";
import { db } from "./db";

const deleteAccountSchema = z.object({
  userId: z.number().int().positive(),
});

export const deleteAccount = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const parsed = deleteAccountSchema.parse(data);

    await db.execute<ResultSetHeader>(
      `
      UPDATE users
      SET
        is_active = 0,
        deleted_at = NOW()
      WHERE user_id = ?
      `,
      [parsed.userId],
    );

    return {
      success: true,
      message: "Account deactivated successfully.",
    };
  },
);
