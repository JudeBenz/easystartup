import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const SAVED_KEY = "showshow.savedSlugs";
const memory = new Map<string, string>();

async function readRaw() {
  if (Platform.OS === "web") return memory.get(SAVED_KEY) ?? "[]";
  return (await SecureStore.getItemAsync(SAVED_KEY)) ?? "[]";
}

async function writeRaw(value: string) {
  if (Platform.OS === "web") {
    memory.set(SAVED_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(SAVED_KEY, value);
}

export async function listSavedSlugs() {
  try {
    const parsed = JSON.parse(await readRaw()) as unknown;
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export async function isSaved(slug: string) {
  const slugs = await listSavedSlugs();
  return slugs.includes(slug);
}

export async function toggleSaved(slug: string) {
  const slugs = await listSavedSlugs();
  const next = slugs.includes(slug) ? slugs.filter((s) => s !== slug) : [...slugs, slug];
  await writeRaw(JSON.stringify(next));
  return next.includes(slug);
}
