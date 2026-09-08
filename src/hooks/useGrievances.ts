import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { ParcelProvenance } from "@/data/mockData";

export type GrievanceStatus =
  "SUBMITTED" | "UNDER_REVIEW" | "FIELD_VERIFICATION" | "RESOLVED" | "REJECTED";

export interface GrievanceTicket {
  id: string;
  proposalId: string;
  parcelId: string | null;
  issueCategory: string;
  description: string;
  evidenceUrl: string | null;
  status: GrievanceStatus;
  slaDeadline: string;
  escalated: boolean;
  createdAt: string;
  resolvedAt: string | null;
  proposal?: { projectName: string; state: string; district: string };
}

export interface GrievanceDetail extends GrievanceTicket {
  slaBreached: boolean;
  submittedBy: { name: string; role: string };
}

export function useGrievancesQuery() {
  const { session, loading } = useAuth();
  return useQuery({
    queryKey: ["grievances"],
    queryFn: () => api.get<GrievanceTicket[]>("/api/grievances"),
    enabled: !loading && !!session,
  });
}

export function useGrievanceQuery(id: string) {
  const { session, loading } = useAuth();
  return useQuery({
    queryKey: ["grievances", id],
    queryFn: () => api.get<GrievanceDetail>(`/api/grievances/${id}`),
    enabled: !loading && !!session && !!id,
  });
}

export interface SubmitGrievanceInput {
  proposalId: string;
  parcelId?: string | undefined;
  issueCategory: string;
  description: string;
  evidenceUrl?: string | undefined;
}

export function useSubmitGrievanceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitGrievanceInput) =>
      api.post<GrievanceTicket>("/api/grievances", input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["grievances"] }),
  });
}

export interface ResolveGrievanceInput {
  status: Exclude<GrievanceStatus, "SUBMITTED">;
  updatedProvenance?: ParcelProvenance;
}

export function useResolveGrievanceMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ResolveGrievanceInput) =>
      api.patch<{ ticket: GrievanceTicket }>(`/api/grievances/${id}/resolve`, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["grievances"] });
      void qc.invalidateQueries({ queryKey: ["grievances", id] });
    },
  });
}
