import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Geometry } from "geojson";
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
  /** 14-character ULPIN — matches the parcel-level public register. */
  ulpin?: string | undefined;
  /** Set false to hold the query until the user actually searches. */
  enabled?: boolean | undefined;
}

/** Unauthenticated — GET /api/public/proposals/search. No PII, no auth required. */
export function usePublicProposalsSearch(params: PublicSearchParams) {
  const qs = new URLSearchParams();
  if (params.state) qs.set("state", params.state);
  if (params.district) qs.set("district", params.district);
  if (params.name) qs.set("name", params.name);
  if (params.ulpin) qs.set("ulpin", params.ulpin);
  const query = qs.toString();

  return useQuery({
    queryKey: ["public", "proposals", "search", params],
    queryFn: () =>
      api.get<PublicSearchResult>(`/api/public/proposals/search${query ? `?${query}` : ""}`),
    enabled: params.enabled ?? true,
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

/* ---------------------------------------------------------------- *
 * Landowner portal — land information & R&R tracking
 * ---------------------------------------------------------------- */

export interface RrStage {
  key: string;
  label: string;
  status: "COMPLETE" | "IN_PROGRESS" | "PENDING";
}

export interface RrEntitlement {
  category: string;
  basis: string;
  applicable: boolean;
  amount: number;
}

export interface LandownerRecord {
  ulpin: string;
  ownerName: string;
  coOwners: number;
  khasraNo: string;
  classification: "RURAL" | "URBAN";
  vernacularTerm: { local: string; script: string; standard: string } | null;
  projectId: string;
  projectName: string;
  requiringBody: string;
  state: string;
  district: string;
  totalParcelAreaAcres: number;
  acquiredAreaAcres: number;
  acquiredAreaHa: number;
  compensationStatus: string;
  disbursed: number;
  compensation: {
    baseLandValue: number;
    solatium: number;
    interestAmount: number;
    interestRatePercent: number;
    rrAllowance: number;
    totalLandCompensation: number;
    totalAllocated: number;
  };
  rr: {
    caseId: string;
    overallStatus: string;
    eligibility: string;
    currentStep: number;
    stages: RrStage[];
    entitlements: RrEntitlement[];
  };
  notice: string;
}

export interface LandownerSearchResult {
  count: number;
  query: string;
  notice: string;
  landowners: LandownerRecord[];
}

/** Unauthenticated — GET /api/public/landowners/search. */
export function usePublicLandownerSearch(query: string) {
  const qs = new URLSearchParams();
  if (query.trim()) qs.set("q", query.trim());
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  return useQuery({
    queryKey: ["public", "landowners", "search", query.trim()],
    queryFn: () => api.get<LandownerSearchResult>(`/api/public/landowners/search${suffix}`),
  });
}

export interface LandownerDetail extends LandownerRecord {
  geometry: Geometry | null;
}

/** Unauthenticated — GET /api/public/landowners/:ulpin. */
export function usePublicLandownerDetail(ulpin: string | undefined) {
  return useQuery({
    queryKey: ["public", "landowners", ulpin],
    queryFn: () => api.get<LandownerDetail>(`/api/public/landowners/${ulpin}`),
    enabled: !!ulpin,
    retry: false,
  });
}

/* ---------------------------------------------------------------- *
 * Public objection filing — dispute redressal
 * ---------------------------------------------------------------- */

export const OBJECTION_TYPES = [
  { value: "LAND_VALUATION", label: "Land valuation / market rate dispute" },
  { value: "BOUNDARY_DISPLACEMENT", label: "Boundary displacement (EGPS pegging)" },
  { value: "RR_ELIGIBILITY", label: "R&R eligibility or entitlement" },
  { value: "COMPENSATION_DISBURSEMENT", label: "Compensation disbursement" },
  { value: "OTHER", label: "Other grievance" },
] as const;

export type ObjectionType = (typeof OBJECTION_TYPES)[number]["value"];

export interface PublicObjection {
  id: string;
  proposalId: string;
  parcelId: string | null;
  objectionType: string;
  objectionTypeLabel: string;
  description: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  slaDeadline: string;
  resolvedAt: string | null;
  hasEvidence: boolean;
  evidenceName: string | null;
  evidenceUrl: string | null;
  projectName: string | null;
}

export interface PublicObjectionList {
  count: number;
  ulpin: string;
  khasraNo: string;
  ownerName: string;
  proposalId: string;
  objections: PublicObjection[];
}

/** Unauthenticated — GET /api/public/objections?ulpin=. */
export function usePublicObjections(ulpin: string | undefined) {
  return useQuery({
    queryKey: ["public", "objections", ulpin],
    queryFn: () => api.get<PublicObjectionList>(`/api/public/objections?ulpin=${ulpin}`),
    enabled: !!ulpin,
    retry: false,
  });
}

export interface SubmitObjectionInput {
  ulpin: string;
  objectionType: ObjectionType;
  description: string;
  evidenceUrl?: string | undefined;
  evidenceFile?: File | null | undefined;
}

/** Unauthenticated — POST /api/public/objections (multipart, optional evidence file). */
export function useSubmitPublicObjection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitObjectionInput) => {
      const form = new FormData();
      form.append("ulpin", input.ulpin);
      form.append("objectionType", input.objectionType);
      form.append("description", input.description);
      if (input.evidenceUrl?.trim()) form.append("evidenceUrl", input.evidenceUrl.trim());
      if (input.evidenceFile) form.append("evidence", input.evidenceFile);
      return api.postForm<PublicObjection>("/api/public/objections", form);
    },
    onSuccess: (_created, variables) => {
      void qc.invalidateQueries({ queryKey: ["public", "objections", variables.ulpin] });
    },
  });
}
