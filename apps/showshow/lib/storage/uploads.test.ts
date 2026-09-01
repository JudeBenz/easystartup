import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, displayImageSrc, isRemoteImageUrl, objectKey, validateImageUpload } from "./uploads";

describe("validateImageUpload", () => {
  it("accepts jpeg under the size cap", () => {
    expect(validateImageUpload({ type: "image/jpeg", size: 1200 })).toEqual({
      ok: true,
      ext: "jpg",
    });
  });

  it("rejects empty files", () => {
    expect(validateImageUpload({ type: "image/png", size: 0 }).ok).toBe(false);
  });

  it("rejects oversized files", () => {
    const result = validateImageUpload({ type: "image/png", size: MAX_UPLOAD_BYTES + 1 });
    expect(result.ok).toBe(false);
  });

  it("rejects non-images", () => {
    const result = validateImageUpload({ type: "application/pdf", size: 100 });
    expect(result.ok).toBe(false);
  });
});

describe("objectKey", () => {
  it("namespaces by kind and owner", () => {
    const key = objectKey("jury", "artist_1", "jpg");
    expect(key.startsWith("jury/artist_1/")).toBe(true);
    expect(key.endsWith(".jpg")).toBe(true);
  });
});

describe("displayImageSrc", () => {
  it("treats http URLs as already public", () => {
    expect(isRemoteImageUrl("https://cdn.example/avatar.png")).toBe(true);
    expect(isRemoteImageUrl("product/abc/xyz.jpg")).toBe(false);
  });

  it("returns remote URLs without signing", async () => {
    await expect(displayImageSrc("https://cdn.example/p.png")).resolves.toBe("https://cdn.example/p.png");
  });

  it("returns null for object keys when storage env is unset", async () => {
    const prev = {
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_ENDPOINT_URL_S3: process.env.AWS_ENDPOINT_URL_S3,
      AWS_REGION: process.env.AWS_REGION,
    };
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_ENDPOINT_URL_S3;
    delete process.env.AWS_REGION;
    try {
      await expect(displayImageSrc("product/owner/file.jpg")).resolves.toBeNull();
    } finally {
      for (const [key, value] of Object.entries(prev)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});
