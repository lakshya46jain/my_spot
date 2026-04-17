export const MAX_IMAGE_UPLOAD_BYTES = 1024 * 1024;
export const IMAGE_CACHE_CONTROL = "public,max-age=31536000,immutable";

function slugifySegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "image";
}

function splitFileName(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex <= 0) {
    return { baseName: fileName, extension: "" };
  }

  return {
    baseName: fileName.slice(0, lastDotIndex),
    extension: fileName.slice(lastDotIndex + 1).toLowerCase(),
  };
}

export function extensionForMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

function buildStorageFileName(fileName: string, mimeType: string) {
  const { baseName, extension } = splitFileName(fileName);
  const safeBaseName = slugifySegment(baseName);
  const normalizedExtension = extension || extensionForMimeType(mimeType);

  return `${Date.now()}-${safeBaseName}.${normalizedExtension}`;
}

export function buildAvatarStoragePath(userId: number, fileName: string, mimeType: string) {
  return `users/${userId}/avatars/${buildStorageFileName(fileName, mimeType)}`;
}

export function buildSpotImageStoragePath(
  spotId: number,
  fileName: string,
  mimeType: string,
) {
  return `spots/${spotId}/images/${buildStorageFileName(fileName, mimeType)}`;
}

