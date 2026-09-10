import { create } from 'zustand';

export interface NetworkState {
  isOnline: boolean;
  pending: number;
  failed: number;
  synced: number;
  photos_pending: number;
  refreshStats: () => Promise<void>;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  pending: 0,
  failed: 0,
  synced: 0,
  photos_pending: 0,
  refreshStats: async () => {
    const { getSyncStats } = await import('../sync/syncEngine');
    set(await getSyncStats());
  }
}));

export function updateNetworkStatus(isOnline: boolean): void {
  useNetworkStore.setState({ isOnline });
}