import { createServerFn } from "@tanstack/react-start";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { db } from "./db";

const touchSessionActivitySchema = z.object({
  userId: z.number().int().positive(),
});

type TouchSessionActivityInput = z.infer<typeof touchSessionActivitySchema>;

type ExistingUserRow = RowDataPacket & {
  user_id: number;
};

export const touchSessionActivity = createServerFn({ method: "POST" })
  .inputValidator((input: TouchSessionActivityInput) =>
    touchSessionActivitySchema.parse(input),
  )
  .handler(async ({ data }) => {
    const [users] = await db.execute<ExistingUserRow[]>(
      `
      SELECT user_id
      FROM users
      WHERE user_id = ?
        AND is_active = 1
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [data.userId],
    );

    if (users.length === 0) {
      throw new Error("User not found.");
    }

    await db.execute<ResultSetHeader>(
      `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP
      WHERE user_id = ?
      `,
      [data.userId],
    );

    return {
      success: true,
    };
  });
