import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Proposal } from "@/data/mockData";

/** Live register — polled every 15s so officer counters and the table stay in
 * step with the server (see LiveSyncBadge). */
export const PROPOSALS_POLL_MS = 15_000;

export const proposalsQueryOptions = () =>
  queryOptions({
    queryKey: ["proposals"],
    queryFn: () => api.get<Proposal[]>("/api/proposals"),
    refetchInterval: PROPOSALS_POLL_MS,
    refetchIntervalInBackground: false,
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

export interface CreateProposalInput {
  projectName: string;
  requiringBody: string;
  state: string;
  district: string;
  affectedFamilies: number;
}

/** Submits a new proposal at the INTAKE stage — the pre-funding entry point into the RFCTLARR pipeline. */
export function useCreateProposalMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProposalInput) => api.post<Proposal>("/api/proposals", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
}

export interface AuditLogEntry {
  id: string;
  action:
    | "PROPOSAL_SUBMITTED"
    | "STAGE_ADVANCE"
    | "DOCUMENT_UPLOAD"
    | "DOCUMENT_VERIFY"
    | "COMPENSATION_CALCULATED"
    | "GRIEVANCE_SUBMITTED"
    | "GRIEVANCE_RESOLVED"
    | "RISK_SCORED"
    | string;
  fromStage: string | null;
  toStage: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { name: string; role: string } | null;
  chainHash: string | null;
  previousHash: string | null;
  eventPayloadHash: string | null;
  fileHash: string | null;
  blockHeight: number;
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

/**
 * Verifies a specific document's integrity against the SHA-256 hash stored in
 * the server DB. Submit the original file via `form` to perform the byte-level
 * check; an empty FormData triggers the server-side stored-bytes self-check.
 * The response only carries `integrityMatch` — hashes never leave the server.
 */
export interface VerifyDocumentResult extends DocumentUploadResult {
  integrityMatch: boolean;
}

export interface VerifyDocumentInput {
  documentId: string;
  form: FormData;
}

export function useVerifyDocumentMutation(proposalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, form }: VerifyDocumentInput) =>
      api.postForm<VerifyDocumentResult>(`/api/documents/${documentId}/verify`, form),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["proposals", proposalId] });
      void qc.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
}

export interface VerifyAllResult {
  total: number;
  matched: number;
  failed: string[];
}

/**
 * Verifies every filed document in one pass using the server-side stored-bytes
 * self-check (no user file picker required) — the "Verify documents" action on
 * the proposal's Document Repository.
 */
export function useVerifyAllDocumentsMutation(proposalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (documents: { id: string; name: string }[]): Promise<VerifyAllResult> => {
      const failed: string[] = [];
      let matched = 0;
      for (const doc of documents) {
        const result = await api.postForm<VerifyDocumentResult>(
          `/api/documents/${doc.id}/verify`,
          new FormData(),
        );
        if (result.integrityMatch) matched += 1;
        else failed.push(doc.name);
      }
      return { total: documents.length, matched, failed };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["proposals", proposalId] });
      void qc.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
}

/** Downloads a filed document's stored bytes. Follows the server's content type. */
export async function downloadDocument(documentId: string, filename: string): Promise<void> {
  const blob = await api.getBlob(`/api/documents/${documentId}/download`);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4_000);
}

/** Opens a filed document in a new browser tab (read it in full). */
export async function viewDocument(documentId: string): Promise<void> {
  const blob = await api.getBlob(`/api/documents/${documentId}/download`);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
