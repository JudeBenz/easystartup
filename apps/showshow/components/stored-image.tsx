import { displayImageSrc } from "@/lib/storage/uploads";

export async function StoredImage({
  objectKey,
  alt,
  className,
}: {
  objectKey?: string | null;
  alt: string;
  className?: string;
}) {
  if (!objectKey) return null;
  const src = await displayImageSrc(objectKey);
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className ?? "h-24 w-24 rounded object-cover"} />
  );
}
