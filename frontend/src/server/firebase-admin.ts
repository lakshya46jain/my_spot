import { randomUUID } from "node:crypto";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { IMAGE_CACHE_CONTROL } from "@/lib/media";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set.`);
  }

  return value;
}

function getFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert({
      projectId: getRequiredEnv("FIREBASE_PROJECT_ID"),
      clientEmail: getRequiredEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey: getRequiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
    storageBucket: getRequiredEnv("FIREBASE_STORAGE_BUCKET"),
  });
}

function buildDownloadUrl(bucketName: string, storagePath: string, downloadToken: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
    storagePath,
  )}?alt=media&token=${downloadToken}`;
}

export async function uploadImageToFirebaseStorage({
  storagePath,
  buffer,
  mimeType,
}: {
  storagePath: string;
  buffer: Buffer;
  mimeType: string;
}) {
  const app = getFirebaseAdminApp();
  const bucket = getStorage(app).bucket();
  const file = bucket.file(storagePath);
  const downloadToken = randomUUID();

  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType: mimeType,
      cacheControl: IMAGE_CACHE_CONTROL,
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
  });

  return {
    storagePath,
    mediaUrl: buildDownloadUrl(bucket.name, storagePath, downloadToken),
  };
}

export function extractStoragePathFromDownloadUrl(downloadUrl: string | null | undefined) {
  if (!downloadUrl) {
    return null;
  }

  try {
    const parsed = new URL(downloadUrl);
    const encodedPath = parsed.pathname.split("/o/")[1];

    if (!encodedPath) {
      return null;
    }

    return decodeURIComponent(encodedPath);
  } catch {
    return null;
  }
}

export async function deleteFilesFromFirebaseStorage(storagePaths: string[]) {
  if (storagePaths.length === 0) {
    return;
  }

  const app = getFirebaseAdminApp();
  const bucket = getStorage(app).bucket();

  await Promise.all(
    storagePaths.map(async (storagePath) => {
      if (!storagePath) {
        return;
      }

      try {
        await bucket.file(storagePath).delete({
          ignoreNotFound: true,
        });
      } catch {
        // Best-effort cleanup.
      }
    }),
  );
}
