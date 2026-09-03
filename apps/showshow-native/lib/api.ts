import { API_URL } from "./config";
import { getToken } from "./session";

export type ShowListItem = {
  id: string;
  slug: string;
  name: string;
  city: string;
  region: string;
  officialWebsiteUrl: string;
  officialApplyUrl: string;
  startDate: string | null;
  endDate: string | null;
  applicationDeadline: string | null;
  boothFeeMin: number | null;
  boothFeeMax: number | null;
  venueName: string | null;
};

export type ShowDetail = ShowListItem & {
  factSourceUrl: string;
  fullAddress: string;
  applicationFee: number | null;
  juryProcess: string | null;
  attendance: number | null;
  directorName: string | null;
  directorEmail: string | null;
  directorPhone: string | null;
  year: number | null;
  status: string | null;
};

export type MobileUser = {
  id: string;
  name: string;
  email: string;
  roles: string[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return data;
}

export function listShows(q?: string) {
  const query = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  return request<{ shows: ShowListItem[] }>(`/api/v1/shows${query}`);
}

export function getShow(slug: string) {
  return request<{ show: ShowDetail }>(`/api/v1/shows/${encodeURIComponent(slug)}`);
}

export function login(email: string, password: string) {
  return request<{ token: string; user: MobileUser }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function me() {
  return request<{ user: MobileUser }>("/api/v1/me");
}

export function formatMoney(amount: number | null | undefined) {
  if (amount == null) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    amount,
  );
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
