import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export interface ChainVerification {
  chainIntact: boolean;
  totalRecords: number;
  verifiedBlocks: number;
  genesisHash: string;
  headHash: string | null;
  brokenRecordId?: string;
  brokenAtIndex?: number;
  reason?: string;
}

export interface GlobalChainBlock {
  id: string;
  blockHeight: number;
  proposalId: string;
  projectName: string;
  state: string;
  district: string;
  action: string;
  fromStage: string | null;
  toStage: string | null;
  actor: { name: string; role: string } | null;
  chainHash: string;
  previousHash: string;
  eventPayloadHash: string | null;
  fileHash: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface GlobalChainResponse {
  verification: ChainVerification;
  totalBlocks: number;
  blocks: GlobalChainBlock[];
}

/** On-demand action (not a query) — the officer explicitly asks to re-verify the chain. */
export function useVerifyAuditChainMutation() {
  return useMutation({
    mutationFn: () => api.get<ChainVerification>("/api/audit/verify"),
  });
}

/** Query the full blockchain ledger across all proposals. */
export function useAuditChainQuery(limit = 100) {
  const { session, loading } = useAuth();
  return useQuery({
    queryKey: ["audit-chain", limit],
    queryFn: () => api.get<GlobalChainResponse>(`/api/audit/chain?limit=${limit}`),
    enabled: !loading && !!session,
  });
}
