export type HapticKind = "light" | "medium" | "success";

export function haptic(kind: HapticKind = "light") {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  switch (kind) {
    case "light":
      navigator.vibrate(10);
      break;
    case "medium":
      navigator.vibrate(20);
      break;
    case "success":
      navigator.vibrate([12, 40, 18]);
      break;
  }
}
