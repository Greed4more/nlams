import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export interface CompensationCalcInput {
  circleRate?: number | undefined;
  avgTopHalfSaleDeeds?: number | undefined;
  comparableAreaAvg?: number | undefined;
  distanceFromUrbanKm?: number | undefined;
  ruralMultiplierOverride?: number | null;
  assetItems?: { structures?: number; trees?: number; wells?: number; crops?: number };
  notificationDate: string;
  awardDate: string;
}

export interface CompensationRecord {
  id: string;
  proposalId: string;
  parcelId: string;
  marketValue: number;
  ruralMultiplier: number;
  assetValue: number;
  solatium: number;
  interestAmount: number;
  totalCompensation: number;
  breakdown: Record<string, unknown>;
  pfmsReceipt: { pfmsTransactionId: string; bankReferenceNumber: string; disbursedAmount: number };
  calculatedAt: string;
}

export function useParcelCompensationQuery(parcelId: string) {
  const { session, loading } = useAuth();
  return useQuery({
    queryKey: ["parcels", parcelId, "compensation"],
    queryFn: () => api.get<CompensationRecord[]>(`/api/parcels/${parcelId}/compensation`),
    enabled: !loading && !!session,
  });
}

export function useCalculateCompensationMutation(proposalId: string, parcelId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CompensationCalcInput) =>
      api.post<CompensationRecord>(`/api/parcels/${parcelId}/compensation`, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["parcels", parcelId, "compensation"] });
      void qc.invalidateQueries({ queryKey: ["proposals", proposalId] });
      void qc.invalidateQueries({ queryKey: ["proposals", proposalId, "audit-log"] });
    },
  });
}
