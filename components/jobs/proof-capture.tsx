"use client";

import { useRef, useTransition, useState } from "react";
import { Camera, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { addJobProofAction } from "@/app/actions/job-actions";

const MAX_PX = 640;
const JPEG_Q = 0.75;

/** Resize a File to a ≤640px JPEG data URL using an off-screen canvas. */
async function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX_PX || h > MAX_PX) {
        const r = Math.min(MAX_PX / w, MAX_PX / h);
        w = Math.round(w * r);
        h = Math.round(h * r);
      }
      const canvas = document.createElement("canvas");
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", JPEG_Q));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image load failed"));
    };
    img.src = objectUrl;
  });
}

interface Props {
  jobId:      string;
  proofUrls:  string[];
}

/**
 * Camera capture button + proof thumbnail gallery.
 * Resizes images client-side (640px JPEG) before sending to the server action.
 */
export function ProofCapture({ jobId, proofUrls }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [localUrls, setLocalUrls] = useState<string[]>(proofUrls);

  function handleCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be selected again
    e.target.value = "";

    start(async () => {
      try {
        const dataUrl = await resizeToDataUrl(file);
        setLocalUrls((prev) => [...prev, dataUrl]);
        await addJobProofAction(jobId, dataUrl);
        toast.success("Proof photo added");
      } catch {
        toast.error("Could not attach photo — please try again");
      }
    });
  }

  return (
    <div>
      {/* Thumbnails */}
      {localUrls.length > 0 && (
        <div
          className="mb-4 grid gap-2"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))" }}
          aria-label="Proof photos"
        >
          {localUrls.map((url, i) => (
            <div
              key={i}
              className="aspect-square overflow-hidden rounded-lg border border-rule bg-paper"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Proof photo ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {localUrls.length === 0 && (
        <div className="mb-4 flex flex-col items-center gap-2 rounded-lg border border-dashed border-rule py-8">
          <ImageIcon className="h-8 w-8 text-faint" aria-hidden="true" />
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
            No proof photos yet
          </p>
        </div>
      )}

      {/* Capture button */}
      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        aria-label="Add proof photo"
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-navy bg-navy/10 px-4 font-mono text-[11px] uppercase tracking-[0.1em] text-navy transition-colors hover:bg-navy/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Camera className="h-4 w-4" aria-hidden="true" />
        )}
        {pending ? "Uploading…" : localUrls.length > 0 ? "Add another photo" : "Add proof photo"}
      </button>

      {/* Hidden file input — `capture="environment"` opens back camera on mobile */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleCapture}
      />
    </div>
  );
}
