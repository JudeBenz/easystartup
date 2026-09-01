import { nanoid } from "nanoid";

export const UPLOAD_BUCKET = "uploads";
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type AllowedImageType = keyof typeof ALLOWED_IMAGE_TYPES;

export function isStorageConfigured() {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID?.trim() &&
      process.env.AWS_SECRET_ACCESS_KEY?.trim() &&
      process.env.AWS_ENDPOINT_URL_S3?.trim() &&
      process.env.AWS_REGION?.trim(),
  );
}

export function validateImageUpload(file: {
  type: string;
  size: number;
}): { ok: true; ext: string } | { ok: false; error: string } {
  if (!file.size) return { ok: false, error: "Choose an image to upload." };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Images must be 5 MB or smaller." };
  }
  const ext = ALLOWED_IMAGE_TYPES[file.type as AllowedImageType];
  if (!ext) return { ok: false, error: "Use a JPEG, PNG, or WebP image." };
  return { ok: true, ext };
}

export function objectKey(kind: "jury" | "product" | "avatar", ownerId: string, ext: string) {
  return `${kind}/${ownerId}/${nanoid(12)}.${ext}`;
}

export async function putImageObject(key: string, body: Buffer, contentType: string) {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  await client.send(
    new PutObjectCommand({
      Bucket: UPLOAD_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return key;
}

export function isRemoteImageUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

/** HTTP(S) URLs pass through; object keys become signed GET URLs when storage is configured. */
export async function displayImageSrc(value?: string | null, expiresIn = 3600) {
  if (!value) return null;
  if (isRemoteImageUrl(value)) return value;
  return signedImageUrl(value, expiresIn);
}

export async function signedImageUrl(key: string, expiresIn = 3600) {
  if (!key || isRemoteImageUrl(key) || !isStorageConfigured()) return null;
  const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const client = new S3Client({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: UPLOAD_BUCKET, Key: key }),
    { expiresIn },
  );
}

export async function uploadImageFile(
  file: File | null,
  kind: "jury" | "product" | "avatar",
  ownerId: string,
): Promise<string | undefined> {
  if (!file || !file.size) return undefined;
  if (!isStorageConfigured()) {
    throw new Error("Image uploads are not configured yet.");
  }
  const check = validateImageUpload(file);
  if (!check.ok) throw new Error(check.error);
  const buf = Buffer.from(await file.arrayBuffer());
  return putImageObject(objectKey(kind, ownerId, check.ext), buf, file.type);
}
