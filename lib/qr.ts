import QRCode from "qrcode";

/**
 * Generate a QR code as a data URL, server-side (no third-party image service —
 * the verify URL stays private). On-brand ink-on-panel colors. Returns "" on
 * failure so callers can hide the QR gracefully.
 */
export async function qrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: 240,
      color: { dark: "#17181B", light: "#FBFAF7" },
    });
  } catch {
    return "";
  }
}
