import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface VerifyParcelsResult {
  totalParcels: number;
  bhuvanOverlay: { multiCropIrrigated: boolean; source: string; queriedAt: string };
  autoCreatedGrievancesCount: number;
  parcels: {
    ulpin: string;
    provenance: string;
    restrictionFlags: string[];
    autoGrievanceTicketId: string | null;
  }[];
}

export function useVerifyParcelsMutation(proposalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<VerifyParcelsResult>("/api/parcels/verify", { proposalId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["proposals", proposalId] });
      void qc.invalidateQueries({ queryKey: ["grievances"] });
    },
  });
}
