import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { RfctlarrStage } from "@/data/mockData";

export interface PublicProposalSummary {
  id: string;
  projectName: string;
  state: string;
  district: string;
  currentStage: RfctlarrStage;
  initiatedAt: string;
}

export interface PublicSearchResult {
  count: number;
  proposals: PublicProposalSummary[];
}

export interface PublicSearchParams {
  state?: string | undefined;
  district?: string | undefined;
  name?: string | undefined;
}

/** Unauthenticated — GET /api/public/proposals/search. No PII, no auth required. */
export function usePublicProposalsSearch(params: PublicSearchParams) {
  const qs = new URLSearchParams();
  if (params.state) qs.set("state", params.state);
  if (params.district) qs.set("district", params.district);
  if (params.name) qs.set("name", params.name);
  const query = qs.toString();

  return useQuery({
    queryKey: ["public", "proposals", "search", params],
    queryFn: () =>
      api.get<PublicSearchResult>(`/api/public/proposals/search${query ? `?${query}` : ""}`),
  });
}

export interface PublicProposalDetail {
  projectId: string;
  projectName: string;
  state: string;
  district: string;
  currentStage: RfctlarrStage;
  aggregateMetrics: {
    totalParcelsNotified: number;
    aggregateAreaNotifiedHectares: number;
    aggregateCompensationDisbursedCrores: number;
    affectedFamilies: number;
  };
  transparencyNotice: string;
}

/** Unauthenticated — GET /api/public/proposals/:id. Aggregate metrics only. */
export function usePublicProposalDetail(id: string) {
  return useQuery({
    queryKey: ["public", "proposals", id],
    queryFn: () => api.get<PublicProposalDetail>(`/api/public/proposals/${id}`),
    enabled: !!id,
    retry: false,
  });
}
