import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export interface StateAdapterRow {
  id: string;
  stateCode: string;
  adapterName: string;
  isActive: boolean;
  lastSyncStatus: string;
  updatedAt: string;
}

export interface AdaptersOverview {
  totalStatesSupported: number;
  activeReferenceAdapter: string;
  dbAdapters: StateAdapterRow[];
  registeredPlugins: { stateCode: string; stateName: string; isRegistered: boolean }[];
}

export function useStateAdaptersQuery() {
  const { session, loading } = useAuth();
  return useQuery({
    queryKey: ["admin", "adapters"],
    queryFn: () => api.get<AdaptersOverview>("/api/admin/adapters"),
    enabled: !loading && !!session,
  });
}

export function useTriggerStateSyncMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (stateCode: string) =>
      api.post<{ message: string; adapter: StateAdapterRow }>("/api/admin/adapters/trigger-sync", {
        stateCode,
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "adapters"] }),
  });
}
