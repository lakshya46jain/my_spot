import { createServerFn } from "@tanstack/react-start";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { db } from "./db";
import {
  deleteFilesFromFirebaseStorage,
  extractStoragePathFromDownloadUrl,
} from "./firebase-admin";

const deleteAccountSchema = z.object({
  userId: z.number().int().positive(),
});

type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

type UserAvatarRow = RowDataPacket & {
  avatar_url: string | null;
};

export const deleteAccount = createServerFn({ method: "POST" })
  .inputValidator((input: DeleteAccountInput) =>
    deleteAccountSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const [users] = await db.execute<UserAvatarRow[]>(
      `
      SELECT avatar_url
      FROM users
      WHERE user_id = ?
      LIMIT 1
      `,
      [data.userId],
    );

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

    const avatarStoragePath = extractStoragePathFromDownloadUrl(
      users[0]?.avatar_url ?? null,
    );

    if (avatarStoragePath) {
      await deleteFilesFromFirebaseStorage([avatarStoragePath]);
    }

    return {
      success: true,
      message: "Account deactivated successfully.",
    };
  });
