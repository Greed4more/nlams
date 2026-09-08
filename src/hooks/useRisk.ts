import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export interface RiskScore {
  id: string;
  proposalId: string;
  riskScore: number;
  riskTier: "LOW" | "MEDIUM" | "HIGH";
  topContributingFactors: { feature: string; importance: number }[];
  computedAt: string;
}

export function useRiskQuery(proposalId: string) {
  const { session, loading } = useAuth();
  return useQuery({
    queryKey: ["proposals", proposalId, "risk"],
    queryFn: () => api.get<RiskScore>(`/api/proposals/${proposalId}/risk`),
    enabled: !loading && !!session && !!proposalId,
    retry: false,
  });
}

export function useUpdateConsentMutation(proposalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (consentPercentage: number) =>
      api.patch<{ consentPercentage: number; riskScore: RiskScore | null }>(
        `/api/proposals/${proposalId}/consent`,
        { consentPercentage },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["proposals", proposalId, "risk"] });
      void qc.invalidateQueries({ queryKey: ["proposals", proposalId, "audit-log"] });
    },
  });
}
