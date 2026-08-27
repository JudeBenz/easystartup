import type { SyncStatus } from "./mappers";

export interface SyncSlice {
  syncStatus: SyncStatus;
  syncError?: string;
  lastSyncedAt?: string;
  syncUserEmail?: string | null;
  setSyncStatus: (status: SyncStatus, error?: string) => void;
  setSyncUserEmail: (email: string | null) => void;
}

export const createSyncSlice = (
  set: (fn: (state: SyncSlice) => Partial<SyncSlice>) => void,
): SyncSlice => ({
  syncStatus: "unconfigured",
  syncError: undefined,
  lastSyncedAt: undefined,
  syncUserEmail: null,

  setSyncStatus: (status, error) =>
    set(() => ({
      syncStatus: status,
      syncError: error,
    })),

  setSyncUserEmail: (email) => set(() => ({ syncUserEmail: email })),
});
