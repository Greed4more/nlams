import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ChainVerification {
  chainIntact: boolean;
  totalRecords: number;
  brokenRecordId?: string;
  brokenAtIndex?: number;
  reason?: string;
}

/** On-demand action (not a query) — the officer explicitly asks to re-verify the chain. */
export function useVerifyAuditChainMutation() {
  return useMutation({
    mutationFn: () => api.get<ChainVerification>("/api/audit/verify"),
  });
}
