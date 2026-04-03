import { createServerFn } from "@tanstack/react-start";
import type { ResultSetHeader } from "mysql2";
import { z } from "zod";
import { db } from "./db";

const deleteAccountSchema = z.object({
  userId: z.number().int().positive(),
});

type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

export const deleteAccount = createServerFn({ method: "POST" })
  .inputValidator((input: DeleteAccountInput) =>
    deleteAccountSchema.parse(input),
  )
  .handler(async ({ data }) => {
    await db.execute<ResultSetHeader>(
      `
      UPDATE users
      SET
        email = CONCAT('archived+', user_id, '@deleted.myspot'),
        is_active = 0,
        deleted_at = NOW()
      WHERE user_id = ?
      `,
      [data.userId],
    );

    return {
      success: true,
      message: "Account deactivated successfully.",
    };
  });
