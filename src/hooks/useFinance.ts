import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Geometry } from "geojson";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { FinancialStatus, RfctlarrStage } from "@/data/mockData";

/** Live register — polled so a clearance approved on another officer's session
 * shows up on the disbursement dashboard without a manual refresh. */
export const FINANCE_POLL_MS = 15_000;

export interface ApprovedProject {
  id: string;
  projectName: string;
  requiringBody: string;
  state: string;
  district: string;
  currentStage: RfctlarrStage;
  initiatedAt: string;
  stageEnteredAt: string;
  requiredLandHa: number;
  requiredLandAcres: number;
  affectedLandowners: number;
  affectedFamilies: number;
  surveyNumbers: string[];
  ulpins: string[];
  laoStatus: "APPROVED";
  financialStatus: FinancialStatus;
  financialAssessment: {
    referenceNumber: string;
    approvedAt: string;
    totalCompensation: number;
    beneficiaryCount: number;
  } | null;
}

export interface CompensationBeneficiary {
  parcelId: string;
  ulpin: string;
  surveyNo: string;
  ownerName: string;
  coOwners: number;
  classification: "RURAL" | "URBAN";
  provenance: string;
  areaHa: number;
  areaAcres: number;
  circleRatePerHa: number;
  marketValuePerHa: number;
  multiplier: number;
  avgTopHalfSaleDeedsPerHa: number;
  comparableAreaAvgPerHa: number;
  distanceFromUrbanKm: number;
  landValue: number;
  assetValue: number;
  solatium: number;
  interest: number;
  totalCompensation: number;
}

export interface FinancialAssessment {
  proposalId: string;
  referenceNumber: string;
  persisted: boolean;
  approvedAt: string | null;
  approvedBy: { name: string; role: string } | null;
  landRulesVersion: string;
  notificationDate: string;
  awardDate: string;
  beneficiaryCount: number;
  totalAreaHa: number;
  totals: {
    landValue: number;
    assetValue: number;
    solatium: number;
    interest: number;
    totalCompensation: number;
  };
  beneficiaries: CompensationBeneficiary[];
}

export interface ProposalParcelGeometry {
  ulpin: string;
  surveyNo: string;
  ownerName: string;
  areaHa: number;
  areaAcres: number;
  classification: "RURAL" | "URBAN";
  geometry: Geometry | null;
}

export function useApprovedProjectsQuery() {
  const { session, loading } = useAuth();
  return useQuery(
    queryOptions({
      queryKey: ["finance", "approved-projects"],
      queryFn: () => api.get<ApprovedProject[]>("/api/finance/approved-projects"),
      refetchInterval: FINANCE_POLL_MS,
      refetchIntervalInBackground: false,
      enabled: !loading && !!session,
    }),
  );
}

/**
 * The assessment preview. Pass `enabled: false` until the officer explicitly
 * runs the automatic calculation (or the project already carries a persisted
 * clearance, which is fetched automatically by the page).
 */
export function useFinancialAssessmentQuery(proposalId: string, enabled = true) {
  const { session, loading } = useAuth();
  return useQuery(
    queryOptions({
      queryKey: ["finance", proposalId, "assessment"],
      queryFn: () =>
        api.get<FinancialAssessment>(`/api/finance/proposals/${proposalId}/assessment`),
      enabled: !loading && !!session && !!proposalId && enabled,
      retry: false,
    }),
  );
}

export function useProposalGeometryQuery(proposalId: string) {
  const { session, loading } = useAuth();
  return useQuery(
    queryOptions({
      queryKey: ["finance", proposalId, "geometry"],
      queryFn: () =>
        api.get<{ proposalId: string; parcels: ProposalParcelGeometry[] }>(
          `/api/finance/proposals/${proposalId}/geometry`,
        ),
      enabled: !loading && !!session && !!proposalId,
    }),
  );
}

export interface ApproveAssessmentResult {
  assessment: FinancialAssessment;
  forwardedTo: "DISTRICT_COLLECTOR";
  toStage: RfctlarrStage | null;
}

export function useApproveFinancialAssessmentMutation(proposalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<ApproveAssessmentResult>(`/api/finance/proposals/${proposalId}/approve`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["finance"] });
      void qc.invalidateQueries({ queryKey: ["proposals"] });
      void qc.invalidateQueries({ queryKey: ["proposals", proposalId] });
      void qc.invalidateQueries({ queryKey: ["proposals", proposalId, "audit-log"] });
    },
  });
}

/** ₹ lakh figure used across the finance module, e.g. ₹174.05 Lakhs. */
export function formatLakhs(value: number): string {
  return `₹${(value / 1_00_000).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} Lakhs`;
}
