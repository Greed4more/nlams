import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Proposal } from "@/data/mockData";

export const proposalsQueryOptions = () =>
  queryOptions({
    queryKey: ["proposals"],
    queryFn: () => api.get<Proposal[]>("/api/proposals"),
  });

export const proposalQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["proposals", id],
    queryFn: () => api.get<Proposal>(`/api/proposals/${id}`),
  });

export function useProposalsQuery() {
  const { session, loading } = useAuth();
  return useQuery({ ...proposalsQueryOptions(), enabled: !loading && !!session });
}

export function useProposalQuery(id: string) {
  const { session, loading } = useAuth();
  return useQuery({ ...proposalQueryOptions(id), enabled: !loading && !!session });
}

export function useAdvanceStageMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch<Proposal>(`/api/proposals/${id}/advance-stage`),
    onSuccess: (updated) => {
      qc.setQueryData(["proposals", id], updated);
      void qc.invalidateQueries({ queryKey: ["proposals"] });
      void qc.invalidateQueries({ queryKey: ["proposals", id, "audit-log"] });
    },
  });
}

export interface AuditLogEntry {
  id: string;
  action: "STAGE_ADVANCE" | "DOCUMENT_UPLOAD" | "DOCUMENT_VERIFY";
  fromStage: string | null;
  toStage: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { name: string; role: string } | null;
}

export function useAuditLogQuery(id: string) {
  const { session, loading } = useAuth();
  return useQuery({
    queryKey: ["proposals", id, "audit-log"],
    queryFn: () => api.get<AuditLogEntry[]>(`/api/proposals/${id}/audit-log`),
    enabled: !loading && !!session,
  });
}

export interface DocumentUploadResult {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  sizeKb: number;
  sha256: string;
  verified: boolean;
  lastVerifiedAt: string | null;
}

export function useUploadDocumentMutation(proposalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) =>
      api.postForm<DocumentUploadResult>(`/api/proposals/${proposalId}/documents`, form),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["proposals", proposalId] });
      void qc.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
}

export interface VerifyDocumentResult extends DocumentUploadResult {
  integrityMatch: boolean;
}

export function useVerifyDocumentMutation(proposalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) =>
      api.post<VerifyDocumentResult>(`/api/documents/${documentId}/verify`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["proposals", proposalId] });
      void qc.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
}
