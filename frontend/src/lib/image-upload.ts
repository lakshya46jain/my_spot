import {
  MAX_IMAGE_UPLOAD_BYTES,
  extensionForMimeType,
} from "@/lib/media";

export interface PreparedImageUpload {
  fileName: string;
  mimeType: string;
  base64Data: string;
  fileSizeBytes: number;
  width: number;
  height: number;
}

const SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Image could not be read."));
        return;
      }

      resolve(reader.result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Image could not be read."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image preview could not be loaded."));
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Compressed image could not be generated."));
        return;
      }

      resolve(blob);
    }, mimeType, quality);
  });
}

async function blobToPreparedUpload(
  blob: Blob,
  fileName: string,
  width: number,
  height: number,
): Promise<PreparedImageUpload> {
  const dataUrl = await fileToDataUrl(blob);

  return {
    fileName: `${fileName.replace(/\.[^.]+$/, "")}.${extensionForMimeType(blob.type)}`,
    mimeType: blob.type,
    base64Data: dataUrl.split(",")[1] ?? "",
    fileSizeBytes: blob.size,
    width,
    height,
  };
}

export async function prepareImageUpload(file: File): Promise<PreparedImageUpload> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported.");
  }

  const inputMimeType = SUPPORTED_MIME_TYPES.has(file.type) ? file.type : "image/jpeg";
  const fileDataUrl = await fileToDataUrl(file);
  const image = await loadImage(fileDataUrl);

  if (file.size <= MAX_IMAGE_UPLOAD_BYTES && SUPPORTED_MIME_TYPES.has(file.type)) {
    return {
      fileName: file.name,
      mimeType: file.type,
      base64Data: fileDataUrl.split(",")[1] ?? "",
      fileSizeBytes: file.size,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Image compression is not supported in this browser.");
  }

  let width = image.naturalWidth;
  let height = image.naturalHeight;
  const outputMimeType = inputMimeType === "image/png" ? "image/webp" : "image/jpeg";

  while (width > 2200 || height > 2200) {
    width = Math.round(width * 0.9);
    height = Math.round(height * 0.9);
  }

  let quality = 0.88;
  let attempt = 0;

  while (attempt < 12) {
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, outputMimeType, quality);

    if (blob.size <= MAX_IMAGE_UPLOAD_BYTES) {
      return blobToPreparedUpload(blob, file.name, width, height);
    }

    if (quality > 0.52) {
      quality -= 0.08;
    } else {
      width = Math.max(Math.round(width * 0.88), 480);
      height = Math.max(Math.round(height * 0.88), 480);
    }

    attempt += 1;
  }

  const fallbackBlob = await canvasToBlob(canvas, outputMimeType, quality);

  if (fallbackBlob.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("Image could not be reduced below 1 MB. Try a smaller photo.");
  }

  return blobToPreparedUpload(fallbackBlob, file.name, width, height);
}

