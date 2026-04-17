import { Buffer } from "node:buffer";
import { createServerFn } from "@tanstack/react-start";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { buildAvatarStoragePath, buildSpotImageStoragePath, MAX_IMAGE_UPLOAD_BYTES } from "@/lib/media";
import { db } from "./db";
import { uploadImageToFirebaseStorage } from "./firebase-admin";

const uploadImageSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  base64Data: z.string().min(1),
  fileSizeBytes: z.number().int().positive().max(MAX_IMAGE_UPLOAD_BYTES),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const uploadAvatarSchema = z.object({
  userId: z.number().int().positive(),
  image: uploadImageSchema,
});

const uploadSpotMediaSchema = z.object({
  userId: z.number().int().positive(),
  spotId: z.number().int().positive(),
  images: z.array(uploadImageSchema).min(1).max(5),
});

type ExistingUserRow = RowDataPacket & {
  user_id: number;
};

type ExistingSpotRow = RowDataPacket & {
  spot_id: number;
};

function decodeBase64Image(base64Data: string) {
  const buffer = Buffer.from(base64Data, "base64");

  if (buffer.byteLength === 0) {
    throw new Error("Uploaded image was empty.");
  }

  if (buffer.byteLength > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("Uploaded image must be 1 MB or smaller.");
  }

  return buffer;
}

async function assertUserExists(userId: number) {
  const [rows] = await db.execute<ExistingUserRow[]>(
    `
    SELECT user_id
    FROM users
    WHERE user_id = ?
      AND is_active = 1
      AND deleted_at IS NULL
    LIMIT 1
    `,
    [userId],
  );

  if (rows.length === 0) {
    throw new Error("User not found.");
  }
}

async function assertSpotExistsForUser(spotId: number, userId: number) {
  const [rows] = await db.execute<ExistingSpotRow[]>(
    `
    SELECT spot_id
    FROM spots
    WHERE spot_id = ?
      AND user_id = ?
    LIMIT 1
    `,
    [spotId, userId],
  );

  if (rows.length === 0) {
    throw new Error("Spot not found for this user.");
  }
}

export const uploadUserAvatar = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof uploadAvatarSchema>) =>
    uploadAvatarSchema.parse(input),
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

    const buffer = decodeBase64Image(data.image.base64Data);
    const storagePath = buildAvatarStoragePath(
      data.userId,
      data.image.fileName,
      data.image.mimeType,
    );
    const upload = await uploadImageToFirebaseStorage({
      storagePath,
      buffer,
      mimeType: data.image.mimeType,
    });

    await db.execute<ResultSetHeader>(
      `
      UPDATE users
      SET avatar_url = ?
      WHERE user_id = ?
      `,
      [upload.mediaUrl, data.userId],
    );

    return {
      success: true,
      avatarUrl: upload.mediaUrl,
      storagePath: upload.storagePath,
      message: "Profile photo uploaded successfully.",
    };
  });

export const uploadSpotMedia = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof uploadSpotMediaSchema>) =>
    uploadSpotMediaSchema.parse(input),
  )
  .handler(async ({ data }) => {
    await assertUserExists(data.userId);
    await assertSpotExistsForUser(data.spotId, data.userId);

    const uploads = await Promise.all(
      data.images.map(async (image, index) => {
        const buffer = decodeBase64Image(image.base64Data);
        const storagePath = buildSpotImageStoragePath(
          data.spotId,
          image.fileName,
          image.mimeType,
        );
        const upload = await uploadImageToFirebaseStorage({
          storagePath,
          buffer,
          mimeType: image.mimeType,
        });

        return {
          ...upload,
          fileName: image.fileName,
          mimeType: image.mimeType,
          fileSizeBytes: image.fileSizeBytes,
          width: image.width,
          height: image.height,
          sortOrder: index,
          isPrimary: index === 0 ? 1 : 0,
        };
      }),
    );

    const placeholders = uploads.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    const values = uploads.flatMap((upload) => [
      data.spotId,
      data.userId,
      upload.storagePath,
      upload.fileName,
      upload.mediaUrl,
      upload.mimeType,
      upload.fileSizeBytes,
      upload.width,
      upload.height,
      upload.sortOrder,
      upload.isPrimary,
    ]);

    await db.execute<ResultSetHeader>(
      `
      INSERT INTO spot_media (
        spot_id,
        user_id,
        storage_path,
        file_name,
        media_url,
        mime_type,
        file_size_bytes,
        width,
        height,
        sort_order,
        is_primary
      )
      VALUES ${placeholders}
      `,
      values,
    );

    return {
      success: true,
      media: uploads.map((upload) => ({
        media_url: upload.mediaUrl,
        storage_path: upload.storagePath,
        file_name: upload.fileName,
        mime_type: upload.mimeType,
        file_size_bytes: upload.fileSizeBytes,
        width: upload.width,
        height: upload.height,
        sort_order: upload.sortOrder,
        is_primary: Boolean(upload.isPrimary),
      })),
      message: "Spot photos uploaded successfully.",
    };
  });
